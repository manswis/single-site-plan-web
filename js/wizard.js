/**
 * @file wizard.js
 * @description Apple-style 7-Step Guided Setup Wizard Controller for e-Plan Studio.
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
  'ownerName', 'epId', 'pidNo', 'adlrNo',
  'dcOrderNo', 'dcOrderDate', 'dcAuthority',
  'surveyNo', 'plotNo', 'bbmpZone', 'wardNo', 'wardName', 'address', 'gpsCoords', 'gpsZoom',
  'plotArea', 'roadWidth', 'roadFacing', 'scale',
  'bldgType', 'noOfFloors', 'bldgOrientation',
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
  'challanNo', 'challanFee', 'challanDate',
  'architectName', 'architectRegNo', 'ownerSigData', 'archSigData'
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
  const urlParams = new URLSearchParams(window.location.search);
  const actionParam = urlParams.get('action');

  if (actionParam === 'fresh') {
    discardDraft();
    return true;
  }

  if (actionParam === 'restore') {
    restoreDraft(true);
    return true;
  }

  const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!draftRaw) return false;

  try {
    const draft = JSON.parse(draftRaw);
    if (!draft || !draft.formData) return false;

    // Verify draft has actual non-empty values
    const hasUserData = Object.values(draft.formData).some(val => val !== '' && val !== false && val !== null && val !== undefined);
    if (!hasUserData) return false;

    // Hide wizard card until user taps "Start Fresh" or "Restore Session"
    const wizardCard = document.getElementById('wizardCard');
    if (wizardCard) wizardCard.style.display = 'none';

    // Display Alert Modal Dialog
    showDraftRestoreModal(draft);
    return true;
  } catch (e) {
    console.error('Failed to parse saved draft:', e);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return false;
  }
}

/**
 * Displays the Apple Alert Modal with draft summary metadata.
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

  modal.classList.add('active');
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

    // Re-trigger dynamic UI toggles and calculations
    if (typeof toggleOddSite === 'function') toggleOddSite();
    if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
    if (typeof toggleBufferZone === 'function') toggleBufferZone();
    if (typeof toggleBoundaryType === 'function') {
      ['North', 'South', 'East', 'West'].forEach(dir => toggleBoundaryType(dir));
    }
    if (typeof calculateBuiltUpArea === 'function') calculateBuiltUpArea();
    if (typeof autoCalculateSetbacks === 'function') autoCalculateSetbacks(false);
    if (typeof validateBuildingSetbackFeasibility === 'function') validateBuildingSetbackFeasibility();
    if (typeof syncGpsZoomControls === 'function') syncGpsZoomControls();
    if (typeof syncSignaturePreviews === 'function') syncSignaturePreviews();

    // Mark active session flag
    sessionStorage.setItem(SESSION_FLAG_KEY, 'true');

    if (hideModal) {
      const modal = document.getElementById('draftRestoreModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    }

    // Reveal wizard card and land on Step 1
    const wizardCard = document.getElementById('wizardCard');
    if (wizardCard) wizardCard.style.display = 'block';

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
  sessionStorage.removeItem(SESSION_FLAG_KEY);

  // Reset text, number, select fields & feet-inches controls
  DRAFT_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    const ftEl = document.getElementById(id + '_ft');
    const inEl = document.getElementById(id + '_in');
    if (ftEl) ftEl.value = '';
    if (inEl) inEl.value = '';
  });

  if (typeof syncSignaturePreviews === 'function') syncSignaturePreviews();

  // Reset checkboxes
  DRAFT_CHECKBOX_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = (id === 'includeLegendPage');
  });

  const modal = document.getElementById('draftRestoreModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }

  // Reveal wizard card and start fresh on Step 1
  const wizardCard = document.getElementById('wizardCard');
  if (wizardCard) wizardCard.style.display = 'block';

  showStep(1, false);
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

  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('LocalStorage save failed, attempting fallback without signature data:', err);
    try {
      // Fallback: save all critical property text & measurements excluding large data URLs
      const safeFormData = { ...formData };
      delete safeFormData.ownerSigData;
      delete safeFormData.archSigData;
      payload.formData = safeFormData;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (innerErr) {
      console.warn('LocalStorage completely full:', innerErr);
    }
  }
  sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
}

/* ==========================================================================
   PORTABLE PROJECT FILE (.eplan / .json) EXPORT & IMPORT ENGINE
   ========================================================================== */

