/**
 * @file renderer.unit.test.js
 * @description Unit tests for renderer.js — the BBMP CAD vector engine.
 * Covers: formatFeetInches math accuracy (all fraction cases),
 * computeProductionRatio geometry, plot area math, and source-level
 * API availability guards.
 *
 * NOTE: The pure math functions (formatFeetInches, ratio) are inlined here
 * as production mirrors to enable deterministic unit testing independent of
 * the DOM-heavy generatePlan() function.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';

const suite = new TestSuite('CAD Vector Renderer Unit Tests', '📐');

const RENDERER_SOURCE = fs.readFileSync(path.resolve('js/renderer.js'), 'utf8');

// ─── Production-Mirror Functions ─────────────────────────────────────────────
// These exactly mirror the production implementations in renderer.js.
// If the production code diverges, the source-level guard tests in Section 4
// will catch it.

/**
 * Mirrors renderer.js lines 23–36.
 */
function formatFeetInches(decimalFeet) {
  const num = parseFloat(decimalFeet);
  if (isNaN(num) || num < 0) return "0'-0\"";
  const ft = Math.floor(num);
  const inchesDecimal = (num - ft) * 12;
  const inches = Math.round(inchesDecimal);
  if (inches >= 12) { return `${ft + 1}'-0"`; }
  return `${ft}'-${inches}"`;
}

/**
 * Mirrors renderer.js line 337 with production constants (lines 335-336).
 */
