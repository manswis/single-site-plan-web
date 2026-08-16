/**
 * @file _worker.js
 * @description Cloudflare Worker Advanced Entrypoint.
 * Intercepts /api/tickets and /api/admin routes to interact with Cloudflare D1 (env.DB),
 * enforcing cryptographic admin authorization (env.ADMIN_SECRET),
 * and delegates static asset serving to env.ASSETS.
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

// Constant-time string equality check to prevent side-channel timing attacks
async function timingSafeAuthCheck(providedToken, secretToken) {
  if (!providedToken || !secretToken) return false;
  const enc = new TextEncoder();
  const a = enc.encode(providedToken);
  const b = enc.encode(secretToken);
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

// Admin Authorization Gatekeeper
async function verifyAdminAuth(request, env) {
  if (!env.ADMIN_SECRET || typeof env.ADMIN_SECRET !== 'string' || env.ADMIN_SECRET.trim().length === 0) {
    return false;
  }
  const authHeader = request.headers.get('Authorization') || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    token = request.headers.get('X-Admin-Key') || '';
  }
  return await timingSafeAuthCheck(token, env.ADMIN_SECRET.trim());
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle preflight OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key'
        }
      });
    }

    // =========================================================================
    // 1. PUBLIC ROUTE: POST /api/tickets (Submit a Request)
    // =========================================================================
    if (pathname === '/api/tickets' && request.method === 'POST') {
      try {
        if (!env.DB) {
          return jsonResponse({ error: 'Database binding "DB" is not connected. Please check Cloudflare Bindings.' }, 500);
        }

        let body = {};
        try {
          body = await request.json();
        } catch (e) {
          return jsonResponse({ error: 'Invalid JSON payload format.' }, 400);
        }

        const { type, priority, name, email, subject, message, honeypot, client_info } = body;

        // Anti-spam Honeypot Check
        if (honeypot && String(honeypot).trim().length > 0) {
          return jsonResponse({ success: true, ticketId: generateTicketId(), type: 'bug' });
        }

        // Validation
        const validTypes = ['bug', 'feature', 'error', 'suggestion'];
        const ticketType = validTypes.includes(type) ? type : 'bug';
        const validPriorities = ['low', 'medium', 'high'];
        const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

        if (!isValidEmail(email)) {
          return jsonResponse({ error: 'Please provide a valid email address.' }, 400);
        }

        if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
          return jsonResponse({ error: 'Subject summary must be at least 3 characters.' }, 400);
        }

        if (!message || typeof message !== 'string' || message.trim().length < 10) {
          return jsonResponse({ error: 'Detailed description must be at least 10 characters.' }, 400);
        }

        const cleanSubject = subject.trim().slice(0, 200);
        const cleanMessage = message.trim().slice(0, 5000);
        const cleanName = (name && typeof name === 'string') ? name.trim().slice(0, 100) : '';
        const cleanEmail = email.trim().toLowerCase().slice(0, 254);

        // Rate Limiting by Daily Salted IP Hash (Max 5 tickets / hour)
        const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || '0.0.0.0';
        const ipHash = await computeIpHash(clientIp);

        if (ipHash) {
          const recentCountResult = await env.DB.prepare(`
            SELECT COUNT(*) as cnt 
            FROM tickets 
            WHERE ip_hash = ? AND created_at >= datetime('now', '-1 hour')
          `).bind(ipHash).first();

          const count = recentCountResult ? recentCountResult.cnt : 0;
          if (count >= 5) {
            return jsonResponse({
              error: 'Rate limit exceeded. You have reached the maximum allowed ticket submissions (5/hour). Please try again later.'
            }, 429);
          }
        }

        // Generate unique ticket ID and insert
        const ticketId = generateTicketId();
        const clientInfoStr = client_info ? JSON.stringify(client_info) : '{}';

        await env.DB.prepare(`
          INSERT INTO tickets (id, type, priority, status, name, email, subject, message, public_response, internal_notes, ip_hash, client_info)
          VALUES (?, ?, ?, 'open', ?, ?, ?, ?, '', '', ?, ?)
        `).bind(
          ticketId,
          ticketType,
          ticketPriority,
          cleanName,
          cleanEmail,
          cleanSubject,
          cleanMessage,
          ipHash || 'unknown',
          clientInfoStr
        ).run();

        return jsonResponse({
          success: true,
          ticketId,
          type: ticketType,
          message: 'Your request has been logged successfully.'
        }, 201);

      } catch (error) {
        console.error('Ticket submission error:', error);
        return jsonResponse({
          error: 'Database operation failed: ' + (error.message || String(error))
        }, 500);
      }
    }

    // =========================================================================
    // 2. PUBLIC ROUTE: GET /api/tickets/:id (Lookup Ticket Status & Timeline)
    // =========================================================================
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
          WHERE id = ?
        `).bind(cleanId).first();

        if (!ticket) {
          return jsonResponse({
            error: `No ticket found with ID "${cleanId}". Please check the ID and try again.`
          }, 404);
        }

        return jsonResponse({
          success: true,
          ticket: {
            id: ticket.id,
            type: ticket.type,
            priority: ticket.priority,
            status: ticket.status,
            subject: ticket.subject,
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

    // =========================================================================
    // 3. ADMIN ROUTES: Restricted by ADMIN_SECRET
    // =========================================================================
    if (pathname.startsWith('/api/admin')) {
      if (!env.DB) {
        return jsonResponse({ error: 'Database binding "DB" not configured.' }, 500);
      }

      // Check Cryptographic Authorization Gate
      const isAuthorized = await verifyAdminAuth(request, env);
      if (!isAuthorized) {
        return jsonResponse({
          error: 'Unauthorized: Invalid or missing admin credentials.'
        }, 401);
      }

      // 3A. POST /api/admin/auth/verify (Verify passkey)
      if (pathname === '/api/admin/auth/verify' && request.method === 'POST') {
        return jsonResponse({ success: true, message: 'Admin authentication verified.' });
      }

      // 3B. GET /api/admin/tickets (Fetch ticket list with filters)
      if (pathname === '/api/admin/tickets' && request.method === 'GET') {
        try {
          const statusFilter = url.searchParams.get('status') || 'all';
          const searchQuery = url.searchParams.get('q') || '';
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
          const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

          let sql = 'SELECT id, type, priority, status, name, email, subject, message, public_response, internal_notes, client_info, created_at, updated_at FROM tickets WHERE 1=1';
          const params = [];

          if (statusFilter !== 'all') {
            sql += ' AND status = ?';
            params.push(statusFilter);
          }

          if (searchQuery.trim().length > 0) {
            sql += ' AND (id LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
            const term = `%${searchQuery.trim()}%`;
            params.push(term, term, term, term);
          }

          sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
          params.push(limit, offset);

          const { results } = await env.DB.prepare(sql).bind(...params).all();

          // Get counts by status for metrics overview
          const countsResult = await env.DB.prepare(`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as count_open,
              SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as count_review,
              SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as count_progress,
              SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as count_resolved,
              SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as count_closed
            FROM tickets
          `).first();

          return jsonResponse({
            success: true,
            tickets: results || [],
            metrics: {
              total: countsResult?.total || 0,
              open: countsResult?.count_open || 0,
              in_review: countsResult?.count_review || 0,
              in_progress: countsResult?.count_progress || 0,
              resolved: countsResult?.count_resolved || 0,
              closed: countsResult?.count_closed || 0
            }
          });
        } catch (err) {
          return jsonResponse({ error: 'Failed to fetch tickets: ' + err.message }, 500);
        }
      }

      // 3C. POST /api/admin/tickets/:id/reply (Add message to conversation thread)
      if (pathname.match(/^\/api\/admin\/tickets\/[^\/]+\/reply$/) && request.method === 'POST') {
        try {
          const parts = pathname.split('/');
          const ticketId = decodeURIComponent(parts[4] || '').toUpperCase();

          let body = {};
          try { body = await request.json(); } catch (e) {}

          const replyText = (body.message || '').trim();
          const author = (body.author || 'e-Plan Studio Engineering Team').trim();
          const newStatus = (body.status || '').trim();

          if (!replyText || replyText.length < 2) {
            return jsonResponse({ error: 'Reply text must be at least 2 characters.' }, 400);
          }

          // Fetch existing ticket
          const existing = await env.DB.prepare('SELECT public_response, status FROM tickets WHERE id = ?').bind(ticketId).first();
          if (!existing) {
            return jsonResponse({ error: `Ticket "${ticketId}" not found.` }, 404);
          }

          // Parse existing responses as JSON array or convert plain text
          let messages = [];
          const raw = (existing.public_response || '').trim();
          if (raw.startsWith('[') && raw.endsWith(']')) {
            try {
              messages = JSON.parse(raw);
              if (!Array.isArray(messages)) messages = [];
            } catch (e) {
              messages = [{ text: raw, time: new Date().toISOString(), author: 'e-Plan Studio Engineering Team' }];
            }
          } else if (raw.length > 0) {
            messages = [{ text: raw, time: new Date().toISOString(), author: 'e-Plan Studio Engineering Team' }];
          }

          // Append new response object
          messages.push({
            text: replyText,
            time: new Date().toISOString(),
            author: author
          });

          const updatedJson = JSON.stringify(messages);
          const finalStatus = (newStatus && ['open', 'in_review', 'in_progress', 'resolved', 'closed'].includes(newStatus))
            ? newStatus
            : existing.status;

          await env.DB.prepare(`
            UPDATE tickets 
            SET public_response = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(updatedJson, finalStatus, ticketId).run();

          return jsonResponse({
            success: true,
            ticketId,
            status: finalStatus,
            public_response: updatedJson,
            message: 'Reply posted to user timeline.'
          });

        } catch (err) {
          return jsonResponse({ error: 'Failed to post reply: ' + err.message }, 500);
        }
      }

      // 3D. POST /api/admin/tickets/:id/status (Update status or internal notes)
      if (pathname.match(/^\/api\/admin\/tickets\/[^\/]+\/status$/) && request.method === 'POST') {
        try {
          const parts = pathname.split('/');
          const ticketId = decodeURIComponent(parts[4] || '').toUpperCase();

          let body = {};
          try { body = await request.json(); } catch (e) {}

          const { status, internal_notes } = body;
          const validStatuses = ['open', 'in_review', 'in_progress', 'resolved', 'closed'];

          if (status && !validStatuses.includes(status)) {
            return jsonResponse({ error: 'Invalid status value.' }, 400);
          }

          let sql = 'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP';
          const params = [];

          if (status) {
            sql += ', status = ?';
            params.push(status);
          }
          if (typeof internal_notes === 'string') {
            sql += ', internal_notes = ?';
            params.push(internal_notes.trim());
          }

          sql += ' WHERE id = ?';
          params.push(ticketId);

          await env.DB.prepare(sql).bind(...params).run();

          return jsonResponse({ success: true, ticketId, message: 'Ticket updated successfully.' });
        } catch (err) {
          return jsonResponse({ error: 'Failed to update ticket: ' + err.message }, 500);
        }
      }
    }

    // =========================================================================
    // 4. Fallback: Delegate to Static Asset Fetcher (HTML/CSS/JS)
    // =========================================================================
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
