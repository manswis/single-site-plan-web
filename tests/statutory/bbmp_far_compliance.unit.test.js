/**
 * @file bbmp_far_compliance.unit.test.js
 * @description Explicit, exhaustive test suite for Floor Area Ratio (FAR) and Premium FAR
 * compliance indicators under the 2026 Karnataka Building Regulations & BBMP Bye-Laws.
 * 
 * Verifies exact string templates, expected maximum values, road width thresholds (<30ft, 30-40ft, >=40ft),
 * and bilingual English/Kannada rendering.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('2026 BBMP & Karnataka FAR / Premium FAR Compliance Tests', '🏢');

const UI_SOURCE = fs.readFileSync(path.resolve('js/ui.js'), 'utf8');
const UI_SOURCE_EXECUTABLE = UI_SOURCE
  .replace(/^import\s+[\s\S]*?;\s*$/gm, '')
  .replace(/^export\s+/gm, '');

function buildFarSandbox(locale = 'en') {
  const { mockDoc, mockWindow, dispatchDOMContentLoaded } = createMockBrowserEnvironment();

  mockWindow.saveDraft = () => { };
  mockWindow.generatePlan = () => { };
  mockWindow.clearFieldError = () => { };

  // Mock i18n engine
  const EN_CATALOG = {
    'step4.far.baseCompliant': 'FAR: {far} (Compliant • Base FAR Max: {expected})',
    'step4.far.tdrEligible': 'FAR: {far} (Compliant • Permissible up to {expected} with TDR on 30–40ft road)',
    'step4.far.premiumEligible': 'FAR: {far} (Compliant • Permissible up to {expected} with Premium FAR + TDR on ≥40ft road)',
    'step4.far.exceeded': 'FAR: {far} (Exceeds max permissible FAR {expected} for {road} road — check road width eligibility)',
    'step4.height.g4Advisory': 'ℹ️ Notice: G+4 exceeds the 12.0m height cap for Table 8 and triggers stricter Table 9 high-rise setback rules.',
    'step4.height.stiltExclusion': '🚗 Stilt parking (up to 3.0m) is excluded from total height calculation when dedicated to parking.'
  };

  const KN_CATALOG = {
    'step4.far.baseCompliant': 'FAR: {far} (ಅನುಮತಿತ ಮಿತಿಯೊಳಗೆ ಇದೆ • ಮೂಲ FAR ಗರಿಷ್ಠ: {expected})',
    'step4.far.tdrEligible': 'FAR: {far} (ಅನುಮತಿತ ಮಿತಿಯೊಳಗೆ ಇದೆ • ೩೦–೪೦ ಅಡಿ ರಸ್ತೆಗೆ TDR ನೊಂದಿಗೆ ಗರಿಷ್ಠ: {expected})',
    'step4.far.premiumEligible': 'FAR: {far} (ಅನುಮತಿತ ಮಿತಿಯೊಳಗೆ ಇದೆ • ≥೪೦ ಅಡಿ ರಸ್ತೆಗೆ ಪ್ರೀಮಿಯಂ FAR + TDR ನೊಂದಿಗೆ ಗರಿಷ್ಠ: {expected})',
    'step4.far.exceeded': 'FAR: {far} ({road} ರಸ್ತೆಗೆ ನಿಗದಿತ ಗರಿಷ್ಠ FAR {expected} ಮೀರಿದೆ — ರಸ್ತೆಯ ಅಗಲ ಪರಿಶೀಲಿಸಿ)'
  };

  mockWindow.i18n = {
    currentLocale: locale,
    t: (key, params = {}) => {
      const catalog = locale === 'kn' ? KN_CATALOG : EN_CATALOG;
      let template = catalog[key] || key;
      Object.keys(params).forEach(k => {
        template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
      });
      return template;
    }
  };

  const ctx = vm.createContext(mockWindow);
  vm.runInContext(UI_SOURCE_EXECUTABLE, ctx);
  dispatchDOMContentLoaded();

  return { mockDoc, mockWindow };
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. Road Width < 30ft (< 9.0m) — Base FAR (1.75) Only');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Road < 30ft with Achieved FAR 1.50: Shows Compliant with Base FAR Max: 1.75', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  // Plot 1200 sq.ft, Road 25ft, Footprint 20x30 = 600, G+2 (multiplier 3) -> 1800 sq.ft (FAR = 1.50)
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '25';
  mockDoc.getElementById('bldgWidth').value = '20';
  mockDoc.getElementById('bldgLength').value = '30';
  mockDoc.getElementById('noOfFloors').value = 'G+2';

  mockWindow.calculateBuiltUpArea();

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.equal(farBadge.style.display, 'inline-block');
  assert.ok(farBadge.classList.contains('compliant'), 'FAR 1.50 must be marked compliant');
  assert.equal(
    farBadge.textContent,
    'FAR: 1.5 (Compliant • Base FAR Max: 1.75)',
    'Badge must state expected Base FAR Max: 1.75'
  );
});

suite.test('Road < 30ft with Achieved FAR 3.32: Shows Warning with Exceeds max permissible FAR 1.75 for 25\' road', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  // Plot 1200 sq.ft, Road 25ft, manual builtUpArea = 3984 sq.ft -> FAR = 3.32
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '25';
  mockDoc.getElementById('builtUpArea').value = '3984';
  mockDoc.getElementById('noOfFloors').value = 'G+4';

  mockWindow.calculateBuiltUpArea(true); // Manual edit mode

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.equal(farBadge.style.display, 'inline-block');
  assert.ok(farBadge.classList.contains('warning'), 'FAR 3.32 on 25ft road must show warning state');
  assert.equal(
    farBadge.textContent,
    "FAR: 3.32 (Exceeds max permissible FAR 1.75 for 25' road — check road width eligibility)",
    "Warning must explicitly state achieved FAR 3.32, expected max 1.75, and 25' road width"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. Road Width 30ft to 40ft (9.0m to 12.0m) — TDR Loading (Up to 2.80)');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Road 30ft with Achieved FAR 2.25: Shows Compliant with TDR cap 2.8', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  // Plot 1200 sq.ft, Road 30ft, manual builtUpArea = 2700 sq.ft -> FAR = 2.25
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '30';
  mockDoc.getElementById('builtUpArea').value = '2700';
  mockDoc.getElementById('noOfFloors').value = 'G+3';

  mockWindow.calculateBuiltUpArea(true);

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.ok(farBadge.classList.contains('compliant'), 'FAR 2.25 on 30ft road is within 2.80 TDR cap');
  assert.equal(
    farBadge.textContent,
    'FAR: 2.25 (Compliant • Permissible up to 2.8 with TDR on 30–40ft road)'
  );
});

suite.test('Road 30ft with Achieved FAR 3.32: Shows Warning with Exceeds max permissible FAR 2.8 for 30\' road', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '30';
  mockDoc.getElementById('builtUpArea').value = '3984';
  mockDoc.getElementById('noOfFloors').value = 'G+4';

  mockWindow.calculateBuiltUpArea(true);

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.ok(farBadge.classList.contains('warning'), 'FAR 3.32 on 30ft road must show warning state');
  assert.equal(
    farBadge.textContent,
    "FAR: 3.32 (Exceeds max permissible FAR 2.8 for 30' road — check road width eligibility)"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. Road Width ≥ 40ft (≥ 12.0m) — 40% Premium FAR + TDR (Up to 2.80)');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Road 40ft with Achieved FAR 2.45: Shows Compliant with Premium FAR + TDR on ≥40ft road', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  // Plot 2400 sq.ft, Road 40ft, manual builtUpArea = 5880 sq.ft -> FAR = 2.45
  mockDoc.getElementById('plotArea').value = '2400';
  mockDoc.getElementById('roadWidth').value = '40';
  mockDoc.getElementById('builtUpArea').value = '5880';
  mockDoc.getElementById('noOfFloors').value = 'G+3';

  mockWindow.calculateBuiltUpArea(true);

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.ok(farBadge.classList.contains('compliant'));
  assert.equal(
    farBadge.textContent,
    'FAR: 2.45 (Compliant • Permissible up to 2.8 with Premium FAR + TDR on ≥40ft road)'
  );
});

suite.test('Road 40ft with Achieved FAR 3.32: Shows Warning stating expected 2.8 max', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '40';
  mockDoc.getElementById('builtUpArea').value = '3984';
  mockDoc.getElementById('noOfFloors').value = 'G+4';

  mockWindow.calculateBuiltUpArea(true);

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.ok(farBadge.classList.contains('warning'));
  assert.equal(
    farBadge.textContent,
    "FAR: 3.32 (Exceeds max permissible FAR 2.8 for 40' road — check road width eligibility)"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. Bilingual Kannada Localization Verification');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Kannada locale renders FAR exceeded warning with exact expected value and road', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('kn');
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('roadWidth').value = '30';
  mockDoc.getElementById('builtUpArea').value = '3984'; // FAR = 3.32
  mockDoc.getElementById('noOfFloors').value = 'G+4';

  mockWindow.calculateBuiltUpArea(true);

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.equal(
    farBadge.textContent,
    'FAR: 3.32 (30\' ರಸ್ತೆಗೆ ನಿಗದಿತ ಗರಿಷ್ಠ FAR 2.8 ಮೀರಿದೆ — ರಸ್ತೆಯ ಅಗಲ ಪರಿಶೀಲಿಸಿ)'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('5. Edge Cases & Fail-Safe Visibility');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Vacant Plot hides the FAR badge completely', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  mockDoc.getElementById('plotArea').value = '1200';
  mockDoc.getElementById('builtUpArea').value = '0';
  mockDoc.getElementById('noOfFloors').value = 'Vacant Plot';

  mockWindow.calculateBuiltUpArea();

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.equal(farBadge.style.display, 'none', 'Vacant Plot must hide FAR badge');
});

suite.test('Missing plot area hides the FAR badge without throwing', () => {
  const { mockDoc, mockWindow } = buildFarSandbox('en');
  mockDoc.getElementById('plotArea').value = '';
  mockDoc.getElementById('bldgWidth').value = '20';
  mockDoc.getElementById('bldgLength').value = '30';
  mockDoc.getElementById('noOfFloors').value = 'G+1';

  mockWindow.calculateBuiltUpArea();

  const farBadge = mockDoc.getElementById('farComplianceBadge');
  assert.equal(farBadge.style.display, 'none', 'Empty plot area must hide FAR badge safely');
});

suite.finish();
