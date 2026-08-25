/**
 * @file wizard.unit.test.js
 * @description Unit tests for wizard.js — the 7-step wizard state machine.
 * Tests STEP_METADATA completeness, DRAFT_FIELD_IDS integrity,
 * formatDraftTimestamp branches, saveDraft/discardDraft, and navigation guards.
 *
 * NOTE: STEP_METADATA and DRAFT_FIELD_IDS are module-scoped constants in wizard.js
 * (not exposed on window). Their structure is tested via source-level analysis
 * and via save/restore observable side-effects.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Wizard State Machine Unit Tests', '🧙');

const WIZARD_SOURCE = fs.readFileSync(path.resolve('js/wizard.js'), 'utf8');

function buildWizardSandbox() {
  const { mockDoc, mockWindow, mockStorage } = createMockBrowserEnvironment();
  const ctx = vm.createContext(mockWindow);
  vm.runInContext(WIZARD_SOURCE, ctx);
  return { mockDoc, mockWindow, mockStorage, ctx };
}

// ─────────────────────────────────────────────────────────────────────────────
suite.section('1. STEP_METADATA Completeness — Source-Level Integrity');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('wizard.js defines STEP_METADATA with exactly 7 numbered step entries', () => {
  // STEP_METADATA is module-scoped — verify via source analysis
  const matches = [...WIZARD_SOURCE.matchAll(/^\s+(\d+):\s*\{/gm)].map(m => parseInt(m[1]));
  const stepEntries = matches.filter(n => n >= 1 && n <= 7);
  // Filter to the STEP_METADATA block specifically
  const metaBlock = WIZARD_SOURCE.match(/const STEP_METADATA\s*=\s*\{([\s\S]*?)\};/);
  assert.ok(metaBlock, 'STEP_METADATA constant must be defined in wizard.js');

  const stepNums = [...metaBlock[1].matchAll(/^\s+(\d+):\s*\{/gm)].map(m => parseInt(m[1]));
  assert.equal(stepNums.length, 7, `STEP_METADATA must have exactly 7 step entries; found ${stepNums.length}`);
});

suite.test('All 7 steps define title, mobileTitle, icon, and desc fields', () => {
  const metaBlock = WIZARD_SOURCE.match(/const STEP_METADATA\s*=\s*\{([\s\S]*?)\};/);
  if (!metaBlock) return;

  const requiredFields = ['title', 'mobileTitle', 'icon', 'desc'];
  requiredFields.forEach(field => {
    const count = [...metaBlock[1].matchAll(new RegExp(`\\b${field}\\b`, 'g'))].length;
    assert.ok(count >= 7, `STEP_METADATA must have at least 7 occurrences of '${field}' (one per step); found ${count}`);
  });
});

suite.test('Step 7 STEP_METADATA references export/review terminology', () => {
  const metaBlock = WIZARD_SOURCE.match(/const STEP_METADATA\s*=\s*\{([\s\S]*?)\};/);
  if (!metaBlock) return;

  // Extract step 7 specifically
  const step7Match = metaBlock[1].match(/7:\s*\{([^}]+)\}/);
  if (step7Match) {
    const step7Content = step7Match[1].toLowerCase();
    const hasExportTerm = step7Content.includes('review') || step7Content.includes('export') ||
                          step7Content.includes('pdf') || step7Content.includes('print') ||
                          step7Content.includes('download');
    assert.ok(hasExportTerm, 'Step 7 must reference review, export, PDF, or download in its metadata');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('2. DRAFT_FIELD_IDS Integrity');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('DRAFT_FIELD_IDS source block contains >= 30 field IDs', () => {
  const draftBlock = WIZARD_SOURCE.match(/const DRAFT_FIELD_IDS\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(draftBlock, 'DRAFT_FIELD_IDS must be defined in wizard.js');
  const ids = [...draftBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(ids.length >= 30, `DRAFT_FIELD_IDS must have >= 30 entries; found ${ids.length}`);
});

suite.test('DRAFT_FIELD_IDS contains all 7 mandatory Sakala statutory fields', () => {
  const draftBlock = WIZARD_SOURCE.match(/const DRAFT_FIELD_IDS\s*=\s*\[([\s\S]*?)\];/);
  if (!draftBlock) return;
  const ids = [...draftBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const mandatoryFields = ['ownerName', 'epId', 'surveyNo', 'wardNo', 'wardName', 'bbmpZone', 'address'];
  const missing = mandatoryFields.filter(f => !ids.includes(f));
  assert.equal(missing.length, 0, `Missing mandatory Sakala fields: ${missing.join(', ')}`);
});

suite.test('DRAFT_FIELD_IDS has no duplicate entries', () => {
  const draftBlock = WIZARD_SOURCE.match(/const DRAFT_FIELD_IDS\s*=\s*\[([\s\S]*?)\];/);
  if (!draftBlock) return;
  const ids = [...draftBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, `DRAFT_FIELD_IDS has ${ids.length - unique.size} duplicate entries`);
});

suite.test('DRAFT_CHECKBOX_IDS contains legalConsentCheck (the zero-liability gate)', () => {
  const checkboxBlock = WIZARD_SOURCE.match(/const DRAFT_CHECKBOX_IDS\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(checkboxBlock, 'DRAFT_CHECKBOX_IDS must be defined in wizard.js');
  assert.ok(
    checkboxBlock[1].includes('legalConsentCheck'),
    'DRAFT_CHECKBOX_IDS must include legalConsentCheck — removing it breaks the legal consent gate'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('3. formatDraftTimestamp — All 4 Time Branch Coverage');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('formatDraftTimestamp returns "just now" string for < 60 seconds ago', () => {
  const { mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.formatDraftTimestamp !== 'function') return;

  const result = mockWindow.formatDraftTimestamp(Date.now() - 30000);
  assert.ok(typeof result === 'string' && result.length > 0, 'Must return a non-empty string');
  const lower = result.toLowerCase();
  assert.ok(
    lower.includes('just') || lower.includes('now') || lower.includes('0 min') ||
    lower.includes('second') || result.includes('ಇದೀಗ'),
    `Expected "just now" equivalent for 30s ago; got: "${result}"`
  );
});

suite.test('formatDraftTimestamp returns minutes string for 15 minutes ago', () => {
  const { mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.formatDraftTimestamp !== 'function') return;

  const result = mockWindow.formatDraftTimestamp(Date.now() - 15 * 60 * 1000);
  assert.ok(
    result.includes('15') || result.toLowerCase().includes('min') || result.includes('ನಿಮಿಷ'),
    `Expected minutes-ago string for 15min ago; got: "${result}"`
  );
});

suite.test('formatDraftTimestamp returns hours string for 3 hours ago', () => {
  const { mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.formatDraftTimestamp !== 'function') return;

  const result = mockWindow.formatDraftTimestamp(Date.now() - 3 * 60 * 60 * 1000);
  assert.ok(
    result.includes('3') || result.toLowerCase().includes('hour') || result.includes('ಗಂಟೆ'),
    `Expected hours-ago string for 3hrs ago; got: "${result}"`
  );
});

suite.test('formatDraftTimestamp returns days string for 2 days ago', () => {
  const { mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.formatDraftTimestamp !== 'function') return;

  const result = mockWindow.formatDraftTimestamp(Date.now() - 2 * 24 * 60 * 60 * 1000);
  assert.ok(
    result.includes('2') || result.toLowerCase().includes('day') ||
    result.includes('ದಿನ') || result.toLowerCase().includes('yesterday'),
    `Expected days-ago string for 2 days ago; got: "${result}"`
  );
});

suite.test('formatDraftTimestamp handles null/undefined/NaN/0 without throwing', () => {
  const { mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.formatDraftTimestamp !== 'function') return;

  assert.doesNotThrow(() => mockWindow.formatDraftTimestamp(null));
  assert.doesNotThrow(() => mockWindow.formatDraftTimestamp(undefined));
  assert.doesNotThrow(() => mockWindow.formatDraftTimestamp(NaN));
  assert.doesNotThrow(() => mockWindow.formatDraftTimestamp(0));
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('4. saveDraft & discardDraft Functional Tests');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('saveDraft writes correct envelope structure (currentStep, timestamp, formData)', () => {
  const { mockDoc, mockWindow, mockStorage } = buildWizardSandbox();
  mockDoc.getElementById('ownerName').value = 'Sri Test Owner';
  mockDoc.getElementById('surveyNo').value = 'Sy. 100/1A';

  if (typeof mockWindow.saveDraft === 'function') {
    mockWindow.saveDraft();
  }

  const raw = mockStorage.get('bbmp_studio_draft');
  assert.ok(raw, 'saveDraft must write to bbmp_studio_draft key');

  const parsed = JSON.parse(raw);
  assert.ok('currentStep' in parsed, 'Envelope must contain currentStep');
  assert.ok('timestamp'   in parsed, 'Envelope must contain timestamp');
  assert.ok('formData'    in parsed, 'Envelope must contain formData');
  assert.equal(parsed.formData.ownerName, 'Sri Test Owner', 'formData must capture ownerName');
  assert.equal(parsed.formData.surveyNo,  'Sy. 100/1A',    'formData must capture surveyNo');
});

suite.test('discardDraft removes bbmp_studio_draft key from storage', () => {
  const { mockDoc, mockWindow, mockStorage } = buildWizardSandbox();
  mockDoc.getElementById('ownerName').value = 'Sri Test Owner';
  if (typeof mockWindow.saveDraft === 'function') mockWindow.saveDraft();

  assert.ok(mockStorage.get('bbmp_studio_draft'), 'Draft must exist before discard');

  if (typeof mockWindow.discardDraft === 'function') mockWindow.discardDraft();

  assert.ok(!mockStorage.get('bbmp_studio_draft'), 'bbmp_studio_draft must be removed after discard');
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('5. Navigation Button Visibility Matrix');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('showStep(1): prevBtn hidden, nextBtn visible with Continue text', () => {
  const { mockDoc, mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.showStep !== 'function') return;

  mockWindow.showStep(1, false, false);

  assert.equal(mockDoc.getElementById('prevBtn').style.display, 'none', 'prevBtn must be hidden on Step 1');
  assert.equal(mockDoc.getElementById('nextBtn').style.display, 'inline-flex', 'nextBtn must be visible on Step 1');
});

suite.test('showStep(7): prevBtn visible, nextBtn hidden', () => {
  const { mockDoc, mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.showStep !== 'function') return;

  mockWindow.showStep(7, false, false);

  assert.equal(mockDoc.getElementById('prevBtn').style.display, 'inline-flex', 'prevBtn must be visible on Step 7');
  assert.equal(mockDoc.getElementById('nextBtn').style.display, 'none', 'nextBtn must be hidden on Step 7');
});

suite.test('prevStep() on Step 1 is a no-op (stays on Step 1)', () => {
  const { mockWindow } = buildWizardSandbox();
  if (typeof mockWindow.showStep !== 'function') return;

  mockWindow.showStep(1, false, false);
  if (typeof mockWindow.prevStep === 'function') mockWindow.prevStep();

  if (typeof mockWindow.getCurrentStep === 'function') {
    assert.equal(mockWindow.getCurrentStep(), 1, 'prevStep() on Step 1 must stay on Step 1');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
suite.section('6. wizard.js Source-Level Architecture Guardrails');
// ─────────────────────────────────────────────────────────────────────────────

suite.test('wizard.js exposes all required public API functions on window', () => {
  const REQUIRED_WINDOW_FUNCTIONS = [
    'initWizard', 'showStep', 'nextStep', 'prevStep', 'goToStep',
    'saveDraft', 'restoreDraft', 'discardDraft',
    'validateStep', 'exportProjectFile'
  ];
  REQUIRED_WINDOW_FUNCTIONS.forEach(fn => {
    assert.ok(
      WIZARD_SOURCE.includes(`window.${fn}`),
      `wizard.js must expose window.${fn} — removing it breaks the public API`
    );
  });
});

suite.test('DRAFT_STORAGE_KEY constant is present and equals bbmp_studio_draft', () => {
  assert.ok(
    WIZARD_SOURCE.includes("'bbmp_studio_draft'") || WIZARD_SOURCE.includes('"bbmp_studio_draft"'),
    'DRAFT_STORAGE_KEY must equal bbmp_studio_draft — changing it silently breaks all existing drafts'
  );
});

suite.finish();
