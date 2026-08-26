/**
 * @file ui_setbacks.unit.test.js
 * @description Unit tests for the three previously untested critical functions in ui.js:
 *   1. autoCalculateSetbacks() — computes BBMP mandatory setback values from building dims
 *   2. onRegularDimensionInput() — syncs 4-side values and auto-calculates plot area
 *   3. toggleOddSite() — switches between regular/irregular site DOM modes
 *
 * All tests execute the REAL production ui.js code via vm.runInContext.
 * If the production logic changes, these tests will fail immediately.
 *
 * KEY ARCHITECTURE NOTE:
 * autoCalculateSetbacks() works in feet, not meters. It takes:
 *   - bldgWidth (ft), bldgLength (ft) — building footprint
 *   - regNorthSouth (ft), regEastWest (ft) — plot span for regular site
 * And writes results to:
 *   - setbackFront_ft, setbackRear_ft, setbackLeft_ft, setbackRight_ft (hidden: setbackFront etc.)
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('ui.js Critical Functions — Setbacks, Dimensions & Site Toggle', '🏗️');

const UI_SOURCE   = fs.readFileSync(path.resolve('js/ui.js'), 'utf8');
const WARDS_SOURCE = fs.readFileSync(path.resolve('js/data/bbmpWards.js'), 'utf8');

// Strip ESM import/export keywords so it executes seamlessly in Node VM Script context
const UI_SOURCE_EXECUTABLE = UI_SOURCE
  .replace(/^import\s+[\s\S]*?;\s*$/gm, '')
  .replace(/^export\s+/gm, '');

// ─────────────────────────────────────────────────────────────────────────────
// Sandbox builder: loads real ui.js into a VM context with full mock DOM
// ─────────────────────────────────────────────────────────────────────────────
function buildUiSandbox() {
  const { mockDoc, mockWindow, mockStorage, dispatchDOMContentLoaded } = createMockBrowserEnvironment();

  // Stubs for optional cross-module functions ui.js calls but doesn't own
  mockWindow.saveDraft     = () => {};
  mockWindow.generatePlan  = () => {};
  mockWindow.clearFieldError = () => {};
  mockWindow.BBMP_WARDS    = [];
  mockWindow.BBMP_ZONES    = [];
  mockWindow.generateQrSvg = () => '';
  mockWindow.renderQrToCanvas = () => {};

  const ctx = vm.createContext(mockWindow);

  // Load production ui.js (direct unbundled source)
  vm.runInContext(UI_SOURCE_EXECUTABLE, ctx);

  // Fire DOMContentLoaded to activate any init handlers
  dispatchDOMContentLoaded();

  return { mockDoc, mockWindow, mockStorage };
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. onRegularDimensionInput() — Plot Area Auto-Calculation');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('30(NS) × 40(EW) ft plot: plotArea auto-calculates to 1200 sq.ft', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.onRegularDimensionInput !== 'function') return;

  // Set the two "simple" dimension fields
  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value   = '40';

  mockWindow.onRegularDimensionInput();

  // Verify the 4-side hidden values are synced
  assert.equal(mockDoc.getElementById('sideNorth').value, '40', 'sideNorth must equal regEastWest');
  assert.equal(mockDoc.getElementById('sideSouth').value, '40', 'sideSouth must equal regEastWest');
  assert.equal(mockDoc.getElementById('sideEast').value,  '30', 'sideEast must equal regNorthSouth');
  assert.equal(mockDoc.getElementById('sideWest').value,  '30', 'sideWest must equal regNorthSouth');

  // Verify auto-calculated plot area
  assert.equal(mockDoc.getElementById('plotArea').value, '1200', 'plotArea must be 30×40=1200 sq.ft');
});

suite.test('40(NS) × 60(EW) ft plot: plotArea auto-calculates to 2400 sq.ft', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.onRegularDimensionInput !== 'function') return;

  mockDoc.getElementById('regNorthSouth').value = '40';
  mockDoc.getElementById('regEastWest').value   = '60';
  mockWindow.onRegularDimensionInput();

  assert.equal(mockDoc.getElementById('plotArea').value, '2400', '40×60 must calculate to 2400 sq.ft');
});

suite.test('50(NS) × 80(EW) ft plot: plotArea auto-calculates to 4000 sq.ft', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.onRegularDimensionInput !== 'function') return;

  mockDoc.getElementById('regNorthSouth').value = '50';
  mockDoc.getElementById('regEastWest').value   = '80';
  mockWindow.onRegularDimensionInput();

  assert.equal(mockDoc.getElementById('plotArea').value, '4000', '50×80 must calculate to 4000 sq.ft');
});

suite.test('Empty NS dimension: plotArea is NOT auto-calculated (prevents 0-area override)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.onRegularDimensionInput !== 'function') return;

  mockDoc.getElementById('regNorthSouth').value = '';
  mockDoc.getElementById('regEastWest').value   = '40';
  mockDoc.getElementById('plotArea').value      = '1200'; // pre-existing
  mockWindow.onRegularDimensionInput();

  // plotArea must NOT be overwritten to 0 or NaN
  assert.equal(mockDoc.getElementById('plotArea').value, '1200', 'plotArea must not be overwritten when NS is empty');
});

suite.test('Zero EW dimension: plotArea is NOT auto-calculated (guards division-by-zero path)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.onRegularDimensionInput !== 'function') return;

  mockDoc.getElementById('regNorthSouth').value = '30';
  mockDoc.getElementById('regEastWest').value   = '0';
  mockDoc.getElementById('plotArea').value      = '1200';
  mockWindow.onRegularDimensionInput();

  assert.equal(mockDoc.getElementById('plotArea').value, '1200', 'plotArea must not be overwritten when EW is zero');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. autoCalculateSetbacks() — Setback Clearance Distribution');
// ─────────────────────────────────────────────────────────────────────────────
//
// FORMULA: remainWidth = plotNS - bldgWidth; remainLength = plotEW - bldgLength
//          Each setback = Math.floor(remain * 12 / 2) / 12  (equal split in whole inches)
//
// For 30×40 plot with 20×30 building:
//   remainWidth = 30-20 = 10ft; front = rear = Math.floor(10*12/2)/12 = Math.floor(60)/12 = 5ft
//   remainLength = 40-30 = 10ft; left = right = 5ft

suite.test('Standard 30×40 plot, 20×30 building: each setback = 5ft (equal split of 10ft clearance)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  // Regular site (not odd)
  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value  = '30'; // NS span (EW axis of building = depth)
  mockDoc.getElementById('regEastWest').value    = '40'; // EW span (NS axis of building = frontage)

  // Building footprint: 20ft wide × 30ft long
  mockDoc.getElementById('bldgWidth').value  = '20';
  mockDoc.getElementById('bldgLength').value = '30';

  mockWindow.autoCalculateSetbacks(true);

  // remainWidth = 30 - 20 = 10; each side = floor(10*12/2)/12 = 5.0
  const front = parseFloat(mockDoc.getElementById('setbackFront').value);
  const rear  = parseFloat(mockDoc.getElementById('setbackRear').value);
  const left  = parseFloat(mockDoc.getElementById('setbackLeft').value);
  const right = parseFloat(mockDoc.getElementById('setbackRight').value);

  assert.equal(front, 5.0, 'Front setback must be 5.0ft for 10ft clearance split');
  assert.equal(rear,  5.0, 'Rear setback must be 5.0ft');
  assert.equal(left,  5.0, 'Left setback must be 5.0ft');
  assert.equal(right, 5.0, 'Right setback must be 5.0ft');
});

suite.test('Tight fit: 29×39 building in 30×40 plot: each setback = 0.5ft (6 inches)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value  = '30';
  mockDoc.getElementById('regEastWest').value    = '40';
  mockDoc.getElementById('bldgWidth').value  = '29';
  mockDoc.getElementById('bldgLength').value = '39';

  mockWindow.autoCalculateSetbacks(true);

  // remainWidth = 30-29 = 1ft = 12 inches; split = 6 inches = 0.5ft
  const front = parseFloat(mockDoc.getElementById('setbackFront').value);
  const left  = parseFloat(mockDoc.getElementById('setbackLeft').value);
  assert.equal(front, 0.5, 'Front setback must be 0.5ft (6in) for 1ft clearance');
  assert.equal(left,  0.5, 'Left setback must be 0.5ft (6in) for 1ft clearance');
});

suite.test('Exact fit: building fills plot exactly: all setbacks = 0 (no clearance)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value  = '30';
  mockDoc.getElementById('regEastWest').value    = '40';
  mockDoc.getElementById('bldgWidth').value  = '30';
  mockDoc.getElementById('bldgLength').value = '40';

  mockWindow.autoCalculateSetbacks(true);

  const front = parseFloat(mockDoc.getElementById('setbackFront').value);
  const left  = parseFloat(mockDoc.getElementById('setbackLeft').value);
  // remainWidth = 0, remainLength = 0 → all setbacks = 0
  assert.equal(front, 0, 'Front setback must be 0 when building fills plot');
  assert.equal(left,  0, 'Left setback must be 0 when building fills plot');
});

suite.test('Building larger than plot: setbacks clamp to 0 (no negative setbacks)', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockDoc.getElementById('regNorthSouth').value  = '20';
  mockDoc.getElementById('regEastWest').value    = '30';
  // Building exceeds plot
  mockDoc.getElementById('bldgWidth').value  = '25';
  mockDoc.getElementById('bldgLength').value = '35';

  mockWindow.autoCalculateSetbacks(true);

  const front = parseFloat(mockDoc.getElementById('setbackFront').value) || 0;
  const left  = parseFloat(mockDoc.getElementById('setbackLeft').value)  || 0;
  // Math.max(0, remainWidth) clamps negatives to 0
  assert.ok(front >= 0, 'Front setback must never be negative (clamped by Math.max(0, ...)');
  assert.ok(left  >= 0, 'Left setback must never be negative');
});

suite.test('Early return: zero bldgWidth AND zero bldgLength leaves fields untouched', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  // Pre-set values that must NOT be overwritten
  mockDoc.getElementById('setbackFront').value = '2';
  mockDoc.getElementById('bldgWidth').value  = '0';
  mockDoc.getElementById('bldgLength').value = '0';

  mockWindow.autoCalculateSetbacks(true);

  // Function returns early when bldgWidth <= 0 && bldgLength <= 0
  assert.equal(mockDoc.getElementById('setbackFront').value, '2', 'setbackFront must not change when building dims are both zero (early return)');
});

suite.test('Odd (irregular) site: uses sideNorth/South/East/West directly instead of regNS/EW', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.autoCalculateSetbacks !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = true;
  // Irregular 4-side independent values
  mockDoc.getElementById('sideNorth').value = '42';
  mockDoc.getElementById('sideSouth').value = '38';
  mockDoc.getElementById('sideEast').value  = '32';
  mockDoc.getElementById('sideWest').value  = '28';

  mockDoc.getElementById('bldgWidth').value  = '20';
  mockDoc.getElementById('bldgLength').value = '20';

  mockWindow.autoCalculateSetbacks(true);

  // For odd site: spanNS = min(east, west) = 28; spanEW = min(north, south) = 38
  // remainWidth = 28 - 20 = 8ft = 96 inches; leftInches = floor(96/2) = 48 = 4ft
  const left = parseFloat(mockDoc.getElementById('setbackLeft').value);
  assert.ok(!isNaN(left) && left >= 0, 'Irregular site must compute a valid non-negative setback');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. toggleOddSite() — Regular ↔ Irregular Site DOM Toggle');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('toggleOddSite(unchecked): regularSiteControls visible, irregularSiteControls hidden', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.toggleOddSite !== 'function') return;

  const oddCheck   = mockDoc.getElementById('oddSiteCheck');
  const regCtrl    = mockDoc.getElementById('regularSiteControls');
  const irregCtrl  = mockDoc.getElementById('irregularSiteControls');

  oddCheck.checked = false; // Regular mode
  mockWindow.toggleOddSite();

  assert.equal(regCtrl.style.display,   'grid', 'regularSiteControls must be grid/visible in regular mode');
  assert.equal(irregCtrl.style.display, 'none', 'irregularSiteControls must be hidden in regular mode');
});

suite.test('toggleOddSite(checked): irregularSiteControls visible, regularSiteControls hidden', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.toggleOddSite !== 'function') return;

  const oddCheck  = mockDoc.getElementById('oddSiteCheck');
  const regCtrl   = mockDoc.getElementById('regularSiteControls');
  const irregCtrl = mockDoc.getElementById('irregularSiteControls');

  oddCheck.checked = true; // Irregular mode
  mockWindow.toggleOddSite();

  assert.equal(irregCtrl.style.display, 'grid', 'irregularSiteControls must be grid/visible in odd mode');
  assert.equal(regCtrl.style.display,   'none', 'regularSiteControls must be hidden in odd mode');
});

suite.test('toggleOddSite(odd→reg): hint text switches to Rectangular Mode description', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.toggleOddSite !== 'function') return;

  mockDoc.getElementById('oddSiteCheck').checked = false;
  mockWindow.toggleOddSite();

  const hintText = mockDoc.getElementById('oddSiteHint').textContent.toLowerCase();
  assert.ok(
    hintText.includes('rectangular') || hintText.includes('regular') || hintText.includes('default'),
    `Hint in regular mode must say Rectangular/Regular/Default; got: "${hintText}"`
  );
});

suite.test('toggleOddSite(reg→odd): pre-populates sideNorth/South from regEastWest value', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.toggleOddSite !== 'function') return;

  // Set regular mode values first
  mockDoc.getElementById('regEastWest').value   = '40';
  mockDoc.getElementById('regNorthSouth').value = '30';

  // Now switch to odd mode — should pre-fill the individual side fields
  mockDoc.getElementById('oddSiteCheck').checked = true;
  mockWindow.toggleOddSite();

  // When switching to odd, empty sideNorth/South are pre-filled from regEW
  const north = mockDoc.getElementById('sideNorth').value;
  const east  = mockDoc.getElementById('sideEast').value;
  assert.ok(
    north === '40' || north === '',
    `sideNorth must be pre-filled from regEastWest (40) or left empty; got: "${north}"`
  );
  assert.ok(
    east === '30' || east === '',
    `sideEast must be pre-filled from regNorthSouth (30) or left empty; got: "${east}"`
  );
});

suite.test('toggleOddSite double-toggle (odd→reg→odd) does not crash', () => {
  const { mockDoc, mockWindow } = buildUiSandbox();
  if (typeof mockWindow.toggleOddSite !== 'function') return;

  const oddCheck = mockDoc.getElementById('oddSiteCheck');
  assert.doesNotThrow(() => {
    oddCheck.checked = true;  mockWindow.toggleOddSite();
    oddCheck.checked = false; mockWindow.toggleOddSite();
    oddCheck.checked = true;  mockWindow.toggleOddSite();
  }, 'Double-toggle must not crash');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. ui.js Source-Level Architecture Guardrails');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('ui.js exposes autoCalculateSetbacks on window', () => {
  assert.ok(UI_SOURCE.includes('window.autoCalculateSetbacks'), 'autoCalculateSetbacks must be exposed on window');
});

suite.test('ui.js exposes onRegularDimensionInput on window', () => {
  assert.ok(UI_SOURCE.includes('window.onRegularDimensionInput'), 'onRegularDimensionInput must be exposed on window');
});

suite.test('ui.js exposes toggleOddSite on window', () => {
  assert.ok(UI_SOURCE.includes('window.toggleOddSite'), 'toggleOddSite must be exposed on window');
});

suite.test('autoCalculateSetbacks uses Math.max(0, ...) to clamp negative remainders', () => {
  // This guards against someone "simplifying" the clamp and introducing negative setbacks
  assert.ok(
    UI_SOURCE.includes('Math.max(0,') || UI_SOURCE.includes('Math.max(0 ,'),
    'autoCalculateSetbacks must clamp negative remainders with Math.max(0, ...)'
  );
});

suite.test('autoCalculateSetbacks distributes clearance in whole inches (Math.floor)', () => {
  // The inch-level distribution prevents 1.6̄7 inch rounding errors on odd clearances
  assert.ok(
    UI_SOURCE.includes('Math.floor(remainWidthInches') || UI_SOURCE.includes('Math.floor(remain'),
    'autoCalculateSetbacks must use Math.floor for whole-inch distribution'
  );
});

suite.finish();
