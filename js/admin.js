/**
 * @file js/admin.js
 * @description Frontend controller for the e-Plan Studio Admin Console.
 * Handles passkey session authentication, ticket list filtering, active ticket inspection,
 * instant status updates, timeline multi-message replies, and internal notes persistence.
 */

const STORAGE_KEY = 'eplan_admin_passkey';

let activePasskey = '';
let currentTickets = [];
let selectedTicketId = null;
let activeStatusFilter = 'all';
let activeSearchQuery = '';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
});

// ============================================================================
// 1. AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================
function initAuth() {
  const savedKey = sessionStorage.getItem(STORAGE_KEY);
  if (savedKey) {
    activePasskey = savedKey;
    verifyAndLaunch(savedKey);
  } else {
    showLoginView();
  }
}

function showLoginView() {
  document.getElementById('adminLoginView').style.display = 'flex';
  document.getElementById('adminDashboardView').style.display = 'none';
  const passkeyInput = document.getElementById('adminPasskeyInput');
  if (passkeyInput) passkeyInput.focus();
}

function showDashboardView() {
  document.getElementById('adminLoginView').style.display = 'none';
  document.getElementById('adminDashboardView').style.display = 'flex';
  loadTickets();
}

async function verifyAndLaunch(passkey) {
  try {
    const response = await fetch('/api/admin/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${passkey}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      activePasskey = passkey;
      sessionStorage.setItem(STORAGE_KEY, passkey);
      showDashboardView();
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      showLoginView();
      showLoginError('Invalid Admin Passkey. Access denied.');
    }
  } catch (err) {
    showLoginError('Network or server error while authenticating: ' + err.message);
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem(STORAGE_KEY);
  activePasskey = '';
  selectedTicketId = null;
  showLoginView();
}

function showLoginError(msg) {
  const alertBox = document.getElementById('loginAlertBox');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  }
}

function togglePasskeyVisibility() {
  const input = document.getElementById('adminPasskeyInput');
  const icon = document.getElementById('passkeyEyeIcon');
  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  }
}

// ============================================================================
// 2. EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  // Login Form Submit
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('adminPasskeyInput');
      const key = input ? input.value.trim() : '';
      if (!key) return;

      const submitBtn = document.getElementById('loginSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Authenticating...';
      }

      await verifyAndLaunch(key);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">lock_open</span> <span>Unlock Console</span>';
      }
    });
  }

  // Filter Chips Click
  const filterChips = document.querySelectorAll('#inboxFilterChips .filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatusFilter = chip.getAttribute('data-status') || 'all';
      loadTickets();
    });
  });

  // Search Input (Debounced)
  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeSearchQuery = e.target.value.trim();
        loadTickets();
      }, 300);
    });
  }

  // Reply Form Submit
  const replyForm = document.getElementById('adminReplyForm');
  if (replyForm) {
    replyForm.addEventListener('submit', handleReplySubmit);
  }
}

