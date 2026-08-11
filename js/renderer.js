/**
 * @file renderer.js
 * @description Computes plot scale ratios, calculates vertex coordinates, setback placement, and renders vector SVG graphics.
 * Supports multi-road plots and exhaustive 9 boundary types under Karnataka property law.
 * @author Senior Systems Architect
 */

/**
 * Main plan generator controller. Validates input form state, computes plot geometry,
 * populates details summary tables, and renders vector graphics onto SVG canvas.
 * 
 * @function generatePlan
 * @returns {void}
 */
function generatePlan() {
  if (!validate()) return;

  const isOdd = document.getElementById('oddSiteCheck') ? document.getElementById('oddSiteCheck').checked : false;
  const owner = document.getElementById('ownerName').value.trim();
  const epId = document.getElementById('epId').value.trim();
  const survey = document.getElementById('surveyNo').value.trim();
  const ward = document.getElementById('wardNo').value.trim();
  const address = document.getElementById('address').value.trim();
  const area = document.getElementById('plotArea').value;
  const roadW = document.getElementById('roadWidth').value;
  const roadFace = document.getElementById('roadFacing').value;
  const bldgW = parseFloat(document.getElementById('bldgWidth').value) || 0;
  const bldgL = parseFloat(document.getElementById('bldgLength').value) || 0;
  const scale = document.getElementById('scale').value;

  // Primary Universal 4-Side Cardinal Measurements
  const sideN = parseFloat(document.getElementById('sideNorth').value) || 0;
  const sideS = parseFloat(document.getElementById('sideSouth').value) || 0;
  const sideE = parseFloat(document.getElementById('sideEast').value) || 0;
  const sideW = parseFloat(document.getElementById('sideWest').value) || 0;

  const width = (sideN + sideS) / 2;
  const length = (sideE + sideW) / 2;

  // Read Boundary Types & Metadata across all 9 categories
  const boundaries = {
    North: getBoundaryInfo('North'),
    South: getBoundaryInfo('South'),
    East: getBoundaryInfo('East'),
    West: getBoundaryInfo('West')
  };

  /**
   * Helper function to extract boundary metadata.
   * @param {string} dir - Direction key.
   * @returns {Object}
   */
  function getBoundaryInfo(dir) {
    const typeEl = document.getElementById(`type${dir}`);
    const type = typeEl ? typeEl.value : (dir.toLowerCase() === roadFace ? 'road' : 'plot');
    if (type === 'road') {
      const nameEl = document.getElementById(`nameRoad${dir}`);
      const widthEl = document.getElementById(`widthRoad${dir}`);
      const name = nameEl && nameEl.value.trim() ? nameEl.value.trim() : 'PUBLIC ROAD';
      const w = widthEl && widthEl.value ? widthEl.value : roadW;
      return { type: 'road', text: `${name.toUpperCase()} (${w}' WIDE)`, roadW: w };
    } else {
      const descEl = document.getElementById(`descPlot${dir}`);
      const desc = descEl && descEl.value.trim() ? descEl.value.trim() : getDefaultLabel(type);
      return { type: type, text: `Adjacent: ${desc}` };
    }
  }

  /**
   * Returns fallback descriptions for non-road boundary types.
   * @param {string} type - Boundary type key.
   * @returns {string}
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
      default: return "NEIGHBOR'S PLOT";
    }
  }

  // Populate Summary Details Table
  document.getElementById('outOwner').textContent = owner;
  document.getElementById('outEpId').textContent = epId;
  document.getElementById('outSurvey').textContent = survey;
  document.getElementById('outWard').textContent = ward;
  document.getElementById('outAddress').textContent = address;
  document.getElementById('outArea').textContent = area + ' sq.ft (' + (parseFloat(area) * 0.0929).toFixed(2) + ' sq.m)';
  document.getElementById('outSize').textContent = `N:${sideN}' × S:${sideS}' × E:${sideE}' × W:${sideW}'` + (isOdd ? ' (Irregular)' : ' (Regular)');
  document.getElementById('outRoadFace').textContent = roadFace.charAt(0).toUpperCase() + roadFace.slice(1);
  document.getElementById('outRoadWidth').textContent = roadW + "' Wide";

  const plotRect = document.getElementById('plotRect');
  const plotPoly = document.getElementById('plotPoly');
  const bldgRect = document.getElementById('bldgRect');

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

    offsetX = 80 + (maxDrawW - Math.max(nW, sW)) / 2;
    offsetY = 60 + (maxDrawH - Math.max(eH, wH)) / 2;

    topLeft = { x: offsetX + (maxDrawW - nW) / 2, y: offsetY };
    topRight = { x: offsetX + (maxDrawW + nW) / 2, y: offsetY };
    botRight = { x: offsetX + (maxDrawW + sW) / 2, y: offsetY + Math.max(eH, wH) };
    botLeft = { x: offsetX + (maxDrawW - sW) / 2, y: offsetY + Math.max(eH, wH) };

    plotPoly.setAttribute('points', `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${botRight.x},${botRight.y} ${botLeft.x},${botLeft.y}`);

    const bldgDrawW = Math.min(bldgW * ratio, nW * 0.8, sW * 0.8);
    const bldgDrawH = Math.min(bldgL * ratio, eH * 0.8, wH * 0.8);
    const bldgX = offsetX + maxDrawW / 2 - bldgDrawW / 2;
    const bldgY = offsetY + Math.max(eH, wH) / 2 - bldgDrawH / 2;

    bldgRect.setAttribute('x', bldgX);
    bldgRect.setAttribute('y', bldgY);
    bldgRect.setAttribute('width', bldgDrawW);
    bldgRect.setAttribute('height', bldgDrawH);

  } else {
    plotRect.style.display = 'block';
    plotPoly.style.display = 'none';

    drawW = (roadFace === 'north' || roadFace === 'south') ? sideN * ratio : sideE * ratio;
    drawH = (roadFace === 'north' || roadFace === 'south') ? sideE * ratio : sideN * ratio;
    offsetX = 80 + (maxDrawW - drawW) / 2;
    offsetY = 60 + (maxDrawH - drawH) / 2;

    plotRect.setAttribute('x', offsetX);
    plotRect.setAttribute('y', offsetY);
    plotRect.setAttribute('width', drawW);
    plotRect.setAttribute('height', drawH);

    topLeft = { x: offsetX, y: offsetY };
    topRight = { x: offsetX + drawW, y: offsetY };
    botRight = { x: offsetX + drawW, y: offsetY + drawH };
    botLeft = { x: offsetX, y: offsetY + drawH };

    const bldgDrawW = bldgW * ratio;
    const bldgDrawH = bldgL * ratio;
    const bldgX = offsetX + (drawW - bldgDrawW) / 2;
    const bldgY = offsetY + (drawH - bldgDrawH) / 2;

    bldgRect.setAttribute('x', bldgX);
    bldgRect.setAttribute('y', bldgY);
    bldgRect.setAttribute('width', bldgDrawW);
    bldgRect.setAttribute('height', bldgDrawH);

    const dimY = offsetY + drawH + 20;
    document.getElementById('dimWLine').setAttribute('x1', offsetX);
    document.getElementById('dimWLine').setAttribute('y1', dimY);
    document.getElementById('dimWLine').setAttribute('x2', offsetX + drawW);
    document.getElementById('dimWLine').setAttribute('y2', dimY);
    document.getElementById('dimWidth').setAttribute('x', offsetX + drawW / 2);
    document.getElementById('dimWidth').setAttribute('y', dimY + 18);
    document.getElementById('dimWidth').textContent = width + "'-0\"";

    const dimX = offsetX + drawW + 20;
    document.getElementById('dimLLine').setAttribute('x1', dimX);
    document.getElementById('dimLLine').setAttribute('y1', offsetY);
    document.getElementById('dimLLine').setAttribute('x2', dimX);
    document.getElementById('dimLLine').setAttribute('y2', offsetY + drawH);
    document.getElementById('dimLength').setAttribute('x', dimX + 18);
    document.getElementById('dimLength').setAttribute('y', offsetY + drawH / 2);
    document.getElementById('dimLength').setAttribute('transform', 'rotate(90, ' + (dimX + 18) + ', ' + (offsetY + drawH / 2) + ')');
    document.getElementById('dimLength').textContent = length + "'-0\"";
  }

  // Multi-Road Render Handling (North, South, East, West)
  renderRoadOrLabel('North', boundaries.North, topLeft.x, topLeft.y - 35, (topRight.x - topLeft.x), 35, 'top');
  renderRoadOrLabel('South', boundaries.South, botLeft.x, botLeft.y + 5, (botRight.x - botLeft.x), 35, 'bottom');
  renderRoadOrLabel('East', boundaries.East, topRight.x + 5, topRight.y, 35, (botRight.y - topRight.y), 'right');
  renderRoadOrLabel('West', boundaries.West, topLeft.x - 40, topLeft.y, 35, (botLeft.y - topLeft.y), 'left');

  /**
   * Dynamically renders road rectangle or adjacency label.
   */
  function renderRoadOrLabel(dir, info, x, y, w, h, position) {
    const roadEl = document.getElementById(`roadRect${dir}`) || createRoadRect(dir);
    const labelEl = document.getElementById(`adj${dir.charAt(0)}`);

    if (info.type === 'road') {
      roadEl.style.display = 'block';
      roadEl.setAttribute('x', x);
      roadEl.setAttribute('y', y);
      roadEl.setAttribute('width', Math.max(w, 20));
      roadEl.setAttribute('height', Math.max(h, 20));

      if (labelEl) {
        labelEl.textContent = info.text;
      }
    } else {
      roadEl.style.display = 'none';
      if (labelEl) {
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

  // Side Labels
  document.getElementById('labelSideN').style.display = 'block';
  document.getElementById('labelSideS').style.display = 'block';
  document.getElementById('labelSideE').style.display = 'block';
  document.getElementById('labelSideW').style.display = 'block';

  document.getElementById('labelSideN').textContent = 'N: ' + sideN + "'-0\"";
  document.getElementById('labelSideS').textContent = 'S: ' + sideS + "'-0\"";
  document.getElementById('labelSideE').textContent = 'E: ' + sideE + "'-0\"";
  document.getElementById('labelSideW').textContent = 'W: ' + sideW + "'-0\"";

  const sbN = ((sideN - bldgW) / 2).toFixed(1);
  const sbS = ((sideS - bldgW) / 2).toFixed(1);
  const sbE = ((sideE - bldgL) / 2).toFixed(1);
  const sbW = ((sideW - bldgL) / 2).toFixed(1);

  document.getElementById('setbackN').textContent = "Setback: " + sbN + "'";
  document.getElementById('setbackS').textContent = "Setback: " + sbS + "'";
  document.getElementById('setbackE').textContent = "Setback: " + sbE + "'";
  document.getElementById('setbackW').textContent = "Setback: " + sbW + "'";

  document.getElementById('scaleText').textContent = "Scale: " + scale;

  document.getElementById('planOutput').style.display = 'block';
  document.getElementById('planOutput').scrollIntoView({ behavior: 'smooth' });
}
