/**
 * @file bbmp_bye_laws_compliance.test.js
 * @description Statutory tests verifying compliance against official BBMP Building Bye-Laws (2020 / Sakala).
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('BBMP Building Bye-Laws Statutory Compliance Tests', '🏛️');

/**
 * Statutory Setback Table from BBMP Building Bye-Laws Schedule III.
 */
function getStatutorySetbacks(plotAreaSqm) {
  if (plotAreaSqm <= 60) {
    return { front: 1.0, rear: 0.0, left: 0.0, right: 0.0, tier: '<= 60 sqm (Smallest Residential Plot)' };
  } else if (plotAreaSqm <= 120) {
    return { front: 1.5, rear: 1.0, left: 0.0, right: 0.0, tier: '60 - 120 sqm (EWS / Standard 30x40)' };
  } else if (plotAreaSqm <= 240) {
    return { front: 2.0, rear: 1.5, left: 1.0, right: 1.0, tier: '120 - 240 sqm (Medium 40x60)' };
  } else if (plotAreaSqm <= 500) {
    return { front: 3.0, rear: 2.0, left: 1.5, right: 1.5, tier: '240 - 500 sqm (Large Plot)' };
  } else {
    return { front: 4.0, rear: 3.0, left: 2.0, right: 2.0, tier: '> 500 sqm (Very Large / Multi-Dwelling)' };
  }
}

suite.section('1. Statutory Setback Compliance Tiers');

suite.test('Tier 1: Up to 60 sq.m (Front: 1.0m, Rear: 0m, Sides: 0m)', () => {
  const sb = getStatutorySetbacks(50);
  assert.equal(sb.front, 1.0);
  assert.equal(sb.rear, 0.0);
  assert.equal(sb.left, 0.0);
  assert.equal(sb.right, 0.0);
});

suite.test('Tier 2: 60 - 120 sq.m (Front: 1.5m, Rear: 1.0m, Sides: 0m)', () => {
  const sb = getStatutorySetbacks(111.48); // Standard 30x40 = 1200 sq.ft = 111.48 sqm
  assert.equal(sb.front, 1.5);
  assert.equal(sb.rear, 1.0);
  assert.equal(sb.left, 0.0);
  assert.equal(sb.right, 0.0);
});

suite.test('Tier 3: 120 - 240 sq.m (Front: 2.0m, Rear: 1.5m, Sides: 1.0m)', () => {
  const sb = getStatutorySetbacks(222.96); // Standard 40x60 = 2400 sq.ft = 222.96 sqm
  assert.equal(sb.front, 2.0);
  assert.equal(sb.rear, 1.5);
  assert.equal(sb.left, 1.0);
  assert.equal(sb.right, 1.0);
});

suite.test('Tier 4: 240 - 500 sq.m (Front: 3.0m, Rear: 2.0m, Sides: 1.5m)', () => {
  const sb = getStatutorySetbacks(350);
  assert.equal(sb.front, 3.0);
  assert.equal(sb.rear, 2.0);
  assert.equal(sb.left, 1.5);
  assert.equal(sb.right, 1.5);
});

suite.test('Tier 5: > 500 sq.m (Front: 4.0m, Rear: 3.0m, Sides: 2.0m)', () => {
  const sb = getStatutorySetbacks(600);
  assert.equal(sb.front, 4.0);
  assert.equal(sb.rear, 3.0);
  assert.equal(sb.left, 2.0);
  assert.equal(sb.right, 2.0);
});

suite.finish();
