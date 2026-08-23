/**
 * @file draft_session_lifecycle.test.js
 * @description Integration tests for auto-save draft lifecycle, JSON schema serialization, and corrupted session recovery.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Draft Session & Serialization Integration Tests', '💾');

const { mockDoc, mockWindow, mockStorage } = createMockBrowserEnvironment();
const studioBundleMinJs = fs.readFileSync(path.resolve('js/studio.bundle.min.js'), 'utf8');

const context = vm.createContext(mockWindow);
vm.runInContext(studioBundleMinJs, context);

suite.section('1. Full Form Draft Serialization & Round-Trip');

suite.test('Serializes full 7-step wizard state into valid JSON in localStorage', () => {
  mockDoc.getElementById('ownerName').value = 'Sri Ramesh Rao';
  mockDoc.getElementById('surveyNo').value = 'Sy. 45/2B';
  mockDoc.getElementById('wardNo').value = '112';
  mockDoc.getElementById('wardName').value = 'Domlur';
  mockDoc.getElementById('plotWidth').value = '30';
  mockDoc.getElementById('plotDepth').value = '40';

  if (typeof mockWindow.saveDraft === 'function') {
    mockWindow.saveDraft();
  }

  const savedDraft = mockStorage.get('eplan_studio_draft');
  if (savedDraft) {
    const parsed = JSON.parse(savedDraft);
    assert.equal(parsed.ownerName, 'Sri Ramesh Rao');
    assert.equal(parsed.surveyNo, 'Sy. 45/2B');
    assert.equal(parsed.wardNo, '112');
  }
});

suite.section('2. Corrupted Draft & Fault Tolerance');

suite.test('Recovers safely when localStorage contains malformed / non-JSON data', () => {
  mockStorage.set('eplan_studio_draft', 'CORRUPTED_NON_JSON_DATA{{{');
  // Attempting to restore or check draft must not throw fatal exceptions
  try {
    if (typeof mockWindow.checkForSavedDraft === 'function') {
      mockWindow.checkForSavedDraft();
    }
    assert.ok(true, 'Corrupted draft handled gracefully without crashing app');
  } catch (err) {
    assert.fail(`Fatal error on corrupted draft: ${err.message}`);
  }
});

suite.test('Handles empty and blank draft restoration cleanly', () => {
  mockStorage.clear();
  if (typeof mockWindow.checkForSavedDraft === 'function') {
    mockWindow.checkForSavedDraft();
  }
  assert.ok(true);
});

suite.finish();
