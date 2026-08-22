/**
 * @file ward.test.js
 * @description Exhaustive Unit Tests for the BBMP Zone & Ward Auto-Suggest Directory.
 */

import { strict as assert } from 'assert';
import { BBMP_ZONES, BBMP_WARDS } from '../js/data/bbmpWards.js';

console.log('\n🏛️ [Test Runner] Starting BBMP Zone & Ward Auto-Suggest Directory Unit Tests...\n');

// 1. Verify Zones Definition
console.log('1. Verifying BBMP Zones Structure:');
assert(Array.isArray(BBMP_ZONES), 'BBMP_ZONES must be an array');
assert(BBMP_ZONES.length >= 9, 'Must define all 8 BBMP zones plus "all"');

const validZoneIds = ['all', 'East', 'West', 'South', 'Mahadevapura', 'Yelahanka', 'Dasarahalli', 'Bommanahalli', 'Rajarajeshwari Nagar'];
validZoneIds.forEach(id => {
  const found = BBMP_ZONES.find(z => z.id === id);
  assert(found, `Zone ${id} must exist in BBMP_ZONES`);
  assert(found.nameEn && found.nameEn.length > 0, `Zone ${id} must have English name`);
  assert(found.nameKn && found.nameKn.length > 0, `Zone ${id} must have Kannada name`);
});
console.log('   ✓ All 8 BBMP Administrative Zones verified with bilingual metadata.');

// 2. Verify Ward Directory Integrity
console.log('\n2. Verifying Ward Directory Data Integrity:');
assert(Array.isArray(BBMP_WARDS), 'BBMP_WARDS must be an array');
assert(BBMP_WARDS.length >= 70, `Directory contains ${BBMP_WARDS.length} curated key wards`);

BBMP_WARDS.forEach(w => {
  assert(typeof w.wardNo === 'number' && w.wardNo > 0 && w.wardNo <= 243, `Invalid ward number: ${w.wardNo}`);
  assert(typeof w.nameEn === 'string' && w.nameEn.trim().length > 0, `Missing English name for ward ${w.wardNo}`);
  assert(typeof w.nameKn === 'string' && w.nameKn.trim().length > 0, `Missing Kannada name for ward ${w.wardNo}`);
  assert(validZoneIds.includes(w.zone), `Ward ${w.wardNo} has invalid zone: ${w.zone}`);
  assert(Array.isArray(w.keywords) && w.keywords.length > 0, `Ward ${w.wardNo} must have search keywords`);
});
console.log(`   ✓ ${BBMP_WARDS.length} BBMP Wards verified with 100% valid schema and Kannada translations.`);

// 3. Testing Search & Autocomplete Matching Logic
console.log('\n3. Testing Search Query & Landmark Matching:');

function searchWards(query, zoneFilter = 'all') {
  const q = (query || '').trim().toLowerCase();
  return BBMP_WARDS.filter(w => {
    if (zoneFilter !== 'all' && w.zone !== zoneFilter) return false;
    if (!q) return true;
    if (w.wardNo.toString().includes(q)) return true;
    if (w.nameEn.toLowerCase().includes(q)) return true;
    if (w.nameKn && w.nameKn.toLowerCase().includes(q)) return true;
    if (w.keywords && w.keywords.some(k => k.toLowerCase().includes(q))) return true;
    if (w.zone.toLowerCase().includes(q)) return true;
    if (w.subZone && w.subZone.toLowerCase().includes(q)) return true;
    return false;
  });
}

// Test Specific Statutory Ward Mappings (e-Aasthi Portal)
const ward53 = BBMP_WARDS.find(w => w.wardNo === 53);
assert(ward53 && ward53.nameEn === 'Basavanapura' && ward53.zone === 'Mahadevapura', 'Ward 53 must be Basavanapura in Mahadevapura Zone');
assert(ward53.subZone === 'K R Pura', 'Ward 53 must have subZone K R Pura');

// Test e-Aasthi Sub-Zone Search
const krPuraResults = searchWards('K R Pura');
assert(krPuraResults.some(w => w.wardNo === 53), 'Searching K R Pura must return Ward 53 (Basavanapura)');

const krPuraNoSpace = searchWards('KR Pura');
assert(krPuraNoSpace.some(w => w.wardNo === 53), 'Searching KR Pura must return Ward 53 (Basavanapura)');

// Test Search by Ward Name
const koraResults = searchWards('Koramangala');
assert(koraResults.some(w => w.wardNo === 151 && w.zone === 'South'), 'Koramangala search must find Ward 151 South Zone');

// Test Search by Popular Landmark & Tech Parks
const landmarkResults = searchWards('Sony World');
assert(landmarkResults.some(w => w.wardNo === 151 || w.wardNo === 148), 'Sony World search must find Koramangala / Ejipura');

const techParkResults = searchWards('ITPL');
assert(techParkResults.some(w => w.wardNo === 84 || w.wardNo === 54), 'ITPL search must find Whitefield / Hoodi');

const manyataResults = searchWards('Manyata');
assert(manyataResults.some(w => w.wardNo === 6 || w.wardNo === 23), 'Manyata search must find Thanisandra / Nagavara');

const silkBoardResults = searchWards('Silk Board');
assert(silkBoardResults.some(w => w.wardNo === 174 || w.wardNo === 172), 'Silk Board search must find HSR Layout / Madiwala');

const ikeaResults = searchWards('IKEA');
assert(ikeaResults.some(w => w.wardNo === 40), 'IKEA search must find Nagasandra / Dodda Bidarkallu');

const ubCityResults = searchWards('UB City');
assert(ubCityResults.some(w => w.wardNo === 111), 'UB City search must find Shanthala Nagar');

const iiscResults = searchWards('IISc');
assert(iiscResults.some(w => w.wardNo === 35), 'IISc search must find Aramane Nagara / Sadashivanagar');

// Test Search by Ward Number
const ward80 = searchWards('80');
assert(ward80.some(w => w.wardNo === 80 && w.nameEn.includes('Indiranagar')), 'Search 80 must return Hoysala Nagar / Indiranagar');

// Test Zone Filtering
const southOnly = searchWards('', 'South');
assert(southOnly.every(w => w.zone === 'South'), 'Zone filter South must only return South Zone wards');

const eastIndiranagar = searchWards('Indiranagar', 'East');
assert(eastIndiranagar.length > 0 && eastIndiranagar.every(w => w.zone === 'East'), 'Filtered search must strictly respect zone');

console.log('   ✓ Substring, landmark, ward number, and zone filter matching verified.');

// 4. Edge Cases & Malformed Inputs
console.log('\n4. Testing Edge Cases & Safety:');
assert.equal(searchWards(null).length, BBMP_WARDS.length, 'Null query should return all wards');
assert.equal(searchWards(undefined).length, BBMP_WARDS.length, 'Undefined query should return all wards');
assert.equal(searchWards('   ').length, BBMP_WARDS.length, 'Whitespace query should return all wards');
assert.equal(searchWards('xyz_non_existent_place_12345').length, 0, 'Non-existent search should return empty array');

console.log('   ✓ Malformed, empty, and non-matching inputs handled fail-safely.');

console.log('\n🎉 ALL BBMP WARD DIRECTORY TEST SUITES PASSED WITH 100% SUCCESS!\n');
