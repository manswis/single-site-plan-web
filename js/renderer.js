/**
 * @file renderer.js
 * @description Official BBMP Vector SVG Graphics Engine & Architectural Feet-Inches Formatter.
 * Implements strict 4-Layer Radial Coordinate Positioning and architectural text rotation rules.
 * Renders plot boundary dash-dot-dot lines, Cobalt Blue diagonal hatched building footprints,
 * custom setback geometry, RMP-2015 road widening strips, drain buffer zones, and corner splays.
 * Compliant with BBMP Colour & Line Specification Standards (LEGEND.pdf).
 * @author Senior Systems Architect
 */

/**
 * Formats a numerical feet measurement into standard architectural feet-inches string notation.
 * Examples:
 *   40.0   -> 40'-0"
 *   40.5   -> 40'-6"
 *   12.25  -> 12'-3"
 *   15.75  -> 15'-9"
 * 
 * @function formatFeetInches
 * @param {number|string} decimalFeet - Measurement in feet (e.g. 40, 40.5).
 * @returns {string} Formatted architectural string (e.g. 40'-6").
 */
function formatFeetInches(decimalFeet) {
  const num = parseFloat(decimalFeet);
  if (isNaN(num) || num < 0) return "0'-0\"";

  const ft = Math.floor(num);
  const inchesDecimal = (num - ft) * 12;
  const inches = Math.round(inchesDecimal);

  if (inches >= 12) {
    return `${ft + 1}'-0"`;
  }

  return `${ft}'-${inches}"`;
}

/**
 * Main plan generator controller. Validates input form state, computes plot geometry,
 * populates details summary tables and 8 sidebar panels, and renders vector graphics onto SVG canvas.
 * 
 * @function generatePlan
 * @returns {void}
 */
