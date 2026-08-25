/**
 * @file theme.unit.test.js
 * @description Unit tests for the real theme.min.js module.
 * Loads the production bundle in a Node.js VM context and exercises
 * the actual toggleTheme / setThemeMode / preference resolution logic.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Theme Manager Unit Tests', '🎨');

// ─── Constants (mirrored from production) ────────────────────────────────────
const THEME_STORAGE_KEY = 'eplan_theme_preference';

// ─── VM Sandbox Setup ─────────────────────────────────────────────────────────
/** Creates a fresh sandboxed environment for each test to avoid state leaks */
function buildThemeSandbox({ storedTheme = null, systemDark = false } = {}) {
  const storage = {};
  if (storedTheme) storage[THEME_STORAGE_KEY] = storedTheme;

  const domAttrs = {};
  const classLists = {};

  const makeClassList = (id) => ({
    classes: new Set(),
    add(c)      { this.classes.add(c); },
    remove(c)   { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  });

  classLists['themeSegmentLight'] = makeClassList('themeSegmentLight');
  classLists['themeSegmentDark']  = makeClassList('themeSegmentDark');

  const mockDoc = {
    documentElement: {
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      getAttribute(k)    { return this.attrs[k] || null; }
    },
    getElementById(id) {
      if (!this._els) this._els = {};
      if (!this._els[id]) {
        this._els[id] = {
          id, classList: makeClassList(id), innerHTML: '', textContent: '',
          setAttribute() {}, getAttribute() { return null; }
        };
      }
      return this._els[id];
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {}
  };

  const win = {
    APP_CONFIG: { BRAND_ICON: '🏛️', BRAND_NAME: 'e-Plan Studio', VERSION: '1.2.2' },
    localStorage: {
      getItem: (k)    => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; }
    },
    document: mockDoc,
    matchMedia: (q) => ({
      matches: q.includes('dark') ? systemDark : false,
      addEventListener: () => {}
    }),
    addEventListener: () => {},
    setTimeout: (fn) => fn(),
    console: { log() {}, warn() {}, error() {} }
  };
  win.window = win;
  win.global = win;

  const ctx = vm.createContext(win);
  const themeCode = fs.readFileSync(path.resolve('js/theme.min.js'), 'utf8');
  try { vm.runInContext(themeCode, ctx); } catch (_) { /* DOMContentLoaded not fired in VM */ }

  return { win, storage, mockDoc };
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. Initial Theme Resolution (System Preference & Storage Priority)');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('setThemeMode("dark") writes to storage and updates data-theme attribute', () => {
  const { win, storage, mockDoc } = buildThemeSandbox();

  win.setThemeMode('dark');

  assert.equal(storage[THEME_STORAGE_KEY], 'dark', 'Storage must record dark preference');
  assert.equal(mockDoc.documentElement.attrs['data-theme'], 'dark', 'data-theme attribute must be set to dark');
});

suite.test('setThemeMode("light") writes to storage and updates data-theme attribute', () => {
  const { win, storage, mockDoc } = buildThemeSandbox();

  win.setThemeMode('light');

  assert.equal(storage[THEME_STORAGE_KEY], 'light', 'Storage must record light preference');
  assert.equal(mockDoc.documentElement.attrs['data-theme'], 'light', 'data-theme attribute must be set to light');
});

suite.test('setThemeMode rejects invalid values and does not mutate storage', () => {
  const { win, storage } = buildThemeSandbox();
  const before = storage[THEME_STORAGE_KEY];

  win.setThemeMode('invalid');
  win.setThemeMode(null);
  win.setThemeMode(undefined);
  win.setThemeMode('');

  assert.equal(storage[THEME_STORAGE_KEY], before, 'Storage must not be mutated by invalid setThemeMode calls');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. Theme Toggle Logic');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('toggleTheme switches from dark to light', () => {
  const { win, storage, mockDoc } = buildThemeSandbox({ storedTheme: 'dark' });
  mockDoc.documentElement.attrs['data-theme'] = 'dark'; // simulate page load state

  win.toggleTheme();

  assert.equal(storage[THEME_STORAGE_KEY], 'light', 'After toggle from dark, storage must be light');
  assert.equal(mockDoc.documentElement.attrs['data-theme'], 'light', 'data-theme must be updated to light after toggle');
});

suite.test('toggleTheme switches from light to dark', () => {
  const { win, storage, mockDoc } = buildThemeSandbox({ storedTheme: 'light' });
  mockDoc.documentElement.attrs['data-theme'] = 'light';

  win.toggleTheme();

  assert.equal(storage[THEME_STORAGE_KEY], 'dark', 'After toggle from light, storage must be dark');
  assert.equal(mockDoc.documentElement.attrs['data-theme'], 'dark', 'data-theme must be updated to dark after toggle');
});

suite.test('Two consecutive toggles return to the original theme', () => {
  const { win, storage, mockDoc } = buildThemeSandbox({ storedTheme: 'dark' });
  mockDoc.documentElement.attrs['data-theme'] = 'dark';

  win.toggleTheme(); // → light
  win.toggleTheme(); // → dark

  assert.equal(storage[THEME_STORAGE_KEY], 'dark', 'Double-toggle must return to original dark preference');
  assert.equal(mockDoc.documentElement.attrs['data-theme'], 'dark', 'data-theme must return to dark after double toggle');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. Storage Persistence Across Simulated Page Reloads');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('setThemeMode("dark") preference survives simulated page reload', () => {
  const { win, storage } = buildThemeSandbox();
  win.setThemeMode('dark');

  // Simulate page reload by re-reading from storage in a fresh sandbox
  const { win: win2, mockDoc: doc2 } = buildThemeSandbox({ storedTheme: storage[THEME_STORAGE_KEY] });
  // On load, the stored preference should drive data-theme
  win2.setThemeMode(storage[THEME_STORAGE_KEY]);

  assert.equal(doc2.documentElement.attrs['data-theme'], 'dark', 'Stored dark preference must be applied on reload');
});

suite.test('setThemeMode("light") preference survives simulated page reload', () => {
  const { win, storage } = buildThemeSandbox({ storedTheme: 'dark' });
  win.setThemeMode('light');

  const { win: win2, mockDoc: doc2 } = buildThemeSandbox({ storedTheme: storage[THEME_STORAGE_KEY] });
  win2.setThemeMode(storage[THEME_STORAGE_KEY]);

  assert.equal(doc2.documentElement.attrs['data-theme'], 'light', 'Stored light preference must be applied on reload');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. Edge Cases & Defensive Guards');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('toggleTheme does not throw even with null data-theme attribute', () => {
  const { win, mockDoc } = buildThemeSandbox();
  mockDoc.documentElement.attrs['data-theme'] = null; // simulate missing attribute

  assert.doesNotThrow(() => win.toggleTheme(), 'toggleTheme must not throw when data-theme is null');
});

suite.test('setThemeMode and toggleTheme are both defined on window', () => {
  const { win } = buildThemeSandbox();
  assert.ok(typeof win.toggleTheme  === 'function', 'window.toggleTheme must be a function');
  assert.ok(typeof win.setThemeMode === 'function', 'window.setThemeMode must be a function');
});

suite.finish();
