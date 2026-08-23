/**
 * @file wards.unit.test.js
 * @description Comprehensive unit tests for BBMP Ward Directory database and search engine.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { BBMP_WARDS, BBMP_ZONES } from '../../js/data/bbmpWards.js';

const suite = new TestSuite('BBMP Wards Directory & Search Unit Tests', '🏛️');

const OFFICIAL_BBMP_ZONES = [
  'East',
  'West',
  'South',
  'Mahadevapura',
  'Yelahanka',
  'Rajarajeshwari Nagar',
  'Dasarahalli',
  'Bommanahalli'
];

suite.section('1. Statutory Database Completeness');

suite.test('Contains all 198 official BBMP wards without missing records', () => {
  assert.equal(BBMP_WARDS.length, 198, `BBMP Wards database must contain exactly 198 wards (got ${BBMP_WARDS.length})`);
});

suite.test('Every ward has valid wardNo, nameEn, nameKn, and zone', () => {
  BBMP_WARDS.forEach(w => {
    assert.ok(w.wardNo >= 1 && w.wardNo <= 198, `Ward number ${w.wardNo} out of range [1, 198]`);
    assert.ok(w.nameEn && w.nameEn.trim().length > 0, `Ward ${w.wardNo} missing English name`);
    assert.ok(w.nameKn && w.nameKn.trim().length > 0, `Ward ${w.wardNo} missing Kannada name`);
    assert.ok(OFFICIAL_BBMP_ZONES.includes(w.zone), `Ward ${w.wardNo} has invalid zone '${w.zone}'`);
  });
});

suite.test('Ward numbers are strictly unique from 1 to 198', () => {
  const seenNumbers = new Set();
  BBMP_WARDS.forEach(w => {
    assert.ok(!seenNumbers.has(w.wardNo), `Duplicate ward number detected: ${w.wardNo}`);
    seenNumbers.add(w.wardNo);
  });
  assert.equal(seenNumbers.size, 198);
});

suite.section('2. Zone Distribution & Filtering');

suite.test('All 8 BBMP Administrative Zones are populated with wards', () => {
  OFFICIAL_BBMP_ZONES.forEach(zone => {
    const wardsInZone = BBMP_WARDS.filter(w => w.zone === zone);
    assert.ok(wardsInZone.length > 0, `Zone '${zone}' has 0 wards assigned!`);
  });
});

suite.section('3. Search Engine & Keyword Matching');

suite.test('Finds wards by exact number (e.g. 112 -> Domlur)', () => {
  const results = BBMP_WARDS.filter(w => w.wardNo === 112);
  assert.ok(results.length > 0);
  assert.equal(results[0].wardNo, 112);
  assert.equal(results[0].nameEn, 'Domlur');
});

suite.test('Finds wards by English locality name (e.g. "Indiranagar")', () => {
  const results = BBMP_WARDS.filter(w => w.nameEn.toLowerCase().includes('indiranagar') || (w.keywords && w.keywords.some(k => k.includes('indiranagar'))));
  assert.ok(results.length > 0, 'Searching for "Indiranagar" must return matching wards');
});

suite.test('Finds wards by Kannada locality name (e.g. "ಶಾಂತಿನಗರ")', () => {
  const results = BBMP_WARDS.filter(w => w.nameKn.includes('ಶಾಂತಿ'));
  assert.ok(results.length > 0, 'Searching in Kannada must return matching wards');
});

suite.test('Returns empty array safely for non-matching queries', () => {
  const results = BBMP_WARDS.filter(w => w.nameEn.toLowerCase().includes('nonexistentplace999xyz'));
  assert.equal(results.length, 0);
});

suite.finish();
