/**
 * @file _worker.js
 * @description Cloudflare Worker Advanced Entrypoint.
 * Intercepts /api/tickets and /api/admin routes to interact with Cloudflare D1 (env.DB),
 * enforcing cryptographic admin authorization (env.ADMIN_SECRET), brute-force IP rate limiting,
 * and security headers. Delegates static asset serving to env.ASSETS.
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

// Global Security Response Builder with strict OWASP headers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';",
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

// Admin Authorization Gatekeeper with Brute-Force Rate Limiting
async function verifyAdminAuth(request, env) {
  if (!env.ADMIN_SECRET || typeof env.ADMIN_SECRET !== 'string' || env.ADMIN_SECRET.trim().length === 0) {
    return { authorized: false, rateLimited: false };
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || '0.0.0.0';
  const ipHash = await computeIpHash(clientIp);

  // Check Brute-Force Rate Limiter (Max 5 failed attempts per 15 minutes)
  if (env.DB && ipHash) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS auth_failures (
          ip_hash TEXT NOT NULL,
          attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const failureRow = await env.DB.prepare(`
        SELECT COUNT(*) as fail_count 
        FROM auth_failures 
        WHERE ip_hash = ? AND attempt_time >= datetime('now', '-15 minutes')
      `).bind(ipHash).first();

      const failCount = failureRow ? failureRow.fail_count : 0;
      if (failCount >= 5) {
        return { authorized: false, rateLimited: true };
      }
    } catch (e) {
      console.warn('Auth failure check warning:', e.message);
    }
  }

  const authHeader = request.headers.get('Authorization') || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    token = request.headers.get('X-Admin-Key') || '';
  }

  const isValid = await timingSafeAuthCheck(token, env.ADMIN_SECRET.trim());

  if (env.DB && ipHash) {
    try {
      if (isValid) {
        // Clear failures on successful login
        await env.DB.prepare('DELETE FROM auth_failures WHERE ip_hash = ?').bind(ipHash).run();
      } else {
        // Log failure
        await env.DB.prepare('INSERT INTO auth_failures (ip_hash) VALUES (?)').bind(ipHash).run();
      }
    } catch (e) { }
  }

  return { authorized: isValid, rateLimited: false };
}

// Self-Healing Schema Migration to remove obsolete restrictive SQLite CHECK constraints
async function ensureSchemaUpdated(db) {
  if (!db) return;
  try {
    const tableInfo = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tickets'").first();
    if (tableInfo && tableInfo.sql) {
      // If table definition has the old CHECK constraint that blocks on_hold or infeasible
      if (tableInfo.sql.includes("status IN ('open'") && !tableInfo.sql.includes('on_hold')) {
        await db.batch([
          db.prepare("ALTER TABLE tickets RENAME TO tickets_old"),
          db.prepare(`
            CREATE TABLE tickets (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              priority TEXT NOT NULL DEFAULT 'medium',
              status TEXT NOT NULL DEFAULT 'open',
              name TEXT DEFAULT '',
              email TEXT NOT NULL,
              subject TEXT NOT NULL,
              message TEXT NOT NULL,
              public_response TEXT DEFAULT '',
              internal_notes TEXT DEFAULT '',
              ip_hash TEXT NOT NULL,
              client_info TEXT DEFAULT '{}',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `),
          db.prepare(`
            INSERT INTO tickets (id, type, priority, status, name, email, subject, message, public_response, internal_notes, ip_hash, client_info, created_at, updated_at)
            SELECT id, type, priority, status, name, email, subject, message, public_response, internal_notes, ip_hash, client_info, created_at, updated_at
            FROM tickets_old
          `),
          db.prepare("DROP TABLE tickets_old"),
          db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at DESC)"),
          db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)"),
          db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_ip_hash_created ON tickets(ip_hash, created_at DESC)")
        ]);
      }
    }
  } catch (err) {
    console.error('Auto-migration error:', err);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight options
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Auto-update D1 table schema on database operations
    if (pathname.startsWith('/api/admin/') && env.DB) {
      ctx.waitUntil ? ctx.waitUntil(ensureSchemaUpdated(env.DB)) : await ensureSchemaUpdated(env.DB);
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
    // 3. ADMIN ROUTES: Restricted by ADMIN_SECRET + Rate Limiter
    // =========================================================================
    if (pathname.startsWith('/api/admin')) {
      if (!env.DB) {
        return jsonResponse({ error: 'Database binding "DB" not configured.' }, 500);
      }

      // Check Cryptographic Authorization Gate & Rate Limit
      const authResult = await verifyAdminAuth(request, env);

      if (authResult.rateLimited) {
        return jsonResponse({
          error: 'Too many failed login attempts. Access is locked for 15 minutes to protect against brute-force attacks.'
        }, 429);
      }

      if (!authResult.authorized) {
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
          const statusParam = url.searchParams.get('status') || 'all';
          const priorityParam = url.searchParams.get('priority') || 'all';
          const searchQuery = url.searchParams.get('q') || '';
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
          const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

          const validStatuses = ['open', 'in_review', 'in_progress', 'on_hold', 'infeasible', 'resolved', 'closed'];
          const validPriorities = ['low', 'medium', 'high'];

          let sql = 'SELECT id, type, priority, status, name, email, subject, message, public_response, internal_notes, client_info, created_at, updated_at FROM tickets WHERE 1=1';
          const params = [];

          if (statusParam !== 'all' && statusParam.trim().length > 0) {
            const requestedStatuses = statusParam.split(',').map(s => s.trim()).filter(s => validStatuses.includes(s));
            if (requestedStatuses.length > 0) {
              const placeholders = requestedStatuses.map(() => '?').join(',');
              sql += ` AND status IN (${placeholders})`;
              params.push(...requestedStatuses);
            }
          }

          if (priorityParam !== 'all' && priorityParam.trim().length > 0) {
            const requestedPriorities = priorityParam.split(',').map(p => p.trim()).filter(p => validPriorities.includes(p));
            if (requestedPriorities.length > 0) {
              const placeholders = requestedPriorities.map(() => '?').join(',');
              sql += ` AND priority IN (${placeholders})`;
              params.push(...requestedPriorities);
            }
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
              SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as count_hold,
              SUM(CASE WHEN status = 'infeasible' THEN 1 ELSE 0 END) as count_infeasible,
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
              on_hold: countsResult?.count_hold || 0,
              infeasible: countsResult?.count_infeasible || 0,
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
          try { body = await request.json(); } catch (e) { }

          const replyText = (body.reply || body.message || '').trim();
          const author = (body.author || 'e-Plan Studio Engineering Team').trim();
          const newStatus = (body.status || '').trim();

          if (!replyText) {
            return jsonResponse({ error: 'Reply text is required.' }, 400);
          }

          // Fetch existing ticket
          const existing = await env.DB.prepare('SELECT public_response, status FROM tickets WHERE id = ?').bind(ticketId).first();
          if (!existing) {
            return jsonResponse({ error: 'Ticket not found.' }, 404);
          }

          let messages = [];
          if (existing.public_response) {
            try {
              messages = JSON.parse(existing.public_response);
              if (!Array.isArray(messages)) messages = [{ text: existing.public_response, time: new Date().toISOString() }];
            } catch (e) {
              messages = [{ text: existing.public_response, time: new Date().toISOString() }];
            }
          }

          // Append new response object
          messages.push({
            text: replyText,
            time: new Date().toISOString(),
            author: author
          });

          const updatedJson = JSON.stringify(messages);
          const finalStatus = (newStatus && ['open', 'in_review', 'in_progress', 'on_hold', 'infeasible', 'resolved', 'closed'].includes(newStatus))
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

      // 3D. POST /api/admin/tickets/:id/status (Update status, priority, or internal notes)
      if (pathname.match(/^\/api\/admin\/tickets\/[^\/]+\/status$/) && request.method === 'POST') {
        try {
          await ensureSchemaUpdated(env.DB);

          const parts = pathname.split('/');
          const ticketId = decodeURIComponent(parts[4] || '').toUpperCase();

          let body = {};
          try { body = await request.json(); } catch (e) { }

          const { status, priority, internal_notes } = body;
          const validStatuses = ['open', 'in_review', 'in_progress', 'on_hold', 'infeasible', 'resolved', 'closed'];
          const validPriorities = ['low', 'medium', 'high'];

          if (status && !validStatuses.includes(status)) {
            return jsonResponse({ error: 'Invalid status value.' }, 400);
          }
          if (priority && !validPriorities.includes(priority)) {
            return jsonResponse({ error: 'Invalid priority value.' }, 400);
          }

          let sql = 'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP';
          const params = [];

          if (status) {
            sql += ', status = ?';
            params.push(status);
          }
          if (priority) {
            sql += ', priority = ?';
            params.push(priority);
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

      // 3E. DELETE /api/admin/tickets/:id (Permanently delete ticket)
      if (pathname.match(/^\/api\/admin\/tickets\/[^\/]+$/) && request.method === 'DELETE') {
        try {
          const parts = pathname.split('/');
          const ticketId = decodeURIComponent(parts[4] || '').toUpperCase();

          const existing = await env.DB.prepare('SELECT id FROM tickets WHERE id = ?').bind(ticketId).first();
          if (!existing) {
            return jsonResponse({ error: 'Ticket not found.' }, 404);
          }

          await env.DB.prepare('DELETE FROM tickets WHERE id = ?').bind(ticketId).run();

          return jsonResponse({ success: true, ticketId, message: 'Ticket deleted permanently from D1.' });
        } catch (err) {
          return jsonResponse({ error: 'Failed to delete ticket: ' + err.message }, 500);
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
