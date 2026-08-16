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
  setupAttachmentHandlers();
  setupTrackingLookup();
  setupSavedTicketsVault();
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

  if (tabName === 'track') {
    renderSavedTicketsList();
  }

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

// 3. Form Submission Handling & Consent Modal Workflow
let pendingTicketPayload = null;

function setupFormSubmission() {
  const form = document.getElementById('ticketSubmitForm');
  const checkbox = document.getElementById('modalTermsCheckbox');
  const confirmBtn = document.getElementById('confirmSubmitBtn');

  if (checkbox && confirmBtn) {
    checkbox.addEventListener('change', () => {
      confirmBtn.disabled = !checkbox.checked;
      confirmBtn.style.opacity = checkbox.checked ? '1' : '0.5';
      confirmBtn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
    });
  }

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

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

    // Save payload and open Terms Modal
    pendingTicketPayload = {
      type: activeCategory,
      priority,
      name,
      email,
      subject,
      message,
      attachments: currentAttachments,
      honeypot,
      client_info: getClientDiagnostics()
    };

    openTermsModal();
  });
}

// ============================================================================
// 5-LAYER SECURE IMAGE ATTACHMENT PIPELINE
// ============================================================================
let currentAttachments = []; // Array of { name, size, dataUrl }

function setupAttachmentHandlers() {
  const dropzone = document.getElementById('attachmentDropzone');

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dropzone-hover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dropzone-hover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer ? e.dataTransfer.files : [];
      if (files && files.length > 0) {
        processAttachmentFiles(files);
      }
    });
  }

  // Clipboard Paste listener (Cmd+V / Ctrl+V on message box or window)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processAttachmentFiles([file]);
        }
      }
    }
  });

  // Lightbox keyboard dismissal (Escape key)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageLightbox();
    }
  });
}

function triggerAttachmentPicker() {
  const fileInput = document.getElementById('attachmentFileInput');
  if (fileInput) fileInput.click();
}

function handleAttachmentFileSelect(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    processAttachmentFiles(files);
  }
  event.target.value = '';
}

async function processAttachmentFiles(files) {
  for (let i = 0; i < files.length; i++) {
    if (currentAttachments.length >= 2) {
      showFormAlert('Maximum of 2 screenshots/drawings allowed per ticket.', 'error');
      break;
    }
    const file = files[i];
    try {
      const sanitized = await sanitizeAndCompressImage(file);
      if (sanitized) {
        currentAttachments.push(sanitized);
        renderAttachmentPreviews();
      }
    } catch (err) {
      showFormAlert(err.message || 'Failed to attach image.', 'error');
    }
  }
}

/**
 * 5-Layer Security Sanitizer & Offscreen Canvas Compressor
 * Discards all binary payload, EXIF metadata, and polyglots by re-encoding from pure pixel RGB data.
 */
function sanitizeAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    // Layer 1: Whitelist raster formats only (strictly reject SVGs and non-images)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase()) || file.name.toLowerCase().endsWith('.svg')) {
      return reject(new Error('Prohibited format: Only JPG, PNG, and WebP raster images are permitted. Vector SVGs and executables are blocked for security.'));
    }

    // Layer 2: Raw size guard (max 10MB input before processing)
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('File too large: Please select an image under 10 MB.'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Layer 3: Dimension downscaling (max 1280 x 1280)
      const MAX_DIM = 1280;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      // Layer 4: Canvas Re-Encoding ("Digital Furnace")
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Unable to initialize image processor.'));
      }

      // Fill transparent backgrounds with solid white (for transparent PNGs)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw pure pixel RGB data only (strips all EXIF metadata and hidden injections)
      ctx.drawImage(img, 0, 0, width, height);

      // Export as fresh, clean compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

      // Calculate approximate size
      const cleanSizeInBytes = Math.round((compressedDataUrl.length * 3) / 4);

      resolve({
        name: file.name ? file.name.replace(/[^\w\.-]/g, '_').slice(0, 40) : 'screenshot.jpg',
        size: cleanSizeInBytes,
        dataUrl: compressedDataUrl
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file. Please ensure it is a valid raster photograph or screenshot.'));
    };

    img.src = objectUrl;
  });
}