function generatePlan() {
  const isOdd = document.getElementById('oddSiteCheck') ? document.getElementById('oddSiteCheck').checked : false;
  const owner = (document.getElementById('ownerName')?.value || '').trim() || '—';
  const epId = (document.getElementById('epId')?.value || '').trim() || '—';
  const pidNo = (document.getElementById('pidNo')?.value || '').trim() || '—';
  const survey = (document.getElementById('surveyNo')?.value || '').trim() || '—';
  const zone = (document.getElementById('bbmpZone')?.value || '').trim() || 'East';
  const wardNo = (document.getElementById('wardNo')?.value || '').trim() || '—';
  const wardName = (document.getElementById('wardName')?.value || '').trim() || '—';
  const address = (document.getElementById('address')?.value || '').trim() || '—';

  // Primary Universal 4-Side Cardinal Measurements with Fallbacks
  let sideN = parseFloat(document.getElementById('sideNorth')?.value) || 0;
  let sideS = parseFloat(document.getElementById('sideSouth')?.value) || 0;
  let sideE = parseFloat(document.getElementById('sideEast')?.value) || 0;
  let sideW = parseFloat(document.getElementById('sideWest')?.value) || 0;

  if (!isOdd) {
    const regNS = parseFloat(document.getElementById('regNorthSouth')?.value) || 30;
    const regEW = parseFloat(document.getElementById('regEastWest')?.value) || 40;
    if (sideN <= 0) sideN = regEW;
    if (sideS <= 0) sideS = regEW;
    if (sideE <= 0) sideE = regNS;
    if (sideW <= 0) sideW = regNS;
  } else {
    if (sideN <= 0) sideN = 40;
    if (sideS <= 0) sideS = 40;
    if (sideE <= 0) sideE = 30;
    if (sideW <= 0) sideW = 30;
  }

  const width = (sideN + sideS) / 2;
  const length = (sideE + sideW) / 2;
  const areaSqFt = parseFloat(document.getElementById('plotArea')?.value) || Math.round(width * length);
  const roadW = parseFloat(document.getElementById('roadWidth')?.value) || 30;
  const roadFace = (document.getElementById('roadFacing')?.value || '').trim() || 'north';
  const scale = document.getElementById('scale')?.value || '1:100';

  // Read Site / Plot Number
  const rawPlotNo = (document.getElementById('plotNo')?.value || '').trim();
  let displayPlotNo = '';
  if (rawPlotNo) {
    displayPlotNo = /^(site|plot)\b/i.test(rawPlotNo) ? rawPlotNo.toUpperCase() : `SITE NO. ${rawPlotNo.toUpperCase()}`;
  }

  // Read Custom Building Setback Values (ft)
  const setbackF = parseFloat(document.getElementById('setbackFront')?.value) || 0;
  const setbackR = parseFloat(document.getElementById('setbackRear')?.value) || 0;
  const setbackL = parseFloat(document.getElementById('setbackLeft')?.value) || 0;
  const setbackRt = parseFloat(document.getElementById('setbackRight')?.value) || 0;

  let bldgW = parseFloat(document.getElementById('bldgWidth')?.value) || 0;
  let bldgL = parseFloat(document.getElementById('bldgLength')?.value) || 0;

  // Metadata & Document Details
  const adlrNo = (document.getElementById('adlrNo')?.value || '').trim() || 'N/A';
  const dcOrderNo = (document.getElementById('dcOrderNo')?.value || '').trim() || 'N/A';
  const dcOrderDate = document.getElementById('dcOrderDate')?.value || 'N/A';
  const dcAuthority = (document.getElementById('dcAuthority')?.value || '').trim() || 'DC, Bengaluru Urban';

  // Derive building dimensions if empty from setbacks
  if (bldgW <= 0) bldgW = Math.max(0, width - setbackL - setbackRt);
  if (bldgL <= 0) bldgL = Math.max(0, length - setbackF - setbackR);

  // Read Boundary Types & Metadata across all 9 categories
  const boundaries = {
    North: getBoundaryInfo('North'),
    South: getBoundaryInfo('South'),
    East: getBoundaryInfo('East'),
    West: getBoundaryInfo('West')
  };

  /**
   * Formats adjacent plot/property description with clean, professional labels.
   * @param {string} desc - Raw user-entered text.
   * @param {string} type - Boundary category type.
   * @returns {string} Formatted boundary callout text.
   */
  function formatAdjacentBoundaryText(desc, type) {
    if (!desc) {
      return `Adjacent: ${getDefaultLabel(type)}`;
    }
    const trimmed = desc.trim();
    if (type === 'plot') {
      // If user entered only digits or alphanumeric plot identifiers (e.g. "40", "40/A", "40-B")
      if (/^[\d]+[\w\/-]*$/.test(trimmed)) {
        return `Adjacent Plot No. ${trimmed}`;
      }
      if (/^(plot|site|plot no|site no|plot no\.|site no\.)\b/i.test(trimmed)) {
        return `Adjacent ${trimmed}`;
      }
      if (/^adjacent\b/i.test(trimmed)) {
        return trimmed;
      }
      return `Adjacent Plot: ${trimmed}`;
    } else if (type === 'private') {
      if (/^[\d]+[\w\/-]*$/.test(trimmed)) {
        return `Adjacent Private Property No. ${trimmed}`;
      }
      if (/^adjacent\b/i.test(trimmed)) {
        return trimmed;
      }
      return `Adjacent: ${trimmed}`;
    }
    if (/^adjacent\b/i.test(trimmed)) return trimmed;
    return `Adjacent: ${trimmed}`;
  }

  /**
   * Helper function to extract boundary metadata.
   * @param {string} dir - Direction key ('North', 'South', 'East', 'West').
   * @returns {Object} Boundary information object.
   */
  function getBoundaryInfo(dir) {
    const typeEl = document.getElementById(`type${dir}`);
    const type = typeEl ? typeEl.value : (dir.toLowerCase() === roadFace ? 'road' : 'plot');
    if (type === 'road') {
      const nameEl = document.getElementById(`nameRoad${dir}`);
      const ftEl = document.getElementById(`widthRoad${dir}_ft`);
      const inEl = document.getElementById(`widthRoad${dir}_in`);
      const hiddenWidthEl = document.getElementById(`widthRoad${dir}`);

      let w = roadW;
      const ftVal = ftEl ? ftEl.value.trim() : '';
      const inVal = inEl ? inEl.value.trim() : '';
      if (ftVal !== '' || inVal !== '') {
        w = (parseFloat(ftVal) || 0) + ((parseFloat(inVal) || 0) / 12);
      } else if (hiddenWidthEl && hiddenWidthEl.value) {
        w = parseFloat(hiddenWidthEl.value) || roadW;
      }

      const name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : (dir.toLowerCase() === roadFace ? 'PUBLIC ROAD' : 'ABUTTING ROAD');
      const meterW = (w * 0.3048).toFixed(2);
      return { type: 'road', text: `${name.toUpperCase()} (${formatFeetInches(w)} [${meterW} M] WIDE)`, roadW: w, name: name };
    } else {
      const descEl = document.getElementById(`descPlot${dir}`);
      const rawDesc = descEl && descEl.value.trim() ? descEl.value.trim() : '';
      const formattedText = formatAdjacentBoundaryText(rawDesc, type);
      return { type: type, text: formattedText };
    }
  }

  /**
   * Returns fallback descriptions for non-road boundary types.
   * @param {string} type - Boundary type key.
   * @returns {string} Human-readable fallback label.
   */
  function getDefaultLabel(type) {
    switch (type) {
      case 'drain': return 'STORMWATER DRAIN (RAJAKALUVE)';
      case 'lake': return 'LAKE / WATER BODY BUFFER';
      case 'park': return 'BDA PARK / CA SITE';
      case 'land': return 'VACANT SURVEY LAND';
      case 'passage': return 'PRIVATE PASSAGE / COMMON LANE';
      case 'infra': return 'RAILWAY / METRO CORRIDOR';
      case 'govt': return 'GOVERNMENT / INSTITUTIONAL LAND';
      case 'private': return "PRIVATE PROPERTY";
      default: return "NEIGHBOR'S PLOT";
    }
  }

  // 1. Populate Summary Details Table (70% Left Column Header)
  const areaSqM = (areaSqFt * 0.092903).toFixed(2);
  document.getElementById('outOwner').textContent = owner;
  document.getElementById('outEpId').textContent = epId;
  document.getElementById('outSurvey').textContent = survey;
  document.getElementById('outWard').textContent = `Ward ${wardNo} — ${wardName}`;
  document.getElementById('outAddress').textContent = address;

  // Populate GPS Coordinates if present
  const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
  const parsedGps = parseCoordinates(rawGps);
  const outGpsWrap = document.getElementById('outGpsWrap');
  const outGps = document.getElementById('outGps');
  if (parsedGps && outGpsWrap && outGps) {
    const latDir = parsedGps.lat >= 0 ? 'N' : 'S';
    const lonDir = parsedGps.lon >= 0 ? 'E' : 'W';
    outGps.textContent = `${Math.abs(parsedGps.lat).toFixed(4)}° ${latDir}, ${Math.abs(parsedGps.lon).toFixed(4)}° ${lonDir}`;
    outGpsWrap.style.display = 'inline';
  } else if (outGpsWrap) {
    outGpsWrap.style.display = 'none';
  }

  document.getElementById('outArea').textContent = `${areaSqFt} sq.ft (${areaSqM} sq.m)`;
  document.getElementById('outSize').textContent = `N:${formatFeetInches(sideN)} × S:${formatFeetInches(sideS)} × E:${formatFeetInches(sideE)} × W:${formatFeetInches(sideW)}` + (isOdd ? ' (Irregular)' : ' (Regular)');
  document.getElementById('outRoadFace').textContent = roadFace.charAt(0).toUpperCase() + roadFace.slice(1);
  const roadMeterW = (roadW * 0.3048).toFixed(2);
  document.getElementById('outRoadWidth').textContent = `${formatFeetInches(roadW)} (${roadMeterW} m) Wide`;

  // 2. Populate ADLR 11E Header Bar
  document.getElementById('outAdlrNo').textContent = adlrNo;
  document.getElementById('outHeaderSurvey').textContent = survey;

  // 3. Populate Sidebar Panel 1: ADLR 11E
  document.getElementById('sbAdlrNo').textContent = adlrNo;
  document.getElementById('sbMojiniRef').textContent = adlrNo !== 'N/A' ? 'MOJINI-' + adlrNo : 'N/A';

  // 4. Populate Sidebar Panel 3: DC Conversion Details
  document.getElementById('sbDcOrderNo').textContent = dcOrderNo;
  document.getElementById('sbDcOrderDate').textContent = dcOrderDate;
  document.getElementById('sbDcAuthority').textContent = dcAuthority;

  // 5. Compute Land Use Analysis Table Math (Panel 5)
  const isRoadWidening = document.getElementById('roadWideningCheck') && document.getElementById('roadWideningCheck').checked;
  const isBuffer = document.getElementById('bufferCheck') && document.getElementById('bufferCheck').checked;

  let roadAreaSqFt = 0;
  let stripW = 0;
  if (isRoadWidening) {
    stripW = parseFloat(document.getElementById('roadWideningStripWidth').value) || 0;
    roadAreaSqFt = width * stripW;
  }

  let bufferAreaSqFt = 0;
  let bufW = 0;
  if (isBuffer) {
    bufW = parseFloat(document.getElementById('bufferWidth').value) || 0;
    bufferAreaSqFt = width * bufW;
  }

  const resAreaSqFt = Math.max(0, areaSqFt - roadAreaSqFt - bufferAreaSqFt);
  const totalAreaSqM = parseFloat(areaSqM);
  const resAreaSqM = (resAreaSqFt * 0.092903).toFixed(2);
  const roadAreaSqM = (roadAreaSqFt * 0.092903).toFixed(2);
  const bufferAreaSqM = (bufferAreaSqFt * 0.092903).toFixed(2);

  const resPct = ((resAreaSqFt / areaSqFt) * 100).toFixed(2);
  const roadPct = ((roadAreaSqFt / areaSqFt) * 100).toFixed(2);
  const bufferPct = ((bufferAreaSqFt / areaSqFt) * 100).toFixed(2);

  document.getElementById('luResArea').textContent = resAreaSqM;
  document.getElementById('luResPct').textContent = `${resPct}%`;

  const rowRoad = document.getElementById('luRowRoad');
  if (rowRoad) {
    rowRoad.style.display = isRoadWidening ? 'table-row' : 'none';
    document.getElementById('luRoadArea').textContent = roadAreaSqM;
    document.getElementById('luRoadPct').textContent = `${roadPct}%`;
  }

  const rowBuffer = document.getElementById('luRowBuffer');
  if (rowBuffer) {
    rowBuffer.style.display = isBuffer ? 'table-row' : 'none';
    document.getElementById('luBufferArea').textContent = bufferAreaSqM;
    document.getElementById('luBufferPct').textContent = `${bufferPct}%`;
  }

  document.getElementById('luTotalArea').textContent = totalAreaSqM.toFixed(2);

  // 6. Populate Sidebar Panel 8: Title Block
  const tbPlotEl = document.getElementById('tbPlotNo');
  if (tbPlotEl) tbPlotEl.textContent = displayPlotNo || rawPlotNo || '—';
  document.getElementById('tbPidNo').textContent = pidNo;
  document.getElementById('tbWard').textContent = `Ward ${wardNo} (${wardName})`;
  document.getElementById('tbZone').textContent = `${zone} Zone`;
  document.getElementById('tbScale').textContent = scale;

  // 7. Render Plot Vector SVG Canvas inside generous 700 x 520 ViewBox
  const plotRect = document.getElementById('plotRect');
  const plotPoly = document.getElementById('plotPoly');
  const bldgRect = document.getElementById('bldgRect');

  // Reserved Centered Plot Box Canvas: Width 340, Height 260
  const maxDrawW = 340;
  const maxDrawH = 260;
  const ratio = Math.min(maxDrawW / Math.max(sideN, sideS, 1), maxDrawH / Math.max(sideE, sideW, 1));

  let offsetX, offsetY, drawW, drawH, nW, sW, eH, wH;
  let topLeft, topRight, botRight, botLeft;

  if (isOdd) {
    plotRect.style.display = 'none';
    plotPoly.style.display = 'block';

    nW = sideN * ratio;
    sW = sideS * ratio;
    eH = sideE * ratio;
    wH = sideW * ratio;

    const maxW = Math.max(nW, sW);
    const maxH = Math.max(eH, wH);

    offsetX = 180 + (maxDrawW - maxW) / 2;
    offsetY = 100 + (maxDrawH - maxH) / 2;

    // 4 Corner Vertices for Irregular Quadrilateral
    topLeft = { x: offsetX + (maxW - nW) / 2, y: offsetY };
    topRight = { x: offsetX + (maxW + nW) / 2, y: offsetY };
    botRight = { x: offsetX + (maxW + sW) / 2, y: offsetY + eH };
    botLeft = { x: offsetX + (maxW - sW) / 2, y: offsetY + wH };

    drawW = maxW;
    drawH = maxH;

    plotPoly.setAttribute('points', `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${botRight.x},${botRight.y} ${botLeft.x},${botLeft.y}`);

    // Dimension lines for Irregular Plot
    const dimY = offsetY + maxH + 35;
    document.getElementById('dimWLine').setAttribute('x1', offsetX);
    document.getElementById('dimWLine').setAttribute('y1', dimY);
    document.getElementById('dimWLine').setAttribute('x2', offsetX + maxW);
    document.getElementById('dimWLine').setAttribute('y2', dimY);
    document.getElementById('dimWidth').setAttribute('x', offsetX + maxW / 2);
    document.getElementById('dimWidth').setAttribute('y', dimY + 15);
    document.getElementById('dimWidth').textContent = formatFeetInches(Math.max(sideN, sideS));

    const dimX = offsetX + maxW + 35;
    document.getElementById('dimLLine').setAttribute('x1', dimX);
    document.getElementById('dimLLine').setAttribute('y1', offsetY);
    document.getElementById('dimLLine').setAttribute('x2', dimX);
    document.getElementById('dimLLine').setAttribute('y2', offsetY + maxH);
    document.getElementById('dimLength').setAttribute('x', dimX + 16);
    document.getElementById('dimLength').setAttribute('y', offsetY + maxH / 2);
    document.getElementById('dimLength').setAttribute('transform', `rotate(-90, ${dimX + 16}, ${offsetY + maxH / 2})`);
    document.getElementById('dimLength').textContent = formatFeetInches(Math.max(sideE, sideW));

  } else {
    plotRect.style.display = 'block';
    plotPoly.style.display = 'none';

    drawW = width * ratio;
    drawH = length * ratio;
    offsetX = 180 + (maxDrawW - drawW) / 2;
    offsetY = 100 + (maxDrawH - drawH) / 2;

    plotRect.setAttribute('x', offsetX);
    plotRect.setAttribute('y', offsetY);
    plotRect.setAttribute('width', drawW);
    plotRect.setAttribute('height', drawH);

    topLeft = { x: offsetX, y: offsetY };
    topRight = { x: offsetX + drawW, y: offsetY };
    botRight = { x: offsetX + drawW, y: offsetY + drawH };
    botLeft = { x: offsetX, y: offsetY + drawH };

    // Dimension lines (Positioned cleanly on Layer 3 below & to the right)
    const dimY = offsetY + drawH + 35;
    document.getElementById('dimWLine').setAttribute('x1', offsetX);
    document.getElementById('dimWLine').setAttribute('y1', dimY);
    document.getElementById('dimWLine').setAttribute('x2', offsetX + drawW);
    document.getElementById('dimWLine').setAttribute('y2', dimY);
    document.getElementById('dimWidth').setAttribute('x', offsetX + drawW / 2);
    document.getElementById('dimWidth').setAttribute('y', dimY + 15);
    document.getElementById('dimWidth').textContent = formatFeetInches(width);

    const dimX = offsetX + drawW + 35;
    document.getElementById('dimLLine').setAttribute('x1', dimX);
    document.getElementById('dimLLine').setAttribute('y1', offsetY);
    document.getElementById('dimLLine').setAttribute('x2', dimX);
    document.getElementById('dimLLine').setAttribute('y2', offsetY + drawH);
    document.getElementById('dimLength').setAttribute('x', dimX + 16);
    document.getElementById('dimLength').setAttribute('y', offsetY + drawH / 2);
    document.getElementById('dimLength').setAttribute('transform', `rotate(-90, ${dimX + 16}, ${offsetY + drawH / 2})`);
    document.getElementById('dimLength').textContent = formatFeetInches(length);
  }

  // 8. Layer 2: Render Boundary Labels
  document.getElementById('labelSideN').style.display = 'block';
  document.getElementById('labelSideS').style.display = 'block';
  document.getElementById('labelSideE').style.display = 'block';
  document.getElementById('labelSideW').style.display = 'block';

  document.getElementById('labelSideN').setAttribute('x', offsetX + drawW / 2);
  document.getElementById('labelSideN').setAttribute('y', offsetY - 12);
  document.getElementById('labelSideN').textContent = 'NORTH: ' + formatFeetInches(sideN);

  document.getElementById('labelSideS').setAttribute('x', offsetX + drawW / 2);
  document.getElementById('labelSideS').setAttribute('y', offsetY + drawH + 16);
  document.getElementById('labelSideS').textContent = 'SOUTH: ' + formatFeetInches(sideS);

  document.getElementById('labelSideE').setAttribute('x', offsetX + drawW + 16);
  document.getElementById('labelSideE').setAttribute('y', offsetY + drawH / 2);
  document.getElementById('labelSideE').setAttribute('transform', `rotate(-90, ${offsetX + drawW + 16}, ${offsetY + drawH / 2})`);
  document.getElementById('labelSideE').textContent = 'EAST: ' + formatFeetInches(sideE);

  document.getElementById('labelSideW').setAttribute('x', offsetX - 16);
  document.getElementById('labelSideW').setAttribute('y', offsetY + drawH / 2);
  document.getElementById('labelSideW').setAttribute('transform', `rotate(-90, ${offsetX - 16}, ${offsetY + drawH / 2})`);
  document.getElementById('labelSideW').textContent = 'WEST: ' + formatFeetInches(sideW);

  // Map setbacks to Cardinal Directions (Top, Bottom, Left, Right) based on Road Facing Direction
  let sbTop = setbackF, sbBottom = setbackR, sbLeft = setbackL, sbRight = setbackRt;
  let labelN = `Front Setback: ${formatFeetInches(setbackF)}`;
  let labelS = `Rear Setback: ${formatFeetInches(setbackR)}`;
  let labelE = `Right Setback: ${formatFeetInches(setbackRt)}`;
  let labelW = `Left Setback: ${formatFeetInches(setbackL)}`;

  const rfDir = (roadFace || 'north').toLowerCase();
  if (rfDir === 'east') {
    sbTop = setbackL; sbBottom = setbackRt; sbLeft = setbackR; sbRight = setbackF;
    labelN = `Left Setback: ${formatFeetInches(setbackL)}`;
    labelS = `Right Setback: ${formatFeetInches(setbackRt)}`;
    labelE = `Front Setback: ${formatFeetInches(setbackF)}`;
    labelW = `Rear Setback: ${formatFeetInches(setbackR)}`;
  } else if (rfDir === 'west') {
    sbTop = setbackRt; sbBottom = setbackL; sbLeft = setbackF; sbRight = setbackR;
    labelN = `Right Setback: ${formatFeetInches(setbackRt)}`;
    labelS = `Left Setback: ${formatFeetInches(setbackL)}`;
    labelE = `Rear Setback: ${formatFeetInches(setbackR)}`;
    labelW = `Front Setback: ${formatFeetInches(setbackF)}`;
  } else if (rfDir === 'south') {
    sbTop = setbackR; sbBottom = setbackF; sbLeft = setbackRt; sbRight = setbackL;
    labelN = `Rear Setback: ${formatFeetInches(setbackR)}`;
    labelS = `Front Setback: ${formatFeetInches(setbackF)}`;
    labelE = `Left Setback: ${formatFeetInches(setbackL)}`;
    labelW = `Right Setback: ${formatFeetInches(setbackRt)}`;
  }

  // Check Building Type (Vacant Plot vs Constructed Structure)
  const bldgType = (document.getElementById('bldgType')?.value || '').trim();
  const isExplicitVacant = bldgType === 'Vacant Plot' || bldgType === 'vacant';
  const hasBuilding = !isExplicitVacant && (bldgW > 0 || bldgL > 0 || setbackF > 0 || setbackR > 0 || setbackL > 0 || setbackRt > 0);

  const setbackRect = document.getElementById('setbackRect');
  const bldgTitle = document.getElementById('bldgTitle');
  const bldgDimText = document.getElementById('bldgDimText');
  const plotNoCenterEl = document.getElementById('plotNoCenterText');

  if (!hasBuilding) {
    // Vacant Plot / Open Site: Zero setbacks, zero building footprint
    if (bldgRect) bldgRect.style.display = 'none';
    if (setbackRect) setbackRect.style.display = 'none';

    document.getElementById('setbackN').textContent = '';
    document.getElementById('setbackS').textContent = '';
    document.getElementById('setbackE').textContent = '';
    document.getElementById('setbackW').textContent = '';

    if (displayPlotNo && plotNoCenterEl) {
      plotNoCenterEl.style.display = 'block';
      plotNoCenterEl.setAttribute('x', offsetX + drawW / 2);
      plotNoCenterEl.setAttribute('y', offsetY + drawH / 2 - 14);
      plotNoCenterEl.setAttribute('font-size', '13');
      plotNoCenterEl.textContent = displayPlotNo;

      if (bldgTitle) {
        bldgTitle.setAttribute('x', offsetX + drawW / 2);
        bldgTitle.setAttribute('y', offsetY + drawH / 2 + 3);
        bldgTitle.setAttribute('font-size', '11');
        bldgTitle.textContent = 'VACANT PLOT';
      }
      if (bldgDimText) {
        bldgDimText.setAttribute('x', offsetX + drawW / 2);
        bldgDimText.setAttribute('y', offsetY + drawH / 2 + 18);
        bldgDimText.setAttribute('font-size', '9.5');
        bldgDimText.textContent = `(OPEN SITE: ${areaSqFt} SQ.FT)`;
      }
    } else {
      if (plotNoCenterEl) {
        plotNoCenterEl.style.display = 'none';
        plotNoCenterEl.textContent = '';
      }
      if (bldgTitle) {
        bldgTitle.setAttribute('x', offsetX + drawW / 2);
        bldgTitle.setAttribute('y', offsetY + drawH / 2 - 4);
        bldgTitle.setAttribute('font-size', '13');
        bldgTitle.textContent = 'VACANT PLOT';
      }
      if (bldgDimText) {
        bldgDimText.setAttribute('x', offsetX + drawW / 2);
        bldgDimText.setAttribute('y', offsetY + drawH / 2 + 14);
        bldgDimText.setAttribute('font-size', '11');
        bldgDimText.textContent = `(OPEN SITE: ${areaSqFt} SQ.FT)`;
      }
    }
  } else {
    // Constructed Structure: Render Blue Hatched Footprint strictly bounded inside plot
    if (bldgRect) bldgRect.style.display = 'block';
    if (setbackRect) setbackRect.style.display = 'block';

    const bldgOrient = document.getElementById('bldgOrientation')?.value || 'auto';
    let bldgRenderW = bldgW;
    let bldgRenderH = bldgL;

    // Available drawing dimensions on canvas in feet
    const availCanvasW_ft = drawW / ratio;
    const availCanvasH_ft = drawH / ratio;

    if (bldgOrient === 'horizontal') {
      bldgRenderW = Math.max(bldgW, bldgL);
      bldgRenderH = Math.min(bldgW, bldgL);
    } else if (bldgOrient === 'vertical') {
      bldgRenderW = Math.min(bldgW, bldgL);
      bldgRenderH = Math.max(bldgW, bldgL);
    } else {
      // Auto-fit: align longer building dimension with the longer canvas span
      if (availCanvasW_ft > availCanvasH_ft) {
        bldgRenderW = Math.max(bldgW, bldgL);
        bldgRenderH = Math.min(bldgW, bldgL);
      } else {
        bldgRenderW = Math.min(bldgW, bldgL);
        bldgRenderH = Math.max(bldgW, bldgL);
      }
    }

    // Bound building drawing size so it never exceeds available space inside plot boundaries on screen
    const maxAllowedDrawW_ft = Math.max(0, availCanvasW_ft - sbLeft - sbRight);
    const maxAllowedDrawH_ft = Math.max(0, availCanvasH_ft - sbTop - sbBottom);

    const bldgDrawW = Math.max(15, Math.min(bldgRenderW, maxAllowedDrawW_ft > 0 ? maxAllowedDrawW_ft : availCanvasW_ft) * ratio);
    const bldgDrawH = Math.max(15, Math.min(bldgRenderH, maxAllowedDrawH_ft > 0 ? maxAllowedDrawH_ft : availCanvasH_ft) * ratio);
    const bldgX = offsetX + (sbLeft * ratio);
    const bldgY = offsetY + (sbTop * ratio);

    if (setbackRect) {
      setbackRect.setAttribute('x', bldgX);
      setbackRect.setAttribute('y', bldgY);
      setbackRect.setAttribute('width', bldgDrawW);
      setbackRect.setAttribute('height', bldgDrawH);
    }

    bldgRect.setAttribute('x', bldgX);
    bldgRect.setAttribute('y', bldgY);
    bldgRect.setAttribute('width', bldgDrawW);
    bldgRect.setAttribute('height', bldgDrawH);

    // Front / Top Setback (North Side) - Only render if positive
    if (sbTop > 0) {
      document.getElementById('setbackN').setAttribute('x', offsetX + drawW / 2);
      document.getElementById('setbackN').setAttribute('y', offsetY + (bldgY - offsetY) / 2 + 4);
      document.getElementById('setbackN').textContent = labelN;
    } else {
      document.getElementById('setbackN').textContent = '';
    }

    // Rear / Bottom Setback (South Side) - Only render if positive
    if (sbBottom > 0) {
      document.getElementById('setbackS').setAttribute('x', offsetX + drawW / 2);
      document.getElementById('setbackS').setAttribute('y', (offsetY + drawH) - (offsetY + drawH - (bldgY + bldgDrawH)) / 2 + 4);
      document.getElementById('setbackS').textContent = labelS;
    } else {
      document.getElementById('setbackS').textContent = '';
    }

    // Right Setback (East Side) - Only render if positive
    if (sbRight > 0) {
      const sbEastX = (offsetX + drawW) - (offsetX + drawW - (bldgX + bldgDrawW)) / 2;
      document.getElementById('setbackE').setAttribute('x', sbEastX);
      document.getElementById('setbackE').setAttribute('y', offsetY + drawH / 2);
      document.getElementById('setbackE').setAttribute('transform', `rotate(-90, ${sbEastX}, ${offsetY + drawH / 2})`);
      document.getElementById('setbackE').textContent = labelE;
    } else {
      document.getElementById('setbackE').textContent = '';
    }

    // Left Setback (West Side) - Only render if positive
    if (sbLeft > 0) {
      const sbWestX = offsetX + (bldgX - offsetX) / 2;
      document.getElementById('setbackW').setAttribute('x', sbWestX);
      document.getElementById('setbackW').setAttribute('y', offsetY + drawH / 2);
      document.getElementById('setbackW').setAttribute('transform', `rotate(-90, ${sbWestX}, ${offsetY + drawH / 2})`);
      document.getElementById('setbackW').textContent = labelW;
    } else {
      document.getElementById('setbackW').textContent = '';
    }

    // Interior Building Footprint Text
    if (bldgTitle && bldgDimText) {
      const isNarrow = Math.min(sideN, sideS) < 25;
      if (displayPlotNo && plotNoCenterEl) {
        plotNoCenterEl.style.display = 'block';
        plotNoCenterEl.setAttribute('x', bldgX + bldgDrawW / 2);
        plotNoCenterEl.setAttribute('y', bldgY + bldgDrawH / 2 - 15);
        plotNoCenterEl.setAttribute('font-size', isNarrow ? '9' : '11');
        plotNoCenterEl.textContent = displayPlotNo;

        bldgTitle.setAttribute('x', bldgX + bldgDrawW / 2);
        bldgTitle.setAttribute('y', bldgY + bldgDrawH / 2 + 1);
        bldgTitle.setAttribute('font-size', isNarrow ? '8.5' : '10.5');
        bldgTitle.textContent = (bldgType && bldgType !== 'Residential' ? bldgType.toUpperCase() : 'EXISTING BUILDING');

        bldgDimText.setAttribute('x', bldgX + bldgDrawW / 2);
        bldgDimText.setAttribute('y', bldgY + bldgDrawH / 2 + 16);
        bldgDimText.setAttribute('font-size', isNarrow ? '8' : '9.5');
        bldgDimText.textContent = `${formatFeetInches(bldgRenderW)} × ${formatFeetInches(bldgRenderH)}`;
      } else {
        if (plotNoCenterEl) {
          plotNoCenterEl.style.display = 'none';
          plotNoCenterEl.textContent = '';
        }
        bldgTitle.setAttribute('x', bldgX + bldgDrawW / 2);
        bldgTitle.setAttribute('y', bldgY + bldgDrawH / 2 - 6);
        bldgTitle.setAttribute('font-size', isNarrow ? '10' : '13');
        bldgTitle.textContent = (bldgType && bldgType !== 'Residential' ? bldgType.toUpperCase() : 'EXISTING BUILDING');

        bldgDimText.setAttribute('x', bldgX + bldgDrawW / 2);
        bldgDimText.setAttribute('y', bldgY + bldgDrawH / 2 + 10);
        bldgDimText.setAttribute('font-size', isNarrow ? '9' : '11');
        bldgDimText.textContent = `${formatFeetInches(bldgRenderW)} × ${formatFeetInches(bldgRenderH)}`;
      }
    }
  }

  // 9. Render Corner Splay for 2-side Corner Plots (Any 2 intersecting roads)
  const splayPoly = document.getElementById('splayPoly');
  const hasNorthRoad = boundaries.North.type === 'road';
  const hasSouthRoad = boundaries.South.type === 'road';
  const hasEastRoad = boundaries.East.type === 'road';
  const hasWestRoad = boundaries.West.type === 'road';

  let cornerPoints = null;
  const splaySize = 5 * ratio; // 5ft statutory municipal splay

  if (hasNorthRoad && hasEastRoad) {
    // Top-Right Corner (North & East)
    cornerPoints = `${topRight.x - splaySize},${topRight.y} ${topRight.x},${topRight.y} ${topRight.x},${topRight.y + splaySize}`;
  } else if (hasNorthRoad && hasWestRoad) {
    // Top-Left Corner (North & West)
    cornerPoints = `${topLeft.x + splaySize},${topLeft.y} ${topLeft.x},${topLeft.y} ${topLeft.x},${topLeft.y + splaySize}`;
  } else if (hasSouthRoad && hasEastRoad) {
    // Bottom-Right Corner (South & East)
    cornerPoints = `${botRight.x - splaySize},${botRight.y} ${botRight.x},${botRight.y} ${botRight.x},${botRight.y - splaySize}`;
  } else if (hasSouthRoad && hasWestRoad) {
    // Bottom-Left Corner (South & West)
    cornerPoints = `${botLeft.x + splaySize},${botLeft.y} ${botLeft.x},${botLeft.y} ${botLeft.x},${botLeft.y - splaySize}`;
  }

  if (cornerPoints && splayPoly) {
    splayPoly.setAttribute('points', cornerPoints);
    splayPoly.style.display = 'block';
  } else if (splayPoly) {
    splayPoly.style.display = 'none';
  }

  // 10. Render RMP-2015 Road Widening Strip Overlay (Oriented to Active Road)
  const roadWideningRect = document.getElementById('roadWideningRect');
  const roadWideningText = document.getElementById('roadWideningText');
  if (isRoadWidening && stripW > 0 && roadWideningRect && roadWideningText) {
    const stripPx = stripW * ratio;
    roadWideningRect.style.display = 'block';
    roadWideningText.style.display = 'block';

    const rf = (roadFace || 'north').toLowerCase();
    if (rf === 'north') {
      roadWideningRect.setAttribute('x', topLeft.x);
      roadWideningRect.setAttribute('y', topLeft.y);
      roadWideningRect.setAttribute('width', drawW);
      roadWideningRect.setAttribute('height', stripPx);
      roadWideningText.setAttribute('x', topLeft.x + drawW / 2);
      roadWideningText.setAttribute('y', topLeft.y + stripPx / 2 + 3);
      roadWideningText.removeAttribute('transform');
    } else if (rf === 'east') {
      roadWideningRect.setAttribute('x', topRight.x - stripPx);
      roadWideningRect.setAttribute('y', topRight.y);
      roadWideningRect.setAttribute('width', stripPx);
      roadWideningRect.setAttribute('height', drawH);
      const textX = topRight.x - stripPx / 2;
      const textY = topRight.y + drawH / 2;
      roadWideningText.setAttribute('x', textX);
      roadWideningText.setAttribute('y', textY);
      roadWideningText.setAttribute('transform', `rotate(-90, ${textX}, ${textY})`);
    } else if (rf === 'west') {
      roadWideningRect.setAttribute('x', topLeft.x);
      roadWideningRect.setAttribute('y', topLeft.y);
      roadWideningRect.setAttribute('width', stripPx);
      roadWideningRect.setAttribute('height', drawH);
      const textX = topLeft.x + stripPx / 2;
      const textY = topLeft.y + drawH / 2;
      roadWideningText.setAttribute('x', textX);
      roadWideningText.setAttribute('y', textY);
      roadWideningText.setAttribute('transform', `rotate(-90, ${textX}, ${textY})`);
    } else {
      // South (default)
      roadWideningRect.setAttribute('x', botLeft.x);
      roadWideningRect.setAttribute('y', botLeft.y - stripPx);
      roadWideningRect.setAttribute('width', drawW);
      roadWideningRect.setAttribute('height', stripPx);
      roadWideningText.setAttribute('x', botLeft.x + drawW / 2);
      roadWideningText.setAttribute('y', botLeft.y - stripPx / 2 + 3);
      roadWideningText.removeAttribute('transform');
    }
    roadWideningText.textContent = `ROAD WIDENING STRIP (${formatFeetInches(stripW)})`;
  } else if (roadWideningRect && roadWideningText) {
    roadWideningRect.style.display = 'none';
    roadWideningText.style.display = 'none';
  }

  // 11. Render Drain / Lake Buffer Zone Overlay (Oriented to Matching Drain Boundary)
  const bufferRect = document.getElementById('bufferRect');
  const bufferText = document.getElementById('bufferText');
  if (isBuffer && bufW > 0 && bufferRect && bufferText) {
    const bufPx = bufW * ratio;
    bufferRect.style.display = 'block';
    bufferText.style.display = 'block';

    const hasNorthDrain = boundaries.North.type === 'drain' || boundaries.North.type === 'lake';
    const hasEastDrain = boundaries.East.type === 'drain' || boundaries.East.type === 'lake';
    const hasWestDrain = boundaries.West.type === 'drain' || boundaries.West.type === 'lake';

    if (hasNorthDrain) {
      bufferRect.setAttribute('x', topLeft.x);
      bufferRect.setAttribute('y', topLeft.y);
      bufferRect.setAttribute('width', drawW);
      bufferRect.setAttribute('height', bufPx);
      bufferText.setAttribute('x', topLeft.x + drawW / 2);
      bufferText.setAttribute('y', topLeft.y + bufPx / 2 + 3);
      bufferText.removeAttribute('transform');
    } else if (hasEastDrain) {
      bufferRect.setAttribute('x', topRight.x - bufPx);
      bufferRect.setAttribute('y', topRight.y);
      bufferRect.setAttribute('width', bufPx);
      bufferRect.setAttribute('height', drawH);
      const tX = topRight.x - bufPx / 2;
      const tY = topRight.y + drawH / 2;
      bufferText.setAttribute('x', tX);
      bufferText.setAttribute('y', tY);
      bufferText.setAttribute('transform', `rotate(-90, ${tX}, ${tY})`);
    } else if (hasWestDrain) {
      bufferRect.setAttribute('x', topLeft.x);
      bufferRect.setAttribute('y', topLeft.y);
      bufferRect.setAttribute('width', bufPx);
      bufferRect.setAttribute('height', drawH);
      const tX = topLeft.x + bufPx / 2;
      const tY = topLeft.y + drawH / 2;
      bufferText.setAttribute('x', tX);
      bufferText.setAttribute('y', tY);
      bufferText.setAttribute('transform', `rotate(-90, ${tX}, ${tY})`);
    } else {
      // South (default)
      bufferRect.setAttribute('x', botLeft.x);
      bufferRect.setAttribute('y', botLeft.y - bufPx);
      bufferRect.setAttribute('width', drawW);
      bufferRect.setAttribute('height', bufPx);
      bufferText.setAttribute('x', botLeft.x + drawW / 2);
      bufferText.setAttribute('y', botLeft.y - bufPx / 2 + 3);
      bufferText.removeAttribute('transform');
    }
    bufferText.textContent = `NALA / LAKE BUFFER ZONE (${formatFeetInches(bufW)})`;
  } else if (bufferRect && bufferText) {
    bufferRect.style.display = 'none';
    bufferText.style.display = 'none';
  }

  // 12. Multi-Road Render Handling (Layer 4 Outermost Position with Generous Margins)
  renderRoadOrLabel('North', boundaries.North, topLeft.x, topLeft.y - 65, (topRight.x - topLeft.x), 32, 'top', offsetX + drawW / 2, offsetY - 72);
  renderRoadOrLabel('South', boundaries.South, botLeft.x, botLeft.y + 68, (botRight.x - botLeft.x), 32, 'bottom', offsetX + drawW / 2, botLeft.y + 112);
  renderRoadOrLabel('East', boundaries.East, topRight.x + 68, topRight.y, 32, (botRight.y - topRight.y), 'right', topRight.x + 115, offsetY + drawH / 2);
  renderRoadOrLabel('West', boundaries.West, topLeft.x - 85, topLeft.y, 32, (botLeft.y - topLeft.y), 'left', topLeft.x - 98, offsetY + drawH / 2);

  /**
   * Dynamically renders road rectangle or adjacency label with precise non-overlapping coordinates.
   */
  function renderRoadOrLabel(dir, info, x, y, w, h, position, labelX, labelY) {
    const roadEl = document.getElementById(`roadRect${dir}`) || createRoadRect(dir);
    const clEl = document.getElementById(`roadCL${dir}`) || createRoadCL(dir);
    const labelEl = document.getElementById(`adj${dir.charAt(0)}`);

    if (info.type === 'road') {
      roadEl.style.display = 'block';
      roadEl.setAttribute('x', x);
      roadEl.setAttribute('y', y);
      roadEl.setAttribute('width', Math.max(w, 20));
      roadEl.setAttribute('height', Math.max(h, 20));

      clEl.style.display = 'block';
      if (position === 'top' || position === 'bottom') {
        const midY = y + h / 2;
        clEl.setAttribute('x1', x);
        clEl.setAttribute('y1', midY);
        clEl.setAttribute('x2', x + w);
        clEl.setAttribute('y2', midY);
      } else {
        const midX = x + w / 2;
        clEl.setAttribute('x1', midX);
        clEl.setAttribute('y1', y);
        clEl.setAttribute('x2', midX);
        clEl.setAttribute('y2', y + h);
      }

      if (labelEl) {
        labelEl.setAttribute('x', labelX);
        labelEl.setAttribute('y', labelY);
        if (position === 'left' || position === 'right') {
          labelEl.setAttribute('transform', `rotate(-90, ${labelX}, ${labelY})`);
        } else {
          labelEl.removeAttribute('transform');
        }
        labelEl.textContent = info.text;
      }
    } else {
      roadEl.style.display = 'none';
      clEl.style.display = 'none';
      if (labelEl) {
        labelEl.setAttribute('x', labelX);
        labelEl.setAttribute('y', labelY);
        if (position === 'left' || position === 'right') {
          labelEl.setAttribute('transform', `rotate(-90, ${labelX}, ${labelY})`);
        } else {
          labelEl.removeAttribute('transform');
        }
        labelEl.textContent = info.text;
      }
    }
  }

  function createRoadRect(dir) {
    const svg = document.getElementById('plotSvg');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', `roadRect${dir}`);
    rect.setAttribute('fill', '#e2e8f0');
    rect.setAttribute('stroke', '#94a3b8');
    rect.setAttribute('stroke-width', '1');
    svg.appendChild(rect);
    return rect;
  }

  function createRoadCL(dir) {
    const svg = document.getElementById('plotSvg');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', `roadCL${dir}`);
    line.setAttribute('stroke', '#64748b');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '12,3,3,3');
    svg.appendChild(line);
    return line;
  }

  document.getElementById('scaleText').textContent = "Scale: " + scale;

  updateKeyPlan();

  if (typeof toggleSampleWatermark === 'function') {
    toggleSampleWatermark();
  }

  if (typeof toggleLegendSheetPage === 'function') {
    toggleLegendSheetPage();
  }

  const actionBar = document.getElementById('actionBar');
  if (actionBar) {
    actionBar.style.display = 'block';
  }

  document.getElementById('planOutput').style.display = 'block';
  document.getElementById('planOutput').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Parses raw GPS coordinate string into numeric latitude and longitude.
 * Supports decimal (12.9716, 77.5946), degrees (12.9716° N, 77.5946° E), and space-separated formats.
 * 
 * @function parseCoordinates
 * @param {string} str - Raw coordinate string.
 * @returns {{lat: number, lon: number}|null} Parsed coordinate object or null.
 */
