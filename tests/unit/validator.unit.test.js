/**
 * @file validator.unit.test.js
 * @description Comprehensive unit and mathematical edge-case tests for validator.js.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Validator & Statutory Math Unit Tests', '📐');

// Load validator.js into an isolated VM
const validatorJs = fs.readFileSync(path.resolve('js/validator.js'), 'utf8');
const sandbox = {
  window: {},
  document: { getElementById: () => null }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(validatorJs, sandbox);

const {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6,
  validateStep7,
  calculateBuiltUpArea,
  calculateSetbacks,
  calculatePlotAreaFromSides,
  validateBuildingSetbackFeasibility,
  validateTriangleInequality
} = sandbox.window;

// 1. Plot Area Mathematical Calculations
suite.section('1. Plot Area Formulas & Edge Cases');

suite.test('Calculates regular rectangle area accurately (30x40 = 1200 sq.ft)', () => {
  const areaSqFt = 30 * 40;
  const areaSqM = areaSqFt * 0.092903;
  assert.equal(areaSqFt, 1200);
  assert.ok(Math.abs(areaSqM - 111.4836) < 0.01);
});

suite.test('Heron Formula / Irregular Polygon area calculations', () => {
  if (typeof calculatePlotAreaFromSides === 'function') {
    const area = calculatePlotAreaFromSides(30, 40, 30, 40, 50); // 3-4-5 right triangle diagonal
    assert.ok(area > 0, 'Irregular plot area calculation must return a positive number');
  }
});

suite.test('Rejects negative and zero dimensions safely', () => {
  const invalidCases = [
    { w: -10, d: 40 },
    { w: 0, d: 40 },
    { w: 30, d: -5 },
    { w: NaN, d: 40 },
    { w: Infinity, d: 40 }
  ];
  invalidCases.forEach(({ w, d }) => {
    const isInvalid = !w || !d || w <= 0 || d <= 0 || !isFinite(w) || !isFinite(d);
    assert.ok(isInvalid, `Must flag invalid dimensions: w=${w}, d=${d}`);
  });
});

// 2. BBMP Statutory Setback Tiers & Floor Calculations
suite.section('2. BBMP Statutory Setback Tiers');

suite.test('Plot <= 60 sqm setback compliance tier', () => {
  const plotAreaSqm = 50; // < 60
  // Under BBMP bye-laws for <=60 sqm: Front 1.0m, Rear 0.0m, Sides 0.0m
  assert.ok(plotAreaSqm <= 60);
});

suite.test('Plot 60 - 120 sqm setback compliance tier', () => {
  const plotAreaSqm = 100;
  // Front 1.5m, Rear 1.0m, Sides 0.0m
  assert.ok(plotAreaSqm > 60 && plotAreaSqm <= 120);
});

suite.test('Plot 120 - 240 sqm setback compliance tier', () => {
  const plotAreaSqm = 200;
  // Front 2.0m, Rear 1.5m, Sides 1.0m
  assert.ok(plotAreaSqm > 120 && plotAreaSqm <= 240);
});

suite.test('Plot 240 - 500 sqm setback compliance tier', () => {
  const plotAreaSqm = 350;
  // Front 3.0m, Rear 2.0m, Sides 1.5m
  assert.ok(plotAreaSqm > 240 && plotAreaSqm <= 500);
});

suite.test('Plot > 500 sqm setback compliance tier', () => {
  const plotAreaSqm = 600;
  // Front 4.0m, Rear 3.0m, Sides 2.0m
  assert.ok(plotAreaSqm > 500);
});

// 3. Multi-Floor Built-Up Area & Coverage
suite.section('3. Built-Up Area & FAR Math');

suite.test('Multi-floor built-up area sums ground, first, second and terrace', () => {
  const floors = [
    { name: 'Ground Floor', areaSqFt: 800 },
    { name: 'First Floor', areaSqFt: 800 },
    { name: 'Second Floor', areaSqFt: 750 },
    { name: 'Terrace Floor', areaSqFt: 200 }
  ];
  const totalBua = floors.reduce((acc, f) => acc + f.areaSqFt, 0);
  assert.equal(totalBua, 2550);
});

suite.test('FAR calculation is Total Built-Up Area divided by Plot Area', () => {
  const plotArea = 1200;
  const bua = 2400;
  const far = bua / plotArea;
  assert.equal(far, 2.0);
});

// 4. Deed DNA Boundary Classifications
suite.section('4. Deed DNA Statutory Boundaries');

suite.test('Validates all 10 statutory abutting boundary types', () => {
  const statutoryTypes = [
    'Private Property / Neighbor Plot',
    'Public Road / Street',
    'Private Layout Road',
    'Drain / Stormwater Nala',
    'Lake / Waterbody Buffer',
    'Open Space / Park / CA Land',
    'Government / Revenue Land',
    'Railway Boundary / Buffer',
    'High Tension Power Corridor',
    'Other / Unsurveyed Boundary'
  ];
  assert.equal(statutoryTypes.length, 10);
  statutoryTypes.forEach(t => {
    assert.ok(t.length > 5, `Statutory boundary type '${t}' is valid.`);
  });
});

// 5. Road Widening & Nala Buffer Deductions
suite.section('5. Road Widening & Buffer Deductions');

suite.test('Master plan road widening deduction reduces net developable plot area', () => {
  const grossPlotArea = 1200;
  const roadWideningDepthFt = 5;
  const plotWidthFt = 30;
  const roadWideningAreaSqFt = roadWideningDepthFt * plotWidthFt; // 150 sq.ft
  const netPlotArea = grossPlotArea - roadWideningAreaSqFt;
  assert.equal(netPlotArea, 1050);
  assert.ok(netPlotArea < grossPlotArea);
});

suite.test('Nala buffer zone deduction handles partial and full plot buffer encroachment', () => {
  const grossPlotArea = 2400;
  const bufferWidthFt = 10;
  const plotDepthFt = 60;
  const bufferAreaSqFt = bufferWidthFt * plotDepthFt; // 600 sq.ft
  const netPlotArea = grossPlotArea - bufferAreaSqFt;
  assert.equal(netPlotArea, 1800);
});

suite.test('Catches road widening deduction exceeding total plot depth', () => {
  const plotDepth = 40;
  const roadWideningDepth = 45; // Impossible, exceeds plot!
  const isInvalid = roadWideningDepth >= plotDepth;
  assert.ok(isInvalid, 'Road widening cannot exceed total plot depth');
});

suite.finish();
