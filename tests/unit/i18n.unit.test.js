/**
 * @file i18n.unit.test.js
 * @description Unit tests for i18n string lookup, parameter interpolation, and language switching.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { en } from '../../js/i18n/en.js';
import { kn } from '../../js/i18n/kn.js';

const suite = new TestSuite('I18n Engine & Token Interpolation Unit Tests', '🌐');

class MockI18nManager {
  constructor() {
    this.currentLang = 'en';
    this.catalogs = { en, kn };
  }

  setLanguage(lang) {
    if (this.catalogs[lang]) this.currentLang = lang;
  }

  t(key, params = {}) {
    const catalog = this.catalogs[this.currentLang] || this.catalogs.en;
    let str = catalog[key] || this.catalogs.en[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
    return str;
  }
}

const i18n = new MockI18nManager();

suite.section('1. Translation Lookup & Fallback');

suite.test('Looks up English string correctly', () => {
  i18n.setLanguage('en');
  const str = i18n.t('brand.badge');
  assert.ok(str && str.length > 0);
  assert.equal(str, en['brand.badge']);
});

suite.test('Looks up Kannada string correctly', () => {
  i18n.setLanguage('kn');
  const str = i18n.t('brand.badge');
  assert.ok(str && str.length > 0);
  assert.equal(str, kn['brand.badge']);
});

suite.test('Falls back to English if key missing in current language', () => {
  i18n.setLanguage('kn');
  const testKey = 'nonExistentKeyInKn';
  en[testKey] = 'English Fallback Text';
  const str = i18n.t(testKey);
  assert.equal(str, 'English Fallback Text');
  delete en[testKey];
});

suite.test('Returns key itself if missing from all catalogs', () => {
  i18n.setLanguage('en');
  const str = i18n.t('completely.unknown.key.123');
  assert.equal(str, 'completely.unknown.key.123');
});

suite.section('2. Parameter & Token Interpolation');

suite.test('Interpolates single parameter {count}', () => {
  i18n.setLanguage('en');
  en['test.token'] = 'Found {count} results';
  const str = i18n.t('test.token', { count: 5 });
  assert.equal(str, 'Found 5 results');
  delete en['test.token'];
});

suite.test('Interpolates multiple parameters {name} and {zone}', () => {
  i18n.setLanguage('en');
  en['test.multiToken'] = 'Ward {name} in {zone} Zone';
  const str = i18n.t('test.multiToken', { name: 'Domlur', zone: 'East' });
  assert.equal(str, 'Ward Domlur in East Zone');
  delete en['test.multiToken'];
});

suite.finish();
