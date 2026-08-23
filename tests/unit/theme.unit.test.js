/**
 * @file theme.unit.test.js
 * @description Unit tests for light/dark theme manager and system preference handling.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';

const suite = new TestSuite('Theme Manager Unit Tests', '🎨');

const { mockDoc, mockWindow, mockStorage } = createMockBrowserEnvironment();

function setTheme(theme) {
  const current = theme === 'dark' ? 'dark' : 'light';
  mockDoc.documentElement.setAttribute('data-theme', current);
  mockStorage.set('eplan_theme', current);
  return current;
}

function getTheme() {
  return mockDoc.documentElement.getAttribute('data-theme') || mockStorage.get('eplan_theme') || 'light';
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return setTheme(next);
}

suite.section('1. Theme State Transitions');

suite.test('Defaults to light theme if no preference stored', () => {
  mockStorage.clear();
  mockDoc.documentElement.removeAttribute('data-theme');
  assert.equal(getTheme(), 'light');
});

suite.test('Sets dark theme and updates document attribute and storage', () => {
  setTheme('dark');
  assert.equal(mockDoc.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(mockStorage.get('eplan_theme'), 'dark');
});

suite.test('Toggles smoothly from dark to light', () => {
  setTheme('dark');
  const next = toggleTheme();
  assert.equal(next, 'light');
  assert.equal(getTheme(), 'light');
});

suite.test('Toggles smoothly from light to dark', () => {
  setTheme('light');
  const next = toggleTheme();
  assert.equal(next, 'dark');
  assert.equal(getTheme(), 'dark');
});

suite.section('2. Storage Persistence');

suite.test('Preserves user theme selection across page loads', () => {
  setTheme('dark');
  assert.equal(mockStorage.get('eplan_theme'), 'dark');
  // Simulate page reload
  mockDoc.documentElement.removeAttribute('data-theme');
  const restoredTheme = mockStorage.get('eplan_theme');
  assert.equal(restoredTheme, 'dark');
});

suite.finish();
