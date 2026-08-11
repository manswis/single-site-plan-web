/**
 * @file wizard.js
 * @description Apple-style 7-Step Guided Setup Wizard Controller for BBMP e-Plan Studio.
 * Manages step state, step validation checks, progress pill indicators, and smooth step transitions.
 * @author Senior Systems Architect
 */

/** Current active step index (1-based, 1 to 7) */
let currentStep = 1;
const TOTAL_STEPS = 7;

/**
 * Step titles and descriptions for header guidance.
 */
const STEP_METADATA = {
  1: { title: "Revenue Records & Identifiers", icon: "🏛️", desc: "Enter official owner names, e-Khata EP ID, PID, and DC Conversion details." },
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
 * Navigates to a specific step index after validating current step input.
 * 
 * @function goToStep
 * @param {number} stepNum - Target step number (1 to 7).
 * @returns {boolean} True if step transition succeeded.
 */
function goToStep(stepNum) {
  if (stepNum < 1 || stepNum > TOTAL_STEPS) return false;

  // If advancing forward, validate current step fields first
  if (stepNum > currentStep) {
    if (!validateStep(currentStep)) {
      return false;
    }
  }

  showStep(stepNum);
  return true;
}

/**
 * Advances to the next step.
 * 
 * @function nextStep
 * @returns {void}
 */
function nextStep() {
  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1);
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
 * Displays the target step tab and updates UI state.
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

  updateProgressBar();

  // Scroll step panel into smooth view
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
 * Validates mandatory fields for a specific step before allowing forward progression.
 * 
 * @function validateStep
 * @param {number} stepNum - Step index to validate.
 * @returns {boolean} True if step inputs are valid.
 */
function validateStep(stepNum) {
  let isValid = true;
  clearStepErrors(stepNum);

  switch (stepNum) {
    case 1:
      isValid = checkRequired('ownerName', 'err-ownerName') && isValid;
      isValid = checkRequired('epId', 'err-epId') && isValid;
      isValid = checkRequired('pidNo', 'err-pidNo') && isValid;
      break;
    case 2:
      isValid = checkRequired('surveyNo', 'err-surveyNo') && isValid;
      isValid = checkRequired('bbmpZone', 'err-bbmpZone') && isValid;
      isValid = checkRequired('wardNo', 'err-wardNo') && isValid;
      isValid = checkRequired('wardName', 'err-wardName') && isValid;
      isValid = checkRequired('address', 'err-address') && isValid;
      break;
    case 3:
      isValid = checkRequired('plotArea', 'err-plotArea') && isValid;
      isValid = checkRequired('roadWidth', 'err-roadWidth') && isValid;
      isValid = checkRequired('roadFacing', 'err-roadFacing') && isValid;
      isValid = checkRequired('sideNorth', 'err-sideNorth') && isValid;
      isValid = checkRequired('sideSouth', 'err-sideSouth') && isValid;
      isValid = checkRequired('sideEast', 'err-sideEast') && isValid;
      isValid = checkRequired('sideWest', 'err-sideWest') && isValid;
      break;
    case 5:
      isValid = checkRequired('typeNorth', 'err-typeNorth') && isValid;
      isValid = checkRequired('typeSouth', 'err-typeSouth') && isValid;
      isValid = checkRequired('typeEast', 'err-typeEast') && isValid;
      isValid = checkRequired('typeWest', 'err-typeWest') && isValid;
      break;
    case 6:
      const rwCheck = document.getElementById('roadWideningCheck');
      if (rwCheck && rwCheck.checked) {
        isValid = checkRequired('proposedRoadWidth', 'err-proposedRoadWidth') && isValid;
        isValid = checkRequired('roadWideningStripWidth', 'err-roadWideningStripWidth') && isValid;
      }
      const bCheck = document.getElementById('bufferCheck');
      if (bCheck && bCheck.checked) {
        isValid = checkRequired('bufferType', 'err-bufferType') && isValid;
        isValid = checkRequired('bufferWidth', 'err-bufferWidth') && isValid;
      }
      break;
    case 7:
      const legalCheck = document.getElementById('legalConsentCheck');
      const errLegal = document.getElementById('err-legalConsent');
      if (legalCheck && !legalCheck.checked) {
        if (errLegal) errLegal.style.display = 'block';
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
 * @returns {boolean} True if field is non-empty.
 */
function checkRequired(fieldId, errId) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);
  if (!field) return true;

  const val = field.value ? field.value.trim() : '';
  if (!val) {
    if (field.parentElement) field.parentElement.classList.add('error');
    if (err) err.style.display = 'block';
    return false;
  } else {
    if (field.parentElement) field.parentElement.classList.remove('error');
    if (err) err.style.display = 'none';
    return true;
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

// Initialize wizard on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initWizard();
});
