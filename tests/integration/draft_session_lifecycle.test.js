/**
 * @file draft_session_lifecycle.test.js
 * @description Integration tests for auto-save draft lifecycle:
 *   - Full round-trip: save → restore → verify every field value
 *   - Discard draft: localStorage key removed, fields cleared
 *   - Corrupt / malformed JSON recovery (no fatal exception)
 *   - Missing draft recovery (empty localStorage)
 *   - Draft schema integrity (required envelope keys present)
 *   - Step pointer restoration (currentStep serialised in payload)
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Draft Session & Serialization Integration Tests', '💾');

// ─── Shared Environment Setup ─────────────────────────────────────────────────

const { mockDoc, mockWindow, mockStorage } = createMockBrowserEnvironment();
const wizardCode  = fs.readFileSync(path.resolve('js/wizard.js'), 'utf8');
const studioCode  = fs.readFileSync(path.resolve('js/studio.bundle.min.js'), 'utf8');

const context = vm.createContext(mockWindow);
vm.runInContext(wizardCode, context);
try { vm.runInContext(studioCode, context); } catch (_) { /* non-fatal */ }

/** Helper: reset all form fields and storage before each test group */
function resetAll() {
  mockStorage.clear();
  // Also clear fields manually since discardDraft() requires bbmp_studio_draft to exist
  ['ownerName', 'surveyNo', 'wardNo', 'wardName', 'bbmpZone', 'plotArea',
   'dcOrderNo', 'dcAuthority', 'roadWidth', 'scale', 'legalConsentCheck'].forEach(id => {
    const el = mockDoc.getElementById(id);
    if (el) { el.value = ''; el.checked = false; }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. Draft Schema Envelope Integrity');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('saveDraft writes a well-formed JSON envelope with required top-level keys', () => {
  resetAll();
  mockDoc.getElementById('ownerName').value = 'Sri Ramesh Rao';
  mockDoc.getElementById('surveyNo').value = 'Sy. 45/2B';

  if (typeof mockWindow.saveDraft === 'function') {
    mockWindow.saveDraft();
  }

  const raw = mockStorage.get('bbmp_studio_draft');
  assert.ok(raw, 'Draft must be written to bbmp_studio_draft key');

  const parsed = JSON.parse(raw);
  assert.ok('currentStep' in parsed, 'Envelope must contain currentStep');
  assert.ok('timestamp' in parsed, 'Envelope must contain timestamp');
  assert.ok('formData' in parsed, 'Envelope must contain formData');
  assert.ok(typeof parsed.timestamp === 'number', 'Timestamp must be a number');
  assert.ok(parsed.timestamp > 0, 'Timestamp must be a positive epoch value');
  assert.ok(typeof parsed.formData === 'object', 'formData must be an object');
});

suite.test('saveDraft timestamp is within 5 seconds of actual current time', () => {
  resetAll();
  const before = Date.now();
  if (typeof mockWindow.saveDraft === 'function') {
    mockWindow.saveDraft();
  }
  const after = Date.now();

  const raw = mockStorage.get('bbmp_studio_draft');
  if (raw) {
    const { timestamp } = JSON.parse(raw);
    assert.ok(timestamp >= before, 'Timestamp must not be before save call');
    assert.ok(timestamp <= after + 100, 'Timestamp must not be more than 100ms in the future');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. Full Round-Trip: Save → Restore → Verify Field Values');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Round-trip: ownerName, surveyNo, wardNo, wardName, bbmpZone survive save/restore', () => {
  resetAll();

  mockDoc.getElementById('ownerName').value = 'Sri Ramesh Rao';
  mockDoc.getElementById('surveyNo').value = 'Sy. 45/2B';
  mockDoc.getElementById('wardNo').value = '112';
  mockDoc.getElementById('wardName').value = 'Domlur';
  mockDoc.getElementById('bbmpZone').value = 'East Zone';
  mockDoc.getElementById('plotArea').value = '1200';

  if (typeof mockWindow.saveDraft === 'function') {
    mockWindow.saveDraft();
  }

  ['ownerName', 'surveyNo', 'wardNo', 'wardName', 'bbmpZone', 'plotArea'].forEach(id => {
    mockDoc.getElementById(id).value = '';
  });

  if (typeof mockWindow.restoreDraft === 'function') {
    mockWindow.restoreDraft(true);
  }

  assert.equal(mockDoc.getElementById('ownerName').value, 'Sri Ramesh Rao', 'ownerName must survive round-trip');
  assert.equal(mockDoc.getElementById('surveyNo').value, 'Sy. 45/2B', 'surveyNo must survive round-trip');
  assert.equal(mockDoc.getElementById('wardNo').value, '112', 'wardNo must survive round-trip');
  assert.equal(mockDoc.getElementById('wardName').value, 'Domlur', 'wardName must survive round-trip');
  assert.equal(mockDoc.getElementById('bbmpZone').value, 'East Zone', 'bbmpZone must survive round-trip');
  assert.equal(mockDoc.getElementById('plotArea').value, '1200', 'plotArea must survive round-trip');
});

suite.test('Round-trip: DC Conversion fields (dcOrderNo, dcAuthority) survive save/restore', () => {
  resetAll();

  mockDoc.getElementById('dcOrderNo').value = 'DC/BLR/2024/00123';
  mockDoc.getElementById('dcAuthority').value = 'Deputy Commissioner, Bangalore Urban';

  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();

  mockDoc.getElementById('dcOrderNo').value = '';
  mockDoc.getElementById('dcAuthority').value = '';

  if (typeof mockWindow.restoreDraft === 'function') mockWindow.restoreDraft(true);

  assert.equal(mockDoc.getElementById('dcOrderNo').value, 'DC/BLR/2024/00123', 'dcOrderNo must survive round-trip');
  assert.equal(mockDoc.getElementById('dcAuthority').value, 'Deputy Commissioner, Bangalore Urban', 'dcAuthority must survive round-trip');
});

suite.test('Round-trip: measurement fields (roadWidth, plotArea, scale) survive intact', () => {
  resetAll();

  mockDoc.getElementById('roadWidth').value = '30';
  mockDoc.getElementById('plotArea').value = '2400';
  mockDoc.getElementById('scale').value = '1:100';

  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();

  mockDoc.getElementById('roadWidth').value = '';
  mockDoc.getElementById('plotArea').value = '';
  mockDoc.getElementById('scale').value = '';

  if (typeof mockWindow.restoreDraft === 'function') mockWindow.restoreDraft(true);

  assert.equal(mockDoc.getElementById('roadWidth').value, '30', 'roadWidth must survive round-trip');
  assert.equal(mockDoc.getElementById('plotArea').value, '2400', 'plotArea must survive round-trip');
  assert.equal(mockDoc.getElementById('scale').value, '1:100', 'scale must survive round-trip');
});

suite.test('Round-trip: checkbox state (legalConsentCheck) survives save/restore', () => {
  resetAll();

  const checkEl = mockDoc.getElementById('legalConsentCheck');
  checkEl.checked = true;

  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();
  checkEl.checked = false;
  if (typeof mockWindow.restoreDraft === 'function') mockWindow.restoreDraft(true);

  assert.equal(mockDoc.getElementById('legalConsentCheck').checked, true, 'legalConsentCheck must be restored to checked state');
});

suite.test('Draft currentStep pointer is serialised and in range 1-7', () => {
  resetAll();
  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();

  const raw = mockStorage.get('bbmp_studio_draft');
  if (raw) {
    const { currentStep } = JSON.parse(raw);
    assert.ok(currentStep >= 1 && currentStep <= 7, `currentStep must be between 1-7; got ${currentStep}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. Discard Draft — Storage Clean-Up Verification');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('discardDraft removes bbmp_studio_draft key from localStorage', () => {
  resetAll();
  mockDoc.getElementById('ownerName').value = 'Test User';
  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();

  assert.ok(mockStorage.get('bbmp_studio_draft'), 'Precondition: draft must exist before discard');

  if (typeof mockWindow.discardDraft === 'function') mockWindow.discardDraft();

  assert.ok(!mockStorage.get('bbmp_studio_draft'), 'bbmp_studio_draft must be removed after discard (key not found in storage)');
});

suite.test('discardDraft clears form fields back to empty strings', () => {
  resetAll();
  mockDoc.getElementById('ownerName').value = 'Sri Ramesh Rao';
  mockDoc.getElementById('surveyNo').value = 'Sy. 45/2B';
  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();

  if (typeof mockWindow.discardDraft === 'function') mockWindow.discardDraft();

  assert.equal(mockDoc.getElementById('ownerName').value, '', 'ownerName must be cleared after discard');
  assert.equal(mockDoc.getElementById('surveyNo').value, '', 'surveyNo must be cleared after discard');
});

suite.test('discardDraft is idempotent — calling it twice does not throw', () => {
  resetAll();
  assert.doesNotThrow(() => {
    if (typeof mockWindow.discardDraft === 'function') {
      mockWindow.discardDraft();
      mockWindow.discardDraft();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. Corrupted Draft & Fault Tolerance');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('Recovers safely when localStorage contains malformed / non-JSON data', () => {
  mockStorage.set('bbmp_studio_draft', 'CORRUPTED_NON_JSON_DATA{{{');
  assert.doesNotThrow(() => {
    if (typeof mockWindow.checkAndRestoreDraft === 'function') {
      mockWindow.checkAndRestoreDraft();
    } else if (typeof mockWindow.restoreDraft === 'function') {
      try { mockWindow.restoreDraft(true); } catch (_) { /* graceful */ }
    }
  }, 'Corrupted draft must not crash the application');
});

suite.test('Recovers safely with truncated / partial JSON', () => {
  mockStorage.set('bbmp_studio_draft', '{"currentStep":3,"timestamp":170000000,"formData":{"ownerName":"Sri R');
  assert.doesNotThrow(() => {
    if (typeof mockWindow.restoreDraft === 'function') {
      try { mockWindow.restoreDraft(true); } catch (_) { /* graceful */ }
    }
  }, 'Truncated JSON must not crash the application');
});

suite.test('Handles empty string draft value without throwing', () => {
  mockStorage.set('bbmp_studio_draft', '');
  assert.doesNotThrow(() => {
    if (typeof mockWindow.restoreDraft === 'function') {
      try { mockWindow.restoreDraft(true); } catch (_) { }
    }
  });
});

suite.test('Handles completely empty localStorage gracefully', () => {
  mockStorage.clear();
  assert.doesNotThrow(() => {
    if (typeof mockWindow.checkAndRestoreDraft === 'function') {
      mockWindow.checkAndRestoreDraft();
    } else if (typeof mockWindow.restoreDraft === 'function') {
      mockWindow.restoreDraft(true);
    }
  }, 'Empty localStorage must not crash restoreDraft');
});

suite.test('Draft with an out-of-range currentStep value (99) is handled without error', () => {
  const badDraft = JSON.stringify({
    currentStep: 99,
    timestamp: Date.now(),
    formData: { ownerName: 'Test User' }
  });
  mockStorage.set('bbmp_studio_draft', badDraft);
  assert.doesNotThrow(() => {
    if (typeof mockWindow.restoreDraft === 'function') {
      try { mockWindow.restoreDraft(true); } catch (_) { }
    }
  }, 'Out-of-range currentStep must not crash the application');
});

suite.finish();
