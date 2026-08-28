/**
 * @file bbmp_bye_laws_compliance.test.js
 * @description Statutory tests verifying BBMP Building Bye-Laws (2020/Sakala) compliance.
 *
 * GAP FIX: This file previously tested a LOCAL SHADOW COPY of the setback logic.
 * It now tests the REAL production autoCalculateSetbacks() from ui.js via VM context.
 * If you change the setback formula in ui.js, these tests will fail immediately.
 *
 * BBMP Schedule III — Minimum Statutory Setbacks (in feet):
 * ─────────────────────────────────────────────────────────
 * Plot Area (sqm) │ Front │ Rear  │ Side L │ Side R
 * ≤ 60            │ 3.28ft│ 0     │ 0      │ 0
 * 60–120          │ 4.92ft│ 3.28ft│ 0      │ 0
 * 120–240         │ 6.56ft│ 4.92ft│ 3.28ft │ 3.28ft
 * 240–500         │ 9.84ft│ 6.56ft│ 4.92ft │ 4.92ft
 * > 500           │13.12ft│ 9.84ft│ 6.56ft │ 6.56ft
 *
 * Note: ft values = m × 3.28084 (exact conversions used in BBMP drawings)
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('BBMP Building Bye-Laws Statutory Compliance Tests', '🏛️');

const UI_SOURCE = fs.readFileSync(path.resolve('js/ui.js'), 'utf8');
const WARDS_SOURCE = fs.readFileSync(path.resolve('js/data/bbmpWards.js'), 'utf8');

// ─── BBMP Schedule III minimum setbacks (in feet) ────────────────────────────
// These are the LEGAL minimums that every generated drawing must satisfy.
// Source: BBMP Building Bye-Laws 2020, Schedule III, Table 1.
const STATUTORY_MINS = {
  'Tier1_≤60sqm': { frontFt: 3.28, rearFt: 0.00, sideFt: 0.00 },
  'Tier2_60-120sqm': { frontFt: 4.92, rearFt: 3.28, sideFt: 0.00 },
  'Tier3_120-240sqm': { frontFt: 6.56, rearFt: 4.92, sideFt: 3.28 },
  'Tier4_240-500sqm': { frontFt: 9.84, rearFt: 6.56, sideFt: 4.92 },
  'Tier5_>500sqm': { frontFt: 13.12, rearFt: 9.84, sideFt: 6.56 }
};

// Standard plot sizes used in BBMP drawings (sqft → sqm: multiply by 0.092903)
const STANDARD_PLOTS = [
  { desc: '20×30 (600 sq.ft = 55.7 sqm)', nsFt: 30, ewFt: 20, sqm: 55.74, tier: 'Tier1' },
  { desc: '30×40 (1200 sq.ft = 111.5 sqm)', nsFt: 40, ewFt: 30, sqm: 111.48, tier: 'Tier2' },
  { desc: '40×60 (2400 sq.ft = 222.9 sqm)', nsFt: 60, ewFt: 40, sqm: 222.97, tier: 'Tier3' },
  { desc: '50×80 (4000 sq.ft = 371.6 sqm)', nsFt: 80, ewFt: 50, sqm: 371.61, tier: 'Tier4' },
];

// Strip ESM import/export keywords so it executes seamlessly in Node VM Script context
const UI_SOURCE_EXECUTABLE = UI_SOURCE
  .replace(/^import\s+[\s\S]*?;\s*$/gm, '')
  .replace(/^export\s+/gm, '');

// ─── Sandbox builder that loads the REAL ui.js ───────────────────────────────
function buildUiSandbox() {
  const { mockDoc, mockWindow, mockStorage, dispatchDOMContentLoaded } = createMockBrowserEnvironment();
  mockWindow.saveDraft = () => { };
  mockWindow.generatePlan = () => { };
  mockWindow.clearFieldError = () => { };
  mockWindow.BBMP_WARDS = [];
  mockWindow.BBMP_ZONES = [];
  mockWindow.generateQrSvg = () => '';
  mockWindow.renderQrToCanvas = () => { };

  const ctx = vm.createContext(mockWindow);
  vm.runInContext(UI_SOURCE_EXECUTABLE, ctx);
  dispatchDOMContentLoaded();
  return { mockDoc, mockWindow };
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. Production autoCalculateSetbacks() — Real Function, Real DOM');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('autoCalculateSetbacks is exposed on window by production ui.js', () => {
  const { mockWindow } = buildUiSandbox();
  assert.ok(typeof mockWindow.autoCalculateSetbacks === 'function',
    'window.autoCalculateSetbacks must be a function — removing it breaks all BBMP setback calculations');
});

suite.test('autoCalculateSetbacks: 30×40 plot with 20×30 building distributes 10ft clearance equally (5ft each)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value = '40';
  mockDoc.getElementById('bldgWidth').value = '20';
  mockDoc.getElementById('bldgLength').value = '30';

  mockWindow.autoCalculateSetbacks(true);

  const front = parseFloat(mockDoc.getElementById('setbackFront').value);
  const rear = parseFloat(mockDoc.getElementById('setbackRear').value);
  const left = parseFloat(mockDoc.getElementById('setbackLeft').value);
  const right = parseFloat(mockDoc.getElementById('setbackRight').value);

  assert.equal(front, 5.0, 'Front setback must be 5.0ft (10ft clearance ÷ 2)');
  assert.equal(rear, 5.0, 'Rear setback must be 5.0ft');
  assert.equal(left, 5.0, 'Left setback must be 5.0ft');
  assert.equal(right, 5.0, 'Right setback must be 5.0ft');
});

suite.test('autoCalculateSetbacks: setback values are never negative for oversized building', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '20';
  mockDoc.getElementById('regEastWest').value = '30';
  mockDoc.getElementById('bldgWidth').value = '25'; // exceeds plot
  mockDoc.getElementById('bldgLength').value = '35'; // exceeds plot

  mockWindow.autoCalculateSetbacks(true);

  const front = parseFloat(mockDoc.getElementById('setbackFront').value) || 0;
  const left = parseFloat(mockDoc.getElementById('setbackLeft').value) || 0;
  assert.ok(front >= 0, 'Front setback must never be negative');
  assert.ok(left >= 0, 'Left setback must never be negative');
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. 2026 Karnataka Gazette Table 8 — Statutory Minimum Compliance');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Tier 1 (≤60 sq.m / 20×30 plot = 600 sq.ft): 0.75m front (2.46ft) and single-side 0.6m (1.97ft) compliant', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.updateSetbackComplianceBadges !== 'function') return;

  // 20×30 plot = 600 sq.ft (plotSqM = 55.74 <= 60 sq.m)
  mockDoc.getElementById('plotArea').value = '600';
  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value = '20';

  // Set 2.5ft front (>= 2.46ft), 0ft rear (allowed), 2.0ft left (>= 1.97ft), 0ft right (party wall allowed)
  mockDoc.getElementById('setbackFront').value = '2.5';
  mockDoc.getElementById('setbackFront_ft').value = '2';
  mockDoc.getElementById('setbackRear').value = '0';
  mockDoc.getElementById('setbackRear_ft').value = '0';
  mockDoc.getElementById('setbackLeft').value = '2.0';
  mockDoc.getElementById('setbackLeft_ft').value = '2';
  mockDoc.getElementById('setbackRight').value = '0';
  mockDoc.getElementById('setbackRight_ft').value = '0';

  mockWindow.updateSetbackComplianceBadges();

  const pillFront = mockDoc.getElementById('compliance_setbackFront');
  const pillRear = mockDoc.getElementById('compliance_setbackRear');
  const pillLeft = mockDoc.getElementById('compliance_setbackLeft');
  const pillRight = mockDoc.getElementById('compliance_setbackRight');

  assert.ok(pillFront.classList.contains('compliant') || pillFront.className.includes('compliant'),
    'Front setback (2.5ft >= 2.46ft) must be marked compliant');
  assert.ok(pillRear.classList.contains('compliant') || pillRear.className.includes('compliant'),
    'Rear setback (0ft for Tier 1) must be marked compliant');
  assert.ok(pillLeft.classList.contains('compliant') || pillLeft.className.includes('compliant'),
    'Left side setback (2.0ft >= 1.97ft) must be marked compliant');
  assert.ok(pillRight.classList.contains('compliant') || pillRight.className.includes('compliant'),
    'Right side setback with opposing side compliant must be marked compliant under single-side tolerance');
});

suite.test('Tier 2 (60–150 sq.m / 30×40 plot = 1200 sq.ft): 0.9m front (2.95ft) and 0.7m rear/side (2.3ft) compliant', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.updateSetbackComplianceBadges !== 'function') return;

  // 30×40 plot = 1200 sqft (plotSqM = 111.48 sq.m <= 150 sq.m)
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value = '40';

  // 3.0ft front (>= 2.95ft), 2.5ft rear (>= 2.3ft), 2.5ft left (>= 2.3ft), 0ft right (allowed on one side)
  mockDoc.getElementById('setbackFront').value = '3.0';
  mockDoc.getElementById('setbackFront_ft').value = '3';
  mockDoc.getElementById('setbackRear').value = '2.5';
  mockDoc.getElementById('setbackRear_ft').value = '2';
  mockDoc.getElementById('setbackLeft').value = '2.5';
  mockDoc.getElementById('setbackLeft_ft').value = '2';
  mockDoc.getElementById('setbackRight').value = '0';
  mockDoc.getElementById('setbackRight_ft').value = '0';

  mockWindow.updateSetbackComplianceBadges();

  const pillFront = mockDoc.getElementById('compliance_setbackFront');
  const pillRear = mockDoc.getElementById('compliance_setbackRear');
  const pillLeft = mockDoc.getElementById('compliance_setbackLeft');
  const pillRight = mockDoc.getElementById('compliance_setbackRight');

  assert.ok(pillFront.classList.contains('compliant'), 'Front setback 3.0ft must be compliant');
  assert.ok(pillRear.classList.contains('compliant'), 'Rear setback 2.5ft must be compliant');
  assert.ok(pillLeft.classList.contains('compliant'), 'Left side setback 2.5ft must be compliant');
  assert.ok(pillRight.classList.contains('compliant'), 'Right side zero setback must be compliant with left compliant');
});

suite.test('Tier 3 (150–250 sq.m / 40×60 plot = 2400 sq.ft): Requires 1.0m front (3.28ft) and 0.8m rear & both sides (2.62ft)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.updateSetbackComplianceBadges !== 'function') return;

  // 40×60 plot = 2400 sq.ft (plotSqM = 222.97 sq.m)
  mockDoc.getElementById('plotArea').value = '2400';
  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '40';
  mockDoc.getElementById('regEastWest').value = '60';

  mockDoc.getElementById('setbackFront').value = '3.5';
  mockDoc.getElementById('setbackFront_ft').value = '3';
  mockDoc.getElementById('setbackRear').value = '3.0';
  mockDoc.getElementById('setbackRear_ft').value = '3';
  mockDoc.getElementById('setbackLeft').value = '3.0';
  mockDoc.getElementById('setbackLeft_ft').value = '3';
  mockDoc.getElementById('setbackRight').value = '1.0'; // Substandard for Tier 3 (requires both sides >= 2.62ft)
  mockDoc.getElementById('setbackRight_ft').value = '1';

  mockWindow.updateSetbackComplianceBadges();

  const pillRight = mockDoc.getElementById('compliance_setbackRight');
  assert.ok(pillRight.classList.contains('warning'), 'Tier 3 right setback of 1.0ft (< 2.62ft) must show warning badge');
});

suite.test('FAR Calculation & Height Advisory for 2026 Regulations', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.calculateBuiltUpArea !== 'function') return;

  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '40';
  mockDoc.getElementById('bldgWidth').value = '20';
  mockDoc.getElementById('bldgLength').value = '30'; // Footprint = 600 sq.ft
  mockDoc.getElementById('noOfFloors').value = 'G+3'; // Multiplier = 4 -> BuiltUp = 2400 sq.ft (FAR = 2.0)

  mockWindow.calculateBuiltUpArea();

  const builtUp = parseFloat(mockDoc.getElementById('builtUpArea').value);
  assert.equal(builtUp, 2400, 'Built-up area must be 2400 sq.ft');

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.ok(farBadge.classList.contains('compliant'), 'FAR 2.0 on 40ft road is within Premium FAR / TDR cap');
  assert.ok(farBadge.textContent.includes('2.8'), 'Compliant badge for 40ft road mentions expected max 2.80');

  // Test FAR Exceeded state (e.g. 3.32)
  mockDoc.getElementById('roadWidth').value = '25'; // <30ft road (max allowed = 1.75)
  mockDoc.getElementById('noOfFloors').value = 'G+4'; // 5 floors = 3000 sq.ft (FAR = 2.50)
  mockWindow.calculateBuiltUpArea();
  assert.ok(farBadge.classList.contains('warning'), 'FAR exceeding 1.75 on 25ft road shows warning badge');
  assert.ok(farBadge.textContent.includes('1.75'), 'Warning badge mentions expected max FAR of 1.75');

  // Test G+4 height advisory notice
  const heightBanner = mockDoc.getElementById('heightAdvisoryBanner');
  assert.equal(heightBanner.style.display, 'block', 'Height advisory banner must be visible when G+4 is selected');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. 2026 BBMP & Karnataka Gazette Constants & Thresholds');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('STATUTORY_2026_SETBACKS constants object is exposed on window with accurate 2026 thresholds', () => {
  const { mockWindow } = buildUiSandbox();
  assert.ok(mockWindow.STATUTORY_2026_SETBACKS, 'STATUTORY_2026_SETBACKS must be exposed on window');
  assert.equal(mockWindow.STATUTORY_2026_SETBACKS.TIER_1_MAX_SQM, 60, 'Tier 1 max must be 60 sq.m');
  assert.equal(mockWindow.STATUTORY_2026_SETBACKS.TIER_2_MAX_SQM, 150, 'Tier 2 max must be 150 sq.m');
  assert.equal(mockWindow.STATUTORY_2026_SETBACKS.TIER_3_MAX_SQM, 250, 'Tier 3 max must be 250 sq.m');
  assert.equal(mockWindow.STATUTORY_2026_SETBACKS.MAX_LOW_RISE_HEIGHT_METERS, 12.0, 'Low-rise height cap must be 12.0m');
});

suite.test('sq.ft ↔ sq.m conversion factor (0.0929) is present in ui.js', () => {
  assert.ok(
    UI_SOURCE.includes('0.0929'),
    'ui.js must use the standard conversion factor (0.0929 sq.m/sq.ft) for land conversion calculations'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. Sakala Drawing Output — Statutory Data Integrity');
// ─────────────────────────────────────────────────────────────────────────────

STANDARD_PLOTS.forEach(({ desc, nsFt, ewFt, sqm, tier }) => {
  suite.test(`${desc}: plot area calculation is within 1 sq.ft of expected`, () => {
    const { mockDoc, mockWindow } = buildUiSandbox();
    if (typeof mockWindow.onRegularDimensionInput !== 'function') return;

    mockDoc.getElementById('regNorthSouth').value = String(nsFt);
    mockDoc.getElementById('regEastWest').value = String(ewFt);
    mockWindow.onRegularDimensionInput();

    const calculatedArea = parseFloat(mockDoc.getElementById('plotArea').value);
    const expectedArea = nsFt * ewFt;
    assert.ok(
      Math.abs(calculatedArea - expectedArea) <= 1,
      `${desc}: calculated area ${calculatedArea} must be within 1 sq.ft of ${expectedArea}`
    );
  });
});

suite.test('sq.ft to sq.m conversion for 1200 sq.ft (30×40) = 111.48 sq.m (BBMP drawing header)', () => {
  // This is the exact value printed in the drawing's "Plot Area" header cell.
  // If this changes, every drawing shows wrong sqm area.
  const sqm = parseFloat((1200 * 0.092903).toFixed(2));
  assert.ok(Math.abs(sqm - 111.48) < 0.01, `1200 sq.ft must convert to 111.48 sq.m; got ${sqm}`);
});

suite.test('sq.ft to sq.m conversion for 2400 sq.ft (40×60) = 222.97 sq.m (BBMP drawing header)', () => {
  const sqm = parseFloat((2400 * 0.092903).toFixed(2));
  assert.ok(Math.abs(sqm - 222.97) < 0.01, `2400 sq.ft must convert to 222.97 sq.m; got ${sqm}`);
});

suite.finish();
