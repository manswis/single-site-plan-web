/**
 * @file converter.unit.test.js
 * @description Pure mathematical unit tests for Karnataka statutory land area conversions.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('Karnataka Land Area Converter Math Unit Tests', '📐');

// Statutory conversion factors relative to Square Feet
const SQFT_FACTORS = {
  sqft: 1.0,
  sqm: 10.7639104,
  sqyd: 9.0,
  gunta: 1089.0,         // Karnataka standard (1 Gunta = 1,089 sq.ft)
  cent: 435.6,           // 1 Cent = 435.6 sq.ft
  acre: 43560.0,         // 1 Acre = 43,560 sq.ft (40 Guntas)
  hectare: 107639.104,   // 1 Hectare = 10,000 sq.m
  ankanam: 72.0,         // 1 Ankanam = 72 sq.ft
  ground: 2400.0         // 1 Ground = 2,400 sq.ft
};

function convertArea(value, fromUnit, toUnit) {
  if (value === null || value === undefined || isNaN(value) || value < 0) return 0;
  const fromFactor = SQFT_FACTORS[fromUnit];
  const toFactor = SQFT_FACTORS[toUnit];
  if (!fromFactor || !toFactor) return 0;
  const sqft = value * fromFactor;
  return sqft / toFactor;
}

suite.section('1. Karnataka Gunta Conversions');

suite.test('1 Gunta = 1,089 Sq.Ft exactly', () => {
  const sqft = convertArea(1, 'gunta', 'sqft');
  assert.equal(sqft, 1089.0);
});

suite.test('1 Gunta = 101.171 Sq.Meters', () => {
  const sqm = convertArea(1, 'gunta', 'sqm');
  assert.ok(Math.abs(sqm - 101.171) < 0.01);
});

suite.test('1 Gunta = 121 Sq.Yards', () => {
  const sqyd = convertArea(1, 'gunta', 'sqyd');
  assert.equal(sqyd, 121.0);
});

suite.test('1 Gunta = 2.5 Cents', () => {
  const cents = convertArea(1, 'gunta', 'cent');
  assert.equal(cents, 2.5);
});

suite.section('2. Acre and Hectare Conversions');

suite.test('1 Acre = 40 Guntas exactly', () => {
  const guntas = convertArea(1, 'acre', 'gunta');
  assert.equal(guntas, 40.0);
});

suite.test('1 Acre = 43,560 Sq.Ft exactly', () => {
  const sqft = convertArea(1, 'acre', 'sqft');
  assert.equal(sqft, 43560.0);
});

suite.test('1 Acre = 100 Cents exactly', () => {
  const cents = convertArea(1, 'acre', 'cent');
  assert.equal(cents, 100.0);
});

suite.test('1 Hectare = 2.471 Acres', () => {
  const acres = convertArea(1, 'hectare', 'acre');
  assert.ok(Math.abs(acres - 2.47105) < 0.001);
});

suite.section('3. Traditional South Indian Units (Ankanam, Ground, Cent)');

suite.test('1 Cent = 435.6 Sq.Ft', () => {
  const sqft = convertArea(1, 'cent', 'sqft');
  assert.equal(sqft, 435.6);
});

suite.test('1 Ankanam = 72 Sq.Ft', () => {
  const sqft = convertArea(1, 'ankanam', 'sqft');
  assert.equal(sqft, 72.0);
});

suite.test('1 Ground = 2,400 Sq.Ft', () => {
  const sqft = convertArea(1, 'ground', 'sqft');
  assert.equal(sqft, 2400.0);
});

suite.section('4. Edge Cases, Zero & Negative Handling');

suite.test('Handles 0 input returning 0 across all units', () => {
  assert.equal(convertArea(0, 'gunta', 'sqft'), 0);
  assert.equal(convertArea(0, 'acre', 'sqm'), 0);
});

suite.test('Safely handles null, undefined and negative values', () => {
  assert.equal(convertArea(null, 'gunta', 'sqft'), 0);
  assert.equal(convertArea(undefined, 'gunta', 'sqft'), 0);
  assert.equal(convertArea(-10, 'gunta', 'sqft'), 0);
});

suite.finish();
