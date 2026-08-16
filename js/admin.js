/**
 * @file js/admin.js
 * @description Frontend controller for the e-Plan Studio Admin Console.
 * Built with Apple HIG standards: session authentication, real-time ticket filtering,
 * canned developer responses, public timeline sync, private notes management,
 * 15-minute inactivity auto-lock, and zero-trust DOM insertion against XSS.
 */

const STORAGE_KEY = 'eplan_admin_passkey';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

let activePasskey = '';
let currentTickets = [];
let selectedTicketId = null;
let activeStatusFilter = 'all';
let activeSearchQuery = '';
let inactivityTimer = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
  setupInactivityAutoLock();
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
  resetInactivityTimer();
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
      const data = await response.json().catch(() => ({}));
      sessionStorage.removeItem(STORAGE_KEY);
      showLoginView();
      showLoginError(data.error || 'Invalid Admin Passkey. Access denied.');
    }
  } catch (err) {
    showLoginError('Network or server error while authenticating: ' + err.message);
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem(STORAGE_KEY);
  activePasskey = '';
  selectedTicketId = null;
  if (inactivityTimer) clearTimeout(inactivityTimer);
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

// Inactivity Auto-Lock (Finding 2 Remediation)
function setupInactivityAutoLock() {
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  events.forEach(evt => {
    window.addEventListener(evt, () => {
      if (activePasskey) resetInactivityTimer();
    }, { passive: true });
  });
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    if (activePasskey) {
      handleAdminLogout();
      showLoginError('Session locked due to 15 minutes of inactivity for security.');
    }
  }, INACTIVITY_TIMEOUT_MS);
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

  // Search Input (Debounced with keyboard shortcuts & out-of-order cancellation)
  const searchInput = document.getElementById('adminSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val.trim().length > 0 ? 'flex' : 'none';

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const trimmed = val.trim();
        if (trimmed !== activeSearchQuery) {
          activeSearchQuery = trimmed;
          loadTickets();
        }
      }, 250);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        const trimmed = searchInput.value.trim();
        if (trimmed !== activeSearchQuery) {
          activeSearchQuery = trimmed;
          loadTickets();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearAdminSearch();
      }
    });
  }

  // Reply Form Submit
  const replyForm = document.getElementById('adminReplyForm');
  if (replyForm) {
    replyForm.addEventListener('submit', handleReplySubmit);
  }
}

function clearAdminSearch() {
  const searchInput = document.getElementById('adminSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    searchInput.value = '';
  }
  if (clearBtn) clearBtn.style.display = 'none';
  if (activeSearchQuery !== '') {
    activeSearchQuery = '';
    loadTickets();
  }
}

// ============================================================================
// 3. TICKET FETCHING & INBOX RENDERING
// ============================================================================
let activeSearchAbortController = null;

async function loadTickets() {
  const container = document.getElementById('inboxTicketList');
  if (!container) return;

  // Cancel any stale in-flight request to prevent race conditions
  if (activeSearchAbortController) {
    activeSearchAbortController.abort();
  }
  activeSearchAbortController = new AbortController();

  // If container is empty, show loading state
  if (!container.children.length) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: var(--apple-text-secondary);">
        <span class="material-symbols-outlined spin-icon" style="font-size: 24px;">sync</span>
        <div style="font-size: 12px; margin-top: 6px;">Fetching from D1...</div>
      </div>
    `;
  }

  try {
    let url = `/api/admin/tickets?status=${encodeURIComponent(activeStatusFilter)}`;
    if (activeSearchQuery) {
      url += `&q=${encodeURIComponent(activeSearchQuery)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${activePasskey}`,
        'Accept': 'application/json'
      },
      signal: activeSearchAbortController.signal
    });

    if (response.status === 401 || response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      handleAdminLogout();
      showLoginError(errData.error || 'Access denied.');
      return;
    }

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to fetch tickets.');
    }

    currentTickets = data.tickets || [];
    renderMetricBadges(data.metrics || {});
    renderInboxList(currentTickets);

    // If an active ticket is selected, refresh its details
    if (selectedTicketId) {
      const found = currentTickets.find(t => t.id === selectedTicketId);
      if (found) {
        renderTicketDetail(found);
      }
    }

  } catch (err) {
    if (err.name === 'AbortError') return; // Ignore intentionally cancelled fetches
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--apple-red); font-size: 13px;">
        <span class="material-symbols-outlined" style="font-size: 28px;">error</span>
        <div style="margin-top: 6px;">${escapeHtml(err.message)}</div>
      </div>
    `;
  }
}

