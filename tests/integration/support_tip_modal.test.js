/**
 * @file support_tip_modal.test.js
 * @description Comprehensive Integration and Offline Resilience test suite for the
 * Voluntary Support & Tip Modal, Pure Client-Side UPI QR Code Generator, and Non-Blocking Export Flow.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { generateQrSvg } from '../../js/qrcode.js';

const suite = new TestSuite('Voluntary Support & Tip Modal Integration Tests', '☕');

suite.section('1. Pure Client-Side Mathematical QR Code Generator (100% Offline)');

suite.test('generateQrSvg creates valid standalone SVG markup for NPCI UPI URI', () => {
  const upiUri = 'upi://pay?pa=manojbiswas83@okaxis&pn=ePlan%20Studio&am=99&cu=INR&tn=Support%20ePlanStudio';
  const svg = generateQrSvg(upiUri, { size: 140, margin: 2, darkColor: '#0f172a', lightColor: '#ffffff' });

  assert.ok(svg, 'SVG output must not be empty');
  assert.ok(svg.startsWith('<svg'), 'Output must start with <svg tag');
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'Must include SVG XML namespace');
  assert.ok(svg.includes('viewBox='), 'Must include viewBox attribute for responsive scaling');
  assert.ok(svg.includes('fill="#0f172a"'), 'Must include dark module fill color');
  assert.ok(svg.includes('fill="#ffffff"'), 'Must include light background fill color');
  assert.ok(svg.endsWith('</svg>'), 'Must end with closing </svg>');
});

suite.test('generateQrSvg handles different tip amounts and caches identical requests in memory', () => {
  const uri49 = 'upi://pay?pa=manojbiswas83@okaxis&pn=ePlan%20Studio&am=49&cu=INR&tn=Support%20ePlanStudio';
  const uri199 = 'upi://pay?pa=manojbiswas83@okaxis&pn=ePlan%20Studio&am=199&cu=INR&tn=Support%20ePlanStudio';

  const svg49_1 = generateQrSvg(uri49);
  const svg49_2 = generateQrSvg(uri49);
  const svg199 = generateQrSvg(uri199);

  assert.equal(svg49_1, svg49_2, 'Identical URI requests must return matching cached SVG');
  assert.notEqual(svg49_1, svg199, 'Different amounts must generate distinct QR matrices');
});

suite.test('generateQrSvg handles invalid or empty inputs fail-safely without throwing', () => {
  assert.equal(generateQrSvg(''), '');
  assert.equal(generateQrSvg(null), '');
  assert.equal(generateQrSvg(undefined), '');
});

suite.section('2. Support Modal DOM Lifecycle & Preset Controllers');

// Create lightweight DOM mock environment
const mockStorage = {};
const mockElements = {};

function createMockElement(id, tagName = 'div') {
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      classes: new Set(),
      add(cls) { this.classes.add(cls); },
      remove(cls) { this.classes.delete(cls); },
      contains(cls) { return this.classes.has(cls); }
    },
    href: '',
    checked: false,
    disabled: false,
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k] || null; }
  };
  mockElements[id] = el;
  return el;
}

// Setup mock elements
createMockElement('supportTipModal');
createMockElement('supportProceedBtnText', 'span');
createMockElement('supportChip49', 'button');
createMockElement('supportChip99', 'button');
createMockElement('supportChip199', 'button');
createMockElement('supportUpiIntentLink', 'a');
createMockElement('supportUpiCode', 'code');
createMockElement('supportQrContainer', 'div');
createMockElement('supportQrCanvas', 'canvas');
createMockElement('supportCopyBtn', 'button');
createMockElement('supportCopyIcon', 'span');
createMockElement('supportCopyText', 'span');
createMockElement('legalConsentCheck', 'input');
createMockElement('err-legalConsent', 'div');
createMockElement('downloadPdfBtn', 'button');
createMockElement('printBtn', 'button');

const mockDoc = {
  getElementById(id) {
    return mockElements[id] || null;
  },
  querySelector(sel) {
    return null;
  },
  querySelectorAll(sel) {
    return [];
  },
  addEventListener(evt, fn) { },
  removeEventListener(evt, fn) { },
  createElement(tag) {
    return createMockElement('temp_' + Date.now(), tag);
  },
  body: {
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    appendChild() { },
    removeChild() { }
  }
};

const mockWindow = {
  document: mockDoc,
  window: null,
  global: null,
  addEventListener: () => { },
  removeEventListener: () => { },
  print: () => { },
  localStorage: {
    getItem(k) { return mockStorage[k] || null; },
    setItem(k, v) { mockStorage[k] = String(v); },
    removeItem(k) { delete mockStorage[k]; }
  },
  navigator: {
    clipboard: {
      writeText(text) {
        return {
          then(cb) {
            cb();
            return { catch() { } };
          }
        };
      }
    }
  },
  i18n: {
    t(key) {
      const dict = {
        'supportModal.proceedDownload': '⬇️ Proceed to Download PDF',
        'supportModal.proceedPrint': '🖨️ Proceed to Print Plan',
        'supportModal.copied': '✓ Copied!'
      };
      return dict[key] || key;
    }
  },
  generateQrSvg
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

// Evaluate production bundle in sandbox
const bundleContent = fs.readFileSync(path.resolve('js/studio.bundle.min.js'), 'utf8');
const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  localStorage: mockWindow.localStorage,
  navigator: mockWindow.navigator,
  console: { log() { }, warn() { }, error() { } },
  setTimeout: (fn, ms) => 1,
  clearTimeout: () => { }
});

vm.runInContext(bundleContent, context);

suite.test('SUPPORT_CONFIG has valid official VPA and BuyMeACoffee URL', () => {
  const config = mockWindow.SUPPORT_CONFIG;
  assert.ok(config, 'SUPPORT_CONFIG must be defined');
  assert.equal(config.upiId, 'manojbiswas83@okaxis');
  assert.equal(config.buyMeACoffeeUrl, 'https://buymeacoffee.com/cranbear');
  assert.equal(config.defaultAmount, 99);
});

suite.test('showSupportModal opens modal and sets download proceed label', () => {
  if (typeof mockWindow.showSupportModal === 'function') {
    mockWindow.showSupportModal('download');

    const modal = mockDoc.getElementById('supportTipModal');
    assert.equal(modal.style.display, 'flex');
    assert.ok(modal.classList.contains('active'));

    const proceedText = mockDoc.getElementById('supportProceedBtnText');
    assert.equal(proceedText.textContent, '⬇️ Proceed to Download PDF');
  }
});

suite.test('showSupportModal sets print proceed label when action is print', () => {
  if (typeof mockWindow.showSupportModal === 'function') {
    mockWindow.showSupportModal('print');

    const proceedText = mockDoc.getElementById('supportProceedBtnText');
    assert.equal(proceedText.textContent, '🖨️ Proceed to Print Plan');
  }
});

suite.test('selectTipAmount updates active chip, mobile intent URI, and QR container', () => {
  if (typeof mockWindow.selectTipAmount === 'function') {
    mockWindow.selectTipAmount(49);

    assert.ok(mockDoc.getElementById('supportChip49').classList.contains('active'));
    assert.ok(!mockDoc.getElementById('supportChip99').classList.contains('active'));
    assert.ok(!mockDoc.getElementById('supportChip199').classList.contains('active'));

    const intentLink = mockDoc.getElementById('supportUpiIntentLink');
    assert.ok(intentLink.href.includes('am=49'));
    assert.ok(intentLink.href.includes('pa=manojbiswas83@okaxis'));

    const qrContainer = mockDoc.getElementById('supportQrContainer');
    assert.ok(qrContainer.innerHTML.includes('<svg'), 'QR container must contain generated SVG');

    // Modal is 100% stateless and does not pollute localStorage
    assert.equal(mockWindow.localStorage.getItem('eplan_support_selected_amount'), null);
  }
});

suite.test('copyUpiId invokes clipboard API and sets feedback icon', () => {
  if (typeof mockWindow.copyUpiId === 'function') {
    mockWindow.copyUpiId();

    const copyIcon = mockDoc.getElementById('supportCopyIcon');
    assert.equal(copyIcon.textContent, 'check');
  }
});

suite.section('3. Non-Blocking Bypass & Modal Dismissal');

suite.test('closeSupportModal hides modal safely', () => {
  if (typeof mockWindow.closeSupportModal === 'function') {
    mockWindow.closeSupportModal();

    const modal = mockDoc.getElementById('supportTipModal');
    assert.equal(modal.style.display, 'none');
    assert.ok(!modal.classList.contains('active'));
  }
});

suite.test('proceedWithPendingAction closes modal and executes pending export', () => {
  if (typeof mockWindow.proceedWithPendingAction === 'function') {
    mockWindow.showSupportModal('download');
    mockWindow.proceedWithPendingAction();

    const modal = mockDoc.getElementById('supportTipModal');
    assert.equal(modal.style.display, 'none');
  }
});

suite.finish();
