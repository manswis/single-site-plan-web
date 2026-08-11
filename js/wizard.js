/**
 * @file wizard.js
 * @description Apple-style 7-Step Guided Setup Wizard Controller for BBMP e-Plan Studio.
 * Manages step state, lazy validation, progress indicators, draft auto-persistence, and smart session restoration.
 * @author Senior Systems Architect
 */

/** Current active step index (1-based, 1 to 7) */
let currentStep = 1;
const TOTAL_STEPS = 7;
const DRAFT_STORAGE_KEY = 'bbmp_studio_draft';
const SESSION_FLAG_KEY = 'bbmp_session_active';

/**
 * Step titles and descriptions for header guidance.
 */
const STEP_METADATA = {
  1: { title: "Revenue Records & Identifiers", mobileTitle: "Revenue Records", icon: "🏛️", desc: "Enter official owner names, eKhata ID (ePID), PID, and DC Conversion details." },
  2: { title: "Property Location & Administration", mobileTitle: "Property Location", icon: "📍", desc: "Select your BBMP administrative zone, ward number, and site location address." },
  3: { title: "Plot Measurements & Dimensions", mobileTitle: "Plot Measurements", icon: "📐", desc: "Enter plot area, road width, facing direction, and N/S/E/W side measurements." },
  4: { title: "Structure & Building Setbacks", mobileTitle: "Building Setbacks", icon: "🧱", desc: "Specify floor counts, built-up area, and custom building setbacks." },
  5: { title: "Schedule of Property & Deed DNA", mobileTitle: "Property Boundaries", icon: "🗺️", desc: "Define abutting boundary categories for all cardinal sides." },
  6: { title: "Constraints & Submission Options", mobileTitle: "Submission Options", icon: "🚧", desc: "Configure Master Plan road widening, buffer zones, and Page 2 Legend Sheet." },
  7: { title: "Instant Review & PDF Package Download", mobileTitle: "Review & Export", icon: "📥", desc: "Review your generated layout plan and export official Sakala-compliant PDF." }
};

/**
 * List of all form element IDs to persist in draft state.
 */
const DRAFT_FIELD_IDS = [
  'ownerName', 'epId', 'pidNo', 'sasNo', 'adlrNo',
  'dcOrderNo', 'dcOrderDate', 'dcAuthority',
  'surveyNo', 'bbmpZone', 'wardNo', 'wardName', 'address',
  'plotArea', 'roadWidth', 'roadFacing', 'scale', 'floorsCount',
  'regNorthSouth', 'regEastWest',
  'sideNorth', 'sideSouth', 'sideEast', 'sideWest',
  'typeNorth', 'typeSouth', 'typeEast', 'typeWest',
  'nameRoadNorth', 'widthRoadNorth', 'descPlotNorth',
  'nameRoadSouth', 'widthRoadSouth', 'descPlotSouth',
  'nameRoadEast', 'widthRoadEast', 'descPlotEast',
  'nameRoadWest', 'widthRoadWest', 'descPlotWest',
  'bldgWidth', 'bldgLength', 'builtUpArea',
  'setbackFront', 'setbackRear', 'setbackLeft', 'setbackRight',
  'proposedRoadWidth', 'roadWideningStripWidth',
  'bufferType', 'bufferWidth',
  'challanNo', 'challanFee', 'challanDate'
];

const DRAFT_CHECKBOX_IDS = [
  'oddSiteCheck', 'roadWideningCheck', 'bufferCheck',
  'includeLegendPage', 'sampleWatermarkCheck', 'legalConsentCheck'
];

/**
 * Initializes wizard state on page load.
 * Checks for existing cached draft data:
 * - On Page Refresh (F5 / active session): Auto-restores directly to saved step with data filled.
 * - On Fresh Open (new tab / re-opened browser): Displays Apple Frosted Glass Restore Prompt Modal.
 * 
 * @function initWizard
 * @returns {void}
 */
function initWizard() {
  const hasDraft = checkAndRestoreDraft();
  if (!hasDraft) {
    showStep(1);
    updateProgressBar();
  }
}

