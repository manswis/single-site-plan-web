/**
 * @file samples.js
 * @description Sample reference plan presets for instant pre-filling and testing of the BBMP Single Plot Generator.
 * Enforces population of all mandatory fields across all 4 cardinal boundaries and sets precautionary watermark flag.
 * @author Senior Systems Architect
 */

/**
 * Helper function to safely set input values by element ID.
 * 
 * @function setVal
 * @param {string} id - Element ID.
 * @param {string|number} val - Value to assign.
 * @returns {void}
 */
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = val;
  }
}

/**
 * Helper function to set checkbox checked state by element ID.
 * 
 * @function setCheck
 * @param {string} id - Element ID.
 * @param {boolean} checked - Checked status.
 * @returns {void}
 */
function setCheck(id, checked) {
  const el = document.getElementById(id);
  if (el) {
    el.checked = checked;
  }
}

/**
 * Loads Sample Preset 1: Standard 30x40 Rectangular Residential Plot (1 Road).
 * 
 * @function loadSampleRegular
 * @returns {void}
 */
function loadSampleRegular() {
  setCheck('oddSiteCheck', false);
  setCheck('roadWideningCheck', false);
  setCheck('bufferCheck', false);
  setCheck('includeLegendPage', true);
  setCheck('sampleWatermarkCheck', true);

  if (typeof toggleOddSite === 'function') toggleOddSite();
  if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
  if (typeof toggleBufferZone === 'function') toggleBufferZone();

  // Primary Info
  setVal('ownerName', 'RAMESH KUMAR & ANJALI KUMAR');
  setVal('epId', 'EP-2024-789456');
  setVal('pidNo', '108-W0045-12');
  setVal('sasNo', 'SAS-2024-554433');
  setVal('adlrNo', 'ADLR/11E/2024/7891');

  // DC Conversion
  setVal('dcOrderNo', 'ALN(EV)SR/45/2018-19');
  setVal('dcOrderDate', '2019-04-15');
  setVal('dcAuthority', 'DC, Bengaluru Urban');

  // Location
  setVal('surveyNo', '45/2A');
  setVal('bbmpZone', 'West');
  setVal('wardNo', '45');
  setVal('wardName', 'Malleshwaram');
  setVal('address', 'No. 12, 3rd Cross, Rajajinagar, Bangalore - 560010');

  // Plot Dimensions (30' x 40')
  setVal('plotArea', '1200');
  setVal('sideNorth', '30');
  setVal('sideSouth', '30');
  setVal('sideEast', '40');
  setVal('sideWest', '40');
  setVal('roadWidth', '30');
  setVal('roadFacing', 'north');
  setVal('scale', '1:100');

  setVal('floorsCount', 'G+1');
  setVal('builtUpArea', '1800');
  setVal('bldgWidth', '22');
  setVal('bldgLength', '30');

  // Setbacks
  setVal('setbackFront', '5');
  setVal('setbackRear', '5');
  setVal('setbackLeft', '4');
  setVal('setbackRight', '4');

  // Boundary Access (1 Road on North, Neighbor Plots on South, East, West)
  setVal('typeNorth', 'road');
  setVal('nameRoadNorth', '3RD CROSS ROAD');
  setVal('widthRoadNorth', '30');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('North');

  setVal('typeSouth', 'plot');
  setVal('descPlotSouth', 'PLOT NO. 46');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('South');

  setVal('typeEast', 'plot');
  setVal('descPlotEast', 'PLOT NO. 13');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('East');

  setVal('typeWest', 'plot');
  setVal('descPlotWest', 'PLOT NO. 11');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('West');

  // Fee Details
  setVal('challanNo', 'CH-2024-99881');
  setVal('challanFee', '48000');
  setVal('challanDate', '2024-05-20');

  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Loads Sample Preset 2: 2-Side Corner Plot (North 30' Road & East 60' Main Road).
 * 
 * @function loadSampleCornerPlot
 * @returns {void}
 */
function loadSampleCornerPlot() {
  setCheck('oddSiteCheck', false);
  setCheck('roadWideningCheck', false);
  setCheck('bufferCheck', false);
  setCheck('includeLegendPage', true);
  setCheck('sampleWatermarkCheck', true);

  if (typeof toggleOddSite === 'function') toggleOddSite();
  if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
  if (typeof toggleBufferZone === 'function') toggleBufferZone();

  setVal('ownerName', 'VIKRAM SHARMA & DEEPIKA SHARMA');
  setVal('epId', 'EP-2024-334455');
  setVal('pidNo', '102-W0089-05');
  setVal('sasNo', 'SAS-2024-778899');
  setVal('adlrNo', 'ADLR/11E/2024/4455');

  setVal('dcOrderNo', 'ALN(N)SR/78/2021-22');
  setVal('dcOrderDate', '2021-11-05');
  setVal('dcAuthority', 'DC, Bengaluru Urban');

  setVal('surveyNo', '89/1C');
  setVal('bbmpZone', 'Yelahanka');
  setVal('wardNo', '102');
  setVal('wardName', 'Yelahanka New Town');
  setVal('address', 'Corner Site No. 1, 4th Cross & 100ft Main Road, Yelahanka, Bangalore - 560064');

  setVal('plotArea', '2400');
  setVal('sideNorth', '40');
  setVal('sideSouth', '40');
  setVal('sideEast', '60');
  setVal('sideWest', '60');
  setVal('roadWidth', '60');
  setVal('roadFacing', 'east');
  setVal('scale', '1:200');

  setVal('floorsCount', 'G+2');
  setVal('builtUpArea', '3600');
  setVal('bldgWidth', '30');
  setVal('bldgLength', '45');

  setVal('setbackFront', '10');
  setVal('setbackRear', '8');
  setVal('setbackLeft', '5');
  setVal('setbackRight', '5');

  // Corner Plot Boundaries: Roads on North & East, Neighbor Plots on South & West!
  setVal('typeNorth', 'road');
  setVal('nameRoadNorth', '4TH CROSS ROAD');
  setVal('widthRoadNorth', '30');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('North');

  setVal('typeEast', 'road');
  setVal('nameRoadEast', '100FT MAIN ROAD');
  setVal('widthRoadEast', '60');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('East');

  setVal('typeSouth', 'plot');
  setVal('descPlotSouth', 'PLOT NO. 2');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('South');

  setVal('typeWest', 'plot');
  setVal('descPlotWest', 'PLOT NO. 25');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('West');

  setVal('challanNo', 'CH-2024-11229');
  setVal('challanFee', '65000');
  setVal('challanDate', '2024-06-18');

  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Loads Sample Preset 3: Irregular / Odd Shaped Plot (Trapezoid / Quad Geometry).
 * 
 * @function loadSampleOdd
 * @returns {void}
 */
function loadSampleOdd() {
  setCheck('oddSiteCheck', true);
  setCheck('roadWideningCheck', false);
  setCheck('bufferCheck', false);
  setCheck('includeLegendPage', true);
  setCheck('sampleWatermarkCheck', true);

  if (typeof toggleOddSite === 'function') toggleOddSite();
  if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
  if (typeof toggleBufferZone === 'function') toggleBufferZone();

  setVal('ownerName', 'SURESH RAO & LAKSHMI RAO');
  setVal('epId', 'EP-2024-112233');
  setVal('pidNo', '178-W0078-45');
  setVal('sasNo', 'SAS-2024-887766');
  setVal('adlrNo', 'ADLR/11E/2024/3321');

  setVal('dcOrderNo', 'ALN(SE)SR/112/2017-18');
  setVal('dcOrderDate', '2018-09-10');
  setVal('dcAuthority', 'DC, Bengaluru Urban');

  setVal('surveyNo', '78/3B');
  setVal('bbmpZone', 'South');
  setVal('wardNo', '78');
  setVal('wardName', 'JP Nagar');
  setVal('address', 'No. 45, 5th Main, JP Nagar 2nd Phase, Bangalore - 560078');

  setVal('plotArea', '2460');
  setVal('sideNorth', '42');
  setVal('sideSouth', '38');
  setVal('sideEast', '65');
  setVal('sideWest', '58');
  setVal('roadWidth', '40');
  setVal('roadFacing', 'east');
  setVal('scale', '1:200');

  setVal('floorsCount', 'G+2');
  setVal('builtUpArea', '3200');
  setVal('bldgWidth', '28');
  setVal('bldgLength', '42');

  setVal('setbackFront', '12');
  setVal('setbackRear', '8');
  setVal('setbackLeft', '5');
  setVal('setbackRight', '5');

  // Populate ALL 4 Mandatory Boundaries for Irregular Site
  setVal('typeNorth', 'plot');
  setVal('descPlotNorth', 'PLOT NO. 12');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('North');

  setVal('typeSouth', 'plot');
  setVal('descPlotSouth', 'PLOT NO. 46');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('South');

  setVal('typeEast', 'road');
  setVal('nameRoadEast', '5TH MAIN ROAD');
  setVal('widthRoadEast', '40');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('East');

  setVal('typeWest', 'plot');
  setVal('descPlotWest', 'STORMWATER DRAIN (RAJAKALUVE)');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('West');

  setVal('challanNo', 'CH-2024-55442');
  setVal('challanFee', '52000');
  setVal('challanDate', '2024-06-12');

  if (typeof generatePlan === 'function') generatePlan();
}

/**
 * Loads Sample Preset 4: Site subject to RMP-2015 Master Plan Road Widening.
 * 
 * @function loadSampleRoadWidening
 * @returns {void}
 */
function loadSampleRoadWidening() {
  setCheck('oddSiteCheck', false);
  setCheck('roadWideningCheck', true);
  setCheck('bufferCheck', false);
  setCheck('includeLegendPage', true);
  setCheck('sampleWatermarkCheck', true);

  if (typeof toggleOddSite === 'function') toggleOddSite();
  if (typeof toggleRoadWidening === 'function') toggleRoadWidening();
  if (typeof toggleBufferZone === 'function') toggleBufferZone();

  setVal('ownerName', 'KAVITHA REDDY');
  setVal('epId', 'EP-2024-998877');
  setVal('pidNo', '150-W0150-08');
  setVal('sasNo', 'SAS-2024-112244');
  setVal('adlrNo', 'ADLR/11E/2024/9012');

  setVal('dcOrderNo', 'ALN(E)SR/88/2020-21');
  setVal('dcOrderDate', '2021-01-20');
  setVal('dcAuthority', 'DC, Bengaluru Urban');

  setVal('surveyNo', '12/4');
  setVal('bbmpZone', 'Mahadevapura');
  setVal('wardNo', '150');
  setVal('wardName', 'Bellandur');
  setVal('address', 'Kithaganur Main Road, 14th Cross, Bangalore - 560036');

  setVal('plotArea', '3600');
  setVal('sideNorth', '40');
  setVal('sideSouth', '40');
  setVal('sideEast', '90');
  setVal('sideWest', '90');
  setVal('roadWidth', '40');
  setVal('roadFacing', 'south');
  setVal('scale', '1:200');

  setVal('proposedRoadWidth', '60');
  setVal('roadWideningStripWidth', '10');

  setVal('floorsCount', 'G+2');
  setVal('builtUpArea', '3800');
  setVal('bldgWidth', '30');
  setVal('bldgLength', '50');

  setVal('setbackFront', '15');
  setVal('setbackRear', '10');
  setVal('setbackLeft', '5');
  setVal('setbackRight', '5');

  // Populate ALL 4 Mandatory Boundaries for Road Widening Site
  setVal('typeNorth', 'plot');
  setVal('descPlotNorth', 'PLOT NO. 88');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('North');

  setVal('typeSouth', 'road');
  setVal('nameRoadSouth', 'KITHAGANUR MAIN ROAD');
  setVal('widthRoadSouth', '40');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('South');

  setVal('typeEast', 'plot');
  setVal('descPlotEast', 'PLOT NO. 15');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('East');

  setVal('typeWest', 'plot');
  setVal('descPlotWest', 'PLOT NO. 13');
  if (typeof toggleBoundaryType === 'function') toggleBoundaryType('West');

  setVal('challanNo', 'CH-2024-77661');
  setVal('challanFee', '72000');
  setVal('challanDate', '2024-07-05');

  if (typeof goToStep === 'function') goToStep(7);
  if (typeof generatePlan === 'function') generatePlan();
}
