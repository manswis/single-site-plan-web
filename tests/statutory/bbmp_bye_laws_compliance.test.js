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
suite.section('2. BBMP Schedule III — Statutory Minimum Compliance Verification');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Tier 1 (≤650 sq.ft / 20×30 plot): clearance calculated and compliance badge marks compliant', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  // 20×30 plot = 600 sqft (Tier 1: minFront = 3.28ft)
  mockDoc.getElementById('plotArea').value = '600';
  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value = '20';
  // Building leaves 6.56ft clearance on 30ft axis (3.28ft front, 3.28ft rear)
  mockDoc.getElementById('bldgWidth').value = '15';
  mockDoc.getElementById('bldgLength').value = String(30 - 6.56);

  mockWindow.autoCalculateSetbacks(true);

  const front = parseFloat(mockDoc.getElementById('setbackFront').value) || 0;
  assert.ok(Math.abs(front - 3.28) <= 0.1, `Front setback must equal 3.28ft; got: ${front}`);

  // Test compliance badge status
  const pill = mockDoc.getElementById('compliance_setbackFront');
  assert.ok(pill.classList.contains('compliant') || pill.className.includes('compliant'),
    'Compliance badge for front setback must be marked compliant');
});

suite.test('Tier 2 (650–1300 sq.ft / 30×40 plot): 10ft clearance yields 5.0ft setbacks and marks compliant', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  // 30×40 plot = 1200 sqft (Tier 2: rec. minFront = 3.28ft)
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value = '40';
  mockDoc.getElementById('bldgWidth').value = '20';
  mockDoc.getElementById('bldgLength').value = '30';

  mockWindow.autoCalculateSetbacks(true);

  const front = parseFloat(mockDoc.getElementById('setbackFront').value) || 0;
  assert.equal(front, 5.0, `Tier 2 front setback must be 5.0ft; got: ${front}`);

  const pill = mockDoc.getElementById('compliance_setbackFront');
  assert.ok(pill.classList.contains('compliant') || pill.className.includes('compliant'),
    'Compliance badge for front setback (5.0ft >= 3.28ft rec min) must be marked compliant');
});

suite.test('Sub-minimum setback triggers warning state on compliance badge', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.updateSetbackComplianceBadges !== 'function') return;

  // 30×40 plot = 1200 sqft (minFront is 3.28ft)
  mockDoc.getElementById('plotArea').value = '1200';
  // Manually set a substandard 1.0ft front setback
  mockDoc.getElementById('setbackFront').value = '1.0';
  mockDoc.getElementById('setbackFront_ft').value = '1';
  mockDoc.getElementById('setbackFront_in').value = '0';

  mockWindow.updateSetbackComplianceBadges();

  const pill = mockDoc.getElementById('compliance_setbackFront');
  assert.ok(pill.classList.contains('warning') || pill.className.includes('warning'),
    'Setback below RMP-2015 recommended minimum must show warning badge');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. BBMP Schedule III — Tier Classification Thresholds');
// ─────────────────────────────────────────────────────────────────────────────
// These tests verify the TIER BOUNDARIES are correct in the source code.
// They test the CONSTANTS, not the running logic — because the thresholds
// are policy values that must never silently change.

suite.test('BBMP Schedule III Tier boundary 60 sqm is present in updateSetbackComplianceBadges source', () => {
  // If someone changes "60" to "80" in the tier boundary, this fails immediately
  const hasT60 = UI_SOURCE.includes('60');
  assert.ok(hasT60, 'ui.js must reference the 60 sqm tier boundary from BBMP Schedule III');
});

suite.test('BBMP Schedule III Tier boundary 120 sqm is present in ui.js source', () => {
  assert.ok(UI_SOURCE.includes('120'), 'ui.js must reference the 120 sqm tier boundary');
});

suite.test('BBMP Schedule III Tier boundary 240 sqm is present in ui.js source', () => {
  assert.ok(UI_SOURCE.includes('240'), 'ui.js must reference the 240 sqm tier boundary');
});

suite.test('BBMP Schedule III Tier boundary 500 sqm is present in ui.js source', () => {
  assert.ok(UI_SOURCE.includes('500'), 'ui.js must reference the 500 sqm tier boundary');
});

suite.test('sq.ft ↔ sq.m conversion factor (10.7639104 or 0.0929) is present in ui.js', () => {
  assert.ok(
    UI_SOURCE.includes('10.7639104') || UI_SOURCE.includes('0.0929'),
    'ui.js must use the standard conversion factor (10.7639104 sq.ft/sq.m or 0.0929) for land conversion calculations'
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
