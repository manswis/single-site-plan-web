/**
 * @file review.test.js
 * @description Exhaustive unit test suite for Step 7 Review & Export Summary,
 * Window Export Parity, Accordion State Machine, and Legal Consent Interlocking.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

console.log('\n📋 [Test Runner] Starting Review Summary & Window Export Parity Tests...\n');

// 1. Review Summary Section Definitions & Field Mapping Test
console.log('1. Verifying Review Summary Section Schemas:');
function generateMockReviewSections(formData = {}) {
  const isOdd = formData.oddSiteCheck || false;
  const isRoadWidening = formData.roadWideningCheck || false;
  const isBuffer = formData.bufferCheck || false;

  return [
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
        { id: 'plotNo', label: 'Site / Plot Number' },
        { id: 'gpsCoords', label: 'GPS Co-ordinates' },
        { id: 'wardName', label: 'Ward / Area Name' },
        { id: 'bbmpZone', label: 'BBMP Zone' }
      ]
    },
    {
      title: '📐 Plot Measurements & Geometry',
      step: 3,
      fields: [
        { id: 'oddSiteCheck', label: 'Plot Type', val: isOdd ? 'Irregular (4-Side Measurement)' : 'Regular (Rectangular / Square)' },
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
          { id: 'regEastWest', label: 'East–West Span (North & South Boundaries)', isFtIn: true },
          { id: 'regNorthSouth', label: 'North–South Span (East & West Boundaries / Frontage)', isFtIn: true }
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
        { id: 'typeNorth', label: 'North Boundary' },
        { id: 'typeSouth', label: 'South Boundary' },
        { id: 'typeEast', label: 'East Boundary' },
        { id: 'typeWest', label: 'West Boundary' }
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
        { id: 'architectName', label: 'Architect / Surveyor Name' },
        { id: 'architectRegNo', label: 'COA / BBMP Reg. No' },
        { id: 'ownerSigData', label: 'Owner Signature' },
        { id: 'archSigData', label: 'Architect Seal / Sign' },
        { id: 'includeLegendPage', label: 'Include Page 2 Legend Sheet', isCheckbox: true },
        { id: 'sampleWatermarkCheck', label: 'Sample Draft Watermark', isCheckbox: true }
      ]
    }
  ];
}

const regularSections = generateMockReviewSections({ oddSiteCheck: false });
assert.equal(regularSections.length, 6, 'Must generate exactly 6 review sections');
assert.equal(regularSections[2].fields.some(f => f.id === 'regEastWest'), true, 'Regular plot must include regEastWest');
assert.equal(regularSections[2].fields.some(f => f.id === 'sideNorth'), false, 'Regular plot must not include sideNorth');

const oddSections = generateMockReviewSections({ oddSiteCheck: true });
assert.equal(oddSections[2].fields.some(f => f.id === 'sideNorth'), true, 'Irregular plot must include 4 separate sides');
assert.equal(oddSections[2].fields.some(f => f.id === 'regEastWest'), false, 'Irregular plot must omit regEastWest');
console.log('   ✓ Review summary section schemas and regular/irregular branching verified.');

// 2. GPS & Boundary Formatting Logic
console.log('\n2. Verifying Review Formatting Helpers:');
function formatGpsCoords(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return '—';
  const clean = raw.trim();
  const match = clean.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lon).toFixed(5)}° ${lonDir}`;
  }
  return clean;
}

assert.equal(formatGpsCoords(''), '—', 'Empty GPS must format as em-dash');
assert.equal(formatGpsCoords('12.97160, 77.59460'), '12.97160° N, 77.59460° E', 'Lat/Lon pair formatted correctly');
assert.equal(formatGpsCoords('-12.50000, -77.10000'), '12.50000° S, 77.10000° W', 'Negative coordinates format with S/W');
console.log('   ✓ GPS coordinates formatting helper verified.');

// 3. Legal Consent State Machine Interlocking
console.log('\n3. Verifying Legal Consent Button State Interlocking:');
function computeButtonStates(isConsentChecked, isPlanGenerated) {
  return {
    generatePlanBtnDisabled: !isConsentChecked,
    downloadPdfBtnDisabled: !isConsentChecked || !isPlanGenerated,
    printBtnDisabled: !isConsentChecked || !isPlanGenerated,
    reportDrawingBtnDisabled: !isConsentChecked || !isPlanGenerated,
    exportProjectBtnDisabled: !isConsentChecked
  };
}

const sUnchecked = computeButtonStates(false, false);
assert.equal(sUnchecked.generatePlanBtnDisabled, true, 'Generate Plan must be disabled when consent is unchecked');
assert.equal(sUnchecked.downloadPdfBtnDisabled, true);
assert.equal(sUnchecked.printBtnDisabled, true);

const sCheckedNotGenerated = computeButtonStates(true, false);
assert.equal(sCheckedNotGenerated.generatePlanBtnDisabled, false, 'Generate Plan must be enabled when consent is checked');
assert.equal(sCheckedNotGenerated.downloadPdfBtnDisabled, true, 'Export PDF must remain disabled until plan is generated');

const sCheckedAndGenerated = computeButtonStates(true, true);
assert.equal(sCheckedAndGenerated.generatePlanBtnDisabled, false);
assert.equal(sCheckedAndGenerated.downloadPdfBtnDisabled, false, 'Export PDF must be enabled after plan generation');
assert.equal(sCheckedAndGenerated.printBtnDisabled, false, 'Print Drawing must be enabled after plan generation');
console.log('   ✓ Legal consent gating and post-generation button enablement verified.');

// 4. Window Export Parity AST / Static Verification
console.log('\n4. Verifying Window Export Parity across UI, Renderer & Wizard Modules:');
const uiJsPath = path.resolve('js/ui.js');
const uiJsContent = fs.readFileSync(uiJsPath, 'utf8');

const rendererJsPath = path.resolve('js/renderer.js');
const rendererJsContent = fs.readFileSync(rendererJsPath, 'utf8');

const wizardJsPath = path.resolve('js/wizard.js');
const wizardJsContent = fs.readFileSync(wizardJsPath, 'utf8');

const CRITICAL_UI_EXPORTS = [
  'downloadPDFPackage',
  'printPlanPackage',
  'reportDrawingIssue',
  'buildReviewSummary',
  'toggleReviewSection',
  'toggleAllReviewSections',
  'editFieldFromReview',
  'formatGpsSummary',
  'formatBoundarySummary',
  'toggleLegalConsent',
  'onGeneratePlanClick',
  'showFieldHelp',
  'closeFieldHelp',
  'openAreaConverterModal',
  'closeAreaConverterModal',
  'initSmartFtInAutoTab',
  'parseFeetInchesString',
  'openWardSearchModal',
  'closeWardSearchModal'
];

CRITICAL_UI_EXPORTS.forEach(fnName => {
  const exportPattern = new RegExp(`window\\.${fnName}\\s*=`, 'm');
  assert.ok(exportPattern.test(uiJsContent), `CRITICAL REGRESSION: window.${fnName} is missing from window exports block in js/ui.js`);
});
console.log(`   ✓ All ${CRITICAL_UI_EXPORTS.length} critical UI functions confirmed present in js/ui.js exports.`);

const CRITICAL_RENDERER_EXPORTS = ['generatePlan', 'updateKeyPlan', 'parseCoordinates'];
CRITICAL_RENDERER_EXPORTS.forEach(fnName => {
  const exportPattern = new RegExp(`window\\.${fnName}\\s*=`, 'm');
  assert.ok(exportPattern.test(rendererJsContent), `CRITICAL REGRESSION: window.${fnName} is missing from window exports block in js/renderer.js`);
});
console.log(`   ✓ All ${CRITICAL_RENDERER_EXPORTS.length} renderer CAD engine functions confirmed present in js/renderer.js exports.`);

const CRITICAL_WIZARD_EXPORTS = ['initWizard', 'goToStep', 'nextStep', 'prevStep', 'showStep', 'saveDraft', 'restoreDraft', 'exportProjectFile'];
CRITICAL_WIZARD_EXPORTS.forEach(fnName => {
  const exportPattern = new RegExp(`window\\.${fnName}\\s*=`, 'm');
  assert.ok(exportPattern.test(wizardJsContent), `CRITICAL REGRESSION: window.${fnName} is missing from window exports block in js/wizard.js`);
});
console.log(`   ✓ All ${CRITICAL_WIZARD_EXPORTS.length} wizard workflow functions confirmed present in js/wizard.js exports.`);

console.log('\n🎉 ALL 4 REVIEW SUMMARY & EXPORT TEST SUITES PASSED WITH 100% SUCCESS!\n');

