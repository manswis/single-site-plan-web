/**
 * @file validator.js
 * @description Form validation module enforcing BBMP e-Khata data integrity and input sanitization.
 * @author Senior Systems Architect
 */

/**
 * Resets all inline error state indicators, field highlights, and the validation summary alert block.
 * 
 * @function clearErrors
 * @returns {void}
 */
function clearErrors() {
  const fields = [
    'ownerName', 'epId', 'pidNo', 'sasNo', 'adlrNo',
    'dcOrderNo', 'dcOrderDate', 'dcAuthority',
    'surveyNo', 'bbmpZone', 'wardNo', 'wardName', 'address',
    'plotArea', 'roadWidth', 'roadFacing', 'scale', 'floorsCount',
    'sideNorth', 'sideSouth', 'sideEast', 'sideWest',
    'typeNorth', 'typeSouth', 'typeEast', 'typeWest',
    'bldgWidth', 'bldgLength', 'builtUpArea',
    'setbackFront', 'setbackRear', 'setbackLeft', 'setbackRight',
    'proposedRoadWidth', 'roadWideningStripWidth',
    'bufferType', 'bufferWidth',
    'challanNo', 'challanFee', 'challanDate'
  ];

  fields.forEach(id => {
    const errEl = document.getElementById('err-' + id);
    if (errEl) {
      errEl.style.display = 'none';
    }
    const inp = document.getElementById(id);
    if (inp) {
      inp.classList.remove('error');
    }
  });

  const summary = document.getElementById('validationSummary');
  if (summary) {
    summary.style.display = 'none';
  }
}

/**
 * Displays an inline error message beneath a specific input field and adds error styling.
 * 
 * @function showError
 * @param {string} fieldId - ID of HTML input or select element.
 * @param {string} message - Human-readable error description.
 * @returns {void}
 */
function showError(fieldId, message) {
  const errEl = document.getElementById('err-' + fieldId);
  if (errEl) {
    errEl.textContent = '⚠ ' + message;
    errEl.style.display = 'block';
  }
  const inp = document.getElementById(fieldId);
  if (inp) {
    inp.classList.add('error');
  }
}

/**
 * Performs comprehensive form validation against mandatory BBMP property details.
 * Evaluates required fields, numerical thresholds, and conditional rules.
 * 
 * @function validate
 * @returns {boolean} True if all validation rules pass, false otherwise.
 */
function validate() {
  clearErrors();
  const errors = [];

  /**
   * Helper function to check presence and validity of input fields.
   * @param {string} id - Element ID.
   * @param {string} label - Human-readable field label.
   * @param {boolean} [mustBePositive=false] - Whether numerical value must be > 0.
   * @returns {boolean}
   */
  function checkRequired(id, label, mustBePositive = false) {
    const el = document.getElementById(id);
    if (!el) return true;

    const val = el.value.trim();
    if (!val) {
      const msg = `${label} is required`;
      errors.push(msg);
      showError(id, msg);
      return false;
    }

    if (mustBePositive || el.type === 'number') {
      const numVal = parseFloat(val);
      if (isNaN(numVal) || numVal <= 0) {
        const msg = `${label} must be greater than 0`;
        errors.push(msg);
        showError(id, msg);
        return false;
      }
    }

    return true;
  }

  // 1. Core Property Metadata (Mandatory BBMP Sakala e-Khata Requirements)
  checkRequired('ownerName', 'Owner Name');
  checkRequired('epId', 'eKhata ID (ePID)');

  // 2. Location & Administrative Details
  checkRequired('surveyNo', 'Survey Number');
  checkRequired('bbmpZone', 'BBMP Zone');
  checkRequired('wardNo', 'Ward Number');
  checkRequired('wardName', 'Ward Name');
  checkRequired('address', 'Site Address');

  // 3. Plot Measurements & Universal 4-Side Cardinal Dimensions
  checkRequired('plotArea', 'Plot Area', true);
  checkRequired('roadWidth', 'Abutting Road Width', true);
  checkRequired('roadFacing', 'Primary Road Facing Direction');

  checkRequired('sideNorth', 'North Side Measurement', true);
  checkRequired('sideSouth', 'South Side Measurement', true);
  checkRequired('sideEast', 'East Side Measurement', true);
  checkRequired('sideWest', 'West Side Measurement', true);

  // 4. Boundary Types for all 4 Cardinal Directions
  checkRequired('typeNorth', 'North Abutting Boundary Type');
  checkRequired('typeSouth', 'South Abutting Boundary Type');
  checkRequired('typeEast', 'East Abutting Boundary Type');
  checkRequired('typeWest', 'West Abutting Boundary Type');

  // 5. Conditional Check for Road Widening
  const isRoadWidening = document.getElementById('roadWideningCheck') && document.getElementById('roadWideningCheck').checked;
  if (isRoadWidening) {
    checkRequired('proposedRoadWidth', 'Proposed Road Width (RMP-2015)', true);
    checkRequired('roadWideningStripWidth', 'Road Widening Strip Width', true);
  }

  // 6. Conditional Check for Buffer Zone
  const isBuffer = document.getElementById('bufferCheck') && document.getElementById('bufferCheck').checked;
  if (isBuffer) {
    checkRequired('bufferType', 'Buffer Zone Type');
    checkRequired('bufferWidth', 'Buffer Width', true);
  }

  if (errors.length > 0) {
    const list = document.getElementById('validationList');
    if (list) {
      list.innerHTML = errors.map(e => '<li>' + e + '</li>').join('');
    }
    const summary = document.getElementById('validationSummary');
    if (summary) {
      summary.style.display = 'block';
      summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return false;
  }

  return true;
}

if (typeof window !== 'undefined') {
  window.clearErrors = clearErrors;
  window.showError = showError;
  window.validate = validate;
}