// ============================================================================
// 3. TICKET FETCHING & INBOX RENDERING
// ============================================================================
async function loadTickets() {
  const container = document.getElementById('inboxTicketList');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; color: var(--apple-text-secondary);">
      <span class="material-symbols-outlined spin-icon" style="font-size: 24px;">sync</span>
      <div style="font-size: 12px; margin-top: 6px;">Fetching from D1...</div>
    </div>
  `;

  try {
    let url = `/api/admin/tickets?status=${encodeURIComponent(activeStatusFilter)}`;
    if (activeSearchQuery) {
      url += `&q=${encodeURIComponent(activeSearchQuery)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${activePasskey}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      handleAdminLogout();
      return;
    }

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to fetch tickets.');
    }

    currentTickets = data.tickets || [];
    renderMetrics(data.metrics || {});
    renderInboxList(currentTickets);

    // If an active ticket is selected, refresh its details
    if (selectedTicketId) {
      const found = currentTickets.find(t => t.id === selectedTicketId);
      if (found) {
        renderTicketDetail(found);
      }
    }

  } catch (err) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--apple-red); font-size: 13px;">
        <span class="material-symbols-outlined" style="font-size: 28px;">error</span>
        <div style="margin-top: 6px;">${escapeHtml(err.message)}</div>
      </div>
    `;
  }
}

function renderMetrics(metrics) {
  const elTotal = document.getElementById('metricTotal');
  const elOpen = document.getElementById('metricOpen');
  const elProgress = document.getElementById('metricProgress');
  const elResolved = document.getElementById('metricResolved');

  if (elTotal) elTotal.textContent = metrics.total || 0;
  if (elOpen) elOpen.textContent = metrics.open || 0;
  if (elProgress) elProgress.textContent = metrics.in_progress || 0;
  if (elResolved) elResolved.textContent = metrics.resolved || 0;
}

function renderInboxList(tickets) {
  const container = document.getElementById('inboxTicketList');
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 16px; text-align: center; color: var(--apple-text-secondary);">
        <span class="material-symbols-outlined" style="font-size: 32px; opacity: 0.4;">inbox</span>
        <div style="font-size: 13px; font-weight: 600; margin-top: 6px;">No Tickets Found</div>
        <div style="font-size: 11px; margin-top: 2px;">No support tickets match the current filter.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  tickets.forEach(ticket => {
    const item = document.createElement('div');
    item.className = `inbox-item ${selectedTicketId === ticket.id ? 'active' : ''}`;
    item.onclick = () => selectTicket(ticket.id);

    const typeIcons = {
      bug: 'bug_report',
      feature: 'auto_awesome',
      error: 'warning',
      suggestion: 'lightbulb'
    };

    const statusClasses = {
      open: 'status-open',
      in_review: 'status-review',
      in_progress: 'status-progress',
      resolved: 'status-resolved',
      closed: 'status-closed'
    };

    item.innerHTML = `
      <div class="inbox-item-header">
        <div class="inbox-id-row">
          <span class="priority-dot dot-${ticket.priority || 'medium'}"></span>
          <span class="inbox-ticket-id">${escapeHtml(ticket.id)}</span>
          <span class="material-symbols-outlined inbox-type-icon" title="${escapeHtml(ticket.type)}">${typeIcons[ticket.type] || 'help'}</span>
        </div>
        <span class="ticket-status-pill ${statusClasses[ticket.status] || 'status-open'}">${escapeHtml(ticket.status)}</span>
      </div>
      <div class="inbox-item-subject">${escapeHtml(ticket.subject)}</div>
      <div class="inbox-item-footer">
        <span class="inbox-requester">${escapeHtml(ticket.email)}</span>
        <span class="inbox-date">${formatRelativeTime(ticket.created_at)}</span>
      </div>
    `;

    container.appendChild(item);
  });
}

function selectTicket(ticketId) {
  selectedTicketId = ticketId;

  // Highlight active in list
  const items = document.querySelectorAll('.inbox-item');
  items.forEach(item => {
    const idText = item.querySelector('.inbox-ticket-id')?.textContent;
    item.classList.toggle('active', idText === ticketId);
  });

  const ticket = currentTickets.find(t => t.id === ticketId);
  if (ticket) {
    renderTicketDetail(ticket);
  }
}

// ============================================================================
// 4. DETAIL INSPECTOR & CONVERSATION MANAGER
// ============================================================================
function renderTicketDetail(ticket) {
  document.getElementById('noTicketSelected').style.display = 'none';
  const workspace = document.getElementById('activeTicketWorkspace');
  workspace.style.display = 'flex';

  // Badges & Subject
  document.getElementById('detailTicketId').textContent = ticket.id;
  document.getElementById('detailSubject').textContent = ticket.subject;
  document.getElementById('detailCategoryBadge').textContent = (ticket.type || 'bug').toUpperCase();
  document.getElementById('detailPriorityBadge').textContent = `Priority: ${(ticket.priority || 'medium').toUpperCase()}`;

  // Status Selector
  const statusSelect = document.getElementById('detailStatusSelect');
  if (statusSelect) {
    statusSelect.value = ticket.status;
  }

  // Requester Profile
  document.getElementById('detailRequesterName').textContent = ticket.name || 'Anonymous Requester';
  const emailLink = document.getElementById('detailRequesterEmailLink');
  if (emailLink) {
    emailLink.textContent = ticket.email;
    emailLink.href = `mailto:${encodeURIComponent(ticket.email)}?subject=${encodeURIComponent(`[${ticket.id}] Regarding: ${ticket.subject}`)}`;
  }
  document.getElementById('detailSubmittedTime').textContent = formatDate(ticket.created_at);

  // Client Diagnostics Inspector
  const diagContainer = document.getElementById('detailDiagnosticsContent');
  if (diagContainer) {
    let diagObj = {};
    try {
      diagObj = typeof ticket.client_info === 'string' ? JSON.parse(ticket.client_info) : (ticket.client_info || {});
    } catch (e) {}

    diagContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; font-size: 11px;">
        <div><strong>OS / Platform:</strong> ${escapeHtml(diagObj.platform || '—')}</div>
        <div><strong>Browser User-Agent:</strong> <span style="font-family: monospace; font-size: 10px;">${escapeHtml((diagObj.userAgent || '—').slice(0, 50))}...</span></div>
        <div><strong>Screen Size:</strong> ${diagObj.screenWidth || '—'} × ${diagObj.screenHeight || '—'}</div>
        <div><strong>Viewport Size:</strong> ${diagObj.windowInnerWidth || '—'} × ${diagObj.windowInnerHeight || '—'}</div>
        <div><strong>Referrer:</strong> ${escapeHtml(diagObj.referrer || 'direct')}</div>
        <div><strong>Logged Timestamp:</strong> ${formatDate(ticket.created_at)}</div>
      </div>
    `;
  }

  // Original Message
  document.getElementById('detailOriginalMessage').textContent = ticket.message || 'No description provided.';

  // Timeline Conversation Thread
  renderAdminTimeline(ticket);

  // Internal Notes
  const notesArea = document.getElementById('internalNotesInput');
  if (notesArea) {
    notesArea.value = ticket.internal_notes || '';
  }

  // Scroll workspace to top
  workspace.scrollTop = 0;
}

