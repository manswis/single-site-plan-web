/**
 * @file functions/api/tickets/index.js
 * @description Cloudflare Pages Function for Support Ticket Creation & List/Query.
 * Implements high-entropy ID generation, salted SHA-256 IP hashing (DPDP Act compliant),
 * strict input validation, client diagnostics, and zero PII leakage.
 */

// Helper to generate a non-sequential, cryptographically secure Ticket ID (e.g. REQ-9X4K-72M1)
function generateTicketId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous characters (0, O, 1, I)
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
  const dateSalt = new Date().toISOString().slice(0, 10); // Daily rotation
  const data = encoder.encode(`${ipAddress}:${dateSalt}:eplan_ticket_salt`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple email regex validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && re.test(email.trim()) && email.length <= 254;
}

// Standard JSON response builder with CORS & security headers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}

/**
 * POST /api/tickets
 * Submits a new support/feedback ticket.
 */
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({
        error: 'Database binding "DB" is not configured in Cloudflare Pages settings.'
      }, 500);
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return jsonResponse({ error: 'Expected application/json payload.' }, 400);
    }

    const body = await request.json();
    let { type, priority, name, email, subject, message, client_info, honeypot } = body;

    // Honeypot anti-spam check (if bot fills hidden field, reject silently or error)
    if (honeypot && String(honeypot).trim().length > 0) {
      return jsonResponse({ error: 'Spam detected.' }, 400);
    }

    // Input Sanitization & Validation
    const validTypes = ['bug', 'feature', 'error', 'suggestion', 'other'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    type = typeof type === 'string' ? type.toLowerCase().trim() : 'suggestion';
    if (!validTypes.includes(type)) {
      type = 'other';
    }

    priority = typeof priority === 'string' ? priority.toLowerCase().trim() : 'medium';
    if (!validPriorities.includes(priority)) {
      priority = 'medium';
    }

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return jsonResponse({ error: 'Subject must be at least 3 characters long.' }, 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return jsonResponse({ error: 'Message must be at least 10 characters long.' }, 400);
    }

    // Max length safeguards
    name = (name && typeof name === 'string') ? name.trim().slice(0, 100) : 'Anonymous';
    email = email.trim().slice(0, 254);
    subject = subject.trim().slice(0, 200);
    message = message.trim().slice(0, 5000);

    // Diagnostic client info
    let clientInfoStr = '{}';
    if (client_info && typeof client_info === 'object') {
      try {
        clientInfoStr = JSON.stringify(client_info).slice(0, 2000);
      } catch (e) {}
    }

    // IP Rate Limiting check (Max 10 submissions per IP hash per hour)
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

    // Generate unique Ticket ID
    const ticketId = generateTicketId();

    // Insert into Cloudflare D1
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
      error: 'An internal error occurred while processing your request. Please try again later.'
    }, 500);
  }
}

/**
 * GET /api/tickets?id=REQ-XXXX-XXXX
 * Status lookup fallback.
 */
export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ error: 'Database binding not configured.' }, 500);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id || typeof id !== 'string' || id.trim().length < 4) {
      return jsonResponse({ error: 'Ticket ID parameter is required.' }, 400);
    }

    const cleanId = id.trim().toUpperCase();

    // Query D1 table with zero PII exposure
    const ticket = await env.DB.prepare(`
      SELECT id, type, priority, status, subject, public_response, created_at, updated_at
      FROM tickets
      WHERE id = ? AND deleted_at IS NULL
    `).bind(cleanId).first();

    if (!ticket) {
      return jsonResponse({
        error: `No ticket found with ID "${cleanId}". Please check the ID and try again.`
      }, 404);
    }

    // Mask subject partially for privacy protection
    let safeSubject = ticket.subject;
    if (safeSubject.length > 50) {
      safeSubject = safeSubject.slice(0, 47) + '...';
    }

    return jsonResponse({
      success: true,
      ticket: {
        id: ticket.id,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        subject: safeSubject,
        public_response: ticket.public_response || null,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      }
    });

  } catch (error) {
    console.error('Ticket query error:', error);
    return jsonResponse({ error: 'Failed to look up ticket.' }, 500);
  }
}
