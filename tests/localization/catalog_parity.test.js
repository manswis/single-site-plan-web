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

suite.section('3. Critical Wizard Action Keys — Existence & Non-Empty Guard');

// These keys power every wizard navigation button. If they are missing
// or empty, the wizard UI renders blank buttons. This is a deployment-killer.
const CRITICAL_WIZARD_KEYS = [
  'btn.continue', 'btn.back', 'btn.review',
  'btn.generate', 'btn.exportPdf', 'btn.print'
];

suite.test('All critical wizard action button keys exist in English catalog', () => {
  const missing = CRITICAL_WIZARD_KEYS.filter(k => !(k in en));
  assert.equal(missing.length, 0, `Missing critical EN keys: ${missing.join(', ')}`);
});

suite.test('All critical wizard action button keys exist in Kannada catalog', () => {
  const missing = CRITICAL_WIZARD_KEYS.filter(k => !(k in kn));
  assert.equal(missing.length, 0, `Missing critical KN keys: ${missing.join(', ')}`);
});

suite.test('All critical wizard action button keys are non-empty in both catalogs', () => {
  CRITICAL_WIZARD_KEYS.forEach(k => {
    if (k in en) assert.ok(en[k].trim().length > 0, `EN key '${k}' is empty — wizard button will render blank`);
    if (k in kn) assert.ok(kn[k].trim().length > 0, `KN key '${k}' is empty — wizard button will render blank in Kannada`);
  });
});

suite.section('4. XSS Injection Guard — No Raw HTML Tags in Translation Strings');

// Translation strings must never contain <script> or unescaped event handlers.
// A single compromised string could enable stored XSS across all pages.
const XSS_PATTERNS = [/<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i];

suite.test('No English translation string contains raw <script> or event handler injection', () => {
  const xssViolations = enKeys.filter(k =>
    XSS_PATTERNS.some(p => p.test(en[k]))
  );
  assert.equal(xssViolations.length, 0, `XSS patterns found in EN keys: ${xssViolations.join(', ')}`);
});

suite.test('No Kannada translation string contains raw <script> or event handler injection', () => {
  const xssViolations = knKeys.filter(k =>
    XSS_PATTERNS.some(p => p.test(kn[k]))
  );
  assert.equal(xssViolations.length, 0, `XSS patterns found in KN keys: ${xssViolations.join(', ')}`);
});

suite.section('5. Kannada Linguistic Integrity — Unicode Character Presence');

// Kannada characters occupy Unicode range U+0C80–U+0CFF.
// Any KN translation that contains zero Kannada characters is likely a copy-paste
// English fallback, not a real Kannada translation.
const KANNADA_UNICODE = /[\u0C80-\u0CFF]/;

suite.test('At least 90% of Kannada translations contain actual Kannada Unicode characters', () => {
  const total = knKeys.length;
  const withKannadaChars = knKeys.filter(k => KANNADA_UNICODE.test(kn[k])).length;
  const percentage = (withKannadaChars / total) * 100;
  assert.ok(
    percentage >= 90,
    `Only ${percentage.toFixed(1)}% of KN translations contain Kannada Unicode characters. ` +
    `This suggests widespread English placeholders in the KN catalog.`
  );
});

suite.test('Zero-liability and legal sentinel keys contain Kannada characters', () => {
  // The most critical legal keys must be genuinely translated, not English placeholders
  const legalSentinelKeys = knKeys.filter(k =>
    k.startsWith('legal.') || k.startsWith('tos.') || k.includes('liability') || k.includes('disclaimer')
  );
  legalSentinelKeys.forEach(k => {
    assert.ok(
      KANNADA_UNICODE.test(kn[k]),
      `Legal key '${k}' must contain Kannada characters, not an English placeholder`
    );
  });
});

suite.finish();