function renderAttachmentPreviews() {
  const grid = document.getElementById('attachmentPreviewsGrid');
  const countBadge = document.getElementById('attachmentCountBadge');
  const dropzone = document.getElementById('attachmentDropzone');

  if (countBadge) {
    countBadge.textContent = `${currentAttachments.length}/2`;
  }

  if (!grid) return;

  if (currentAttachments.length === 0) {
    grid.style.display = 'none';
    grid.innerHTML = '';
    if (dropzone) dropzone.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  grid.innerHTML = '';

  currentAttachments.forEach((att, idx) => {
    const card = document.createElement('div');
    card.className = 'attachment-preview-card';
    card.innerHTML = `
      <div class="attachment-thumb-wrap" onclick="openImageLightbox('${att.dataUrl}', '${escapeHtml(att.name)}')">
        <img src="${att.dataUrl}" alt="${escapeHtml(att.name)}" class="attachment-thumb-img">
        <div class="attachment-zoom-overlay">
          <span class="material-symbols-outlined">zoom_in</span>
        </div>
      </div>
      <div class="attachment-meta-info">
        <div class="attachment-name-text" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</div>
        <div class="attachment-size-badge">${(att.size / 1024).toFixed(1)} KB</div>
      </div>
      <button type="button" class="attachment-remove-btn" onclick="removeAttachment(${idx})" title="Remove attachment">
        <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
      </button>
    `;
    grid.appendChild(card);
  });

  if (dropzone) {
    dropzone.style.display = currentAttachments.length >= 2 ? 'none' : 'block';
  }
}

function removeAttachment(index) {
  if (index >= 0 && index < currentAttachments.length) {
    currentAttachments.splice(index, 1);
    renderAttachmentPreviews();
  }
}

// Lightbox Handlers
function openImageLightbox(src, caption) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxModalImg');
  const captionEl = document.getElementById('lightboxCaption');

  if (modal && img) {
    img.src = src;
    if (captionEl) captionEl.textContent = caption || 'Attached Screenshot';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeImageLightbox() {
  const modal = document.getElementById('imageLightboxModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Open Terms & Privacy Consent Modal
function openTermsModal() {
  const modal = document.getElementById('termsConsentModal');
  const checkbox = document.getElementById('modalTermsCheckbox');
  const confirmBtn = document.getElementById('confirmSubmitBtn');

  if (checkbox) checkbox.checked = false;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    confirmBtn.style.cursor = 'not-allowed';
  }

  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// Close Terms & Privacy Consent Modal
function closeTermsModal() {
  const modal = document.getElementById('termsConsentModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Set form locking and loading stack state
function setFormLoadingState(isLoading) {
  const overlay = document.getElementById('submitCardLoadingOverlay');
  const form = document.getElementById('ticketSubmitForm');
  const submitBtn = document.getElementById('ticketSubmitBtn');
  const tiles = document.querySelectorAll('.category-tile');
  const priorityBtns = document.querySelectorAll('.priority-btn');

  if (overlay) {
    overlay.style.display = isLoading ? 'flex' : 'none';
  }

  if (form) {
    if (isLoading) {
      form.classList.add('form-locked');
    } else {
      form.classList.remove('form-locked');
    }
    const inputs = form.querySelectorAll('input, textarea, button, select');
    inputs.forEach(el => {
      el.disabled = isLoading;
    });
  }

  tiles.forEach(tile => {
    tile.disabled = isLoading;
    tile.style.pointerEvents = isLoading ? 'none' : '';
  });

  priorityBtns.forEach(btn => {
    btn.disabled = isLoading;
    btn.style.pointerEvents = isLoading ? 'none' : '';
  });

  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.innerHTML = isLoading
      ? '<span class="material-symbols-outlined spin-icon">sync</span> Submitting Request...'
      : '<span class="material-symbols-outlined">send</span> Submit Request';
  }
}

// Execute confirmed submission after user accepts terms
async function proceedConfirmedSubmit() {
  if (!pendingTicketPayload) {
    closeTermsModal();
    return;
  }

  closeTermsModal();

  const form = document.getElementById('ticketSubmitForm');

  // Activate Frosted Glass Loading Stack & Lock All Fields
  setFormLoadingState(true);

  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pendingTicketPayload)
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

    const submittedSubject = pendingTicketPayload?.subject || document.getElementById('ticketSubject')?.value?.trim() || 'Support Inquiry';
    const submittedType = data.type || pendingTicketPayload?.type || 'bug';

    // Auto-save ticket to browser localStorage vault for seamless 1-click tracking
    saveTicketToStorage({
      id: data.ticketId,
      type: submittedType,
      subject: submittedSubject,
      date: new Date().toISOString()
    });

    // Success Display
    showSubmissionSuccess(data.ticketId, submittedType);
    if (form) form.reset();
    currentAttachments = [];
    renderAttachmentPreviews();
    pendingTicketPayload = null;

  } catch (err) {
    showFormAlert(err.message || 'An error occurred. Please check your connection and try again.', 'error');
  } finally {
    setFormLoadingState(false);
  }
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
  const form = document.getElementById('ticketSubmitForm');

  if (idEl) idEl.textContent = ticketId;
  if (typeEl) typeEl.textContent = type.toUpperCase();

  // Thoroughly clear all form inputs and attachments
  if (form) form.reset();
  currentAttachments = [];
  renderAttachmentPreviews();
  pendingTicketPayload = null;

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
  const form = document.getElementById('ticketSubmitForm');

  // Complete cleanup of form inputs and attachments
  if (form) form.reset();
  currentAttachments = [];
  renderAttachmentPreviews();
  pendingTicketPayload = null;

  // Reset category selector to default "bug"
  const tiles = document.querySelectorAll('.category-tile');
  tiles.forEach(t => t.classList.remove('active'));
  const defaultTile = document.querySelector('.category-tile[data-type="bug"]');
  if (defaultTile) defaultTile.classList.add('active');
  activeCategory = 'bug';
  const typeInput = document.getElementById('ticketTypeInput');
  if (typeInput) typeInput.value = 'bug';

  // Reset priority buttons to default "medium"
  const priorityBtns = document.querySelectorAll('.priority-btn');
  priorityBtns.forEach(b => b.classList.remove('active'));
  const defaultPriority = document.querySelector('.priority-btn[data-priority="medium"]');
  if (defaultPriority) defaultPriority.classList.add('active');
  const priorityInput = document.getElementById('ticketPriority');
  if (priorityInput) priorityInput.value = 'medium';

  // Clear alert boxes
  const alertBox = document.getElementById('submitAlertBox');
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'contact-alert';
  }

  // Restore form card view
  if (successCard) successCard.style.display = 'none';
  if (formCard) {
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

    // Auto-save/refresh ticket in browser localStorage vault upon successful query
    if (data.ticket && data.ticket.id) {
      saveTicketToStorage({
        id: data.ticket.id,
        type: data.ticket.type || 'bug',
        subject: data.ticket.subject || 'Support Inquiry',
        date: data.ticket.created_at || new Date().toISOString()
      });
    }

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
    on_hold: { label: 'On Hold / Pending Info', class: 'status-hold' },
    infeasible: { label: 'Infeasible / Not Supported', class: 'status-infeasible' },
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
  let attachmentsHtml = '';
  if (Array.isArray(ticket.attachments) && ticket.attachments.length > 0) {
    attachmentsHtml = `
      <div class="chat-attachments-container">
        <div class="chat-attachments-title">
          <span class="material-symbols-outlined" style="font-size: 14px;">attachment</span>
          <span>Attached Screenshots (${ticket.attachments.length})</span>
        </div>
        <div class="chat-attachments-gallery">
          ${ticket.attachments.map(att => {
      const src = typeof att === 'string' ? att : att.dataUrl;
      const name = (typeof att === 'object' && att.name) ? att.name : 'Screenshot';
      return `
              <div class="chat-attachment-thumb" onclick="openImageLightbox('${src}', '${escapeHtml(name)}')">
                <img src="${src}" alt="${escapeHtml(name)}" loading="lazy">
                <div class="thumb-zoom-badge"><span class="material-symbols-outlined">zoom_in</span></div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

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
      ${attachmentsHtml}
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

// ============================================================================
// 6. LOCAL BROWSER TICKET VAULT (Recent Inquiries Manager)
// ============================================================================
const SAVED_TICKETS_KEY = 'eplan_saved_tickets_vault';

function setupSavedTicketsVault() {
  renderSavedTicketsList();
}

function getSavedTickets() {
  try {
    const raw = localStorage.getItem(SAVED_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveTicketToStorage(ticket) {
  if (!ticket || !ticket.id) return;
  try {
    let list = getSavedTickets();
    // Remove if already exists to bump to the top of list
    list = list.filter(t => t.id !== ticket.id);
    list.unshift({
      id: ticket.id,
      type: ticket.type || 'bug',
      subject: ticket.subject || 'Support Inquiry',
      date: ticket.date || new Date().toISOString()
    });
    // Cap at most recent 8 items
    if (list.length > 8) list = list.slice(0, 8);
    localStorage.setItem(SAVED_TICKETS_KEY, JSON.stringify(list));
    renderSavedTicketsList();
  } catch (e) { }
}

function removeSingleSavedTicket(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  try {
    let list = getSavedTickets();
    list = list.filter(t => t.id !== id);
    localStorage.setItem(SAVED_TICKETS_KEY, JSON.stringify(list));
    renderSavedTicketsList();
  } catch (e) { }
}

window.removeSingleSavedTicket = removeSingleSavedTicket;

window.clearAllSavedTickets = function () {
  try {
    localStorage.removeItem(SAVED_TICKETS_KEY);
    renderSavedTicketsList();
  } catch (e) { }
};

window.lookupSavedTicket = function (ticketId) {
  const input = document.getElementById('trackIdInput');
  if (input) {
    input.value = ticketId;
    switchTab('track');
    executeTrackLookup(ticketId);
  }
};

function renderSavedTicketsList() {
  const card = document.getElementById('savedTicketsCard');
  const listEl = document.getElementById('savedTicketsList');
  const countBadge = document.getElementById('savedTicketsCountBadge');
  if (!card || !listEl) return;

  const tickets = getSavedTickets();
  if (tickets.length === 0) {
    card.style.display = 'none';
    listEl.innerHTML = '';
    return;
  }

  card.style.display = 'block';
  if (countBadge) countBadge.textContent = `${tickets.length} Saved`;

  listEl.innerHTML = '';
  tickets.forEach(ticket => {
    const item = document.createElement('div');
    item.className = 'saved-ticket-item';

    const timeAgo = formatRelativeTime(ticket.date);
    const safeType = escapeHtml(ticket.type || 'bug');
    const safeId = escapeHtml(ticket.id);
    const safeSubject = escapeHtml(ticket.subject || 'Support Inquiry');

    item.onclick = () => window.lookupSavedTicket(ticket.id);

    item.innerHTML = `
      <div class="saved-ticket-main">
        <div class="saved-ticket-top-row">
          <span class="ticket-type-tag type-${safeType}">${safeType.toUpperCase()}</span>
          <span class="saved-ticket-id">${safeId}</span>
          <span class="saved-ticket-time">• ${escapeHtml(timeAgo)}</span>
        </div>
        <div class="saved-ticket-subject">${safeSubject}</div>
      </div>
      <button type="button" class="saved-ticket-remove-btn" title="Remove from this browser" onclick="removeSingleSavedTicket('${safeId}', event)">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;
    listEl.appendChild(item);
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const diff = Date.now() - new Date(dateStr.includes('Z') ? dateStr : dateStr + 'Z').getTime();
    if (isNaN(diff)) return 'Recently';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}