function renderAdminTimeline(ticket) {
  const container = document.getElementById('detailTimelineThread');
  if (!container) return;

  container.innerHTML = '';

  // 1. Initial User Message
  const userEl = document.createElement('div');
  userEl.className = 'chat-message-item user-message';
  userEl.innerHTML = `
    <div class="chat-avatar-box"><span class="material-symbols-outlined">person</span></div>
    <div class="chat-bubble">
      <div class="chat-bubble-header">
        <span class="chat-sender-name">${escapeHtml(ticket.name || 'Requester')}</span>
        <span class="chat-timestamp">${formatDate(ticket.created_at)}</span>
      </div>
      <div class="chat-message-text">${escapeHtml(ticket.message)}</div>
    </div>
  `;
  container.appendChild(userEl);

  // 2. Admin Replies
  const replies = parseResponses(ticket.public_response, ticket.updated_at);
  replies.forEach(rep => {
    const adminEl = document.createElement('div');
    adminEl.className = 'chat-message-item admin-message';
    adminEl.innerHTML = `
      <div class="chat-avatar-box"><span class="material-symbols-outlined">shield_person</span></div>
      <div class="chat-bubble">
        <div class="chat-bubble-header">
          <div class="chat-sender-info">
            <span class="chat-sender-name">${escapeHtml(rep.author || 'e-Plan Studio Engineering Team')}</span>
            <span class="chat-badge-verified"><span class="material-symbols-outlined" style="font-size: 11px;">verified</span> Verified</span>
          </div>
          <span class="chat-timestamp">${formatDate(rep.time || ticket.updated_at)}</span>
        </div>
        <div class="chat-message-text">${escapeHtml(rep.text)}</div>
      </div>
    `;
    container.appendChild(adminEl);
  });
}

function parseResponses(rawResponse, defaultTime) {
  if (!rawResponse || typeof rawResponse !== 'string' || rawResponse.trim().length === 0) return [];
  const trimmed = rawResponse.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          text: item.text || item.message || '',
          time: item.time || defaultTime,
          author: item.author || 'e-Plan Studio Engineering Team'
        })).filter(item => item.text.trim().length > 0);
      }
    } catch (e) {}
  }
  return [{ text: trimmed, time: defaultTime, author: 'e-Plan Studio Engineering Team' }];
}

// ============================================================================
// 5. ACTIONS: STATUS CHANGE, REPLY POST & INTERNAL NOTES
// ============================================================================
async function handleStatusChange(newStatus) {
  if (!selectedTicketId) return;

  try {
    const response = await fetch(`/api/admin/tickets/${encodeURIComponent(selectedTicketId)}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activePasskey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update status.');
    }

    // Refresh tickets in background
    loadTickets();

  } catch (err) {
    alert('Error updating status: ' + err.message);
  }
}

async function handleReplySubmit(e) {
  e.preventDefault();
  if (!selectedTicketId) return;

  const replyInput = document.getElementById('replyMessageInput');
  const resolveCheckbox = document.getElementById('replySetResolvedCheckbox');
  const sendBtn = document.getElementById('sendReplyBtn');

  const text = replyInput ? replyInput.value.trim() : '';
  if (!text) return;

  const shouldResolve = resolveCheckbox ? resolveCheckbox.checked : false;

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Posting...';
  }

  try {
    const payload = {
      message: text,
      author: 'e-Plan Studio Engineering Team',
      status: shouldResolve ? 'resolved' : ''
    };

    const response = await fetch(`/api/admin/tickets/${encodeURIComponent(selectedTicketId)}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activePasskey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to post reply.');
    }

    replyInput.value = '';
    if (resolveCheckbox) resolveCheckbox.checked = false;

    // Reload active ticket and list
    loadTickets();

  } catch (err) {
    alert('Error posting reply: ' + err.message);
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span class="material-symbols-outlined">send</span> <span>Post Timeline Reply</span>';
    }
  }
}

async function handleSaveInternalNotes() {
  if (!selectedTicketId) return;

  const notesArea = document.getElementById('internalNotesInput');
  const saveBtn = document.getElementById('saveNotesBtn');
  const notes = notesArea ? notesArea.value.trim() : '';

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const response = await fetch(`/api/admin/tickets/${encodeURIComponent(selectedTicketId)}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activePasskey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ internal_notes: notes })
    });

    if (!response.ok) throw new Error('Failed to save notes.');

    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Notes';
    }, 1500);

  } catch (err) {
    alert('Error saving notes: ' + err.message);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Notes';
    }
  }
}

// ============================================================================
// 6. UTILITIES
// ============================================================================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr.includes('Z') ? dateStr : dateStr + 'Z');
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr.includes('Z') ? dateStr : dateStr + 'Z');
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