/**
 * Exports all current wizard fields, checkboxes, measurements, and signatures
 * into a downloadable .eplan project file for cross-device portability.
 * 
 * @function exportProjectFile
 * @returns {void}
 */
function exportProjectFile() {
  const legalCheck = document.getElementById('legalConsentCheck');
  if (legalCheck && !legalCheck.checked) {
    if (typeof goToStep === 'function') goToStep(7);
    const errLegal = document.getElementById('err-legalConsent');
    if (errLegal) errLegal.style.display = 'block';
    alert('⚖️ Legal Consent Required:\n\nPlease check the "I Agree to Terms of Service, Privacy Policy & Zero Liability Disclaimer" checkbox in Step 7 before saving your project file.');
    return;
  }

  const formData = {};

  DRAFT_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) formData[id] = el.value;
  });

  DRAFT_CHECKBOX_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) formData[id] = el.checked;
  });

  const pid = (document.getElementById('pidNo')?.value || '').trim();
  const epId = (document.getElementById('epId')?.value || '').trim();
  const survey = (document.getElementById('surveyNo')?.value || '').trim().replace(/[/\\?%*:|"<>]/g, '-');
  const fileIdentifier = pid || epId || survey || 'Project';

  const exportPayload = {
    app: 'e-Plan Studio BBMP',
    format: 'eplan',
    schemaVersion: '1.2.0',
    exportedAt: new Date().toISOString(),
    currentStep,
    formData
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `BBMP_Plan_${fileIdentifier}.eplan`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Triggers the hidden file picker input for importing an existing .eplan / .json file.
 * 
 * @function triggerProjectImport
 * @returns {void}
 */
function triggerProjectImport() {
  const fileInput = document.getElementById('projectFileInput');
  if (fileInput) {
    fileInput.value = ''; // Reset so the same file can be picked again
    fileInput.click();
  }
}

/**
 * Handles project file selection, reads JSON content, validates parameters, and hydrates the application state.
 * 
 * @function handleProjectFileImport
 * @param {Event} event - File input change event.
 * @returns {void}
 */
function handleProjectFileImport(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (jsonErr) {
        showProjectImportErrorModal([
          "Syntax Error: The selected file is not a valid JSON or .eplan file format."
        ]);
        return;
      }

      // Validate schema and parameters thoroughly
      const validationResult = validateProjectFilePayload(parsedData);
      if (!validationResult.isValid) {
        showProjectImportErrorModal(validationResult.errors);
        return;
      }

      // Safe hydration of form data
      const formData = parsedData.formData || parsedData;
      hydrateProjectFormData(formData, parsedData.currentStep);
    } catch (err) {
      console.error('Project import error:', err);
      showProjectImportErrorModal([
        `Unexpected import error: ${err.message || 'Corrupted file contents.'}`
      ]);
    }
  };

  reader.readAsText(file);
}

/**
 * Rigorously validates the imported project file payload against schema, data types, and logical constraints.
 * 
 * @function validateProjectFilePayload
 * @param {Object} data - Parsed JSON object.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateProjectFilePayload(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['File does not contain a valid JSON object.'] };
  }

  const formData = data.formData || data;
  if (!formData || typeof formData !== 'object') {
    return { isValid: false, errors: ['Missing formData configuration in project file.'] };
  }

  // 1. Mandatory Core Identity & Revenue Fields
  if (!formData.ownerName || String(formData.ownerName).trim() === '') {
    errors.push("Missing mandatory field 'ownerName': Owner Name is required.");
  }
  if (!formData.epId || String(formData.epId).trim() === '') {
    errors.push("Missing mandatory field 'epId': eKhata ID (ePID) is required.");
  }

  // 2. Mandatory Location & Property Administration Fields
  if (!formData.surveyNo || String(formData.surveyNo).trim() === '') {
    errors.push("Missing mandatory field 'surveyNo': Survey / Sy No is required.");
  }
  if (!formData.bbmpZone || String(formData.bbmpZone).trim() === '') {
    errors.push("Missing mandatory field 'bbmpZone': BBMP Administrative Zone is required.");
  }
  if (!formData.wardNo || String(formData.wardNo).trim() === '') {
    errors.push("Missing mandatory field 'wardNo': Ward Number is required.");
  }
  if (!formData.wardName || String(formData.wardName).trim() === '') {
    errors.push("Missing mandatory field 'wardName': Ward / Area Name is required.");
  }
  if (!formData.address || String(formData.address).trim() === '') {
    errors.push("Missing mandatory field 'address': Property Site Address is required.");
  }

  // 3. Mandatory Plot Measurements & Geometry
  if (formData.plotArea === undefined || formData.plotArea === '' || String(formData.plotArea).trim() === '') {
    errors.push("Missing mandatory field 'plotArea': Total Plot Area is required.");
  } else {
    const area = parseFloat(formData.plotArea);
    if (isNaN(area) || area <= 0) {
      errors.push("Invalid parameter 'plotArea': Total Plot Area must be a positive number (> 0 sq.ft).");
    } else if (area > 500000) {
      errors.push("Invalid parameter 'plotArea': Total Plot Area exceeds single-plot threshold (500,000 sq.ft).");
    }
  }

  if (formData.roadWidth === undefined || formData.roadWidth === '' || String(formData.roadWidth).trim() === '') {
    errors.push("Missing mandatory field 'roadWidth': Road Width is required.");
  } else {
    const rw = parseFloat(formData.roadWidth);
    if (isNaN(rw) || rw <= 0) {
      errors.push("Invalid parameter 'roadWidth': Road Width must be a positive number (> 0 ft).");
    }
  }

  if (!formData.roadFacing || String(formData.roadFacing).trim() === '') {
    errors.push("Missing mandatory field 'roadFacing': Road Facing Direction is required.");
  } else {
    const validFacings = ['North', 'South', 'East', 'West', 'NORTH', 'SOUTH', 'EAST', 'WEST'];
    if (!validFacings.includes(formData.roadFacing)) {
      errors.push(`Invalid parameter 'roadFacing': received '${formData.roadFacing}', expected one of [North, South, East, West].`);
    }
  }

  // 4. Mandatory Plot Dimensions (Regular vs Odd site)
  const isOdd = !!formData.oddSiteCheck;
  if (isOdd) {
    ['sideNorth', 'sideSouth', 'sideEast', 'sideWest'].forEach(side => {
      if (formData[side] === undefined || formData[side] === '' || String(formData[side]).trim() === '') {
        errors.push(`Missing mandatory parameter '${side}': 4-side irregular plot dimension is required.`);
      } else {
        const val = parseFloat(formData[side]);
        if (isNaN(val) || val <= 0) {
          errors.push(`Invalid parameter '${side}': Dimension measurement must be greater than 0 ft.`);
        }
      }
    });
  } else {
    ['regNorthSouth', 'regEastWest'].forEach(dim => {
      if (formData[dim] === undefined || formData[dim] === '' || String(formData[dim]).trim() === '') {
        errors.push(`Missing mandatory parameter '${dim}': Plot length/width measurement is required for regular plots.`);
      } else {
        const val = parseFloat(formData[dim]);
        if (isNaN(val) || val <= 0) {
          errors.push(`Invalid parameter '${dim}': Plot length/width measurement must be greater than 0 ft.`);
        }
      }
    });
  }

  // 5. Mandatory Boundary Types
  ['typeNorth', 'typeSouth', 'typeEast', 'typeWest'].forEach(dir => {
    if (!formData[dir] || String(formData[dir]).trim() === '') {
      errors.push(`Missing mandatory boundary '${dir}': Abutting boundary type is required.`);
    }
  });

  // 6. Conditional Road Widening & Buffer Zone
  if (formData.roadWideningCheck) {
    if (!formData.proposedRoadWidth || parseFloat(formData.proposedRoadWidth) <= 0) {
      errors.push("Missing or invalid parameter 'proposedRoadWidth': Proposed Road Width must be > 0 ft when Road Widening is enabled.");
    }
    if (formData.roadWideningStripWidth === undefined || parseFloat(formData.roadWideningStripWidth) < 0) {
      errors.push("Missing or invalid parameter 'roadWideningStripWidth': Widening Strip Width is required and cannot be negative.");
    }
  }

  if (formData.bufferCheck) {
    if (!formData.bufferType || String(formData.bufferType).trim() === '') {
      errors.push("Missing mandatory field 'bufferType': Buffer Type is required when Buffer Zone is enabled.");
    }
    if (!formData.bufferWidth || parseFloat(formData.bufferWidth) <= 0) {
      errors.push("Missing or invalid parameter 'bufferWidth': Buffer Width must be > 0 ft when Buffer Zone is enabled.");
    }
  }

  // 7. Building Setbacks (Optional custom override values must be non-negative)
  ['setbackFront', 'setbackRear', 'setbackLeft', 'setbackRight'].forEach(sb => {
    if (formData[sb] !== undefined && formData[sb] !== '') {
      const val = parseFloat(formData[sb]);
      if (isNaN(val) || val < 0) {
        errors.push(`Invalid parameter '${sb}': Setback distance cannot be negative.`);
      }
    }
  });

  // 8. Number of Floors
  if (formData.noOfFloors !== undefined && formData.noOfFloors !== '') {
    const floors = parseInt(formData.noOfFloors, 10);
    if (isNaN(floors) || floors < 1 || floors > 25) {
      errors.push("Invalid parameter 'noOfFloors': Number of floors must be an integer between 1 and 25.");
    }
  }

  // 9. GPS Coordinates Validation (if supplied)
  if (formData.gpsCoords && typeof parseCoordinates === 'function') {
    const coords = parseCoordinates(String(formData.gpsCoords).trim());
    if (!coords) {
      errors.push(`Invalid parameter 'gpsCoords': '${formData.gpsCoords}' is not a recognized GPS coordinate or Google Maps link.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hydrates DOM inputs and updates CAD renderer after successful project file validation.
 * 
 * @function hydrateProjectFormData
 * @param {Object} formData - Validated form field key-value pairs.
 * @param {number} [targetStep] - Optional step index to navigate to.
 * @returns {void}
 */
function hydrateProjectFormData(formData, targetStep = 7) {
  // 1. Hydrate text, number, and select fields
  DRAFT_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && formData[id] !== undefined) {
      el.value = formData[id];
    }
  });

  // 2. Hydrate checkboxes and trigger change events for UI toggles
  DRAFT_CHECKBOX_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && formData[id] !== undefined) {
      el.checked = !!formData[id];
    }
  });

  // 3. Trigger structural conditional toggles
  if (typeof toggleOddSite === 'function') toggleOddSite();
  if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
  if (typeof toggleBufferZone === 'function') toggleBufferZone();
  if (typeof toggleLegendSheetPage === 'function') toggleLegendSheetPage();

  // 4. Trigger boundary field visibilities
  ['North', 'South', 'East', 'West'].forEach(dir => {
    if (typeof toggleBoundaryType === 'function') toggleBoundaryType(dir);
  });

  // 5. Sync digital signatures and previews
  if (typeof syncSignaturePreviews === 'function') syncSignaturePreviews();
  if (typeof updateKeyPlan === 'function') updateKeyPlan();

  // 6. Recalculate setbacks & geometry
  if (typeof recalculateSetbacks === 'function') recalculateSetbacks();
  if (typeof recalculateGeometry === 'function') recalculateGeometry();
  if (typeof generatePlan === 'function') generatePlan();

  // 7. Save to local storage as active draft
  saveDraft();

  // 8. Navigate to target step (Step 7 for immediate review, or Step 1)
  const navStep = (targetStep >= 1 && targetStep <= TOTAL_STEPS) ? targetStep : 7;
  goToStep(navStep);

  // 9. Show brief success confirmation toast
  showImportSuccessToast();
}

