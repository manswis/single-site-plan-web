/**
 * @file catalog_parity.test.js
 * @description Localization tests asserting 100% key parity and non-empty Kannada translations.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { en } from '../../js/i18n/en.js';
import { kn } from '../../js/i18n/kn.js';

const suite = new TestSuite('Bilingual Translation Catalogs Parity Suite', '🌐');

const enKeys = Object.keys(en);
const knKeys = Object.keys(kn);

suite.section('1. Key Parity Between English and Kannada');

suite.test(`English and Kannada catalogs have identical key counts (${enKeys.length} keys)`, () => {
  assert.equal(enKeys.length, knKeys.length, `Key count mismatch: EN has ${enKeys.length} keys, KN has ${knKeys.length} keys`);
});

suite.test('Every key in English exists in Kannada', () => {
  const missingInKn = enKeys.filter(k => !(k in kn));
  assert.equal(missingInKn.length, 0, `Missing in Kannada: ${missingInKn.join(', ')}`);
});

suite.test('Every key in Kannada exists in English', () => {
  const missingInEn = knKeys.filter(k => !(k in en));
  assert.equal(missingInEn.length, 0, `Missing in English: ${missingInEn.join(', ')}`);
});

suite.section('2. Translation String Integrity');

suite.test('All English translations are valid non-empty strings', () => {
  enKeys.forEach(k => {
    assert.ok(typeof en[k] === 'string', `EN key '${k}' is not a string`);
    assert.ok(en[k].trim().length > 0, `EN key '${k}' is empty`);
  });
});

suite.test('All Kannada translations are valid non-empty strings', () => {
  knKeys.forEach(k => {
    assert.ok(typeof kn[k] === 'string', `KN key '${k}' is not a string`);
    assert.ok(kn[k].trim().length > 0, `KN key '${k}' is empty`);
  });
});

suite.finish();
