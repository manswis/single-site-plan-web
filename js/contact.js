/**
 * @file js/contact.js
 * @description Frontend controller for Contact Us, Request Submission & Live Ticket Tracking.
 * Handles client-side diagnostics, category chip selection, form validation,
 * API requests to /api/tickets, dynamic status stepper rendering, and URL query tracking.
 */

// Diagnostic client info collector
function getClientDiagnostics() {
  try {
    return {
      userAgent: navigator.userAgent || 'Unknown',
      platform: navigator.platform || 'Unknown',
      language: navigator.language || 'en',
      screenWidth: window.screen ? window.screen.width : 0,
      screenHeight: window.screen ? window.screen.height : 0,
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      colorDepth: window.screen ? window.screen.colorDepth : 0,
      referrer: document.referrer || 'direct',
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {};
  }
}

// Global state
let activeCategory = 'bug';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupCategoryChips();
  setupTabSwitching();
  setupFormSubmission();
  setupTrackingLookup();
  checkUrlParamsForTracking();
});

// 1. Category Tiles Selection
function setupCategoryChips() {
  const tiles = document.querySelectorAll('.category-tile, .category-chip');
  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      tiles.forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      activeCategory = tile.getAttribute('data-type') || 'bug';

      const typeInput = document.getElementById('ticketTypeInput');
      if (typeInput) {
        typeInput.value = activeCategory;
      }

      // Update placeholder dynamically based on category
      const msgArea = document.getElementById('ticketMessage');
      const subjectInput = document.getElementById('ticketSubject');
      if (msgArea && subjectInput) {
        if (activeCategory === 'bug') {
          subjectInput.placeholder = 'e.g. Setback calculation mismatch on corner plot';
          msgArea.placeholder = 'Please describe the bug in detail: what measurements were entered, what step failed, and what you expected to see...';
        } else if (activeCategory === 'feature') {
          subjectInput.placeholder = 'e.g. Support for G+4 floor residential layouts';
          msgArea.placeholder = 'Describe the requested feature or layout capability and how it supports your planning needs...';
        } else if (activeCategory === 'error') {
          subjectInput.placeholder = 'e.g. PDF export failed during vector render';
          msgArea.placeholder = 'Please describe the technical error: any browser console message or unexpected stop in generation...';
        } else {
          subjectInput.placeholder = 'e.g. Enhancement suggestion for road width controls';
          msgArea.placeholder = 'Share your thoughts, suggestions, or general inquiry with the engineering team...';
        }
      }
    });
  });

  // Priority Segmented Control Handler
  setupPrioritySelector();
}

function setupPrioritySelector() {
  const priorityBtns = document.querySelectorAll('.priority-btn');
  const priorityInput = document.getElementById('ticketPriority');

  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const chosenPriority = btn.getAttribute('data-priority') || 'medium';
      if (priorityInput) {
        priorityInput.value = chosenPriority;
      }
    });
  });
}

// 2. Tab Switching (Submit vs Track)
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll('.tab-segment-btn, .contact-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabName) {
  const tabButtons = document.querySelectorAll('.tab-segment-btn, .contact-tab-btn');
  const panels = document.querySelectorAll('.contact-tab-panel');

  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  panels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tabPanel-${tabName}`);
  });

  // Update URL hash for sharing / bookmarks safely
  try {
    if (window.history && window.history.replaceState && window.location.href.startsWith('http')) {
      const currentUrl = new URL(window.location.href);
      currentUrl.hash = `#${tabName}`;
      window.history.replaceState({}, '', currentUrl.toString());
    }
  } catch (e) { }
}

// Check if URL has ?track=REQ-XXXX or #track
function checkUrlParamsForTracking() {
  try {
    if (!window.location.href.startsWith('http')) return;
    const url = new URL(window.location.href);
    const trackId = url.searchParams.get('track') || url.searchParams.get('id');

    if (trackId) {
      switchTab('track');
      const trackInput = document.getElementById('trackIdInput');
      if (trackInput) {
        trackInput.value = trackId.trim();
        executeTrackLookup(trackId.trim());
      }
    } else if (window.location.hash === '#track') {
      switchTab('track');
    }
  } catch (e) { }
}

