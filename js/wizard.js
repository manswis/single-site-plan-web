/**
 * @file wizard.js
 * @description Apple-style 7-Step Guided Setup Wizard Controller for BBMP e-Plan Studio.
 * Manages step state, lazy on-action validation, progress pill indicators, and smooth step transitions.
 * @author Senior Systems Architect
 */

/** Current active step index (1-based, 1 to 7) */
let currentStep = 1;
const TOTAL_STEPS = 7;

/**
 * Step titles and descriptions for header guidance.
 */
const STEP_METADATA = {
  1: { title: "Revenue Records & Identifiers", icon: "🏛️", desc: "Enter official owner names, eKhata ID (ePID), PID, and DC Conversion details." },
  2: { title: "Property Location & Administration", icon: "📍", desc: "Select your BBMP administrative zone, ward number, and site location address." },
  3: { title: "Plot Measurements & Dimensions", icon: "📐", desc: "Enter plot area, road width, facing direction, and N/S/E/W side measurements." },
  4: { title: "Structure & Building Setbacks", icon: "🧱", desc: "Specify floor counts, built-up area, and custom building setbacks." },
  5: { title: "Schedule of Property & Deed DNA", icon: "🗺️", desc: "Define abutting boundary categories for all cardinal sides." },
  6: { title: "Constraints & Submission Options", icon: "🚧", desc: "Configure Master Plan road widening, buffer zones, and Page 2 Legend Sheet." },
  7: { title: "Instant Review & PDF Package Download", icon: "📥", desc: "Review your generated layout plan and export official Sakala-compliant PDF." }
};

/**
 * Initializes wizard state on page load.
 * 
 * @function initWizard
 * @returns {void}
 */
function initWizard() {
  showStep(1);
  updateProgressBar();
}

/**
 * Navigates to a specific step index with smart lazy validation.
 * - Going Backward (targetStep < currentStep): Instant jump without showing errors.
 * - Going Forward (targetStep > currentStep): Validates all preceding steps. Shows errors on first incomplete step.
 * 
 * @function goToStep
 * @param {number} targetStep - Target step number (1 to 7).
 * @returns {boolean} True if step transition succeeded.
 */
function goToStep(targetStep) {
  if (targetStep < 1 || targetStep > TOTAL_STEPS) return false;

  // 1. Instant Backward Navigation (no validation errors)
  if (targetStep < currentStep) {
    showStep(targetStep);
    return true;
  }

  // 2. Forward Navigation: Validate all preceding steps
  for (let s = 1; s < targetStep; s++) {
    if (!validateStep(s, true)) {
      // Jump to the first incomplete step and display its errors
      showStep(s);
      scrollFirstErrorIntoView(s);
      return false;
    }
  }

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
function showStep(stepNum) {
  currentStep = stepNum;

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

  // Update Header Banner Metadata
  const meta = STEP_METADATA[stepNum];
  const stepBadge = document.getElementById('stepCounterBadge');
  const stepTitle = document.getElementById('stepTitleText');
  const stepDesc = document.getElementById('stepDescText');

  if (stepBadge) stepBadge.textContent = `Step ${stepNum} of ${TOTAL_STEPS}`;
  if (stepTitle && meta) stepTitle.textContent = `${meta.icon} ${meta.title}`;
  if (stepDesc && meta) stepDesc.textContent = meta.desc;

  // Toggle Full-Width Export Viewport Section (Visible ONLY on Step 7)
  const exportSection = document.getElementById('exportViewportSection');
  const nextBtn = document.getElementById('nextBtn');

  if (exportSection) {
    exportSection.style.display = (stepNum === 7) ? 'block' : 'none';
  }

  if (nextBtn) {
    if (stepNum === 6) {
      nextBtn.textContent = 'Preview & Export →';
    } else if (stepNum === 7) {
      nextBtn.textContent = '📥 Download PDF Package';
    } else {
      nextBtn.textContent = 'Continue →';
    }
  }

  updateProgressBar();

  // Scroll step panel smoothly into view
  const wizardCard = document.getElementById('wizardCard');
  if (wizardCard) {
    wizardCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Auto-render live preview on Step 7
  if (stepNum === 7 && typeof generatePlan === 'function') {
    generatePlan();
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
  if (progressBar) {
    const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
    progressBar.style.width = `${pct}%`;
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
      isValid = checkRequired('pidNo', 'err-pidNo', showErrors) && isValid;
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
      isValid = checkRequired('sideNorth', 'err-sideNorth', showErrors) && isValid;
      isValid = checkRequired('sideSouth', 'err-sideSouth', showErrors) && isValid;
      isValid = checkRequired('sideEast', 'err-sideEast', showErrors) && isValid;
      isValid = checkRequired('sideWest', 'err-sideWest', showErrors) && isValid;
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
 * Clears error highlight for a single input field on user typing/selection.
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