/**
 * Checks for existing cached draft in localStorage.
 * 
 * @function checkAndRestoreDraft
 * @returns {boolean} True if draft was restored or modal prompt displayed.
 */
function checkAndRestoreDraft() {
  const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!draftRaw) return false;

  try {
    const draft = JSON.parse(draftRaw);
    if (!draft || !draft.formData) return false;

    // Detect if this is a Page Refresh (F5 / active session) vs Fresh Page Open
    const isSessionActive = sessionStorage.getItem(SESSION_FLAG_KEY) === 'true';
    const isNavReload = performance.navigation && performance.navigation.type === 1;

    if (isSessionActive || isNavReload) {
      // PAGE REFRESH: Restore silently and navigate directly to saved step!
      restoreDraft(false);
      return true;
    } else {
      // FRESH PAGE OPEN: Display Apple Frosted Glass Restore Prompt Modal!
      showDraftRestoreModal(draft);
      showStep(1); // Show Step 1 in background until user chooses action
      return true;
    }
  } catch (e) {
    console.error('Failed to parse saved draft:', e);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return false;
  }
}

/**
 * Displays the Apple Frosted Glass Restore Modal with draft summary metadata.
 * 
 * @function showDraftRestoreModal
 * @param {Object} draft - Draft object.
 * @returns {void}
 */
function showDraftRestoreModal(draft) {
  const modal = document.getElementById('draftRestoreModal');
  if (!modal) return;

  const ownerEl = document.getElementById('modalDraftOwner');
  const stepEl = document.getElementById('modalDraftStep');
  const timeEl = document.getElementById('modalDraftTime');

  const owner = (draft.formData && draft.formData['ownerName']) ? draft.formData['ownerName'] : 'Unnamed Property';
  const stepMeta = STEP_METADATA[draft.currentStep] || { title: 'Setup' };

  if (ownerEl) ownerEl.textContent = owner;
  if (stepEl) stepEl.textContent = `Step ${draft.currentStep} of 7 (${stepMeta.title})`;
  if (timeEl) timeEl.textContent = formatDraftTimestamp(draft.timestamp);

  modal.style.display = 'flex';
}

/**
 * Formats a Unix timestamp into a human-readable relative time string.
 * 
 * @function formatDraftTimestamp
 * @param {number} timestamp - Unix timestamp.
 * @returns {string}
 */
function formatDraftTimestamp(timestamp) {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

/**
 * Restores saved form data from localStorage and navigates to the saved step.
 * 
 * @function restoreDraft
 * @param {boolean} [hideModal=true] - Whether to close the modal prompt.
 * @returns {void}
 */
function restoreDraft(hideModal = true) {
  const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!draftRaw) return;

  try {
    const draft = JSON.parse(draftRaw);
    const data = draft.formData || {};

    // Restore text, number, select fields, and custom feet-inches controls
    DRAFT_FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id] !== undefined) {
        el.value = data[id];

        const ftEl = document.getElementById(id + '_ft');
        const inEl = document.getElementById(id + '_in');
        if (ftEl) {
          const val = data[id];
          if (val !== undefined && val !== null && val !== '') {
            const num = parseFloat(val);
            if (!isNaN(num) && num >= 0) {
              const ft = Math.floor(num);
              const inchesDecimal = (num - ft) * 12;
              const inches = Math.round(inchesDecimal);
              ftEl.value = ft;
              if (inEl) inEl.value = inches > 0 ? inches : '';
            }
          }
        }
      }
    });

    // Restore checkboxes
    DRAFT_CHECKBOX_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id] !== undefined) {
        el.checked = data[id];
      }
    });

    // Re-trigger dynamic UI toggles
    if (typeof toggleOddSite === 'function') toggleOddSite();
    if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
    if (typeof toggleBufferZone === 'function') toggleBufferZone();
    if (typeof toggleBoundaryType === 'function') {
      ['North', 'South', 'East', 'West'].forEach(dir => toggleBoundaryType(dir));
    }

    // Mark active session flag
    sessionStorage.setItem(SESSION_FLAG_KEY, 'true');

    if (hideModal) {
      const modal = document.getElementById('draftRestoreModal');
      if (modal) modal.style.display = 'none';
    }

    // Always start on Step 1 while keeping all cached data pre-filled
    showStep(1, false);

    if (typeof generatePlan === 'function') {
      generatePlan();
    }
  } catch (e) {
    console.error('Error restoring draft:', e);
  }
}