// 3. Form Submission Handling
function setupFormSubmission() {
  const form = document.getElementById('ticketSubmitForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('ticketSubmitBtn');
    const alertBox = document.getElementById('submitAlertBox');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.className = 'contact-alert';
    }

    const name = document.getElementById('ticketName')?.value?.trim() || '';
    const email = document.getElementById('ticketEmail')?.value?.trim() || '';
    const priority = document.getElementById('ticketPriority')?.value || 'medium';
    const subject = document.getElementById('ticketSubject')?.value?.trim() || '';
    const message = document.getElementById('ticketMessage')?.value?.trim() || '';
    const honeypot = document.getElementById('ticketHoneypot')?.value || '';

    // Validation
    if (!email || !email.includes('@')) {
      showFormAlert('Please enter a valid email address so we can reply to you.', 'error');
      return;
    }

    if (!subject || subject.length < 3) {
      showFormAlert('Please enter a descriptive subject (at least 3 characters).', 'error');
      return;
    }

    if (!message || message.length < 10) {
      showFormAlert('Please provide more details in the message (at least 10 characters).', 'error');
      return;
    }

    // Set Loading State
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Submitting Request...';
    }

    const payload = {
      type: activeCategory,
      priority,
      name,
      email,
      subject,
      message,
      honeypot,
      client_info: getClientDiagnostics()
    };

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let data = {};
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(
          response.status === 404
            ? 'The API endpoint (/api/tickets) is not yet deployed or route not found.'
            : (responseText || `Server responded with status ${response.status}`)
        );
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      // Success Display
      showSubmissionSuccess(data.ticketId, data.type);
      form.reset();

    } catch (err) {
      showFormAlert(err.message || 'An error occurred. Please check your connection and try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Submit Request';
      }
    }
  });
}

