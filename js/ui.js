/**
 * @file ui.js
 * @description Dynamic UI interaction logic, real-time live preview event wiring,
 * mobile segmented tab switching, Sakala FAQ accordion toggling, and PDF export engines.
 * @author Senior Systems Architect
 */

/**
 * Toggles visibility between regular rectangular plot mode (auto-syncing opposite sides)
 * and odd/irregular quadrilateral plot mode (independent 4-side inputs).
 * 
 * @function toggleOddSite
 * @returns {void}
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
};
  }

  calculatePlotAreaFromSides();
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
  window.print();
}

/**
 * Attaches real-time live preview re-render event listeners across all form inputs.
 */
document.addEventListener('DOMContentLoaded', () => {
  const allInputs = document.querySelectorAll('input, select');
  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (typeof generatePlan === 'function') generatePlan();
    });
    input.addEventListener('change', () => {
      if (typeof generatePlan === 'function') generatePlan();
    });
  });
});
