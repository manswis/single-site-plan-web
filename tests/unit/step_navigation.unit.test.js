/**
 * @file step_navigation.unit.test.js
 * @description Comprehensive unit test suite verifying that Step 1 shows ONLY the Continue button
 * (Previous/Back button hidden), while Steps 2-7 dynamically display the Previous/Back button.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Wizard Step Navigation Buttons Unit Tests', '🔄');

suite.section('1. Static HTML & Footer Bar Structural Integrity');

suite.test('studio.html contains both prevBtn and nextBtn inside wizard-footer-bar', () => {
  const html = fs.readFileSync(path.resolve('studio.html'), 'utf8');
  assert.ok(html.includes('id="prevBtn"'), 'studio.html must contain #prevBtn element');
  assert.ok(html.includes('id="nextBtn"'), 'studio.html must contain #nextBtn element');
  assert.ok(html.includes('onclick="prevStep()"'), 'prevBtn must be bound to prevStep()');
  assert.ok(html.includes('onclick="nextStep()"'), 'nextBtn must be bound to nextStep()');
});

suite.section('2. Step 1 to 7 Navigation Button Visibility Matrix');

function setupWizardSandbox() {
  const domElements = {};
  const createElement = (id, tag = 'div') => {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      style: {},
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      textContent: '',
      innerHTML: '',
      value: '',
      checked: false,
      scrollIntoView: () => { },
      querySelectorAll: () => []
    };
    domElements[id] = el;
    return el;
  };

  // Create core wizard elements
  createElement('prevBtn', 'button');
  createElement('nextBtn', 'button');
  createElement('wizardCard');
  createElement('wizardProgressBar');
  createElement('mobileStepProgressFill');
  createElement('stepCounterBadge');
  createElement('stepTitleText');
  createElement('stepDescText');
  createElement('mobileStepBadge');
  createElement('mobileStepTitle');
  createElement('exportViewportSection');

  for (let i = 1; i <= 7; i++) {
    createElement(`wizardStep${i}`);
    createElement(`stepTab${i}`);
  }

  const context = {
    document: {
      getElementById: (id) => domElements[id] || null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => { }
    },
    window: {
      addEventListener: () => { }
    },
    localStorage: {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { }
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { }
    },
    console: { log: () => { }, warn: () => { }, error: () => { } },
    t: (k) => k === 'btn.back' ? '← Previous' : k === 'btn.continue' ? 'Continue →' : k === 'btn.review' ? 'Review →' : k,
    setTimeout: (fn) => fn(),
    DRAFT_FIELD_IDS: [],
    DRAFT_CHECKBOX_IDS: [],
    STEP_METADATA: {
      1: { icon: '👤', title: 'Applicant & Ownership', desc: '', mobileTitle: 'Applicant' },
      2: { icon: '📍', title: 'Location & Ward', desc: '', mobileTitle: 'Location' },
      3: { icon: '📐', title: 'Plot Dimensions', desc: '', mobileTitle: 'Plot Area' },
      4: { icon: '🏢', title: 'Building Setbacks', desc: '', mobileTitle: 'Setbacks' },
      5: { icon: '🧭', title: 'Abutting Boundaries', desc: '', mobileTitle: 'Boundaries' },
      6: { icon: '📋', title: 'Statutory Compliance', desc: '', mobileTitle: 'Compliance' },
      7: { icon: '🖨️', title: 'Review & Print', desc: '', mobileTitle: 'Export' }
    }
  };

  vm.createContext(context);
  const wizardCode = fs.readFileSync(path.resolve('js/wizard.js'), 'utf8');
  vm.runInContext(wizardCode, context);

  return { context, domElements };
}

suite.test('Step 1: prevBtn is HIDDEN (display: none) and nextBtn is VISIBLE (display: inline-flex)', () => {
  const { context, domElements } = setupWizardSandbox();
  context.showStep(1, false, false);

  assert.equal(domElements.prevBtn.style.display, 'none', 'Step 1 must HIDE previous button');
  assert.equal(domElements.nextBtn.style.display, 'inline-flex', 'Step 1 must SHOW continue button');
  assert.equal(domElements.nextBtn.textContent, 'Continue →', 'Step 1 next button text must be Continue →');
});

[2, 3, 4, 5].forEach(step => {
  suite.test(`Step ${step}: prevBtn is VISIBLE (display: inline-flex) and nextBtn is VISIBLE (display: inline-flex)`, () => {
    const { context, domElements } = setupWizardSandbox();
    context.showStep(step, false, false);

    assert.equal(domElements.prevBtn.style.display, 'inline-flex', `Step ${step} must SHOW previous button`);
    assert.equal(domElements.prevBtn.textContent, '← Previous', `Step ${step} prev button text must be ← Previous`);
    assert.equal(domElements.nextBtn.style.display, 'inline-flex', `Step ${step} must SHOW continue button`);
    assert.equal(domElements.nextBtn.textContent, 'Continue →', `Step ${step} next button text must be Continue →`);
  });
});

suite.test('Step 6 (Compliance): prevBtn is VISIBLE and nextBtn displays "Review →"', () => {
  const { context, domElements } = setupWizardSandbox();
  context.showStep(6, false, false);

  assert.equal(domElements.prevBtn.style.display, 'inline-flex', 'Step 6 must SHOW previous button');
  assert.equal(domElements.nextBtn.style.display, 'inline-flex', 'Step 6 must SHOW review button');
  assert.equal(domElements.nextBtn.textContent, 'Review →', 'Step 6 next button text must be Review →');
});

suite.test('Step 7 (Final Review): prevBtn is VISIBLE and nextBtn is HIDDEN (display: none)', () => {
  const { context, domElements } = setupWizardSandbox();
  context.showStep(7, false, false);

  assert.equal(domElements.prevBtn.style.display, 'inline-flex', 'Step 7 must SHOW previous button');
  assert.equal(domElements.nextBtn.style.display, 'none', 'Step 7 must HIDE continue button in favor of action buttons');
});

suite.section('3. Navigation Flow Execution Tests (prevStep / nextStep)');

suite.test('prevStep() moves backward safely from Step 3 to Step 2', () => {
  const { context, domElements } = setupWizardSandbox();
  context.window.showStep(3, false, false);
  assert.equal(context.window.getCurrentStep(), 3);
  assert.equal(domElements.wizardStep3.style.display, 'block');

  context.window.prevStep();
  assert.equal(context.window.getCurrentStep(), 2, 'prevStep() from Step 3 must decrement currentStep to 2');
  assert.equal(domElements.wizardStep2.style.display, 'block');
  assert.equal(domElements.wizardStep3.style.display, 'none');
});

suite.test('prevStep() on Step 1 is safely a no-op (cannot go below Step 1)', () => {
  const { context, domElements } = setupWizardSandbox();
  context.window.showStep(1, false, false);
  assert.equal(context.window.getCurrentStep(), 1);
  assert.equal(domElements.wizardStep1.style.display, 'block');

  context.window.prevStep();
  assert.equal(context.window.getCurrentStep(), 1, 'prevStep() on Step 1 must safely remain on Step 1');
  assert.equal(domElements.wizardStep1.style.display, 'block');
});

suite.section('4. Mobile Responsive Navigation CSS Guardrails');

suite.test('Mobile CSS explicitly hides buttons with display: none and does not override prevBtn on Step 1', () => {
  const css = fs.readFileSync(path.resolve('css/styles.css'), 'utf8');
  assert.ok(
    css.includes('.wizard-footer-bar button[style*="display: none"]'),
    'styles.css must contain explicit mobile display: none rule for hidden footer buttons'
  );
  assert.ok(
    css.includes('.wizard-footer-bar #prevBtn[style*="display: none"]'),
    'styles.css must contain explicit mobile display: none rule for #prevBtn'
  );
});

suite.section('5. Step 7 Action Button Sequencing & Plan Generation Gating');

suite.test('Step 7 Action Hub Gatekeeper: Strict sequence from Unchecked -> Consent -> Generate -> Export/Print Unlocked', async () => {
  const { createMockBrowserEnvironment } = await import('../helpers/mock_dom.js');
  const { mockDoc, mockWindow } = createMockBrowserEnvironment();

  // Load real ui.js in a VM sandbox to verify the real toggleLegalConsent and onGeneratePlanClick state transitions
  const UI_SOURCE = fs.readFileSync(path.resolve('js/ui.js'), 'utf8')
    .replace(/^import\s+[\s\S]*?;\s*$/gm, '')
    .replace(/^export\s+/gm, '');

  let planGeneratedTracked = false;
  let cadPlanRendered = false;

  mockWindow.generatePlan = () => { cadPlanRendered = true; };
  mockWindow.trackPlanGenerated = () => { planGeneratedTracked = true; };
  mockWindow.saveDraft = () => {};
  mockWindow.clearFieldError = () => {};
  mockWindow.BBMP_WARDS = [];
  mockWindow.BBMP_ZONES = [];
  mockWindow.generateQrSvg = () => '';
  mockWindow.renderQrToCanvas = () => {};

  const ctx = vm.createContext(mockWindow);
  vm.runInContext(UI_SOURCE, ctx);

  const legalConsentCheck = mockDoc.getElementById('legalConsentCheck');
  const generatePlanBtn   = mockDoc.getElementById('generatePlanBtn');
  const downloadPdfBtn    = mockDoc.getElementById('downloadPdfBtn');
  const printBtn          = mockDoc.getElementById('printBtn');
  const reportBtn         = mockDoc.getElementById('reportDrawingBtn');
  const exportViewport    = mockDoc.getElementById('exportViewportSection');

  // Set initial state
  generatePlanBtn.disabled = true;
  downloadPdfBtn.disabled = true;
  printBtn.disabled = true;
  reportBtn.disabled = true;
  exportViewport.style.display = 'none';

  // 1. Initial State: All action buttons disabled, viewport hidden
  assert.equal(generatePlanBtn.disabled, true, 'Initial: Generate button must be disabled');
  assert.equal(downloadPdfBtn.disabled,  true, 'Initial: Export PDF button must be disabled');
  assert.equal(printBtn.disabled,        true, 'Initial: Print button must be disabled');
  assert.equal(reportBtn.disabled,       true, 'Initial: Report button must be disabled');

  // 2. User checks Legal Consent -> ONLY Generate is enabled; Export/Print MUST REMAIN DISABLED
  legalConsentCheck.checked = true;
  mockWindow.toggleLegalConsent();

  assert.equal(generatePlanBtn.disabled, false, 'Consent checked: Generate button MUST be enabled');
  assert.equal(downloadPdfBtn.disabled,  true,  'Consent checked: Export PDF MUST REMAIN DISABLED (no drawing yet)');
  assert.equal(printBtn.disabled,        true,  'Consent checked: Print MUST REMAIN DISABLED (no drawing yet)');
  assert.equal(reportBtn.disabled,       true,  'Consent checked: Report MUST REMAIN DISABLED (no drawing yet)');
  assert.equal(exportViewport.style.display, 'none', 'Consent checked: Viewport must still be hidden');

  // 3. User clicks "Generate" -> CAD drawing renders, trackPlanGenerated fires, Export/Print unlock!
  mockWindow.onGeneratePlanClick();

  assert.equal(cadPlanRendered, true, 'Generate clicked: generatePlan() CAD renderer must execute');
  assert.equal(planGeneratedTracked, true, 'Generate clicked: trackPlanGenerated() must fire');
  assert.equal(exportViewport.style.display, 'block', 'Generate clicked: Drawing viewport must be revealed');
  assert.equal(downloadPdfBtn.disabled, false, 'Generate clicked: Export PDF button MUST NOW BE UNLOCKED');
  assert.equal(printBtn.disabled,       false, 'Generate clicked: Print button MUST NOW BE UNLOCKED');
  assert.equal(reportBtn.disabled,      false, 'Generate clicked: Report button MUST NOW BE UNLOCKED');

  // 4. User unchecks Legal Consent -> Resets plan generated state, re-disables all buttons, hides viewport
  legalConsentCheck.checked = false;
  mockWindow.toggleLegalConsent();

  assert.equal(generatePlanBtn.disabled, true, 'Consent unchecked: Generate button must be disabled');
  assert.equal(downloadPdfBtn.disabled,  true, 'Consent unchecked: Export PDF button must be disabled');
  assert.equal(printBtn.disabled,        true, 'Consent unchecked: Print button must be disabled');
  assert.equal(reportBtn.disabled,       true, 'Consent unchecked: Report button must be disabled');
  assert.equal(exportViewport.style.display, 'none', 'Consent unchecked: Viewport must be hidden again');
});

export default suite;