/**
 * Discards cached draft and starts a fresh new plan.
 * 
 * @function discardDraft
 * @returns {void}
 */
function discardDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
  sessionStorage.setItem(SESSION_FLAG_KEY, 'true');

  const modal = document.getElementById('draftRestoreModal');
  if (modal) modal.style.display = 'none';

  showStep(1);
}

/**
 * Saves current form state and active step to localStorage.
 * 
 * @function saveDraft
 * @returns {void}
 */
function saveDraft() {
  const formData = {};

  DRAFT_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) formData[id] = el.value;
  });

  DRAFT_CHECKBOX_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) formData[id] = el.checked;
  });

  const payload = {
    currentStep,
    timestamp: Date.now(),
    formData
  };

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
}

/**
 * Navigates to a specific step index with smart lazy validation and draft saving.
 * 
 * @function goToStep
 * @param {number} targetStep - Target step number (1 to 7).
 * @returns {boolean} True if step transition succeeded.
 */
function goToStep(targetStep) {
  if (targetStep < 1 || targetStep > TOTAL_STEPS) return false;

  // 1. Instant Backward Navigation (no validation errors)
  if (targetStep < currentStep) {
    saveDraft();
    showStep(targetStep);
    return true;
  }

  // 2. Forward Navigation: Validate all preceding steps
  for (let s = 1; s < targetStep; s++) {
    if (!validateStep(s, true)) {
      showStep(s);
      scrollFirstErrorIntoView(s);
      return false;
    }
  }

  saveDraft();
  showStep(targetStep);
  return true;
}

/**
 * Advances to the next step when clicking "Continue →".
 * 
 * @function nextStep
 * @returns {void}
 */
function nextStep() {
  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1);
  } else if (currentStep === TOTAL_STEPS) {
    if (typeof downloadPDFPackage === 'function') {
      downloadPDFPackage();
    }
  }
}

/**
 * Returns to the previous step.
 * 
 * @function prevStep
 * @returns {void}
 */
function prevStep() {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
}

/**
 * Displays the target step panel and updates progress UI.
 * 
 * @function showStep
 * @param {number} stepNum - Step number to activate.
 * @returns {void}
 */