function renderMetricBadges(metrics) {
  const bTotal = document.getElementById('badgeTotal');
  const bOpen = document.getElementById('badgeOpen');
  const bReview = document.getElementById('badgeReview');
  const bProgress = document.getElementById('badgeProgress');
  const bHold = document.getElementById('badgeHold');
  const bInfeasible = document.getElementById('badgeInfeasible');
  const bResolved = document.getElementById('badgeResolved');
  const bClosed = document.getElementById('badgeClosed');

  if (bTotal) bTotal.textContent = metrics.total || 0;
  if (bOpen) bOpen.textContent = metrics.open || 0;
  if (bReview) bReview.textContent = metrics.in_review || 0;
  if (bProgress) bProgress.textContent = metrics.in_progress || 0;
  if (bHold) bHold.textContent = metrics.on_hold || 0;
  if (bInfeasible) bInfeasible.textContent = metrics.infeasible || 0;
  if (bResolved) bResolved.textContent = metrics.resolved || 0;
  if (bClosed) bClosed.textContent = metrics.closed || 0;
}

// Zero-Trust DOM Renderer (Finding 3 Remediation)
function renderInboxList(tickets) {
  const container = document.getElementById('inboxTicketList');
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 16px; text-align: center; color: var(--apple-text-secondary);">
        <span class="material-symbols-outlined" style="font-size: 32px; opacity: 0.4;">inbox</span>
        <div style="font-size: 13px; font-weight: 600; margin-top: 6px;">No Tickets Found</div>
        <div style="font-size: 11px; margin-top: 2px;">No support inquiries match the selected filter.</div>
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
      on_hold: 'status-hold',
      infeasible: 'status-infeasible',
      resolved: 'status-resolved',
      closed: 'status-closed'
    };

    const statusLabels = {
      open: 'Open',
      in_review: 'In Review',
      in_progress: 'In Progress',
      on_hold: 'On Hold',
      infeasible: 'Infeasible',
      resolved: 'Resolved',
      closed: 'Closed'
    };

    // Header
    const header = document.createElement('div');
    header.className = 'inbox-item-header';

    const idRow = document.createElement('div');
    idRow.className = 'inbox-id-row';

    // Status Indicator Dot (colored by ticket status)
    const dot = document.createElement('span');
    dot.className = `status-indicator-dot dot-${ticket.status || 'open'}`;
    dot.title = `Status: ${statusLabels[ticket.status] || ticket.status}`;

    const idSpan = document.createElement('span');
    idSpan.className = 'inbox-ticket-id';
    idSpan.textContent = ticket.id;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined inbox-type-icon';
    iconSpan.textContent = typeIcons[ticket.type] || 'help';
    iconSpan.title = ticket.type;

    idRow.appendChild(dot);
    idRow.appendChild(idSpan);
    idRow.appendChild(iconSpan);

    const statusPill = document.createElement('span');
    statusPill.className = `ticket-status-pill ${statusClasses[ticket.status] || 'status-open'}`;
    statusPill.textContent = statusLabels[ticket.status] || ticket.status;

    header.appendChild(idRow);
    header.appendChild(statusPill);

    // Subject (Safe text node)
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'inbox-item-subject';
    subjectDiv.textContent = ticket.subject;

    // Footer
    const footer = document.createElement('div');
    footer.className = 'inbox-item-footer';

    const requesterSpan = document.createElement('span');
    requesterSpan.className = 'inbox-requester';
    requesterSpan.textContent = ticket.email;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'inbox-date';
    dateSpan.textContent = formatRelativeTime(ticket.created_at);

    footer.appendChild(requesterSpan);
    footer.appendChild(dateSpan);

    item.appendChild(header);
    item.appendChild(subjectDiv);
    item.appendChild(footer);

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

  // Mobile Drill-Down Transition
  if (window.innerWidth <= 768) {
    const mainGrid = document.getElementById('adminMainGrid');
    const mobileBackBtn = document.getElementById('mobileBackToInboxBtn');
    const navHomeBtn = document.getElementById('adminNavHomeBtn');

    if (mainGrid) mainGrid.classList.add('mobile-detail-active');
    if (mobileBackBtn) mobileBackBtn.style.display = 'inline-flex';
    if (navHomeBtn) navHomeBtn.style.display = 'none';

    // Scroll mobile detail view to top
    const detailPane = document.getElementById('adminDetailPane');
    if (detailPane) detailPane.scrollTop = 0;
  }
}

