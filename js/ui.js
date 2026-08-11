/**
 * @file ui.js
 * @description Handles dynamic DOM interaction logic, visibility toggles, and cardinal side dimension auto-syncing.
 * @author Senior Systems Architect
 */

/**
 * Toggles visibility between regular rectangular plot mode (auto-syncing opposite sides)
 * and odd/irregular quadrilateral plot mode (independent 4-side inputs).
 * 
 * @function toggleOddSite
 * @returns {void}
 */
function toggleOddSite() {
  const isOdd = document.getElementById('oddSiteCheck') && document.getElementById('oddSiteCheck').checked;
  const hintEl = document.getElementById('oddSiteHint');

  if (hintEl) {
    hintEl.textContent = isOdd
      ? '🔷 Irregular Site Mode: Enter exact independent measurements for all 4 sides.'
      : '🔷 Rectangular Site Mode: Opposite sides (North/South and East/West) auto-sync automatically.';
  }

  if (!isOdd) {
    syncOppositeSides('sideNorth');
    syncOppositeSides('sideEast');
  }
}

/**
 * Auto-syncs opposite cardinal sides (North <-> South, East <-> West) for rectangular plots.
 * 
 * @function syncOppositeSides
 * @param {string} changedId - ID of input field ('sideNorth', 'sideSouth', 'sideEast', 'sideWest').
 * @returns {void}
 */
function syncOppositeSides(changedId) {
  const isOdd = document.getElementById('oddSiteCheck') && document.getElementById('oddSiteCheck').checked;
  if (isOdd) return;

  const changedEl = document.getElementById(changedId);
  if (!changedEl) return;
  const val = changedEl.value;

  if (changedId === 'sideNorth') {
    const sEl = document.getElementById('sideSouth');
    if (sEl) sEl.value = val;
  } else if (changedId === 'sideSouth') {
    const nEl = document.getElementById('sideNorth');
    if (nEl) nEl.value = val;
  } else if (changedId === 'sideEast') {
    const wEl = document.getElementById('sideWest');
    if (wEl) wEl.value = val;
  } else if (changedId === 'sideWest') {
    const eEl = document.getElementById('sideEast');
    if (eEl) eEl.value = val;
  }

  calculatePlotAreaFromSides();
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
 * Supports 1-side, 2-side (corner plots), 3-side, and 4-side (island plots) road access.
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

    // Automatically sync primary Road Width field if North road width is entered
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
}
