/**
 * @file i18n.test.js
 * @description Comprehensive automated test suite for ARB localization catalog and I18nManager.
 */

import assert from 'node:assert';
import { en } from '../js/i18n/en.js';
import { kn } from '../js/i18n/kn.js';
import { I18nManager, LOCALE_STORAGE_KEY, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../js/i18n.js';

// Mock localStorage for test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

console.log('🧪 [Test Runner] Starting ARB Localization Engine Tests...\n');

// 1. Test Key Parity
console.log('1. Verifying 100% Key Parity between English and Kannada Catalogs...');
const enKeys = Object.keys(en).sort();
const knKeys = Object.keys(kn).sort();

assert.deepStrictEqual(enKeys, knKeys, 'Mismatch in ARB keys between English and Kannada!');
console.log(`   ✓ Key Parity Confirmed: ${enKeys.length} keys verified in both catalogs.`);

// 2. Test Non-Empty Values
console.log('\n2. Verifying Non-Empty Translations in Kannada Catalog...');
for (const [key, val] of Object.entries(kn)) {
  assert.ok(typeof val === 'string' && val.trim().length > 0, `Empty or non-string translation for key: ${key}`);
}
console.log('   ✓ All Kannada translations are valid, non-empty strings.');

// 3. Test I18nManager Instance & String Lookup
console.log('\n3. Testing I18nManager String Lookup & Fallback...');
const manager = new I18nManager();

// English lookup
manager.applyLocale('en', false);
assert.strictEqual(manager.t('btn.exportPdf'), 'Export PDF', 'Failed to resolve English translation!');

// Kannada lookup
manager.applyLocale('kn', false);
assert.strictEqual(manager.t('btn.exportPdf'), 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್', 'Failed to resolve Kannada translation!');

// Missing key fallback to English / Key
assert.strictEqual(manager.t('non.existent.key'), 'non.existent.key', 'Failed fallback for missing key!');

console.log('   ✓ String lookup and fallback functioning as expected.');

// 4. Test Parameter Interpolation
console.log('\n4. Testing Parameter Interpolation...');
assert.strictEqual(
  manager.t('toast.saved', { time: '10:30 AM' }),
  'ಕರಡು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ',
  'Toast lookup failed'
);

manager.catalog.en['test.token'] = 'Hello {name}, welcome to {place}!';
manager.applyLocale('en', false);
assert.strictEqual(
  manager.t('test.token', { name: 'Ramesh', place: 'Bangalore' }),
  'Hello Ramesh, welcome to Bangalore!',
  'Parameter interpolation failed!'
);
console.log('   ✓ Parameter token substitution working cleanly.');

// 5. Test Language Toggle Logic
console.log('\n5. Testing Language Toggle Transitions...');
manager.applyLocale('en', false);
assert.strictEqual(manager.currentLocale, 'en');

manager.toggleLanguage();
assert.strictEqual(manager.currentLocale, 'kn', 'Language toggle en -> kn failed!');

manager.toggleLanguage();
assert.strictEqual(manager.currentLocale, 'en', 'Language toggle kn -> en failed!');
console.log('   ✓ Language toggle transitions verified.');

console.log('\n🎉 ALL 5 LOCALIZATION TEST SUITES PASSED WITH 100% SUCCESS!\n');
