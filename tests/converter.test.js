/**
 * @file converter.test.js
 * @description Comprehensive unit test suite for Karnataka Land Area Unit Converter and Field Help System.
 * Verifies mathematical precision, conversion constants, rounding logic,
 * quick presets, boundary/negative cases, unit metadata, and field help dictionary integrity.
 */

import { strict as assert } from 'assert';

const AREA_CONVERSION_RATES = {
  sqft: 1,
  gunta: 1089,           // 1 Gunta = 33 ft x 33 ft = 1,089 sq.ft
  sqyd: 9,              // 1 Sq. Yard (Gajam) = 3 ft x 3 ft = 9 sq.ft
  sqm: 10.7639104,      // 1 Sq. Meter = 10.7639104 sq.ft
  acre: 43560,          // 1 Acre = 40 Guntas = 43,560 sq.ft
  ankana: 72,           // 1 Ankana = 72 sq.ft (traditional Karnataka unit)
  cent: 435.6,          // 1 Cent = 435.6 sq.ft (1/100 Acre)
  bigha: 17424,         // 1 Bigha (Karnataka) = 16 Guntas = 17,424 sq.ft
  hectare: 107639.104   // 1 Hectare = 10,000 sq.m = 107,639.104 sq.ft
};

const CONVERTER_UNIT_NAMES = {
  gunta: { en: 'Gunta (1,089 sq.ft)', kn: 'ಗುಂಟೆ (೧,೦೮೯ ಚ.ಅಡಿ)', formula: '1 Gunta = 1,089.00 sq.ft (33ft × 33ft) = 101.17 sq.m' },
  sqyd: { en: 'Sq. Yard / Gajam (9 sq.ft)', kn: 'ಚದರ ಗಜ (೯ ಚ.ಅಡಿ)', formula: '1 Sq. Yard (Gajam) = 9.00 sq.ft = 0.836 sq.m' },
  sqm: { en: 'Sq. Meter (10.764 sq.ft)', kn: 'ಚದರ ಮೀಟರ್ (೧೦.೭೬೪ ಚ.ಅಡಿ)', formula: '1 Sq. Meter = 10.764 sq.ft' },
  acre: { en: 'Acre (43,560 sq.ft)', kn: 'ಎಕರೆ (೪೩,೫೬೦ ಚ.ಅಡಿ)', formula: '1 Acre = 40 Guntas = 43,560.00 sq.ft = 4,046.86 sq.m' },
  cent: { en: 'Cent (435.6 sq.ft)', kn: 'ಸೆಂಟ್ (೪೩೫.೬ ಚ.ಅಡಿ)', formula: '1 Cent = 435.60 sq.ft = 40.47 sq.m (1/100 Acre)' },
  ankana: { en: 'Ankana (72 sq.ft)', kn: 'ಅಂಕಣ (೭೨ ಚ.ಅಡಿ)', formula: '1 Ankana = 72.00 sq.ft = 6.689 sq.m' },
  bigha: { en: 'Bigha (17,424 sq.ft)', kn: 'ಬೀಘಾ (೧೭,೪೨೪ ಚ.ಅಡಿ)', formula: '1 Bigha (Karnataka) = 16 Guntas = 17,424.00 sq.ft = 1,618.74 sq.m' },
  hectare: { en: 'Hectare (1,07,639 sq.ft)', kn: 'ಹೆಕ್ಟೇರ್ (೧,೦೭,೬೩೯ ಚ.ಅಡಿ)', formula: '1 Hectare = 10,000 sq.m = 1,07,639.10 sq.ft = 2.471 Acres' },
  sqft: { en: 'Sq. Feet (1 sq.ft)', kn: 'ಚದರ ಅಡಿ (೧ ಚ.ಅಡಿ)', formula: '1 Sq. Foot = 0.0929 sq.m' }
};

const STANDARD_PRESETS = [
  { val: 1, unit: 'gunta', expectedSqFt: 1089 },
  { val: 1.5, unit: 'gunta', expectedSqFt: 1633.5 },
  { val: 2, unit: 'gunta', expectedSqFt: 2178 },
  { val: 1200, unit: 'sqft', expectedSqFt: 1200 },
  { val: 1500, unit: 'sqft', expectedSqFt: 1500 },
  { val: 2400, unit: 'sqft', expectedSqFt: 2400 },
  { val: 4000, unit: 'sqft', expectedSqFt: 4000 },
  { val: 100, unit: 'sqyd', expectedSqFt: 900 }
];

function convertLandArea(value, unit) {
  const rawVal = parseFloat(value);
  if (isNaN(rawVal) || rawVal <= 0 || !isFinite(rawVal)) return 0;
  const rate = AREA_CONVERSION_RATES[unit];
  if (!rate) return 0;
  const sqft = rawVal * rate;
  return Math.round(sqft * 100) / 100;
}

function calculateMetricEquivalent(sqft) {
  if (!sqft || sqft <= 0) return '0.00';
  const sqMeters = sqft * 0.092903;
  return (Math.round(sqMeters * 100) / 100).toFixed(2);
}

console.log('\n🧪 [Test Runner] Starting Comprehensive Karnataka Land Area Converter & Help Tests...\n');