function exitMobileDetail() {
  selectedTicketId = null;
  const mainGrid = document.getElementById('adminMainGrid');
  const mobileBackBtn = document.getElementById('mobileBackToInboxBtn');
  const navHomeBtn = document.getElementById('adminNavHomeBtn');

  if (mainGrid) mainGrid.classList.remove('mobile-detail-active');
  if (mobileBackBtn) mobileBackBtn.style.display = 'none';
  if (navHomeBtn) navHomeBtn.style.display = 'inline-flex';

  const items = document.querySelectorAll('.inbox-item');
  items.forEach(item => item.classList.remove('active'));
}

// Window Resize Handler for Mobile Drill-Down State
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    const mainGrid = document.getElementById('adminMainGrid');
    const mobileBackBtn = document.getElementById('mobileBackToInboxBtn');
    const navHomeBtn = document.getElementById('adminNavHomeBtn');

    if (mainGrid) mainGrid.classList.remove('mobile-detail-active');
    if (mobileBackBtn) mobileBackBtn.style.display = 'none';
    if (navHomeBtn) navHomeBtn.style.display = 'inline-flex';
  }
});

// ============================================================================
// 4. DETAIL INSPECTOR & CONVERSATION MANAGER
// ============================================================================
function renderTicketDetail(ticket) {
  document.getElementById('noTicketSelected').style.display = 'none';
  const workspace = document.getElementById('activeTicketWorkspace');
  workspace.style.display = 'flex';

  // Badges & Subject (Pure text nodes)
  document.getElementById('detailTicketId').textContent = ticket.id;
  document.getElementById('detailSubject').textContent = ticket.subject;
  document.getElementById('detailCategoryBadge').textContent = (ticket.type || 'bug').toUpperCase();

  const priorityBadge = document.getElementById('detailPriorityBadge');
  if (priorityBadge) {
    priorityBadge.textContent = (ticket.priority || 'medium').toUpperCase();
    priorityBadge.className = `ticket-priority-tag priority-${ticket.priority || 'medium'}`;
  }

  // Priority Selector
  const prioritySelect = document.getElementById('detailPrioritySelect');
  if (prioritySelect) {
    prioritySelect.value = ticket.priority || 'medium';
  }

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
    } catch (e) { }

    diagContainer.innerHTML = '';
    const diagGrid = document.createElement('div');
    diagGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 11px;';

    const fields = [
      { label: 'OS / Platform:', value: diagObj.platform || '—' },
      { label: 'Browser Agent:', value: (diagObj.userAgent || '—').slice(0, 50) + '...' },
      { label: 'Screen Resolution:', value: `${diagObj.screenWidth || '—'} × ${diagObj.screenHeight || '—'}` },
      { label: 'Viewport Dimensions:', value: `${diagObj.windowInnerWidth || '—'} × ${diagObj.windowInnerHeight || '—'}` },
      { label: 'Referrer Source:', value: diagObj.referrer || 'direct' },
      { label: 'Logged Timestamp:', value: formatDate(ticket.created_at) }
    ];

    fields.forEach(f => {
      const box = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = f.label + ' ';
      const span = document.createElement('span');
      span.textContent = f.value;
      box.appendChild(strong);
      box.appendChild(span);
      diagGrid.appendChild(box);
    });

    diagContainer.appendChild(diagGrid);
  }

  // Original Message (Pure textContent)
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

  const userAvatar = document.createElement('div');
  userAvatar.className = 'chat-avatar-box';
  userAvatar.innerHTML = '<span class="material-symbols-outlined">person</span>';

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble';

  const userBubbleHeader = document.createElement('div');
  userBubbleHeader.className = 'chat-bubble-header';

  const userName = document.createElement('span');
  userName.className = 'chat-sender-name';
  userName.textContent = ticket.name || 'Requester';

  const userTime = document.createElement('span');
  userTime.className = 'chat-timestamp';
  userTime.textContent = formatDate(ticket.created_at);

  userBubbleHeader.appendChild(userName);
  userBubbleHeader.appendChild(userTime);

  const userText = document.createElement('div');
  userText.className = 'chat-message-text';
  userText.textContent = ticket.message;

  userBubble.appendChild(userBubbleHeader);
  userBubble.appendChild(userText);

  userEl.appendChild(userAvatar);
  userEl.appendChild(userBubble);
  container.appendChild(userEl);

  // 2. Admin Replies
  const replies = parseResponses(ticket.public_response, ticket.updated_at);
  replies.forEach(rep => {
    const adminEl = document.createElement('div');
    adminEl.className = 'chat-message-item admin-message';

    const adminAvatar = document.createElement('div');
    adminAvatar.className = 'chat-avatar-box';
    adminAvatar.innerHTML = '<span class="material-symbols-outlined">shield_person</span>';

    const adminBubble = document.createElement('div');
    adminBubble.className = 'chat-bubble';

    const adminBubbleHeader = document.createElement('div');
    adminBubbleHeader.className = 'chat-bubble-header';

    const senderInfo = document.createElement('div');
    senderInfo.className = 'chat-sender-info';

    const adminName = document.createElement('span');
    adminName.className = 'chat-sender-name';
    adminName.textContent = rep.author || 'e-Plan Studio Engineering Team';

    const verifiedTag = document.createElement('span');
    verifiedTag.className = 'chat-badge-verified';
    verifiedTag.innerHTML = '<span class="material-symbols-outlined" style="font-size: 11px;">verified</span> Verified';

    senderInfo.appendChild(adminName);
    senderInfo.appendChild(verifiedTag);

    const adminTime = document.createElement('span');
    adminTime.className = 'chat-timestamp';
    adminTime.textContent = formatDate(rep.time || ticket.updated_at);

    adminBubbleHeader.appendChild(senderInfo);
    adminBubbleHeader.appendChild(adminTime);

    const adminText = document.createElement('div');
    adminText.className = 'chat-message-text';
    adminText.textContent = rep.text;

    adminBubble.appendChild(adminBubbleHeader);
    adminBubble.appendChild(adminText);

    adminEl.appendChild(adminAvatar);
    adminEl.appendChild(adminBubble);
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
    } catch (e) { }
  }
  return [{ text: trimmed, time: defaultTime, author: 'e-Plan Studio Engineering Team' }];
}

