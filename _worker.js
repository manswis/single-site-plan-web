/**
 * @file _worker.js
 * @description Cloudflare Worker & Pages Advanced Entrypoint.
 * Intercepts /api/tickets routes to query/insert into Cloudflare D1 (env.DB),
 * and delegates all static asset serving (HTML, CSS, JS) to env.ASSETS.
 */

// Helper to generate a non-sequential, cryptographically secure Ticket ID (e.g. REQ-9X4K-72M1)
function generateTicketId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomValues[i] % chars.length];
    part2 += chars[randomValues[i + 4] % chars.length];
  }
  return `REQ-${part1}-${part2}`;
}

// Compute SHA-256 hash of client IP + date salt for privacy-preserving rate limiting
async function computeIpHash(ipAddress) {
  if (!ipAddress) return null;
  const encoder = new TextEncoder();
  const dateSalt = new Date().toISOString().slice(0, 10);
  const data = encoder.encode(`${ipAddress}:${dateSalt}:eplan_ticket_salt`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && re.test(email.trim()) && email.length <= 254;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Route: POST /api/tickets
    if (pathname === '/api/tickets' && request.method === 'POST') {
      try {
        if (!env.DB) {
          return jsonResponse({
            error: 'Database binding "DB" is not connected to this deployment. Please check Cloudflare Bindings.'
          }, 500);
        }

        const body = await request.json().catch(() => ({}));
        let { type, priority, name, email, subject, message, client_info, honeypot } = body;

        // Anti-spam honeypot
        if (honeypot && String(honeypot).trim().length > 0) {
          return jsonResponse({ error: 'Spam detected.' }, 400);
        }

        const validTypes = ['bug', 'feature', 'error', 'suggestion', 'other'];
        const validPriorities = ['low', 'medium', 'high', 'urgent'];

        type = typeof type === 'string' ? type.toLowerCase().trim() : 'suggestion';
        if (!validTypes.includes(type)) type = 'other';

        priority = typeof priority === 'string' ? priority.toLowerCase().trim() : 'medium';
        if (!validPriorities.includes(priority)) priority = 'medium';

        if (!email || !isValidEmail(email)) {
          return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
        }

        if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
          return jsonResponse({ error: 'Subject must be at least 3 characters long.' }, 400);
        }

        if (!message || typeof message !== 'string' || message.trim().length < 10) {
          return jsonResponse({ error: 'Message must be at least 10 characters long.' }, 400);
        }

        name = (name && typeof name === 'string') ? name.trim().slice(0, 100) : 'Anonymous';
        email = email.trim().slice(0, 254);
        subject = subject.trim().slice(0, 200);
        message = message.trim().slice(0, 5000);

        let clientInfoStr = '{}';
        if (client_info && typeof client_info === 'object') {
          try {
            clientInfoStr = JSON.stringify(client_info).slice(0, 2000);
          } catch (e) {}
        }

        const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
        const ipHash = await computeIpHash(clientIp);

        if (ipHash) {
          const rateCheck = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM tickets WHERE ip_hash = ? AND created_at >= datetime("now", "-1 hour")'
          ).bind(ipHash).first();

          if (rateCheck && rateCheck.count >= 10) {
            return jsonResponse({
              error: 'Rate limit exceeded. Please wait a while before submitting another request.'
            }, 429);
          }
        }

        const ticketId = generateTicketId();

        const stmt = env.DB.prepare(`
          INSERT INTO tickets (
            id, type, priority, status, name, email, subject, message,
            client_info, public_response, internal_notes, ip_hash, consent_given
          ) VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, '', '', ?, 1)
        `);

        await stmt.bind(
          ticketId,
          type,
          priority,
          name,
          email,
          subject,
          message,
          clientInfoStr,
          ipHash
        ).run();

        return jsonResponse({
          success: true,
          ticketId: ticketId,
          type: type,
          status: 'open',
          message: 'Your request has been registered successfully. Please save your Ticket ID for tracking.'
        }, 201);

      } catch (error) {
        console.error('Ticket submission error:', error);
        return jsonResponse({
          error: 'Database operation failed: ' + (error.message || String(error))
        }, 500);
      }
    }

    // 2. Route: GET /api/tickets or /api/tickets/:id
    if (pathname.startsWith('/api/tickets') && request.method === 'GET') {
      try {
        if (!env.DB) {
          return jsonResponse({ error: 'Database binding "DB" not configured.' }, 500);
        }

        let ticketId = url.searchParams.get('id');
        if (!ticketId && pathname.startsWith('/api/tickets/')) {
          ticketId = pathname.replace('/api/tickets/', '');
        }

        if (!ticketId || ticketId.trim().length < 4) {
          return jsonResponse({ error: 'Ticket ID is required.' }, 400);
        }

        const cleanId = decodeURIComponent(ticketId).trim().toUpperCase();

        const ticket = await env.DB.prepare(`
          SELECT id, type, priority, status, subject, message, public_response, created_at, updated_at
          FROM tickets
          WHERE id = ? AND deleted_at IS NULL
        `).bind(cleanId).first();

        if (!ticket) {
          return jsonResponse({
            error: `No ticket found with ID "${cleanId}". Please check the ID and try again.`
          }, 404);
        }

        let safeSubject = ticket.subject;
        if (safeSubject.length > 80) {
          safeSubject = safeSubject.slice(0, 77) + '...';
        }

        return jsonResponse({
          success: true,
          ticket: {
            id: ticket.id,
            type: ticket.type,
            priority: ticket.priority,
            status: ticket.status,
            subject: safeSubject,
            message: ticket.message,
            public_response: ticket.public_response || null,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at
          }
        });

      } catch (error) {
        console.error('Ticket query error:', error);
        return jsonResponse({ error: 'Failed to look up ticket: ' + (error.message || String(error)) }, 500);
      }
    }

    // 3. Fallback: Delegate to Static Asset Fetcher (HTML/CSS/JS)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