function showStep(stepNum, shouldSave = true) {
  currentStep = stepNum;

  // Clear any residual error messages on the target step when landing
  clearStepErrors(stepNum);

  // Hide all step content panels
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const stepEl = document.getElementById(`wizardStep${i}`);
    const tabEl = document.getElementById(`stepTab${i}`);
    if (stepEl) {
      stepEl.style.display = (i === stepNum) ? 'block' : 'none';
    }
    if (tabEl) {
      if (i === stepNum) {
        tabEl.classList.add('active');
        tabEl.classList.remove('completed');
      } else if (i < stepNum) {
        tabEl.classList.add('completed');
        tabEl.classList.remove('active');
      } else {
        tabEl.classList.remove('active', 'completed');
      }
    }
  }

  // Update Header Banner Metadata & Mobile Step Indicator Card
  const meta = STEP_METADATA[stepNum];
  const stepBadge = document.getElementById('stepCounterBadge');
  const stepTitle = document.getElementById('stepTitleText');
  const stepDesc = document.getElementById('stepDescText');

  const mobileBadge = document.getElementById('mobileStepBadge');
  const mobileTitle = document.getElementById('mobileStepTitle');

  if (stepBadge) stepBadge.textContent = `Step ${stepNum} of ${TOTAL_STEPS}`;
  if (stepTitle && meta) stepTitle.textContent = `${meta.icon} ${meta.title}`;
  if (stepDesc && meta) stepDesc.textContent = meta.desc;

  if (mobileBadge) mobileBadge.textContent = `Step ${stepNum} of ${TOTAL_STEPS}`;
  if (mobileTitle && meta) mobileTitle.textContent = `${meta.icon} ${meta.mobileTitle || meta.title}`;

  // Toggle Full-Width Export Viewport Section (Visible ONLY on Step 7)
  const exportSection = document.getElementById('exportViewportSection');
  const nextBtn = document.getElementById('nextBtn');

  if (exportSection) {
    exportSection.style.display = (stepNum === 7) ? 'block' : 'none';
  }

  if (nextBtn) {
    if (stepNum === 6) {
      nextBtn.textContent = 'Review →';
      nextBtn.style.display = 'inline-flex';
    } else if (stepNum === 7) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.textContent = 'Continue →';
      nextBtn.style.display = 'inline-flex';
    }
  }

  updateProgressBar();

  // Save active step index and form state to localStorage
  if (shouldSave) {
    saveDraft();
  }

  // Populate formatted review summary grid & reset consent/plan state on Step 7
  if (stepNum === 7) {
    const consent = document.getElementById('legalConsentCheck');
    if (consent) consent.checked = false;

    if (typeof isPlanGenerated !== 'undefined') {
      isPlanGenerated = false;
    }

    const viewport = document.getElementById('exportViewportSection');
    if (viewport) viewport.style.display = 'none';

    if (typeof buildReviewSummary === 'function') {
      buildReviewSummary();
    }
    if (typeof toggleLegalConsent === 'function') {
      toggleLegalConsent();
    }
  }

  // Scroll step panel smoothly into view
  const wizardCard = document.getElementById('wizardCard');
  if (wizardCard) {
    wizardCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Updates top Apple-style pill progress bar width and counter.
 * 
 * @function updateProgressBar
 * @returns {void}
 */
function updateProgressBar() {
  const progressBar = document.getElementById('wizardProgressBar');
  const mobileProgress = document.getElementById('mobileStepProgressFill');
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100);

  if (progressBar) {
    progressBar.style.width = `${pct}%`;
  }
  if (mobileProgress) {
    mobileProgress.style.width = `${pct}%`;
  }
}

/**
 * Validates mandatory fields for a specific step.
 * 
 * @function validateStep
 * @param {number} stepNum - Step index to validate.
 * @param {boolean} [showErrors=true] - Whether to display red error messages.
 * @returns {boolean} True if step inputs are valid.
 */
function validateStep(stepNum, showErrors = true) {
  let isValid = true;

  switch (stepNum) {
    case 1:
      isValid = checkRequired('ownerName', 'err-ownerName', showErrors) && isValid;
      isValid = checkRequired('epId', 'err-epId', showErrors) && isValid;
      break;
    case 2:
      isValid = checkRequired('surveyNo', 'err-surveyNo', showErrors) && isValid;
      isValid = checkRequired('bbmpZone', 'err-bbmpZone', showErrors) && isValid;
      isValid = checkRequired('wardNo', 'err-wardNo', showErrors) && isValid;
      isValid = checkRequired('wardName', 'err-wardName', showErrors) && isValid;
      isValid = checkRequired('address', 'err-address', showErrors) && isValid;
      break;
    case 3:
      isValid = checkRequired('plotArea', 'err-plotArea', showErrors) && isValid;
      isValid = checkRequired('roadWidth', 'err-roadWidth', showErrors) && isValid;
      isValid = checkRequired('roadFacing', 'err-roadFacing', showErrors) && isValid;

      const isOddSite = document.getElementById('oddSiteCheck') && document.getElementById('oddSiteCheck').checked;
      if (isOddSite) {
        isValid = checkRequired('sideNorth', 'err-sideNorth', showErrors) && isValid;
        isValid = checkRequired('sideSouth', 'err-sideSouth', showErrors) && isValid;
        isValid = checkRequired('sideEast', 'err-sideEast', showErrors) && isValid;
        isValid = checkRequired('sideWest', 'err-sideWest', showErrors) && isValid;
      } else {
        isValid = checkRequired('regNorthSouth', 'err-regNorthSouth', showErrors) && isValid;
        isValid = checkRequired('regEastWest', 'err-regEastWest', showErrors) && isValid;
      }
      break;
    case 5:
      isValid = checkRequired('typeNorth', 'err-typeNorth', showErrors) && isValid;
      isValid = checkRequired('typeSouth', 'err-typeSouth', showErrors) && isValid;
      isValid = checkRequired('typeEast', 'err-typeEast', showErrors) && isValid;
      isValid = checkRequired('typeWest', 'err-typeWest', showErrors) && isValid;
      break;
    case 6:
      const rwCheck = document.getElementById('roadWideningCheck');
      if (rwCheck && rwCheck.checked) {
        isValid = checkRequired('proposedRoadWidth', 'err-proposedRoadWidth', showErrors) && isValid;
        isValid = checkRequired('roadWideningStripWidth', 'err-roadWideningStripWidth', showErrors) && isValid;
      }
      const bCheck = document.getElementById('bufferCheck');
      if (bCheck && bCheck.checked) {
        isValid = checkRequired('bufferType', 'err-bufferType', showErrors) && isValid;
        isValid = checkRequired('bufferWidth', 'err-bufferWidth', showErrors) && isValid;
      }
      break;
    case 7:
      const legalCheck = document.getElementById('legalConsentCheck');
      const errLegal = document.getElementById('err-legalConsent');
      if (legalCheck && !legalCheck.checked) {
        if (showErrors && errLegal) errLegal.style.display = 'block';
        isValid = false;
      } else {
        if (errLegal) errLegal.style.display = 'none';
      }
      break;
  }

  // Trigger live plan update on valid step edit
  if (isValid && typeof generatePlan === 'function') {
    generatePlan();
  }

  return isValid;
}