function parseCoordinates(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();

  // 1. Google Maps URL or query parameter extraction
  const urlMatch = trimmed.match(/[@=](-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lon = parseFloat(urlMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // 2. DMS parsing (Degrees Minutes Seconds, e.g., 12°58'17.8"N 77°35'40.4"E)
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSEWnsew])/g;
  const dmsMatches = [...trimmed.matchAll(dmsRegex)];
  if (dmsMatches.length >= 2) {
    const parseDmsPart = (m) => {
      const deg = parseFloat(m[1]) || 0;
      const min = parseFloat(m[2]) || 0;
      const sec = parseFloat(m[3]) || 0;
      const dir = m[4].toUpperCase();
      let val = deg + (min / 60) + (sec / 3600);
      if (dir === 'S' || dir === 'W') val = -val;
      return { val, dir };
    };
    const p1 = parseDmsPart(dmsMatches[0]);
    const p2 = parseDmsPart(dmsMatches[1]);
    const lat = (p1.dir === 'N' || p1.dir === 'S') ? p1.val : p2.val;
    const lon = (p1.dir === 'E' || p1.dir === 'W') ? p1.val : p2.val;
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // 3. Decimal Degrees with Optional Direction (e.g. 43.4418 N, 80.5115 W or 12.9716, 77.5946)
  const decDirRegex = /(-?\d+(?:\.\d+)?)\s*([°\s]*([NSEWnsew]))?/g;
  const decMatches = [...trimmed.matchAll(decDirRegex)].filter(m => m[1] !== '');
  if (decMatches.length >= 2) {
    let lat = parseFloat(decMatches[0][1]);
    let lon = parseFloat(decMatches[1][1]);
    const dir1 = decMatches[0][3] ? decMatches[0][3].toUpperCase() : null;
    const dir2 = decMatches[1][3] ? decMatches[1][3].toUpperCase() : null;

    if (dir1 === 'S' && lat > 0) lat = -lat;
    if (dir1 === 'W' && lat > 0) lat = -lat;
    if (dir2 === 'S' && lon > 0) lon = -lon;
    if (dir2 === 'W' && lon > 0) lon = -lon;

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

/**
 * Calculates Slippy map tile coordinate numbers from latitude and longitude.
 * @function getTileCoords
 * @param {number} lat - Latitude in degrees.
 * @param {number} lon - Longitude in degrees.
 * @param {number} [zoom=16] - Map zoom level.
 * @returns {{tileX: number, tileY: number}} Tile numbers.
 */
function getTileCoords(lat, lon, zoom = 16) {
  const n = Math.pow(2, zoom);
  const x = (lon + 180) / 360 * n;
  const latRad = lat * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  return {
    tileX: Math.floor(x),
    tileY: Math.floor(y)
  };
}
/**
 * Renders a perfectly centered multi-tile slippy map onto an offscreen canvas
 * so the GPS coordinate is guaranteed to sit precisely in the center of the image at all zoom levels.
 * 
 * @function renderCenteredKeyPlanMap
 * @param {number} lat - Latitude in decimal degrees.
 * @param {number} lon - Longitude in decimal degrees.
 * @param {number} zoom - Zoom level (14 to 18).
 * @param {number} width - Output image width in pixels.
 * @param {number} height - Output image height in pixels.
 * @param {Function} callback - Callback(err, dataUrl).
 * @returns {void}
 */
function renderCenteredKeyPlanMap(lat, lon, zoom, width, height, callback) {
  const n = Math.pow(2, zoom);
  const worldX = (lon + 180) / 360 * n * 256;
  const latRad = lat * Math.PI / 180;
  const worldY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n * 256;

  const minX = worldX - width / 2;
  const minY = worldY - height / 2;
  const maxX = worldX + width / 2;
  const maxY = worldY + height / 2;

  const minTileX = Math.floor(minX / 256);
  const maxTileX = Math.floor(maxX / 256);
  const minTileY = Math.floor(minY / 256);
  const maxTileY = Math.floor(maxY / 256);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const tiles = [];
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      tiles.push({ tx, ty });
    }
  }

  let loaded = 0;
  let failed = false;

  tiles.forEach(({ tx, ty }) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (failed) return;
      const destX = tx * 256 - minX;
      const destY = ty * 256 - minY;
      ctx.drawImage(img, destX, destY, 256, 256);
      loaded++;
      if (loaded === tiles.length) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          callback(null, dataUrl);
        } catch (e) {
          callback(e);
        }
      }
    };
    img.onerror = () => {
      if (!failed) {
        failed = true;
        callback(new Error('Tile load error'));
      }
    };
    img.src = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`;
  });
}

/**
 * Dynamically renders the Key Plan (Locational Sketch) in Panel 2 based on actual road facing direction,
 * road name, road width, ward location, and GPS coordinates.
 * 
 * @function updateKeyPlan
 * @returns {void}
 */
function updateKeyPlan() {
  const svg = document.getElementById('keyPlanSvg');
  const mapWrapper = document.getElementById('keyPlanMapWrapper');
  const mapImg = document.getElementById('keyPlanMapImg');
  const gpsBadge = document.getElementById('keyPlanGpsBadge');

  const rawGps = (document.getElementById('gpsCoords')?.value || '').trim();
  const coords = parseCoordinates(rawGps);

  const headerEl = document.getElementById('keyPlanHeader');

  if (coords && mapWrapper && mapImg && gpsBadge) {
    const lat = coords.lat;
    const lon = coords.lon;
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    const formattedText = `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;

    const zoom = parseInt(document.getElementById('gpsZoom')?.value, 10) || 16;
    const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)},${zoom}`;

    if (mapImg.getAttribute('data-loaded-coords') !== cacheKey) {
      mapImg.setAttribute('data-loaded-coords', cacheKey);
      renderCenteredKeyPlanMap(lat, lon, zoom, 400, 200, (err, dataUrl) => {
        if (err) {
          if (typeof onKeyPlanMapError === 'function') onKeyPlanMapError();
          return;
        }
        mapImg.src = dataUrl;
        const step2PreviewImg = document.getElementById('step2MapPreviewImg');
        if (step2PreviewImg) {
          step2PreviewImg.setAttribute('data-loaded-coords', cacheKey);
          step2PreviewImg.style.display = 'block';
          step2PreviewImg.src = dataUrl;
        }
      });
    }

    gpsBadge.textContent = `📍 GPS: ${formattedText}`;
    mapWrapper.style.display = 'block';
    if (svg) svg.style.display = 'none';
    if (headerEl) headerEl.textContent = '2. KEY PLAN (GPS LOCATION MAP)';
    return;
  }

  // Fallback: If no GPS coordinates or map is offline, show CAD schematic vector SVG
  if (headerEl) headerEl.textContent = '2. KEY PLAN (LOCATIONAL SKETCH)';
  if (mapWrapper) mapWrapper.style.display = 'none';
  if (!svg) return;
  svg.style.display = 'block';

  const roadFace = (document.getElementById('roadFacing')?.value || 'north').toLowerCase();
  const roadWidthFt = document.getElementById('roadWidth_ft')?.value || '';
  const roadWidthIn = document.getElementById('roadWidth_in')?.value || '';
  const wardName = document.getElementById('wardName')?.value || 'Locality';
  const surveyNo = document.getElementById('surveyNo')?.value || '';

  let roadName = '';
  const capFace = roadFace.charAt(0).toUpperCase() + roadFace.slice(1);
  const typeVal = document.getElementById('type' + capFace)?.value;
  if (typeVal === 'road') {
    roadName = document.getElementById('nameRoad' + capFace)?.value || '';
  }

  let widthLabel = '';
  if (roadWidthFt || roadWidthIn) {
    const rwNum = (parseFloat(roadWidthFt) || 0) + ((parseFloat(roadWidthIn) || 0) / 12);
    const mStr = (rwNum * 0.3048).toFixed(2);
    widthLabel = ` (${roadWidthFt || 0}'${roadWidthIn ? roadWidthIn + '"' : ''} [${mStr}m] WIDE)`;
  }
  const roadTitle = (roadName ? roadName.toUpperCase() : 'ROAD') + widthLabel;

  let html = `
    <rect x="2" y="2" width="176" height="86" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
  `;

  if (roadFace === 'north') {
    html += `
      <rect x="10" y="12" width="160" height="14" fill="#94a3b8" rx="2" />
      <text x="90" y="22" text-anchor="middle" font-size="6.5" fill="#ffffff" font-weight="bold">${roadTitle}</text>
      <rect x="65" y="32" width="50" height="38" fill="url(#bldgHatch)" stroke="#2563eb" stroke-width="1.5" rx="2" />
      <text x="90" y="52" text-anchor="middle" font-size="7.5" fill="#1e3a5f" font-weight="bold">SITE</text>
      <text x="90" y="62" text-anchor="middle" font-size="5.5" fill="#3b82f6">${surveyNo ? 'Sy #' + surveyNo : ''}</text>
    `;
  } else if (roadFace === 'east') {
    html += `
      <rect x="146" y="10" width="14" height="70" fill="#94a3b8" rx="2" />
      <text x="153" y="45" text-anchor="middle" font-size="6.5" fill="#ffffff" font-weight="bold" transform="rotate(90, 153, 45)">${roadTitle}</text>
      <rect x="80" y="25" width="50" height="40" fill="url(#bldgHatch)" stroke="#2563eb" stroke-width="1.5" rx="2" />
      <text x="105" y="46" text-anchor="middle" font-size="7.5" fill="#1e3a5f" font-weight="bold">SITE</text>
      <text x="105" y="56" text-anchor="middle" font-size="5.5" fill="#3b82f6">${surveyNo ? 'Sy #' + surveyNo : ''}</text>
    `;
  } else if (roadFace === 'south') {
    html += `
      <rect x="10" y="64" width="160" height="14" fill="#94a3b8" rx="2" />
      <text x="90" y="74" text-anchor="middle" font-size="6.5" fill="#ffffff" font-weight="bold">${roadTitle}</text>
      <rect x="65" y="20" width="50" height="38" fill="url(#bldgHatch)" stroke="#2563eb" stroke-width="1.5" rx="2" />
      <text x="90" y="40" text-anchor="middle" font-size="7.5" fill="#1e3a5f" font-weight="bold">SITE</text>
      <text x="90" y="50" text-anchor="middle" font-size="5.5" fill="#3b82f6">${surveyNo ? 'Sy #' + surveyNo : ''}</text>
    `;
  } else if (roadFace === 'west') {
    html += `
      <rect x="10" y="10" width="14" height="70" fill="#94a3b8" rx="2" />
      <text x="17" y="45" text-anchor="middle" font-size="6.5" fill="#ffffff" font-weight="bold" transform="rotate(-90, 17, 45)">${roadTitle}</text>
      <rect x="45" y="25" width="50" height="40" fill="url(#bldgHatch)" stroke="#2563eb" stroke-width="1.5" rx="2" />
      <text x="70" y="46" text-anchor="middle" font-size="7.5" fill="#1e3a5f" font-weight="bold">SITE</text>
      <text x="70" y="56" text-anchor="middle" font-size="5.5" fill="#3b82f6">${surveyNo ? 'Sy #' + surveyNo : ''}</text>
    `;
  }

  html += `
    <text x="10" y="82" font-size="5.5" fill="#64748b" font-weight="600">LOC: ${wardName.toUpperCase().slice(0, 24)}</text>
    <path d="M 165,78 L 168,70 L 171,78 L 168,76 Z" fill="#dc2626" />
    <text x="168" y="85" text-anchor="middle" font-size="5.5" fill="#dc2626" font-weight="bold">N</text>
  `;

  svg.innerHTML = html;
}
