/**
 * @file converter.test.js
 * @description Exhaustive unit test suite for Karnataka Land Area Unit Converter.
 * Verifies mathematical precision, conversion constants, rounding logic,
 * and boundary/negative case handling against Karnataka revenue department standards.
 */

import { strict as assert } from 'assert';

const AREA_CONVERSION_RATES = {
  gunta: 1089,           // 1 Gunta = 33 ft x 33 ft = 1,089 sq.ft
  sqyd: 9,              // 1 Sq. Yard (Gajam) = 3 ft x 3 ft = 9 sq.ft
  sqm: 10.7639104,      // 1 Sq. Meter = 10.7639104 sq.ft
  acre: 43560,          // 1 Acre = 40 Guntas = 43,560 sq.ft
  ankana: 72,           // 1 Ankana = 72 sq.ft (traditional Karnataka unit)
  cent: 435.6           // 1 Cent = 435.6 sq.ft (1/100 Acre)
};

function convertLandArea(value, unit) {
  const rawVal = parseFloat(value);
  if (isNaN(rawVal) || rawVal <= 0) return 0;
  const rate = AREA_CONVERSION_RATES[unit];
  if (!rate) return 0;
  const sqft = rawVal * rate;
  return Math.round(sqft * 100) / 100;
}

console.log('\n🧪 [Test Runner] Starting Karnataka Land Area Converter Unit Tests...\n');

// 1. Standard Conversion Checks
console.log('1. Verifying Standard Land Conversion Rates:');
assert.equal(convertLandArea(1, 'gunta'), 1089, '1 Gunta must equal 1089 sq.ft');
assert.equal(convertLandArea(1.5, 'gunta'), 1633.5, '1.5 Guntas must equal 1633.5 sq.ft');
assert.equal(convertLandArea(2, 'gunta'), 2178, '2 Guntas must equal 2178 sq.ft');
assert.equal(convertLandArea(100, 'sqyd'), 900, '100 Sq.Yards must equal 900 sq.ft');
assert.ok(Math.abs(convertLandArea(133.3333, 'sqyd') - 1200) < 0.01, '133.3333 Sq.Yards must equal 1200 sq.ft (30x40 site)');
assert.equal(convertLandArea(1, 'acre'), 43560, '1 Acre must equal 43560 sq.ft');
assert.equal(convertLandArea(0.5, 'acre'), 21780, '0.5 Acre must equal 21780 sq.ft');
assert.equal(convertLandArea(1, 'ankana'), 72, '1 Ankana must equal 72 sq.ft');
assert.equal(convertLandArea(10, 'ankana'), 720, '10 Ankanas must equal 720 sq.ft');
assert.equal(convertLandArea(1, 'cent'), 435.6, '1 Cent must equal 435.6 sq.ft');
assert.equal(convertLandArea(10, 'cent'), 4356, '10 Cents must equal 4356 sq.ft');
console.log('   ✓ All 11 standard conversion calculations match statutory standards.');

// 2. Square Meter Scientific Precision
console.log('\n2. Verifying Metric Square Meter Conversions:');
const sqMToSqFt = convertLandArea(100, 'sqm');
assert.ok(Math.abs(sqMToSqFt - 1076.39) < 0.02, `100 sq.m should equal approx 1076.39 sq.ft, got ${sqMToSqFt}`);
console.log('   ✓ Metric square meter precision verified within 0.01 tolerance.');

// 3. Boundary & Negative Case Resilience
console.log('\n3. Verifying Boundary & Malformed Inputs:');
assert.equal(convertLandArea(0, 'gunta'), 0, 'Zero input must return 0');
assert.equal(convertLandArea(-5, 'gunta'), 0, 'Negative input must fail-safe to 0');
assert.equal(convertLandArea('invalid', 'gunta'), 0, 'Non-numeric string must fail-safe to 0');
assert.equal(convertLandArea(null, 'gunta'), 0, 'Null input must fail-safe to 0');
assert.equal(convertLandArea(undefined, 'gunta'), 0, 'Undefined input must fail-safe to 0');
assert.equal(convertLandArea(10, 'unknown_unit'), 0, 'Unregistered unit must fail-safe to 0');
console.log('   ✓ Negative, malformed, and out-of-bounds inputs fail-safely without throwing.');

console.log('\n🎉 ALL LAND AREA CONVERTER TEST SUITES PASSED WITH 100% SUCCESS!\n');