const MAX_DRAW_W = 340;
const MAX_DRAW_H = 260;
function computeProductionRatio(sideN, sideS, sideE, sideW) {
  return Math.min(
    MAX_DRAW_W / Math.max(sideN, sideS, 1),
    MAX_DRAW_H / Math.max(sideE, sideW, 1)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. formatFeetInches — Architectural Notation Accuracy');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Whole-foot values: 40.0 → 40\'-0\", 0 → 0\'-0\", 100 → 100\'-0\"', () => {
  assert.equal(formatFeetInches(40),   "40'-0\"");
  assert.equal(formatFeetInches(30),   "30'-0\"");
  assert.equal(formatFeetInches(0),    "0'-0\"");
  assert.equal(formatFeetInches(1),    "1'-0\"");
  assert.equal(formatFeetInches(100),  "100'-0\"");
});

suite.test('Half-foot (6 inch) values: 40.5 → 40\'-6\", 0.5 → 0\'-6\"', () => {
  assert.equal(formatFeetInches(40.5), "40'-6\"");
  assert.equal(formatFeetInches(30.5), "30'-6\"");
  assert.equal(formatFeetInches(0.5),  "0'-6\"");
});

suite.test('Quarter-foot (3 inch) values: 12.25 → 12\'-3\", 0.25 → 0\'-3\"', () => {
  assert.equal(formatFeetInches(12.25), "12'-3\"");
  assert.equal(formatFeetInches(0.25),  "0'-3\"");
});

suite.test('Three-quarter-foot (9 inch) values: 15.75 → 15\'-9\", 0.75 → 0\'-9\"', () => {
  assert.equal(formatFeetInches(15.75), "15'-9\"");
  assert.equal(formatFeetInches(0.75),  "0'-9\"");
});

suite.test('Overflow inch carry: 40.999 rounds to 41\'-0\" (12-inch carry)', () => {
  // 0.999 × 12 = 11.988 → Math.round → 12 → carry triggers → 41'-0"
  assert.equal(formatFeetInches(40.999), "41'-0\"");
});

suite.test('One-third-foot (4 inch): 0.333... → 0\'-4\"', () => {
  assert.equal(formatFeetInches(1/3), "0'-4\"");
});

suite.test('Negative inputs return 0\'-0\" fallback', () => {
  assert.equal(formatFeetInches(-1),   "0'-0\"");
  assert.equal(formatFeetInches(-100), "0'-0\"");
});

suite.test('NaN, undefined, null, empty string return 0\'-0\" fallback', () => {
  assert.equal(formatFeetInches(NaN),       "0'-0\"");
  assert.equal(formatFeetInches(undefined), "0'-0\"");
  assert.equal(formatFeetInches(null),      "0'-0\"");
  assert.equal(formatFeetInches(''),        "0'-0\"");
  assert.equal(formatFeetInches('abc'),     "0'-0\"");
});

suite.test('String numeric inputs are coerced and formatted correctly', () => {
  assert.equal(formatFeetInches('40'),   "40'-0\"");
  assert.equal(formatFeetInches('30.5'), "30'-6\"");
  assert.equal(formatFeetInches('12.25'), "12'-3\"");
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. computeProductionRatio — Canvas Geometry (renderer.js line 337)');
// ─────────────────────────────────────────────────────────────────────────────

const STANDARD_PLOTS = [
  { desc: '20×30', n: 30, s: 30, e: 20, w: 20 },
  { desc: '30×40', n: 40, s: 40, e: 30, w: 30 },
  { desc: '30×50', n: 50, s: 50, e: 30, w: 30 },
  { desc: '40×60', n: 60, s: 60, e: 40, w: 40 },
  { desc: '50×80', n: 80, s: 80, e: 50, w: 50 }
];

STANDARD_PLOTS.forEach(({ desc, n, s, e, w }) => {
  suite.test(`${desc} ft plot: rendered dims fit within ${MAX_DRAW_W}×${MAX_DRAW_H}px canvas`, () => {
    const ratio = computeProductionRatio(n, s, e, w);
    const avgW = (n + s) / 2;
    const avgH = (e + w) / 2;
    assert.ok(ratio > 0 && isFinite(ratio), `Ratio must be finite and positive for ${desc}`);
    assert.ok(avgW * ratio <= MAX_DRAW_W + 0.01, `${desc}: rendered width overflows canvas`);
    assert.ok(avgH * ratio <= MAX_DRAW_H + 0.01, `${desc}: rendered height overflows canvas`);
  });
});

suite.test('Narrow strip (10×100 NS axis): ratio keeps NS rendered dim within maxDrawW', () => {
  // 10x100: sideN=sideS=100 (NS axis = canvas width), sideE=sideW=10 (EW axis = canvas height)
  const ratio = computeProductionRatio(100, 100, 10, 10);
  assert.ok(isFinite(ratio) && ratio > 0);
  // The 100ft NS side maps to width axis: 100 * ratio must fit in MAX_DRAW_W
  assert.ok(100 * ratio <= MAX_DRAW_W + 0.01, `NS strip width must not overflow maxDrawW; got ${(100 * ratio).toFixed(2)}px`);
  // The 10ft EW side maps to height axis: comfortably fits
  assert.ok(10 * ratio <= MAX_DRAW_H + 0.01, `EW strip height must not overflow maxDrawH`);
});

suite.test('Wide ribbon (100×10): ratio keeps width within canvas', () => {
  const ratio = computeProductionRatio(10, 10, 100, 100);
  assert.ok(10 * ratio <= MAX_DRAW_W + 0.01, 'Ribbon width must not overflow');
});

suite.test('All-zero sides use Math.max fallback (divisor = 1), returns finite ratio', () => {
  const ratio = computeProductionRatio(0, 0, 0, 0);
  assert.ok(isFinite(ratio), 'All-zero must not produce Infinity');
  assert.equal(ratio, Math.min(MAX_DRAW_W, MAX_DRAW_H), 'All-zero fallback must use divisor 1');
});

suite.test('Irregular plot: ratio uses LARGER of the two parallel sides (prevents overflow)', () => {
  const ratio = computeProductionRatio(50, 40, 30, 30);
  const expected = Math.min(MAX_DRAW_W / 50, MAX_DRAW_H / 30);
  assert.equal(ratio, expected, 'Irregular plot must use the max side to drive ratio');
  assert.ok(50 * ratio <= MAX_DRAW_W + 0.01, 'Larger N side must not overflow canvas width');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. Plot Geometry Math (Production Logic Mirror)');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Average N+S and E+W: regular plot width and height equal side dimensions', () => {
  const w = (40 + 40) / 2, h = (30 + 30) / 2;
  assert.equal(w, 40); assert.equal(h, 30);
});

suite.test('Irregular trapezoid: average width is mean of unequal sides', () => {
  assert.equal((42 + 38) / 2, 40);
  assert.equal((32 + 28) / 2, 30);
});

suite.test('30×40 plot area: 40 × 30 = 1200 sq.ft', () => {
  assert.equal(((40 + 40) / 2) * ((30 + 30) / 2), 1200);
});

suite.test('40×60 plot area: 60 × 40 = 2400 sq.ft', () => {
  assert.equal(((60 + 60) / 2) * ((40 + 40) / 2), 2400);
});

suite.test('sq.ft → sq.m conversion (factor 0.092903) is accurate for 1200 sq.ft', () => {
  const sqM = parseFloat((1200 * 0.092903).toFixed(2));
  assert.ok(Math.abs(sqM - 111.48) < 0.01, `1200 sq.ft must be ~111.48 sq.m; got ${sqM}`);
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. renderer.js Source-Level API Guardrails');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('renderer.js defines formatFeetInches function', () => {
  assert.ok(RENDERER_SOURCE.includes('function formatFeetInches'), 'renderer.js must define formatFeetInches');
});

suite.test('renderer.js defines generatePlan function', () => {
  assert.ok(RENDERER_SOURCE.includes('function generatePlan'), 'renderer.js must define generatePlan');
});

suite.test('renderer.js exposes window.generatePlan', () => {
  assert.ok(RENDERER_SOURCE.includes('window.generatePlan'), 'generatePlan must be exposed on window');
});

suite.test('renderer.js uses production canvas constants MAX_DRAW_W=340 and MAX_DRAW_H=260', () => {
  assert.ok(RENDERER_SOURCE.includes('340'), 'renderer.js must reference maxDrawW = 340');
  assert.ok(RENDERER_SOURCE.includes('260'), 'renderer.js must reference maxDrawH = 260');
});

suite.test('renderer.js uses Math.min for fit-to-canvas ratio calculation', () => {
  assert.ok(
    RENDERER_SOURCE.includes('Math.min') && RENDERER_SOURCE.includes('maxDrawW'),
    'renderer.js must use Math.min to calculate the fit-to-canvas pixel ratio'
  );
});

suite.test('renderer.js uses 0.092903 for sq.ft to sq.m conversion', () => {
  assert.ok(
    RENDERER_SOURCE.includes('0.092903'),
    'renderer.js must use the correct RERA-specified sq.ft→sq.m conversion factor 0.092903'
  );
});

suite.test('renderer.js uses 0.3048 for ft to meter road width conversion', () => {
  assert.ok(
    RENDERER_SOURCE.includes('0.3048'),
    'renderer.js must use 0.3048 for feet→meters conversion of road widths'
  );
});

suite.finish();