function showFormAlert(message, type = 'error') {
  const alertBox = document.getElementById('submitAlertBox');
  if (!alertBox) return;

  alertBox.className = `contact-alert contact-alert-${type}`;
  alertBox.innerHTML = `
    <span class="material-symbols-outlined">${type === 'error' ? 'error' : 'check_circle'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  alertBox.style.display = 'flex';
}

function showSubmissionSuccess(ticketId, type) {
  const formCard = document.getElementById('ticketFormCard');
  const successCard = document.getElementById('ticketSuccessCard');
  const idEl = document.getElementById('generatedTicketId');
  const typeEl = document.getElementById('successTicketType');

  if (idEl) idEl.textContent = ticketId;
  if (typeEl) typeEl.textContent = type.toUpperCase();

  if (formCard) formCard.style.display = 'none';
  if (successCard) {
    successCard.style.display = 'block';
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Reset form to submit another request
window.resetContactForm = function () {
  const formCard = document.getElementById('ticketFormCard');
  const successCard = document.getElementById('ticketSuccessCard');
  if (formCard) formCard.style.display = 'block';
  if (successCard) successCard.style.display = 'none';
};

// Copy ticket ID to clipboard
window.copyTicketId = function () {
  const idEl = document.getElementById('generatedTicketId');
  if (!idEl) return;
  const id = idEl.textContent.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(id).then(() => {
      const copyBtn = document.getElementById('copyTicketBtn');
      if (copyBtn) {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copied!';
        setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2000);
      }
    }).catch(() => fallbackCopy(id));
  } else {
    fallbackCopy(id);
  }
};

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    const copyBtn = document.getElementById('copyTicketBtn');
    if (copyBtn) {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copied!';
      setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2000);
    }
  } catch (err) { }
  document.body.removeChild(textArea);
}

// Quick jump to tracking tab with generated ID
window.trackGeneratedTicket = function () {
  const idEl = document.getElementById('generatedTicketId');
  if (!idEl) return;
  const id = idEl.textContent.trim();
  switchTab('track');
  const trackInput = document.getElementById('trackIdInput');
  if (trackInput) {
    trackInput.value = id;
    executeTrackLookup(id);
  }
};

// 4. Ticket Status Tracking Lookup
function setupTrackingLookup() {
  const trackForm = document.getElementById('ticketTrackForm');
  if (!trackForm) return;

  trackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const trackInput = document.getElementById('trackIdInput');
    const id = trackInput?.value?.trim();
    if (id) {
      executeTrackLookup(id);
    }
  });
}

async function executeTrackLookup(ticketId) {
  const cleanId = ticketId.trim().toUpperCase();
  const lookupBtn = document.getElementById('trackLookupBtn');
  const alertBox = document.getElementById('trackAlertBox');
  const resultCard = document.getElementById('trackResultCard');

  if (alertBox) {
    alertBox.style.display = 'none';
  }
  if (resultCard) {
    resultCard.style.display = 'none';
  }

  if (lookupBtn) {
    lookupBtn.disabled = true;
    lookupBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Searching...';
  }

  try {
    const response = await fetch(`/api/tickets/${encodeURIComponent(cleanId)}`, {
      headers: { 'Accept': 'application/json' }
    });

    let data = {};
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (jsonErr) {
      throw new Error(
        response.status === 404
          ? `No ticket found with ID "${cleanId}".`
          : (responseText || `Server returned status ${response.status}`)
      );
    }

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Ticket not found.');
    }

    renderTrackingResult(data.ticket);

    // Update URL query safely
    try {
      if (window.history && window.history.replaceState && window.location.href.startsWith('http')) {
        const url = new URL(window.location.href);
        url.searchParams.set('track', cleanId);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) { }

  } catch (err) {
    if (alertBox) {
      alertBox.className = 'contact-alert contact-alert-error';
      alertBox.innerHTML = `
        <span class="material-symbols-outlined">info</span>
        <span>${escapeHtml(err.message)}</span>
      `;
      alertBox.style.display = 'flex';
    }
  } finally {
    if (lookupBtn) {
      lookupBtn.disabled = false;
      lookupBtn.innerHTML = '<span class="material-symbols-outlined">search</span> Check Status';
    }
  }
}

// Render status stepper & details
function renderTrackingResult(ticket) {
  const resultCard = document.getElementById('trackResultCard');
  if (!resultCard) return;

  // Set fields
  document.getElementById('resTicketId').textContent = ticket.id;
  document.getElementById('resTicketSubject').textContent = ticket.subject;
  document.getElementById('resTicketType').textContent = ticket.type.toUpperCase();
  document.getElementById('resTicketPriority').textContent = ticket.priority.toUpperCase();
  document.getElementById('resTicketCreated').textContent = formatDate(ticket.created_at);
  document.getElementById('resTicketUpdated').textContent = formatDate(ticket.updated_at);

  // Status Badge Styling
  const statusBadge = document.getElementById('resTicketStatus');
  const statusMap = {
    open: { label: 'Submitted / Open', class: 'status-open' },
    in_review: { label: 'Under Review', class: 'status-review' },
    in_progress: { label: 'In Progress', class: 'status-progress' },
    resolved: { label: 'Resolved', class: 'status-resolved' },
    closed: { label: 'Closed', class: 'status-closed' }
  };

  const statusInfo = statusMap[ticket.status] || { label: ticket.status.toUpperCase(), class: 'status-open' };
  statusBadge.className = `ticket-status-pill ${statusInfo.class}`;
  statusBadge.textContent = statusInfo.label;

  // Stepper Nodes (1: Submitted, 2: Under Review, 3: In Progress, 4: Resolved)
  const steps = ['submitted', 'review', 'progress', 'resolved'];
  const currentStatus = ticket.status.toLowerCase();

  let activeStepIndex = 0;
  if (currentStatus === 'open') activeStepIndex = 0;
  else if (currentStatus === 'in_review') activeStepIndex = 1;
  else if (currentStatus === 'in_progress') activeStepIndex = 2;
  else if (currentStatus === 'resolved' || currentStatus === 'closed') activeStepIndex = 3;

  steps.forEach((step, idx) => {
    const stepEl = document.getElementById(`stepNode-${step}`);
    if (stepEl) {
      stepEl.classList.remove('completed', 'current', 'pending');
      if (idx < activeStepIndex) {
        stepEl.classList.add('completed');
      } else if (idx === activeStepIndex) {
        stepEl.classList.add('current');
      } else {
        stepEl.classList.add('pending');
      }
    }
  });

  // Render Timeline Chat Conversation
  renderTimelineChat(ticket, statusInfo);

  resultCard.style.display = 'block';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Render dynamic chat bubbles
function renderTimelineChat(ticket, statusInfo) {
  const container = document.getElementById('chatThreadContainer');
  if (!container) return;

  container.innerHTML = '';

  // 1. Initial User Request Message
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'chat-message-item user-message';
  userMsgEl.innerHTML = `
    <div class="chat-avatar-box">
      <span class="material-symbols-outlined">person</span>
    </div>
    <div class="chat-bubble">
      <div class="chat-bubble-header">
        <div class="chat-sender-info">
          <span class="chat-sender-name">You (Requester)</span>
        </div>
        <span class="chat-timestamp">${formatDate(ticket.created_at)}</span>
      </div>
      <div class="chat-subject-highlight">
        <span class="material-symbols-outlined" style="font-size: 16px; color: var(--apple-accent);">push_pin</span>
        <span>${escapeHtml(ticket.subject)}</span>
      </div>
      <div class="chat-message-text">${escapeHtml(ticket.message || 'No description provided.')}</div>
    </div>
  `;
  container.appendChild(userMsgEl);

  // 2. System Status Event Milestone
  const milestoneEl = document.createElement('div');
  milestoneEl.className = 'chat-system-milestone';
  milestoneEl.innerHTML = `
    <div class="milestone-line"></div>
    <div class="milestone-pill">
      <span class="material-symbols-outlined" style="font-size: 14px;">update</span>
      <span>Status: <strong>${escapeHtml(statusInfo.label)}</strong> • ${formatDate(ticket.updated_at || ticket.created_at)}</span>
    </div>
    <div class="milestone-line"></div>
  `;
  container.appendChild(milestoneEl);

  // 3. Admin / Engineering Response Bubbles (Listview)
  const messagesList = parseAdminResponses(ticket.public_response, ticket.updated_at);

  if (messagesList.length > 0) {
    messagesList.forEach(msg => {
      const adminMsgEl = document.createElement('div');
      adminMsgEl.className = 'chat-message-item admin-message';
      adminMsgEl.innerHTML = `
        <div class="chat-avatar-box">
          <span class="material-symbols-outlined">account_balance</span>
        </div>
        <div class="chat-bubble">
          <div class="chat-bubble-header">
            <div class="chat-sender-info">
              <span class="chat-sender-name">${escapeHtml(msg.author || 'e-Plan Studio Engineering Team')}</span>
              <span class="chat-badge-verified">
                <span class="material-symbols-outlined" style="font-size: 11px;">verified</span>
                Verified
              </span>
            </div>
            <span class="chat-timestamp">${formatDate(msg.time || ticket.updated_at)}</span>
          </div>
          <div class="chat-message-text">${escapeHtml(msg.text)}</div>
        </div>
      `;
      container.appendChild(adminMsgEl);
    });
  } else {
    const awaitingEl = document.createElement('div');
    awaitingEl.className = 'chat-awaiting-box';
    awaitingEl.innerHTML = `
      <span class="material-symbols-outlined spin-icon" style="color: var(--apple-accent); font-size: 20px;">hourglass_top</span>
      <div>
        <strong>Awaiting Engineering Team Review</strong>
        <div style="font-size: 11px; margin-top: 2px;">Your ticket is in the triage queue. Updates and developer replies will appear directly in this conversation thread.</div>
      </div>
    `;
    container.appendChild(awaitingEl);
  }
}

// Helper to parse multiple admin messages (JSON Array, multi-line, or plain text)
function parseAdminResponses(rawResponse, defaultTime) {
  if (!rawResponse || typeof rawResponse !== 'string' || rawResponse.trim().length === 0) {
    return [];
  }

  const trimmed = rawResponse.trim();

  // 1. Try parsing as JSON Array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'string') {
            return { text: item, time: defaultTime, author: 'e-Plan Studio Engineering Team' };
          } else if (typeof item === 'object' && item !== null) {
            return {
              text: item.text || item.message || '',
              time: item.time || item.created_at || defaultTime,
              author: item.author || item.name || 'e-Plan Studio Engineering Team'
            };
          }
          return null;
        }).filter(item => item && item.text.trim().length > 0);
      }
    } catch (e) {}
  }

  // 2. Try parsing delimiter "---" if admin added multiple updates separated by divider
  if (trimmed.includes('\n---\n') || trimmed.includes('\n---')) {
    const parts = trimmed.split(/\n-{3,}\n?/);
    return parts
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => ({
        text: part,
        time: defaultTime,
        author: 'e-Plan Studio Engineering Team'
      }));
  }

  // 3. Single standard text response
  return [{
    text: trimmed,
    time: defaultTime,
    author: 'e-Plan Studio Engineering Team'
  }];
}

// Utility: Date formatter
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

// Utility: HTML Escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