// ============================================================================
// 5. CANNED TEMPLATES & QUICK ACTIONS
// ============================================================================
function insertCannedResponse(type) {
  const textarea = document.getElementById('replyMessageInput');
  if (!textarea) return;

  const templates = {
    investigating: 'Hi! Our engineering team has received this report and is actively investigating the issue in our development environment.',
    fix_deployed: 'Hi! A fix has been deployed to the live calculation engine. Please re-generate your PDF and let us know if it matches your expectations.',
    need_info: 'Hi! Could you please share your site dimensions or the specific survey sketch page you are working with so we can reproduce accurately?'
  };

  const textToInsert = templates[type] || '';
  if (textToInsert) {
    textarea.value = textToInsert;
    textarea.focus();
  }
}

function copyActiveTicketId() {
  if (!selectedTicketId) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(selectedTicketId).then(() => {
      showToast(`Copied ${selectedTicketId} to clipboard`);
    }).catch(() => {
      showToast(selectedTicketId);
    });
  } else {
    showToast(selectedTicketId);
  }
}

function openPublicTracker() {
  if (!selectedTicketId) return;
  window.open(`contact.html?track=${encodeURIComponent(selectedTicketId)}`, '_blank');
}

function showToast(msg) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2000);
}

// ============================================================================
// 6. ACTIONS: PRIORITY CHANGE, STATUS CHANGE, REPLY POST & INTERNAL NOTES
// ============================================================================
async function handlePriorityChange(newPriority) {
  if (!selectedTicketId) return;

  try {
    const response = await fetch(`/api/admin/tickets/${encodeURIComponent(selectedTicketId)}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activePasskey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ priority: newPriority })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update priority.');
    }

    const ticket = currentTickets.find(t => t.id === selectedTicketId);
    if (ticket) {
      ticket.priority = newPriority;
    }

    const priorityBadge = document.getElementById('detailPriorityBadge');
    if (priorityBadge) {
      priorityBadge.textContent = newPriority.toUpperCase();
      priorityBadge.className = `ticket-priority-tag priority-${newPriority}`;
    }

    showToast(`Priority updated to ${newPriority.toUpperCase()}`);
    loadTickets();

  } catch (err) {
    alert('Error updating priority: ' + err.message);
    const ticket = currentTickets.find(t => t.id === selectedTicketId);
    const select = document.getElementById('detailPrioritySelect');
    if (ticket && select) select.value = ticket.priority || 'medium';
  }
}

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
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update status.');
    }

    const ticket = currentTickets.find(t => t.id === selectedTicketId);
    if (ticket) {
      ticket.status = newStatus;
    }

    showToast(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    loadTickets();

  } catch (err) {
    alert('Error updating status: ' + err.message);
    const ticket = currentTickets.find(t => t.id === selectedTicketId);
    const select = document.getElementById('detailStatusSelect');
    if (ticket && select) select.value = ticket.status || 'open';
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
    showToast('Reply published to timeline ✓');

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
    showToast('Internal notes saved');
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
// 6B. DELETE TICKET WORKFLOW (Irreversible Confirmation with Checkbox)
// ============================================================================
function openDeleteTicketModal() {
  if (!selectedTicketId) return;

  const ticket = currentTickets.find(t => t.id === selectedTicketId);
  const modal = document.getElementById('deleteConfirmModal');
  const idEl = document.getElementById('deleteModalTicketId');
  const subjectEl = document.getElementById('deleteModalTicketSubject');
  const checkbox = document.getElementById('deleteConsentCheckbox');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  if (idEl) idEl.textContent = selectedTicketId;
  if (subjectEl) subjectEl.textContent = ticket ? ticket.subject : '—';
  if (checkbox) checkbox.checked = false;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.4';
    confirmBtn.style.cursor = 'not-allowed';
  }

  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function closeDeleteTicketModal() {
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function toggleDeleteButtonState() {
  const checkbox = document.getElementById('deleteConsentCheckbox');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  if (checkbox && confirmBtn) {
    confirmBtn.disabled = !checkbox.checked;
    confirmBtn.style.opacity = checkbox.checked ? '1' : '0.4';
    confirmBtn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
  }
}

async function executeDeleteTicket() {
  if (!selectedTicketId) return;

  const checkbox = document.getElementById('deleteConsentCheckbox');
  if (!checkbox || !checkbox.checked) return;

  const confirmBtn = document.getElementById('confirmDeleteBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="material-symbols-outlined spin-icon" style="font-size: 16px;">sync</span> Deleting...';
  }

  try {
    const response = await fetch(`/api/admin/tickets/${encodeURIComponent(selectedTicketId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${activePasskey}`
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete ticket.');
    }

    const deletedId = selectedTicketId;
    closeDeleteTicketModal();
    showToast(`Ticket ${deletedId} deleted permanently.`);

    // Reset workspace state
    selectedTicketId = null;
    const workspace = document.getElementById('activeTicketWorkspace');
    const emptyState = document.getElementById('noTicketSelected');
    if (workspace) workspace.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';

    if (window.innerWidth <= 768) {
      exitMobileDetail();
    }

    // Refresh inbox list
    loadTickets();

  } catch (err) {
    alert('Error deleting ticket: ' + err.message);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">delete_forever</span> <span>Delete Ticket</span>';
      toggleDeleteButtonState();
    }
  }
}

// ============================================================================
// 7. UTILITIES
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