/**
 * Checks if an input field is populated.
 * 
 * @function checkRequired
 * @param {string} fieldId - ID of input element.
 * @param {string} errId - ID of error message element.
 * @param {boolean} [showErrors=true] - Whether to display red error UI.
 * @returns {boolean} True if field is non-empty.
 */
function checkRequired(fieldId, errId, showErrors = true) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);
  if (!field) return true;

  const val = field.value ? field.value.trim() : '';
  if (!val) {
    if (showErrors) {
      if (field.parentElement) field.parentElement.classList.add('error');
      if (err) err.style.display = 'block';
    }
    return false;
  } else {
    if (field.parentElement) field.parentElement.classList.remove('error');
    if (err) err.style.display = 'none';
    return true;
  }
}

/**
 * Clears error highlight for a single input field on user typing/selection and saves draft.
 * 
 * @function clearFieldError
 * @param {string} fieldId - Field element ID.
 * @param {string} errId - Error message element ID.
 * @returns {void}
 */
function clearFieldError(fieldId, errId) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);

  if (field && field.value.trim() !== '') {
    if (field.parentElement) field.parentElement.classList.remove('error');
    if (err) err.style.display = 'none';
  }

  saveDraft();

  if (typeof generatePlan === 'function') {
    generatePlan();
  }
}

/**
 * Clears error highlights for fields within a step.
 * 
 * @function clearStepErrors
 * @param {number} stepNum - Step number to clear.
 * @returns {void}
 */
function clearStepErrors(stepNum) {
  const stepPanel = document.getElementById(`wizardStep${stepNum}`);
  if (!stepPanel) return;

  const errorFields = stepPanel.querySelectorAll('.field.error');
  errorFields.forEach(f => f.classList.remove('error'));

  const errorMsgs = stepPanel.querySelectorAll('.error-msg');
  errorMsgs.forEach(m => m.style.display = 'none');
}

/**
 * Scrolls the first visible error message into view.
 * 
 * @function scrollFirstErrorIntoView
 * @param {number} stepNum - Step number to check.
 * @returns {void}
 */
function scrollFirstErrorIntoView(stepNum) {
  const stepPanel = document.getElementById(`wizardStep${stepNum}`);
  if (!stepPanel) return;

  const firstErr = stepPanel.querySelector('.error-msg[style*="display: block"]');
  if (firstErr) {
    firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Initialize wizard on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initWizard();
});
