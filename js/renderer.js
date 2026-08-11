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
  if (!validate()) return;

  const isOdd = document.getElementById('oddSiteCheck') ? document.getElementById('oddSiteCheck').checked : false;
  const owner = document.getElementById('ownerName').value.trim();
  const epId = document.getElementById('epId').value.trim();
  const pidNo = document.getElementById('pidNo').value.trim();
  const survey = document.getElementById('surveyNo').value.trim();
  const zone = document.getElementById('bbmpZone').value;
  const wardNo = document.getElementById('wardNo').value.trim();
  const wardName = document.getElementById('wardName').value.trim();
  const address = document.getElementById('address').value.trim();
  const areaSqFt = parseFloat(document.getElementById('plotArea').value) || 0;
  const roadW = parseFloat(document.getElementById('roadWidth').value) || 0;
  const roadFace = document.getElementById('roadFacing').value;
  const scale = document.getElementById('scale').value || '1:100';

  // Read Custom Building Setback Values (ft)
  const setbackF = parseFloat(document.getElementById('setbackFront').value) || 0;
  const setbackR = parseFloat(document.getElementById('setbackRear').value) || 0;
  const setbackL = parseFloat(document.getElementById('setbackLeft').value) || 0;
  const setbackRt = parseFloat(document.getElementById('setbackRight').value) || 0;

  let bldgW = parseFloat(document.getElementById('bldgWidth').value) || 0;
  let bldgL = parseFloat(document.getElementById('bldgLength').value) || 0;

  // Metadata & Document Details
  const adlrNo = document.getElementById('adlrNo').value.trim() || 'N/A';
  const dcOrderNo = document.getElementById('dcOrderNo').value.trim() || 'N/A';
  const dcOrderDate = document.getElementById('dcOrderDate').value || 'N/A';
  const dcAuthority = document.getElementById('dcAuthority').value.trim() || 'DC, Bengaluru Urban';

  // Primary Universal 4-Side Cardinal Measurements
  const sideN = parseFloat(document.getElementById('sideNorth').value) || 0;
  const sideS = parseFloat(document.getElementById('sideSouth').value) || 0;
  const sideE = parseFloat(document.getElementById('sideEast').value) || 0;
  const sideW = parseFloat(document.getElementById('sideWest').value) || 0;

  const width = (sideN + sideS) / 2;
  const length = (sideE + sideW) / 2;

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
   * Helper function to extract boundary metadata.
   * @param {string} dir - Direction key ('North', 'South', 'East', 'West').
   * @returns {Object} Boundary information object.
   */
  function getBoundaryInfo(dir) {
    const typeEl = document.getElementById(`type${dir}`);
    const type = typeEl ? typeEl.value : (dir.toLowerCase() === roadFace ? 'road' : 'plot');
    if (type === 'road') {
      const nameEl = document.getElementById(`nameRoad${dir}`);
      const widthEl = document.getElementById(`widthRoad${dir}`);
      const name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : 'PUBLIC ROAD';
      const w = widthEl && widthEl.value ? parseFloat(widthEl.value) : roadW;
      return { type: 'road', text: `${name.toUpperCase()} (${formatFeetInches(w)} WIDE)`, roadW: w, name: name };
    } else {
      const descEl = document.getElementById(`descPlot${dir}`);
      const desc = descEl && descEl.value.trim() ? descEl.value.trim() : getDefaultLabel(type);
      return { type: type, text: `Adjacent: ${desc}` };
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
  document.getElementById('outArea').textContent = `${areaSqFt} sq.ft (${areaSqM} sq.m)`;
  document.getElementById('outSize').textContent = `N:${formatFeetInches(sideN)} × S:${formatFeetInches(sideS)} × E:${formatFeetInches(sideE)} × W:${formatFeetInches(sideW)}` + (isOdd ? ' (Irregular)' : ' (Regular)');
  document.getElementById('outRoadFace').textContent = roadFace.charAt(0).toUpperCase() + roadFace.slice(1);
  document.getElementById('outRoadWidth').textContent = formatFeetInches(roadW) + " Wide";

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
  const ratio = Math.min(maxDrawW / Math.max(sideE, sideW, 1), maxDrawH / Math.max(sideN, sideS, 1));

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

    const bldgDrawW = Math.max(10, Math.min(bldgW * ratio, nW * 0.75));
    const bldgDrawH = Math.max(10, Math.min(bldgL * ratio, eH * 0.75));
    const bldgX = topLeft.x + (setbackL * ratio);
    const bldgY = topLeft.y + (setbackF * ratio);

    bldgRect.setAttribute('x', bldgX);
    bldgRect.setAttribute('y', bldgY);
    bldgRect.setAttribute('width', bldgDrawW);
    bldgRect.setAttribute('height', bldgDrawH);

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

    drawW = (roadFace === 'north' || roadFace === 'south') ? sideN * ratio : sideE * ratio;
    drawH = (roadFace === 'north' || roadFace === 'south') ? sideE * ratio : sideN * ratio;
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

    // Dynamic Footprint Placement from Setbacks
    const bldgDrawW = Math.max(15, (bldgW > 0 ? bldgW : (width - setbackL - setbackRt)) * ratio);
    const bldgDrawH = Math.max(15, (bldgL > 0 ? bldgL : (length - setbackF - setbackR)) * ratio);
    const bldgX = offsetX + (setbackL * ratio);
    const bldgY = offsetY + (setbackF * ratio);

    bldgRect.setAttribute('x', bldgX);
    bldgRect.setAttribute('y', bldgY);
    bldgRect.setAttribute('width', bldgDrawW);
    bldgRect.setAttribute('height', bldgDrawH);

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

  // 8. Clean Architectural Layer 2 Callout Labels (NORTH: 40'-0", EAST: 60'-0", etc.)
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

  // Determine building rendering dimensions (width vs height) based on footprint orientation selection
  const bldgOrient = document.getElementById('bldgOrientation')?.value || 'auto';
  let bldgRenderW = bldgW;
  let bldgRenderH = bldgL;

  // For irregular plots, bound available drawing space by the shorter plot side
  const availSpanW = isOdd ? Math.min(sideN, sideS) : Math.max(sideN, sideS);
  const availSpanH = isOdd ? Math.min(sideE, sideW) : Math.max(sideE, sideW);

  if (bldgOrient === 'horizontal') {
    bldgRenderW = Math.max(bldgW, bldgL);
    bldgRenderH = Math.min(bldgW, bldgL);
  } else if (bldgOrient === 'vertical') {
    bldgRenderW = Math.min(bldgW, bldgL);
    bldgRenderH = Math.max(bldgW, bldgL);
  } else {
    // Auto-fit: If bldgL is larger than available height span, orient long side horizontally
    if (bldgL > availSpanH && bldgL <= availSpanW) {
      bldgRenderW = Math.max(bldgW, bldgL);
      bldgRenderH = Math.min(bldgW, bldgL);
    }
  }

  // Bound building drawing size so it never exceeds available space inside shortest plot side
  const maxAllowedDrawH = Math.max(15, (availSpanH - sbTop - sbBottom) * ratio);
  const maxAllowedDrawW = Math.max(15, (availSpanW - sbLeft - sbRight) * ratio);

  const bldgDrawW = Math.max(15, Math.min(bldgRenderW * ratio, maxAllowedDrawW));
  const bldgDrawH = Math.max(15, Math.min(bldgRenderH * ratio, maxAllowedDrawH));
  const bldgX = offsetX + (sbLeft * ratio);
  const bldgY = offsetY + (sbTop * ratio);

  const setbackRect = document.getElementById('setbackRect');
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

  // Front / Top Setback (North Side)
  document.getElementById('setbackN').setAttribute('x', offsetX + drawW / 2);
  document.getElementById('setbackN').setAttribute('y', offsetY + (bldgY - offsetY) / 2 + 4);
  document.getElementById('setbackN').textContent = labelN;

  // Rear / Bottom Setback (South Side)
  document.getElementById('setbackS').setAttribute('x', offsetX + drawW / 2);
  document.getElementById('setbackS').setAttribute('y', (offsetY + drawH) - (offsetY + drawH - (bldgY + bldgDrawH)) / 2 + 4);
  document.getElementById('setbackS').textContent = labelS;

  // Right Setback (East Side - Rotated -90 deg cleanly inside right setback band)
  const sbEastX = (offsetX + drawW) - (offsetX + drawW - (bldgX + bldgDrawW)) / 2;
  document.getElementById('setbackE').setAttribute('x', sbEastX);
  document.getElementById('setbackE').setAttribute('y', offsetY + drawH / 2);
  document.getElementById('setbackE').setAttribute('transform', `rotate(-90, ${sbEastX}, ${offsetY + drawH / 2})`);
  document.getElementById('setbackE').textContent = labelE;

  // Left Setback (West Side - Rotated -90 deg cleanly inside left setback band)
  const sbWestX = offsetX + (bldgX - offsetX) / 2;
  document.getElementById('setbackW').setAttribute('x', sbWestX);
  document.getElementById('setbackW').setAttribute('y', offsetY + drawH / 2);
  document.getElementById('setbackW').setAttribute('transform', `rotate(-90, ${sbWestX}, ${offsetY + drawH / 2})`);
  document.getElementById('setbackW').textContent = labelW;

  // Interior Building Footprint Text
  const bldgTitle = document.getElementById('bldgTitle');
  const bldgDimText = document.getElementById('bldgDimText');
  if (bldgTitle && bldgDimText) {
    bldgTitle.setAttribute('x', bldgX + bldgDrawW / 2);
    bldgTitle.setAttribute('y', bldgY + bldgDrawH / 2 - 6);
    bldgDimText.setAttribute('x', bldgX + bldgDrawW / 2);
    bldgDimText.setAttribute('y', bldgY + bldgDrawH / 2 + 10);
    bldgDimText.textContent = `${formatFeetInches(bldgRenderW)} × ${formatFeetInches(bldgRenderH)}`;
  }

  // 9. Render Corner Splay for 2-side Corner Plots (e.g. North & East Road access)
  const isCorner = boundaries.North.type === 'road' && boundaries.East.type === 'road';
  const splayPoly = document.getElementById('splayPoly');
  if (isCorner && splayPoly) {
    const splaySize = 5 * ratio; // 5ft corner splay
    const p1 = `${topRight.x - splaySize},${topRight.y}`;
    const p2 = `${topRight.x},${topRight.y + splaySize}`;
    splayPoly.setAttribute('points', `${p1} ${topRight.x},${topRight.y} ${p2}`);
    splayPoly.style.display = 'block';
  } else if (splayPoly) {
    splayPoly.style.display = 'none';
  }

  // 10. Render RMP-2015 Road Widening Strip Overlay
  const roadWideningRect = document.getElementById('roadWideningRect');
  const roadWideningText = document.getElementById('roadWideningText');
  if (isRoadWidening && stripW > 0 && roadWideningRect && roadWideningText) {
    const stripPx = stripW * ratio;
    roadWideningRect.style.display = 'block';
    roadWideningText.style.display = 'block';

    if (roadFace === 'north') {
      roadWideningRect.setAttribute('x', topLeft.x);
      roadWideningRect.setAttribute('y', topLeft.y);
      roadWideningRect.setAttribute('width', drawW);
      roadWideningRect.setAttribute('height', stripPx);
      roadWideningText.setAttribute('x', topLeft.x + drawW / 2);
      roadWideningText.setAttribute('y', topLeft.y + stripPx / 2 + 3);
    } else {
      roadWideningRect.setAttribute('x', topLeft.x);
      roadWideningRect.setAttribute('y', botLeft.y - stripPx);
      roadWideningRect.setAttribute('width', drawW);
      roadWideningRect.setAttribute('height', stripPx);
      roadWideningText.setAttribute('x', topLeft.x + drawW / 2);
      roadWideningText.setAttribute('y', botLeft.y - stripPx / 2 + 3);
    }
    roadWideningText.textContent = `ROAD WIDENING STRIP (${formatFeetInches(stripW)})`;
  } else if (roadWideningRect && roadWideningText) {
    roadWideningRect.style.display = 'none';
    roadWideningText.style.display = 'none';
  }

  // 11. Render Drain / Lake Buffer Zone Overlay
  const bufferRect = document.getElementById('bufferRect');
  const bufferText = document.getElementById('bufferText');
  if (isBuffer && bufW > 0 && bufferRect && bufferText) {
    const bufPx = bufW * ratio;
    bufferRect.style.display = 'block';
    bufferText.style.display = 'block';

    bufferRect.setAttribute('x', botLeft.x);
    bufferRect.setAttribute('y', botLeft.y - bufPx);
    bufferRect.setAttribute('width', drawW);
    bufferRect.setAttribute('height', bufPx);

    bufferText.setAttribute('x', botLeft.x + drawW / 2);
    bufferText.setAttribute('y', botLeft.y - bufPx / 2 + 3);
    bufferText.textContent = `NALA / LAKE BUFFER ZONE (${formatFeetInches(bufW)})`;
  } else if (bufferRect && bufferText) {
    bufferRect.style.display = 'none';
    bufferText.style.display = 'none';
  }

  // 12. Multi-Road Render Handling (Layer 4 Outermost Position)
  renderRoadOrLabel('North', boundaries.North, topLeft.x, topLeft.y - 60, (topRight.x - topLeft.x), 32, 'top', offsetX + drawW / 2, offsetY - 66);
  renderRoadOrLabel('South', boundaries.South, botLeft.x, botLeft.y + 58, (botRight.x - botLeft.x), 32, 'bottom', offsetX + drawW / 2, botLeft.y + 102);
  renderRoadOrLabel('East', boundaries.East, topRight.x + 58, topRight.y, 32, (botRight.y - topRight.y), 'right', topRight.x + 105, offsetY + drawH / 2);
  renderRoadOrLabel('West', boundaries.West, topLeft.x - 80, topLeft.y, 32, (botLeft.y - topLeft.y), 'left', topLeft.x - 92, offsetY + drawH / 2);

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
 * Dynamically renders the Key Plan (Locational Sketch) in Panel 2 based on actual road facing direction,
 * road name, road width, and ward location.
 * 
 * @function updateKeyPlan
 * @returns {void}
 */
function updateKeyPlan() {
  const svg = document.getElementById('keyPlanSvg');
  if (!svg) return;

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
    widthLabel = ` (${roadWidthFt || 0}'${roadWidthIn ? roadWidthIn + '"' : ''} WIDE)`;
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
