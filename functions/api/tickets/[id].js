/**
 * @file functions/api/tickets/[id].js
 * @description Cloudflare Pages Dynamic Route Function for GET /api/tickets/:id
 * Zero PII leakage status tracker.
 */

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

export async function onRequestGet({ params, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ error: 'Database binding not configured.' }, 500);
    }

    const { id } = params;
    if (!id || typeof id !== 'string') {
      return jsonResponse({ error: 'Ticket ID is required.' }, 400);
    }

    const cleanId = id.trim().toUpperCase();

    // Query D1 table - strictly omitting email, internal_notes, and ip_hash
    const ticket = await env.DB.prepare(`
      SELECT id, type, priority, status, subject, public_response, created_at, updated_at
      FROM tickets
      WHERE id = ? AND deleted_at IS NULL
    `).bind(cleanId).first();

    if (!ticket) {
      return jsonResponse({
        error: `No ticket found with ID "${cleanId}". Please verify the Ticket ID.`
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
    console.error('Dynamic ticket lookup error:', error);
    return jsonResponse({ error: 'Failed to look up ticket status.' }, 500);
  }
}
