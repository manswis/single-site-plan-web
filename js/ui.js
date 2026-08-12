/**
 * @file ui.js
 * @description Dynamic UI interaction logic, real-time live preview event wiring,
 * mobile segmented tab switching, Sakala FAQ accordion toggling, and PDF export engines.
 * @author Senior Systems Architect
 */

/**
 * Toggles visibility between regular rectangular plot mode (2-field N/S & E/W inputs)
 * and odd/irregular quadrilateral plot mode (independent 4-side inputs).
 * 
 * @function toggleOddSite
 * @returns {void}
 */
function toggleOddSite() {
  const isOdd = document.getElementById('oddSiteCheck') && document.getElementById('oddSiteCheck').checked;
  const regControls = document.getElementById('regularSiteControls');
  const irregControls = document.getElementById('irregularSiteControls');
  const hintEl = document.getElementById('oddSiteHint');

  const regNS = document.getElementById('regNorthSouth');
  const regEW = document.getElementById('regEastWest');
  const nEl = document.getElementById('sideNorth');
  const sEl = document.getElementById('sideSouth');
  const eEl = document.getElementById('sideEast');
  const wEl = document.getElementById('sideWest');

  if (isOdd) {
    // Irregular Mode: Show 4 independent fields
    if (regControls) regControls.style.display = 'none';
    if (irregControls) irregControls.style.display = 'grid';
    if (hintEl) hintEl.textContent = '🔷 Irregular Site Mode: Enter exact independent measurements for all 4 sides.';

    if (nEl && !nEl.value && regNS) nEl.value = regNS.value;
    if (sEl && !sEl.value && regNS) sEl.value = regNS.value;
    if (eEl && !eEl.value && regEW) eEl.value = regEW.value;
    if (wEl && !wEl.value && regEW) wEl.value = regEW.value;
  } else {
    // Regular Mode: Show 2 clean fields (North/South & East/West)
    if (regControls) regControls.style.display = 'grid';
    if (irregControls) irregControls.style.display = 'none';
    if (hintEl) hintEl.textContent = 'Rectangular Mode (Default): Enter North/South width and East/West length.';

    if (regNS && nEl) regNS.value = nEl.value || (sEl ? sEl.value : '');
    if (regEW && eEl) regEW.value = eEl.value || (wEl ? wEl.value : '');

    onRegularDimensionInput();
  }

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Handles input change on 2-column regular dimension fields.
 * Syncs underlying sideNorth, sideSouth, sideEast, sideWest values and auto-calculates plot area.
 * 
 * @function onRegularDimensionInput
 * @returns {void}
 */
function onRegularDimensionInput() {
  const regNS = document.getElementById('regNorthSouth');
  const regEW = document.getElementById('regEastWest');

  const nsVal = regNS ? regNS.value.trim() : '';
  const ewVal = regEW ? regEW.value.trim() : '';

  const nEl = document.getElementById('sideNorth');
  const sEl = document.getElementById('sideSouth');
  const eEl = document.getElementById('sideEast');
  const wEl = document.getElementById('sideWest');

  if (nEl) nEl.value = nsVal;
  if (sEl) sEl.value = nsVal;
  if (eEl) eEl.value = ewVal;
  if (wEl) wEl.value = ewVal;

  // Auto-calculate plot area if non-empty and user hasn't explicitly overridden it
  const areaInput = document.getElementById('plotArea');
  if (areaInput && (!areaInput.dataset.userEdited || areaInput.value === '')) {
    const nsNum = parseFloat(nsVal);
    const ewNum = parseFloat(ewVal);
    if (!isNaN(nsNum) && !isNaN(ewNum) && nsNum > 0 && ewNum > 0) {
      areaInput.value = Math.round(nsNum * ewNum);
      if (typeof clearFieldError === 'function') clearFieldError('plotArea', 'err-plotArea');
    }
  }

  if (typeof clearFieldError === 'function') {
    clearFieldError('regNorthSouth', 'err-regNorthSouth');
    clearFieldError('regEastWest', 'err-regEastWest');
  }

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Automatically calculates and populates plot area in sq.ft based on N/S/E/W side measurements.
 * 
 * @function calculatePlotAreaFromSides
 * @returns {void}
 */
function calculatePlotAreaFromSides() {
  const n = parseFloat(document.getElementById('sideNorth').value) || 0;
  const s = parseFloat(document.getElementById('sideSouth').value) || 0;
  const e = parseFloat(document.getElementById('sideEast').value) || 0;
  const w = parseFloat(document.getElementById('sideWest').value) || 0;

  if (n > 0 && s > 0 && e > 0 && w > 0) {
    const avgW = (n + s) / 2;
    const avgL = (e + w) / 2;
    const area = Math.round(avgW * avgL);
    const plotAreaInp = document.getElementById('plotArea');
    if (plotAreaInp && (!plotAreaInp.value || plotAreaInp.dataset.userEdited !== 'true')) {
      plotAreaInp.value = area;
    }
  }
}
/**
 * Handles live input changes inside custom Feet & Inches input controls (.ft-in-wrapper).
 * Calculates decimal feet ($ft + in/12$) and updates underlying hidden input value.
 * 
 * @function onFtInInput
 * @param {string} fieldId - Target base field ID (e.g. 'roadWidth', 'regNorthSouth').
 * @returns {void}
 */
function onFtInInput(fieldId) {
  const ftEl = document.getElementById(fieldId + '_ft');
  const inEl = document.getElementById(fieldId + '_in');
  const hiddenEl = document.getElementById(fieldId);

  if (!ftEl || !hiddenEl) return;

  const ftRaw = ftEl.value.trim();
  const inRaw = inEl ? inEl.value.trim() : '';

  if (ftRaw === '' && inRaw === '') {
    hiddenEl.value = '';
  } else {
    const ftVal = parseFloat(ftRaw) || 0;
    const inVal = parseFloat(inRaw) || 0;
    const decimalVal = ftVal + (inVal / 12);
    hiddenEl.value = Math.round(decimalVal * 10000) / 10000;
  }

  // Trigger auto-sync callbacks for regular, irregular side measurements, building dimensions & setbacks
  if (fieldId === 'regNorthSouth' || fieldId === 'regEastWest') {
    onRegularDimensionInput();
  } else if (fieldId.startsWith('side')) {
    calculatePlotAreaFromSides();
  } else if (fieldId === 'bldgWidth' || fieldId === 'bldgLength') {
    calculateBuiltUpArea();
    autoCalculateSetbacks(true);
    validateBuildingSetbackFeasibility();
  } else if (fieldId.startsWith('setback')) {
    if (hiddenEl) hiddenEl.dataset.manualEdit = 'true';
    validateBuildingSetbackFeasibility();
  }

  if (typeof clearFieldError === 'function') {
    clearFieldError(fieldId, 'err-' + fieldId);
  }

  if (typeof saveDraft === 'function') saveDraft();
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Auto-calculates Total Built-up Area (sq.ft) from Building Width, Length, and Floors multiplier.
 * Allows user to manually edit or override at any time.
 * 
 * @function calculateBuiltUpArea
 * @returns {void}
 */
function calculateBuiltUpArea() {
  const widthVal = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  const lengthVal = parseFloat(document.getElementById('bldgLength')?.value) || 0;
  const floorsSelect = document.getElementById('noOfFloors')?.value || '';

  if (widthVal <= 0 || lengthVal <= 0) return;

  const footprint = widthVal * lengthVal;

  let multiplier = 1;
  if (floorsSelect === 'Vacant Plot') multiplier = 0;
  else if (floorsSelect === 'Stilt + Ground') multiplier = 1.5;
  else if (floorsSelect === 'G+1') multiplier = 2;
  else if (floorsSelect === 'G+2') multiplier = 3;
  else if (floorsSelect === 'G+3') multiplier = 4;
  else if (floorsSelect === 'G+4') multiplier = 5;

  const totalSqFt = Math.round(footprint * multiplier);
  const builtEl = document.getElementById('builtUpArea');
  if (builtEl && totalSqFt >= 0) {
    builtEl.value = totalSqFt;
  }
}

/**
 * Auto-calculates Front, Rear, Left, and Right setbacks dynamically based on Step 3 Plot Spans
 * and Step 4 Building Footprint (Width & Length).
 * Automatically selects the optimal building orientation to prevent dimension mismatches.
 * Preserves explicit manual overrides on individual setback fields.
 * 
 * @function autoCalculateSetbacks
 * @param {boolean} [force=false] - Whether to force recalculation of auto fields.
 * @returns {void}
 */
function autoCalculateSetbacks(force = false) {
  const widthVal = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  const lengthVal = parseFloat(document.getElementById('bldgLength')?.value) || 0;

  if (widthVal <= 0 && lengthVal <= 0) return;

  // Retrieve Step 3 Site Spans
  const isOdd = document.getElementById('oddSiteCheck')?.checked;
  let north = 0, south = 0, east = 0, west = 0;

  if (isOdd) {
    north = parseFloat(document.getElementById('sideNorth')?.value) || 0;
    south = parseFloat(document.getElementById('sideSouth')?.value) || 0;
    east = parseFloat(document.getElementById('sideEast')?.value) || 0;
    west = parseFloat(document.getElementById('sideWest')?.value) || 0;
  } else {
    north = south = parseFloat(document.getElementById('regNorthSouth')?.value) || 0;
    east = west = parseFloat(document.getElementById('regEastWest')?.value) || 0;
  }

  // For irregular plots, use the shorter side measurement to bound setback clearance
  const spanNS = isOdd ? Math.min(north, south) : Math.max(north, south);
  const spanEW = isOdd ? Math.min(east, west) : Math.max(east, west);

  if (spanNS <= 0 && spanEW <= 0) return;

  const bldgOrient = document.getElementById('bldgOrientation')?.value || 'auto';

  // Alignment 1 (Vertical): Width on N/S span, Length on E/W span
  const fitA_Width = spanNS - widthVal;
  const fitA_Length = spanEW - lengthVal;
  const isFitA = fitA_Width >= 0 && fitA_Length >= 0;

  // Alignment 2 (Horizontal): Length on N/S span, Width on E/W span
  const fitB_Width = spanEW - widthVal;
  const fitB_Length = spanNS - lengthVal;
  const isFitB = fitB_Width >= 0 && fitB_Length >= 0;

  let widthSpan = spanNS;
  let lengthSpan = spanEW;

  if (bldgOrient === 'horizontal') {
    widthSpan = spanEW;
    lengthSpan = spanNS;
  } else if (bldgOrient === 'vertical') {
    widthSpan = spanNS;
    lengthSpan = spanEW;
  } else {
    // Auto-fit selection
    if (isFitB && !isFitA) {
      widthSpan = spanEW;
      lengthSpan = spanNS;
    } else if (!isFitA && !isFitB) {
      const deficitA = Math.min(0, fitA_Width) + Math.min(0, fitA_Length);
      const deficitB = Math.min(0, fitB_Width) + Math.min(0, fitB_Length);
      if (deficitB > deficitA) {
        widthSpan = spanEW;
        lengthSpan = spanNS;
      }
    }
  }

  // Calculate remaining clearance along selected width and length spans
  const remainWidth = Math.max(0, widthSpan - widthVal);
  const remainLength = Math.max(0, lengthSpan - lengthVal);

  // Convert clearance to total whole inches to prevent decimal rounding errors
  const remainWidthInches = Math.floor(remainWidth * 12 + 0.001);
  const remainLengthInches = Math.floor(remainLength * 12 + 0.001);

  // Equal split allocation in whole inches
  const leftInches = Math.floor(remainWidthInches / 2);
  const rightInches = Math.floor(remainWidthInches / 2);
  const frontInches = Math.floor(remainLengthInches / 2);
  const rearInches = Math.floor(remainLengthInches / 2);

  const calcLeft = leftInches / 12;
  const calcRight = rightInches / 12;
  const calcFront = frontInches / 12;
  const calcRear = rearInches / 12;

  // Populate setback input fields (unless manually locked by user)
  const populateField = (fieldId, totalFeet) => {
    const ftEl = document.getElementById(fieldId + '_ft');
    const inEl = document.getElementById(fieldId + '_in');
    const hiddenEl = document.getElementById(fieldId);

    if (!ftEl || !hiddenEl) return;

    // Is manually edited by user?
    const isManual = hiddenEl.dataset.manualEdit === 'true';

    if (force || !isManual || ftEl.value === '' || ftEl.value === '0') {
      const ft = Math.floor(totalFeet);
      const inches = Math.round((totalFeet - ft) * 12);
      ftEl.value = ft > 0 ? ft : (inches > 0 ? '0' : '');
      if (inEl) inEl.value = inches > 0 ? inches : '';
      hiddenEl.value = Math.round(totalFeet * 100) / 100;
    }
  };

  populateField('setbackFront', calcFront);
  populateField('setbackRear', calcRear);
  populateField('setbackLeft', calcLeft);
  populateField('setbackRight', calcRight);
}

/**
 * Helper to format decimal feet into a clean feet-inches string (e.g. 40'-1").
 * 
 * @function formatFeetInches
 * @param {number} val - Decimal feet.
 * @returns {string}
 */
function formatFeetInches(val) {
  if (!val || isNaN(val) || val <= 0) return "0'";
  const ft = Math.floor(val);
  const inches = Math.round((val - ft) * 12);
  if (inches === 12) return `${ft + 1}'`;
  if (inches === 0) return `${ft}'`;
  return `${ft}'-${inches}"`;
}

/**
 * Validates whether proposed Building Width and Length fit within plot dimensions & setbacks from Step 3.
 * Automatically checks both standard and perpendicular orientation alignments.
 * Returns true if valid or if fields are left empty.
 * 
 * @function validateBuildingSetbackFeasibility
 * @returns {boolean} True if feasible or empty.
 */
function validateBuildingSetbackFeasibility() {
  const widthVal = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  const lengthVal = parseFloat(document.getElementById('bldgLength')?.value) || 0;

  const warningBanner = document.getElementById('setbackFeasibilityWarning');
  const warningText = document.getElementById('setbackFeasibilityText');
  const errWidth = document.getElementById('err-bldgWidth');
  const errLength = document.getElementById('err-bldgLength');

  // Reset error displays
  if (warningBanner) warningBanner.style.display = 'none';
  if (errWidth) errWidth.style.display = 'none';
  if (errLength) errLength.style.display = 'none';

  // Rule: If user removed all data (empty), navigation to next step IS ALLOWED!
  if (widthVal === 0 && lengthVal === 0) {
    return true;
  }

  // Retrieve Step 3 Site Dimensions
  const isOdd = document.getElementById('oddSiteCheck')?.checked;
  let north = 0, south = 0, east = 0, west = 0;

  if (isOdd) {
    north = parseFloat(document.getElementById('sideNorth')?.value) || 0;
    south = parseFloat(document.getElementById('sideSouth')?.value) || 0;
    east = parseFloat(document.getElementById('sideEast')?.value) || 0;
    west = parseFloat(document.getElementById('sideWest')?.value) || 0;
  } else {
    north = south = parseFloat(document.getElementById('regNorthSouth')?.value) || 0;
    east = west = parseFloat(document.getElementById('regEastWest')?.value) || 0;
  }

  const spanNS = isOdd ? Math.min(north, south) : Math.max(north, south);
  const spanEW = isOdd ? Math.min(east, west) : Math.max(east, west);

  const maxPlotSpan = Math.max(spanNS, spanEW);

  // Retrieve Setbacks from Step 4
  const frontSetback = parseFloat(document.getElementById('setbackFront')?.value) || 0;
  const rearSetback = parseFloat(document.getElementById('setbackRear')?.value) || 0;
  const leftSetback = parseFloat(document.getElementById('setbackLeft')?.value) || 0;
  const rightSetback = parseFloat(document.getElementById('setbackRight')?.value) || 0;

  // Alignment Option A: Width along North/South (spanNS), Length along East/West (spanEW)
  const availWidthA = Math.max(0, spanNS - leftSetback - rightSetback);
  const availLengthA = Math.max(0, spanEW - frontSetback - rearSetback);
  const isOptionAValid = (spanNS > 0 && widthVal <= spanNS && widthVal <= (availWidthA || spanNS)) &&
    (spanEW > 0 && lengthVal <= spanEW && lengthVal <= (availLengthA || spanEW));

  // Alignment Option B: Length along North/South (spanNS), Width along East/West (spanEW)
  const availLengthB = Math.max(0, spanNS - frontSetback - rearSetback);
  const availWidthB = Math.max(0, spanEW - leftSetback - rightSetback);
  const isOptionBValid = (spanNS > 0 && lengthVal <= spanNS && lengthVal <= (availLengthB || spanNS)) &&
    (spanEW > 0 && widthVal <= spanEW && widthVal <= (availWidthB || spanEW));

  // If EITHER orientation fits the plot boundaries after setbacks, the proposal IS FEASIBLE!
  if (isOptionAValid || isOptionBValid) {
    return true; // 100% Valid!
  }

  // If NEITHER orientation fits, report explicit overflow
  let isFeasible = false;
  let errorMsgs = [];

  if (widthVal > maxPlotSpan && lengthVal > maxPlotSpan) {
    errorMsgs.push(`Both building width (${formatFeetInches(widthVal)}) and length (${formatFeetInches(lengthVal)}) exceed total plot span (${formatFeetInches(maxPlotSpan)}).`);
  } else if (widthVal > maxPlotSpan) {
    errorMsgs.push(`Building width (${formatFeetInches(widthVal)}) exceeds max plot span (${formatFeetInches(maxPlotSpan)}).`);
  } else if (lengthVal > maxPlotSpan) {
    errorMsgs.push(`Building length (${formatFeetInches(lengthVal)}) exceeds max plot span (${formatFeetInches(maxPlotSpan)}).`);
  } else {
    errorMsgs.push(`Proposed building footprint (${formatFeetInches(widthVal)} × ${formatFeetInches(lengthVal)}) exceeds available building space after setbacks on plot (${formatFeetInches(spanNS)} × ${formatFeetInches(spanEW)}).`);
  }

  if (!isFeasible) {
    if (warningBanner && warningText) {
      warningText.innerHTML = errorMsgs.join('<br>') + `<br><span style="display:inline-block; margin-top:6px; color: var(--apple-text-secondary);">Plot Spans: <strong>${formatFeetInches(spanNS)} (N/S) × ${formatFeetInches(spanEW)} (E/W)</strong>. Setbacks: Front ${formatFeetInches(frontSetback)}, Rear ${formatFeetInches(rearSetback)}, Left ${formatFeetInches(leftSetback)}, Right ${formatFeetInches(rightSetback)}.</span>`;
      warningBanner.style.display = 'block';
    }
  }

  return isFeasible;
}

/**
 * Toggles boundary input fields depending on whether boundary is a Public Road or Neighboring Property.
 * 
 * @function toggleBoundaryType
 * @param {string} dir - Direction key ('North', 'South', 'East', 'West').
 * @returns {void}
 */
function toggleBoundaryType(dir) {
  const typeEl = document.getElementById(`type${dir}`);
  const roadPanel = document.getElementById(`roadFields${dir}`);
  const plotPanel = document.getElementById(`plotFields${dir}`);

  if (!typeEl) return;
  const val = typeEl.value;

  if (val === 'road') {
    if (roadPanel) roadPanel.style.display = 'grid';
    if (plotPanel) plotPanel.style.display = 'none';

    if (dir === 'North') {
      const rWidth = document.getElementById('widthRoadNorth');
      const primaryW = document.getElementById('roadWidth');
      if (rWidth && primaryW && rWidth.value) {
        primaryW.value = rWidth.value;
      }
    }
  } else if (val !== '') {
    if (roadPanel) roadPanel.style.display = 'none';
    if (plotPanel) plotPanel.style.display = 'block';
  } else {
    if (roadPanel) roadPanel.style.display = 'none';
    if (plotPanel) plotPanel.style.display = 'none';
  }

  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Toggles visibility of RMP-2015 Master Plan Road Widening controls panel.
 * 
 * @function toggleRoadWidening
 * @returns {void}
 */
function toggleRoadWidening() {
  const isEnabled = document.getElementById('roadWideningCheck').checked;
  const panel = document.getElementById('roadWideningControls');
  if (panel) {
    panel.style.display = isEnabled ? 'block' : 'none';
  }
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Toggles visibility of Drain / Nala / Lake Buffer Zone controls panel.
 * 
 * @function toggleBufferZone
 * @returns {void}
 */
function toggleBufferZone() {
  const isEnabled = document.getElementById('bufferCheck').checked;
  const panel = document.getElementById('bufferControls');
  if (panel) {
    panel.style.display = isEnabled ? 'block' : 'none';
  }
  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Toggles visibility of diagonal SAMPLE ONLY watermark on SVG canvas.
 * 
 * @function toggleSampleWatermark
 * @returns {void}
 */
function toggleSampleWatermark() {
  const watermarkGroup = document.getElementById('watermarkGroup');
  const isChecked = document.getElementById('sampleWatermarkCheck') ? document.getElementById('sampleWatermarkCheck').checked : false;
  if (watermarkGroup) {
    watermarkGroup.style.display = isChecked ? 'block' : 'none';
  }
}

/**
 * Toggles visibility of Page 2 (BBMP Official Line & Colour Specifications Sheet).
 * 
 * @function toggleLegendSheetPage
 * @returns {void}
 */
function toggleLegendSheetPage() {
  const legendSheet = document.getElementById('legendSheetOutput');
  const statusHint = document.getElementById('printPackageStatusHint');
  const isChecked = document.getElementById('includeLegendPage') ? document.getElementById('includeLegendPage').checked : true;

  if (legendSheet) {
    legendSheet.style.display = isChecked ? 'block' : 'none';
  }

  if (statusHint) {
    statusHint.innerHTML = isChecked
      ? '📄 <strong>Document Content:</strong> 2-Page Consolidated Package (Page 1: Single Plot Layout Plan + Page 2: BBMP Line & Colour Specifications Sheet).'
      : '📄 <strong>Document Content:</strong> 1-Page Layout Plan (Page 2 Legend Specifications Sheet disabled).';
  }
}

/**
 * Toggles expanding Sakala FAQ accordion items.
 * 
 * @function toggleFaq
 * @param {HTMLElement} el - Question header element clicked.
 * @returns {void}
 */
function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const icon = el.querySelector('span:last-child');
  if (!answer) return;

  const isOpen = answer.style.display === 'block';
  answer.style.display = isOpen ? 'none' : 'block';
  if (icon) icon.textContent = isOpen ? '+' : '−';
}

/**
 * Switches view tab on mobile (< 1024px) between Setup Form and Live Preview.
 * 
 * @function switchMobileTab
 * @param {string} tabName - 'wizard' or 'preview'.
 * @returns {void}
 */
function switchMobileTab(tabName) {
  const wizardCol = document.getElementById('wizardCol');
  const previewCol = document.getElementById('previewCol');
  const tabW = document.getElementById('mobileTabWizard');
  const tabP = document.getElementById('mobileTabPreview');

  if (tabName === 'wizard') {
    if (wizardCol) wizardCol.style.display = 'block';
    if (previewCol) previewCol.style.display = 'none';
    if (tabW) tabW.classList.add('active');
    if (tabP) tabP.classList.remove('active');
  } else {
    if (wizardCol) wizardCol.style.display = 'none';
    if (previewCol) previewCol.style.display = 'block';
    if (tabW) tabW.classList.remove('active');
    if (tabP) tabP.classList.add('active');

    if (typeof generatePlan === 'function') generatePlan();
  }
}

/**
 * Toggles legal consent acceptance state and updates Action Bar buttons.
 * 
 * @function toggleLegalConsent
 * @returns {void}
 */
function toggleLegalConsent() {
  const isChecked = document.getElementById('legalConsentCheck') ? document.getElementById('legalConsentCheck').checked : false;
  const errLegal = document.getElementById('err-legalConsent');
  if (errLegal) {
    errLegal.style.display = isChecked ? 'none' : 'block';
  }
}

/**
 * Direct client-side PDF file download using jsPDF + html2canvas.
 * Downloads multi-page A4 PDF file directly into user's Downloads folder WITHOUT opening print UI.
 * 
 * @function downloadPDFPackage
 * @returns {Promise<void>}
 */
async function downloadPDFPackage() {
  const legalCheck = document.getElementById('legalConsentCheck');
  if (legalCheck && !legalCheck.checked) {
    if (typeof goToStep === 'function') goToStep(7);
    const errLegal = document.getElementById('err-legalConsent');
    if (errLegal) errLegal.style.display = 'block';
    alert('⚖️ Legal Consent Required:\n\nPlease check the "I Agree to Terms of Service, Privacy Policy & Zero Liability Disclaimer" checkbox in Step 7 before downloading your PDF package.');
    return;
  }

  const downloadBtn = document.getElementById('downloadPdfBtn');
  const originalBtnText = downloadBtn ? downloadBtn.innerHTML : '';
  if (downloadBtn) {
    downloadBtn.innerHTML = '<span>⏳ Generating PDF...</span>';
    downloadBtn.disabled = true;
  }

  try {
    const pid = document.getElementById('pidNo') ? document.getElementById('pidNo').value.trim() : '';
    const survey = document.getElementById('surveyNo') ? document.getElementById('surveyNo').value.trim().replace(/[/\\?%*:|"<>]/g, '-') : '';
    const fileName = `BBMP_Single_Plot_Plan_${pid || survey || 'Sakala'}.pdf`;

    document.body.classList.add('pdf-export-active');

    if (typeof generatePlan === 'function') generatePlan();
    toggleLegendSheetPage();

    if (!window.jspdf || !window.html2canvas) {
      throw new Error('PDF Export libraries unavailable');
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Render Page 1 (Layout Plan Sheet) directly from visible DOM
    const page1Frame = document.querySelector('#planOutput .plan-sheet-frame');
    const canvas1 = await html2canvas(page1Frame, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    const imgProps1 = pdf.getImageProperties(imgData1);
    const renderHeight1 = (imgProps1.height * (pdfWidth - 10)) / imgProps1.width;

    pdf.addImage(imgData1, 'JPEG', 5, 5, pdfWidth - 10, Math.min(renderHeight1, pdfHeight - 10));

    // Render Page 2 (Legend Sheet) if enabled
    const includeLegend = document.getElementById('includeLegendPage') ? document.getElementById('includeLegendPage').checked : true;
    const legendSheet = document.getElementById('legendSheetOutput');

    if (includeLegend && legendSheet) {
      legendSheet.style.display = 'block';
      const page2Frame = document.querySelector('#legendSheetOutput .plan-sheet-frame');
      const canvas2 = await html2canvas(page2Frame, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
      const imgProps2 = pdf.getImageProperties(imgData2);
      const renderHeight2 = (imgProps2.height * (pdfWidth - 10)) / imgProps2.width;

      pdf.addPage();
      pdf.addImage(imgData2, 'JPEG', 5, 5, pdfWidth - 10, Math.min(renderHeight2, pdfHeight - 10));
    }

    // Trigger instant browser file download directly into Downloads folder
    pdf.save(fileName);

  } catch (err) {
    console.error('Direct PDF Export Failed:', err);
    printPlanPackage();
  } finally {
    document.body.classList.remove('pdf-export-active');
    if (downloadBtn) {
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
    }
  }
}

/**
 * Pre-configures page breaks and multi-page visibility before invoking window.print().
 * Opens native browser printer popup for physical paper printing.
 * 
 * @function printPlanPackage
 * @returns {void}
 */
function printPlanPackage() {
  const legalCheck = document.getElementById('legalConsentCheck');
  if (legalCheck && !legalCheck.checked) {
    if (typeof goToStep === 'function') goToStep(7);
    const errLegal = document.getElementById('err-legalConsent');
    if (errLegal) errLegal.style.display = 'block';
    alert('⚖️ Legal Consent Required:\n\nPlease check the "I Agree to Terms of Service, Privacy Policy & Zero Liability Disclaimer" checkbox in Step 7 before printing your plan package.');
    return;
  }

  if (typeof generatePlan === 'function') generatePlan();
  toggleLegendSheetPage();

  const viewport = document.getElementById('exportViewportSection');
  if (viewport) {
    viewport.style.display = 'block';
  }

  setTimeout(() => {
    window.print();
  }, 100);
}


/**
 * Global Plan Generation State Flag
 */
let isPlanGenerated = false;

/**
 * Formats detailed boundary summary description (Road details / Adjacent property info) for Step 7.
 * 
 * @function formatBoundarySummary
 * @param {string} dir - Cardinal direction ('North', 'South', 'East', 'West').
 * @returns {string} Formatted boundary summary label.
 */
function formatBoundarySummary(dir) {
  const typeEl = document.getElementById('type' + dir);
  if (!typeEl || !typeEl.value) return '—';

  const type = typeEl.value;
  if (type === 'road') {
    const name = document.getElementById('nameRoad' + dir)?.value.trim();
    const widthFt = document.getElementById('widthRoad' + dir + '_ft')?.value.trim();
    const widthIn = document.getElementById('widthRoad' + dir + '_in')?.value.trim();
    let widthStr = '';
    if (widthFt || widthIn) {
      widthStr = ` (${widthFt || 0}'${widthIn ? widthIn + '"' : ''} Wide)`;
    }
    return `Road Access${name ? ': ' + name : ''}${widthStr}`;
  } else if (type === 'private') {
    const desc = document.getElementById('descPlot' + dir)?.value.trim();
    return `Private Property${desc ? ' (' + desc + ')' : ''}`;
  } else if (type === 'gov') {
    const desc = document.getElementById('descPlot' + dir)?.value.trim();
    return `Government Property${desc ? ' (' + desc + ')' : ''}`;
  } else if (type === 'drain') {
    return 'Stormwater Drain / Nala';
  }
  return type;
}

/**
 * Dynamically builds the formatted property data summary grid for Step 7.
 * 
 * @function buildReviewSummary
 * @returns {void}
 */
function buildReviewSummary() {
  const container = document.getElementById('reviewSummaryContainer');
  if (!container) return;

  const isOdd = document.getElementById('oddSiteCheck')?.checked;
  const isRoadWidening = document.getElementById('roadWideningCheck')?.checked;
  const isBuffer = document.getElementById('bufferCheck')?.checked;

  const sections = [
    {
      title: '🏛️ Revenue & Property Records',
      step: 1,
      fields: [
        { id: 'ownerName', label: 'Owner Name(s)' },
        { id: 'epId', label: 'eKhata ID (ePID)' },
        { id: 'pidNo', label: 'BBMP PID' },
        { id: 'sasNo', label: 'SAS Tax Application No' },
        { id: 'surveyNo', label: 'Survey / Sy No' },
        { id: 'wardNo', label: 'Ward No' },
        { id: 'adlrNo', label: 'ADLR 11E Sketch No' },
        { id: 'dcOrderNo', label: 'DC Conversion Order No' },
        { id: 'dcOrderDate', label: 'DC Order Date' },
        { id: 'dcAuthority', label: 'Issuing Authority' }
      ]
    },
    {
      title: '📍 Location & Address',
      step: 2,
      fields: [
        { id: 'address', label: 'Property Address' },
        { id: 'wardName', label: 'Ward / Area Name' },
        { id: 'bbmpZone', label: 'BBMP Zone' }
      ]
    },
    {
      title: '📐 Plot Measurements & Geometry',
      step: 3,
      fields: [
        { id: 'oddSiteCheck', label: 'Plot Type', customVal: isOdd ? 'Irregular (4-Side Measurement)' : 'Regular (Rectangular / Square)' },
        { id: 'plotArea', label: 'Total Plot Area (sq.ft)' },
        { id: 'roadFacing', label: 'Road Facing Direction' },
        { id: 'roadWidth', label: 'Front Road Width', isFtIn: true },
        { id: 'scale', label: 'Drawing Scale' },
        ...(isOdd ? [
          { id: 'sideNorth', label: 'North Side Dimension', isFtIn: true },
          { id: 'sideSouth', label: 'South Side Dimension', isFtIn: true },
          { id: 'sideEast', label: 'East Side Dimension', isFtIn: true },
          { id: 'sideWest', label: 'West Side Dimension', isFtIn: true }
        ] : [
          { id: 'regNorthSouth', label: 'North-South Dimension', isFtIn: true },
          { id: 'regEastWest', label: 'East-West Dimension', isFtIn: true }
        ])
      ]
    },
    {
      title: '🏗️ Building Footprint & Setbacks',
      step: 4,
      fields: [
        { id: 'bldgType', label: 'Building Type' },
        { id: 'noOfFloors', label: 'Number of Floors' },
        { id: 'bldgOrientation', label: 'Footprint Alignment' },
        { id: 'bldgWidth', label: 'Building Width', isFtIn: true },
        { id: 'bldgLength', label: 'Building Length', isFtIn: true },
        { id: 'builtUpArea', label: 'Total Built-up Area (sq.ft)' },
        { id: 'setbackFront', label: 'Front Setback', isFtIn: true },
        { id: 'setbackRear', label: 'Rear Setback', isFtIn: true },
        { id: 'setbackLeft', label: 'Left Setback', isFtIn: true },
        { id: 'setbackRight', label: 'Right Setback', isFtIn: true }
      ]
    },
    {
      title: '📜 Deed DNA Boundaries',
      step: 5,
      fields: [
        { id: 'typeNorth', label: 'North Boundary', customVal: formatBoundarySummary('North') },
        { id: 'typeSouth', label: 'South Boundary', customVal: formatBoundarySummary('South') },
        { id: 'typeEast', label: 'East Boundary', customVal: formatBoundarySummary('East') },
        { id: 'typeWest', label: 'West Boundary', customVal: formatBoundarySummary('West') }
      ]
    },
    {
      title: '🚧 Constraints & Fees',
      step: 6,
      fields: [
        { id: 'roadWideningCheck', label: 'Road Widening Affected', isCheckbox: true },
        ...(isRoadWidening ? [
          { id: 'proposedRoadWidth', label: 'Proposed Road Width', isFtIn: true },
          { id: 'roadWideningStripWidth', label: 'Road Widening Strip Width', isFtIn: true }
        ] : []),
        { id: 'bufferCheck', label: 'Drain / Buffer Zone Affected', isCheckbox: true },
        ...(isBuffer ? [
          { id: 'bufferType', label: 'Buffer Type' },
          { id: 'bufferWidth', label: 'Buffer Width', isFtIn: true }
        ] : []),
        { id: 'challanFee', label: 'Challan Fee Amount (₹)' },
        { id: 'challanNo', label: 'Challan Number' },
        { id: 'challanDate', label: 'Challan Date' },
        { id: 'includeLegendPage', label: 'Include Page 2 Legend Sheet', isCheckbox: true },
        { id: 'sampleWatermarkCheck', label: 'Sample Draft Watermark', isCheckbox: true }
      ]
    }
  ];

  let html = '<div class="review-summary-grid">';

  sections.forEach(sec => {
    html += `
      <div class="review-summary-card">
        <div class="review-summary-header">
          <h4>${sec.title}</h4>
          <button type="button" class="review-edit-btn" onclick="goToStep(${sec.step})" title="Edit ${sec.title}">
            <span class="material-symbols-outlined">edit</span> Edit
          </button>
        </div>
        <div class="review-fields-list">
    `;

    sec.fields.forEach(f => {
      let val = '—';
      if (f.customVal !== undefined) {
        val = f.customVal;
      } else if (f.isCheckbox) {
        const el = document.getElementById(f.id);
        val = (el && el.checked) ? 'Yes' : 'No';
      } else if (f.isFtIn) {
        const ftEl = document.getElementById(f.id + '_ft');
        const inEl = document.getElementById(f.id + '_in');
        const ftVal = ftEl ? ftEl.value.trim() : '';
        const inVal = inEl ? inEl.value.trim() : '';
        if (ftVal !== '' || inVal !== '') {
          val = `${ftVal || '0'} ft ${inVal ? inVal + ' in' : ''}`;
        } else {
          const hiddenEl = document.getElementById(f.id);
          if (hiddenEl && hiddenEl.value) {
            val = `${hiddenEl.value} ft`;
          }
        }
      } else {
        const el = document.getElementById(f.id);
        if (el && el.value && el.value.trim() !== '') {
          val = el.value.trim();
        }
      }

      html += `
        <div class="review-field-row">
          <span class="field-label">${f.label}:</span>
          <span class="field-value">${val}</span>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Navigates directly to target step, focuses field, and flashes highlight glow.
 * 
 * @function editFieldFromReview
 * @param {number} stepNum - Target wizard step number.
 * @param {string} fieldId - Target input element ID.
 * @returns {void}
 */
function editFieldFromReview(stepNum, fieldId) {
  if (typeof goToStep === 'function') {
    goToStep(stepNum);
  }
  setTimeout(() => {
    const target = document.getElementById(fieldId + '_ft') || document.getElementById(fieldId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const parentField = target.closest('.field') || target;
      parentField.classList.add('field-highlight-flash');
      setTimeout(() => {
        parentField.classList.remove('field-highlight-flash');
      }, 2400);
    }
  }, 250);
}

/**
 * Manages Legal Consent Checkbox state.
 * Enables "Generate Plan" when checked, disables Export & Print when unchecked.
 * 
 * @function toggleLegalConsent
 * @returns {void}
 */
function toggleLegalConsent() {
  const consent = document.getElementById('legalConsentCheck');
  const genBtn = document.getElementById('generatePlanBtn');
  const exportBtn = document.getElementById('downloadPdfBtn');
  const printBtn = document.getElementById('printBtn');
  const errConsent = document.getElementById('err-legalConsent');

  const isChecked = consent && consent.checked;

  if (errConsent) errConsent.style.display = 'none';

  if (!isChecked) {
    // Unchecked -> Delete generated plan state and disable all 3 buttons!
    isPlanGenerated = false;
    if (genBtn) genBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
    if (printBtn) printBtn.disabled = true;

    const viewport = document.getElementById('exportViewportSection');
    if (viewport) viewport.style.display = 'none';
  } else {
    // Checked -> Enable "Generate Plan", keep Export & Print disabled until plan is generated!
    if (genBtn) genBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = !isPlanGenerated;
    if (printBtn) printBtn.disabled = !isPlanGenerated;
  }
}

/**
 * Generates plan drawing, reveals canvas viewport, and enables Export & Print buttons.
 * 
 * @function onGeneratePlanClick
 * @returns {void}
 */
function onGeneratePlanClick() {
  const consent = document.getElementById('legalConsentCheck');
  if (!consent || !consent.checked) {
    const errConsent = document.getElementById('err-legalConsent');
    if (errConsent) errConsent.style.display = 'block';
    return;
  }

  // Generate 2-page architectural drawing
  if (typeof generatePlan === 'function') {
    generatePlan();
  }

  // Track generated plan count in analytics
  if (typeof trackPlanGenerated === 'function') {
    trackPlanGenerated();
  }

  // Mark plan as generated and display viewport
  isPlanGenerated = true;
  const viewport = document.getElementById('exportViewportSection');
  if (viewport) viewport.style.display = 'block';

  // Enable Export PDF and Print buttons
  const exportBtn = document.getElementById('downloadPdfBtn');
  const printBtn = document.getElementById('printBtn');
  if (exportBtn) exportBtn.disabled = false;
  if (printBtn) printBtn.disabled = false;

  // Scroll to drawing preview smoothly
  if (viewport) {
    viewport.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Central dictionary containing beginner-friendly field explanations,
 * document retrieval instructions, sample snippets, and official portal links.
 */
const FIELD_HELP_DATA = {
  epId: {
    title: "eKhata Property ID (ePID)",
    what: "Your plot's 10-digit official digital ID number issued by BBMP.",
    where: "Look at the top-right corner of your draft or final e-Khata document.",
    sample: "Property ID (ePID): 1509988776",
    link: "https://bbmpekhata.karnataka.gov.in/",
    linkText: "Visit Karnataka e-Khata Portal ↗"
  },
  pidNo: {
    title: "BBMP Property Tax PID Number",
    what: "The Property Identification Number used when paying your yearly BBMP property tax.",
    where: "Printed near the top of your annual SAS Property Tax receipt or tax khata record.",
    sample: "PID Number: 108-W0045-12",
    link: "https://bbmptax.karnataka.gov.in/",
    linkText: "Visit BBMP Property Tax Portal ↗"
  },
  adlrNo: {
    title: "ADLR 11E Survey Sketch Number",
    what: "Pre-mutation survey sketch reference issued by the Assistant Director of Land Records (ADLR).",
    where: "Printed on your official Mojini 11E survey sketch map.",
    sample: "Sketch Ref: ADLR/11E/KR-7891/2023-24",
    link: "https://bhoomi.karnataka.gov.in/mojini/",
    linkText: "Visit Bhoomi Mojini Portal ↗"
  },
  dcOrderNo: {
    title: "DC Conversion Order Number & Date",
    what: "Official government order converting agricultural land for non-agricultural residential use under KLR Act Sec 95.",
    where: "Printed on your official DC Conversion Order issued by the Deputy Commissioner, Bengaluru Urban District.",
    sample: "Order No: ALN(E)SR.97/07-08 (Dated: 12-04-2008)"
  },
  zoneName: {
    title: "BBMP Administrative Zone",
    what: "The BBMP zone governing your property location in Bengaluru (e.g. East, West, South, Mahadevapura, Bommanahalli).",
    where: "Found on your property tax receipt or e-Khata document."
  },
  wardNo: {
    title: "BBMP Ward Number & Name",
    what: "The municipal ward number and neighborhood name where your plot is situated.",
    where: "Printed on your BBMP SAS Tax Receipt (e.g., Ward 45 - Malleshwaram)."
  },
  siteAddress: {
    title: "Complete Property Address",
    what: "The full physical street address of your property.",
    where: "Type the address exactly as written under the Schedule of Property in your registered Sale Deed."
  },
  surveyNo: {
    title: "Survey Number / Sy No",
    what: "The official revenue survey number or site/house number of your plot.",
    where: "Found in your Sale Deed Schedule or 11E Survey Sketch (e.g. Sy No 42/1)."
  },
  isOdd: {
    title: "Regular vs Irregular Plot Shape",
    what: "Choose Regular for simple rectangular/square plots (2 dimensions), or Irregular if your plot has 4 unequal or slanted sides.",
    where: "Check your 11E Survey Sketch or Sale Deed boundary measurements."
  },
  plotDimensions: {
    title: "Plot Boundary Measurements",
    what: "The exact physical length of your plot boundaries in feet and inches.",
    where: "Found under the 'Schedule of Property' section of your Sale Deed or Mojini 11E Sketch."
  },
  roadFacing: {
    title: "Front Main Road Direction",
    what: "The cardinal direction (North, South, East, or West) where your primary entrance/abutting road faces.",
    where: "Check your plot layout sketch or deed schedule."
  },
  roadWidth: {
    title: "Abutting Road Width",
    what: "The width of the public or private road in front of your plot (in feet and inches).",
    where: "Road width determines minimum setback requirements under BBMP RMP-2015 bye-laws."
  },
  bldgType: {
    title: "Proposed Building Structure & Floor Count",
    what: "Choose whether your site is a vacant plot or has a building structure (e.g. Stilt+Ground, G+1 to G+4).",
    where: "Determines the total built-up area and mandatory setback clearances."
  },
  bldgOrientation: {
    title: "Building Footprint Alignment",
    what: "Controls whether the building long side runs horizontally or vertically to fit cleanly within plot setbacks.",
    where: "Select ✨ Auto-Fit or adjust alignment to prevent footprint boundary overflow."
  },
  setbacks: {
    title: "Building Setback Clearances (RMP-2015)",
    what: "Mandatory open space required between your building outer walls and property boundaries.",
    where: "Auto-calculated according to BBMP RMP-2015 bye-laws based on plot depth and road width."
  },
  boundaries: {
    title: "Deed DNA Boundary Schedule",
    what: "Details of what abuts each side of your plot (Public Road, Private Property, Government Land, or Stormwater Drain).",
    where: "Copy directly from the 'Schedule of Property' section in your registered Sale Deed."
  },
  roadWidening: {
    title: "Master Plan Road Widening Strip",
    what: "Government reserved strip of land along public roads under BDA Master Plan (RMP-2015).",
    where: "If your road is slated for widening, check this box to render the hatched widening strip overlay on your plan."
  },
  bufferZone: {
    title: "Stormwater Drain / Lake Buffer Zone",
    what: "Mandatory buffer zone required next to Rajakaluve (Stormwater Drains) or Lakes under KTCP Act Sec 17.",
    where: "If your site is adjacent to a drain or water body, check this to render the sky-blue buffer zone overlay."
  }
};

/**
 * Opens an Apple-style Frosted Glass Field Help Modal.
 * 
 * @function showFieldHelp
 * @param {string} key - Key matching FIELD_HELP_DATA entry.
 * @returns {void}
 */
function showFieldHelp(key) {
  const data = FIELD_HELP_DATA[key];
  if (!data) return;

  const modal = document.getElementById('fieldHelpModal');
  const titleEl = document.getElementById('helpModalTitle');
  const bodyEl = document.getElementById('helpModalBody');

  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = data.title;

  let html = `
    <div style="font-size: 13.5px; line-height: 1.5; color: var(--apple-text-secondary);">
      <p style="margin: 0 0 10px 0;"><strong>What it is:</strong> ${data.what}</p>
      <p style="margin: 0 0 10px 0;"><strong>Where to find it:</strong> ${data.where}</p>
  `;

  if (data.sample) {
    html += `
      <div class="sample-snippet-box" style="margin: 10px 0;">
        <div class="snippet-tag">Sample Document Text</div>
        <div class="snippet-content"><strong>${data.sample}</strong></div>
      </div>
    `;
  }

  if (data.link) {
    html += `
      <a href="${data.link}" target="_blank" rel="noopener" class="doc-link-btn" style="margin-top: 6px;">
        ${data.linkText || 'Visit Official Portal ↗'}
      </a>
    `;
  }

  html += `</div>`;

  bodyEl.innerHTML = html;
  modal.style.display = 'flex';
}

function closeFieldHelp() {
  const modal = document.getElementById('fieldHelpModal');
  if (modal) modal.style.display = 'none';
}