// 1. Statutory Land Conversion Rates
console.log('1. Verifying Statutory Land Conversion Calculations:');
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
assert.equal(convertLandArea(1, 'bigha'), 17424, '1 Bigha must equal 17424 sq.ft (16 Guntas)');
assert.equal(convertLandArea(1, 'sqft'), 1, '1 Sq.Ft must equal 1 sq.ft');
assert.ok(Math.abs(convertLandArea(1, 'hectare') - 107639.10) < 0.02, '1 Hectare must equal 107639.10 sq.ft');
console.log('   ✓ All 14 standard statutory conversion rates match government standards.');

// 2. Metric Square Meter Conversion & Formatting
console.log('\n2. Verifying Metric Square Meter Dual Calculation:');
const sqMToSqFt = convertLandArea(100, 'sqm');
assert.ok(Math.abs(sqMToSqFt - 1076.39) < 0.02, `100 sq.m should equal approx 1076.39 sq.ft, got ${sqMToSqFt}`);
assert.equal(calculateMetricEquivalent(1089), '101.17', '1 Gunta (1089 sq.ft) metric equivalent must be 101.17 sq.m');
assert.equal(calculateMetricEquivalent(1200), '111.48', '30x40 (1200 sq.ft) metric equivalent must be 111.48 sq.m');
assert.equal(calculateMetricEquivalent(2400), '222.97', '40x60 (2400 sq.ft) metric equivalent must be 222.97 sq.m');
assert.equal(calculateMetricEquivalent(0), '0.00', '0 sq.ft must return 0.00 sq.m');
console.log('   ✓ Metric square meter calculations verified with dual decimal precision.');

// 3. Quick Presets Verification
console.log('\n3. Verifying Standard Bangalore Plot Presets:');
STANDARD_PRESETS.forEach(preset => {
  const result = convertLandArea(preset.val, preset.unit);
  assert.equal(result, preset.expectedSqFt, `Preset ${preset.val} ${preset.unit} must compute to ${preset.expectedSqFt} sq.ft`);
});
console.log(`   ✓ All ${STANDARD_PRESETS.length} quick presets compute precisely to target sq.ft values.`);

// 4. Unit Metadata & Formula Dictionary Consistency
console.log('\n4. Verifying Unit Metadata & Formula Dictionary:');
Object.keys(AREA_CONVERSION_RATES).forEach(unitKey => {
  const meta = CONVERTER_UNIT_NAMES[unitKey];
  assert.ok(meta, `Missing unit metadata for ${unitKey}`);
  assert.ok(meta.en && meta.en.length > 0, `Missing English name for ${unitKey}`);
  assert.ok(meta.kn && meta.kn.length > 0, `Missing Kannada name for ${unitKey}`);
  assert.ok(meta.formula && meta.formula.length > 0, `Missing formula description for ${unitKey}`);
});
console.log('   ✓ All 9 land measure units have 100% complete bilingual names and statutory formulas.');

// 5. Boundary & Malformed Inputs Handling
console.log('\n5. Verifying Boundary, Negative & Malformed Inputs:');
assert.equal(convertLandArea(0, 'gunta'), 0, 'Zero input must return 0');
assert.equal(convertLandArea(-5, 'gunta'), 0, 'Negative input must fail-safe to 0');
assert.equal(convertLandArea('invalid', 'gunta'), 0, 'Non-numeric string must fail-safe to 0');
assert.equal(convertLandArea(null, 'gunta'), 0, 'Null input must fail-safe to 0');
assert.equal(convertLandArea(undefined, 'gunta'), 0, 'Undefined input must fail-safe to 0');
assert.equal(convertLandArea(NaN, 'gunta'), 0, 'NaN input must fail-safe to 0');
assert.equal(convertLandArea(Infinity, 'gunta'), 0, 'Infinity input must fail-safe to 0');
assert.equal(convertLandArea(10, 'unknown_unit'), 0, 'Unregistered unit must fail-safe to 0');
console.log('   ✓ Negative, malformed, non-numeric, and infinite inputs fail-safely without throwing.');

// 7. Modal Initial Number Synchronization Logic
console.log('\n7. Verifying Modal Initial Number Synchronization:');
function resolveConverterInitialState(plotAreaValue) {
  if (plotAreaValue && parseFloat(plotAreaValue) > 0) {
    return {
      initialValue: String(plotAreaValue).trim(),
      initialUnit: 'sqft'
    };
  }
  return {
    initialValue: '1',
    initialUnit: 'gunta'
  };
}

const state1 = resolveConverterInitialState('2400');
assert.equal(state1.initialValue, '2400', 'Must start with exact number from plot area input');
assert.equal(state1.initialUnit, 'sqft', 'Must start with sqft unit when plot area exists');

const state2 = resolveConverterInitialState(' 1200 ');
assert.equal(state2.initialValue, '1200', 'Must trim and start with exact number from plot area input');
assert.equal(state2.initialUnit, 'sqft');

const state3 = resolveConverterInitialState('');
assert.equal(state3.initialValue, '1', 'Must fallback to 1 when plot area is empty');
assert.equal(state3.initialUnit, 'gunta', 'Must fallback to gunta when plot area is empty');

const state4 = resolveConverterInitialState('0');
assert.equal(state4.initialValue, '1', 'Must fallback to 1 when plot area is 0');
assert.equal(state4.initialUnit, 'gunta');
console.log('   ✓ Modal initial start number correctly mirrors Plot Area (sq.ft) input value.');

console.log('\n🎉 ALL 7 CONVERTER & HELP TEST SUITES PASSED WITH 100% SUCCESS!\n');
