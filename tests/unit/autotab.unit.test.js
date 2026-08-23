/**
 * @file autotab.unit.test.js
 * @description Unit tests for ft-in compound dimension parsing and smart auto-tabbing.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('Compound Ft-In Numeric Auto-Tabbing & Parser Unit Tests', '⌨️');

/**
 * Normalizes and parses compound feet-and-inches to decimal feet and meters.
 */
function parseFtInToDecimal(feet, inches) {
  const ft = parseFloat(feet) || 0;
  const inc = parseFloat(inches) || 0;
  if (ft < 0 || inc < 0) return { totalFt: 0, totalM: 0, formatted: "0' 0\"" };
  const normalizedFt = ft + Math.floor(inc / 12);
  const remainingIn = inc % 12;
  const totalFt = ft + (inc / 12.0);
  const totalM = totalFt * 0.3048;
  return {
    feet: normalizedFt,
    inches: remainingIn,
    totalFt: parseFloat(totalFt.toFixed(3)),
    totalM: parseFloat(totalM.toFixed(3)),
    formatted: `${normalizedFt}' ${remainingIn.toFixed(1)}"`
  };
}

/**
 * Checks if input is valid inches (0 to 11.99).
 */
function shouldAutoTab(currentVal, maxLen = 3) {
  if (!currentVal) return false;
  const str = String(currentVal).trim();
  // Auto-tab when 3 digits are entered (e.g. 100 feet) or user pressed decimal
  return str.length >= maxLen;
}

suite.section('1. Compound Feet and Inches Arithmetic');

suite.test("Converts 30' 0\" to 30.0 ft and 9.144 m", () => {
  const result = parseFtInToDecimal(30, 0);
  assert.equal(result.totalFt, 30.0);
  assert.equal(result.totalM, 9.144);
});

suite.test("Converts 40' 6\" to 40.5 ft and 12.344 m", () => {
  const result = parseFtInToDecimal(40, 6);
  assert.equal(result.totalFt, 40.5);
  assert.equal(result.totalM, 12.344);
});

suite.test("Normalizes overflow inches (e.g. 10' 18\" -> 11' 6\")", () => {
  const result = parseFtInToDecimal(10, 18);
  assert.equal(result.feet, 11);
  assert.equal(result.inches, 6);
  assert.equal(result.totalFt, 11.5);
});

suite.section('2. Smart Auto-Tabbing Conditions');

suite.test('Triggers auto-tab when max length reached', () => {
  assert.equal(shouldAutoTab('100', 3), true);
  assert.equal(shouldAutoTab('30', 3), false);
  assert.equal(shouldAutoTab('5', 3), false);
});

suite.test('Handles blank and null input safely', () => {
  assert.equal(shouldAutoTab('', 3), false);
  assert.equal(shouldAutoTab(null, 3), false);
  assert.equal(shouldAutoTab(undefined, 3), false);
});

suite.section('3. Negative and Malformed Number Edge Cases');

suite.test('Rejects negative feet or inches returning safe 0', () => {
  const result1 = parseFtInToDecimal(-30, 0);
  assert.equal(result1.totalFt, 0);
  const result2 = parseFtInToDecimal(30, -5);
  assert.equal(result2.totalFt, 0);
});

suite.finish();