/**
 * Displays error modal with specific list of failed parameters.
 * 
 * @function showProjectImportErrorModal
 * @param {string[]} errorList - Array of validation error descriptions.
 * @returns {void}
 */
function showProjectImportErrorModal(errorList) {
  const modal = document.getElementById('projectImportErrorModal');
  const listEl = document.getElementById('projectImportErrorList');
  if (listEl) {
    listEl.innerHTML = `<ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">` +
      errorList.map(err => `<li><strong>${escapeWizardHtml(err)}</strong></li>`).join('') +
      `</ul>`;
  }
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Closes the project import error modal.
 * 
 * @function closeProjectImportErrorModal
 * @returns {void}
 */
function closeProjectImportErrorModal() {
  const modal = document.getElementById('projectImportErrorModal');
  if (modal) modal.style.display = 'none';
}

/**
 * HTML escaper helper for modal rendering.
 */
function escapeWizardHtml(str) {
  return str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
}

/**
 * Displays a brief floating toast notification upon successful project import.
 * 
 * @function showImportSuccessToast
 * @returns {void}
 */
function showImportSuccessToast() {
  const existingToast = document.getElementById('projectImportToast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'projectImportToast';
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#0f172a';
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '980px';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '10000';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  toast.style.border = '1px solid rgba(255,255,255,0.15)';
  toast.innerHTML = `<span style="color: #4ade80;">✓</span><span>Project Loaded Successfully</span>`;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
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
      showStep(s, true, false);
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
 * @param {boolean} [shouldSave=true] - Whether to auto-save draft.
 * @param {boolean} [clearErrors=true] - Whether to clear step errors. Set to false when validation fails.
 * @returns {void}
 */
function showStep(stepNum, shouldSave = true, clearErrors = true) {
  currentStep = stepNum;

  // Clear residual error messages ONLY on voluntary step navigation (not on validation failure)
  if (clearErrors) {
    clearStepErrors(stepNum);
  }

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

      const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
      if (rawGps && typeof parseCoordinates === 'function' && !parseCoordinates(rawGps)) {
        const errEl = document.getElementById('err-gpsCoords');
        if (errEl && showErrors) errEl.style.display = 'block';
        const inp = document.getElementById('gpsCoords');
        if (inp && showErrors) inp.classList.add('error');
        isValid = false;
      }
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
    case 4:
      if (typeof validateBuildingSetbackFeasibility === 'function') {
        isValid = validateBuildingSetbackFeasibility() && isValid;
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
  const container = field.closest('.field') || field.parentElement;

  if (!val) {
    if (showErrors) {
      if (container) container.classList.add('error');
      if (err) err.style.display = 'block';
    }
    return false;
  } else {
    if (container) container.classList.remove('error');
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
    const container = field.closest('.field') || field.parentElement;
    if (container) container.classList.remove('error');
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

  const errorContainer = stepPanel.querySelector('.field.error') || stepPanel.querySelector('.error-msg[style*="display: block"]');
  if (errorContainer) {
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = errorContainer.querySelector('input:not([type="hidden"]), select, textarea');
    if (input && typeof input.focus === 'function') {
      setTimeout(() => {
        try { input.focus(); } catch (e) { }
      }, 150);
    }
  }
}

// Initialize wizard on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initWizard();
});
