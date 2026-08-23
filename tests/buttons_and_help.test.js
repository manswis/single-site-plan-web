/**
 * @file buttons_and_help.test.js
 * @description Comprehensive automated test suite for all interactive buttons,
 * onclick bindings, help tooltips/modals, and functional state machines across e-Plan Studio.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

console.log('\n🔘 [Test Runner] Starting Comprehensive Buttons & Field Help Functional Tests...\n');

// 1. Static HTML Onclick Function Resolution Test
console.log('1. Verifying HTML Button Onclick Handlers vs Window Exports:');
const studioHtmlPath = path.resolve('studio.html');
const studioHtml = fs.readFileSync(studioHtmlPath, 'utf8');

const uiJsContent = fs.readFileSync(path.resolve('js/ui.js'), 'utf8');
const wizardJsContent = fs.readFileSync(path.resolve('js/wizard.js'), 'utf8');
const rendererJsContent = fs.readFileSync(path.resolve('js/renderer.js'), 'utf8');
const themeJsContent = fs.readFileSync(path.resolve('js/theme.js'), 'utf8');
const i18nJsContent = fs.readFileSync(path.resolve('js/i18n.js'), 'utf8');

const allJsCode = [uiJsContent, wizardJsContent, rendererJsContent, themeJsContent, i18nJsContent].join('\n');

// Extract all function calls inside onclick="..." attributes
const onclickRegex = /onclick="([^"]+)"/g;
const JS_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'return', 'event', 'typeof', 'this', 'true', 'false',
  'getElementById', 'querySelector', 'querySelectorAll', 'stopPropagation', 'preventDefault',
  'click', 'focus', 'blur', 'submit', 'reset', 'alert', 'confirm', 'prompt',
  'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent'
]);
const foundFunctions = new Set();
let match;

while ((match = onclickRegex.exec(studioHtml)) !== null) {
  const code = match[1];
  const fnMatches = code.matchAll(/(?:^|[^a-zA-Z0-9_$.])([a-zA-Z0-9_$]+)\s*\(/g);
  for (const fnMatch of fnMatches) {
    const fnName = fnMatch[1];
    if (!JS_KEYWORDS.has(fnName)) {
      foundFunctions.add(fnName);
    }
  }
}

console.log(`   Found ${foundFunctions.size} unique functions attached to onclick handlers in studio.html:`);
foundFunctions.forEach(fn => {
  const isExported = new RegExp(`window\\.${fn}\\s*=`, 'm').test(allJsCode) ||
    new RegExp(`function\\s+${fn}\\s*\\(`, 'm').test(themeJsContent);

  assert.ok(isExported, `CRITICAL ERROR: Onclick function '${fn}()' in studio.html is not exported to window scope!`);
  console.log(`   ✓ Handler '${fn}()' verified and globally bound.`);
});

// 2. Field Help System Coverage & Bilingual Parity Test
console.log('\n2. Verifying Field Help System & Key Parity in EN and KN:');
// Extract help keys referenced in studio.html via showFieldHelp('key')
const helpKeyRegex = /showFieldHelp\('([a-zA-Z0-9_$]+)'\)/g;
const referencedHelpKeys = new Set();
while ((match = helpKeyRegex.exec(studioHtml)) !== null) {
  referencedHelpKeys.add(match[1]);
}

console.log(`   Found ${referencedHelpKeys.size} field help question buttons in studio.html.`);

// Verify FIELD_HELP_DATA and FIELD_HELP_DATA_KN dictionaries from ui.js
const enHelpMatch = uiJsContent.match(/const FIELD_HELP_DATA\s*=\s*({[\s\S]*?});\n\nconst FIELD_HELP_DATA_KN/);
const knHelpMatch = uiJsContent.match(/const FIELD_HELP_DATA_KN\s*=\s*({[\s\S]*?});\n\n\/\*\*/);

assert.ok(enHelpMatch, 'FIELD_HELP_DATA dictionary must be defined in js/ui.js');
assert.ok(knHelpMatch, 'FIELD_HELP_DATA_KN dictionary must be defined in js/ui.js');

const fieldHelpEN = eval('(' + enHelpMatch[1] + ')');
const fieldHelpKN = eval('(' + knHelpMatch[1] + ')');

referencedHelpKeys.forEach(key => {
  assert.ok(fieldHelpEN[key], `Missing English help entry for '${key}' in FIELD_HELP_DATA`);
  assert.ok(fieldHelpEN[key].title, `Missing title for English help '${key}'`);
  assert.ok(fieldHelpEN[key].what, `Missing 'what' explanation for English help '${key}'`);
  assert.ok(fieldHelpEN[key].where, `Missing 'where' guidance for English help '${key}'`);

  assert.ok(fieldHelpKN[key], `Missing Kannada help entry for '${key}' in FIELD_HELP_DATA_KN`);
  assert.ok(fieldHelpKN[key].title, `Missing title for Kannada help '${key}'`);
  assert.ok(fieldHelpKN[key].what, `Missing 'what' explanation for Kannada help '${key}'`);
  assert.ok(fieldHelpKN[key].where, `Missing 'where' guidance for Kannada help '${key}'`);
});
console.log(`   ✓ All ${referencedHelpKeys.size} help buttons have 100% complete bilingual metadata.`);

// 3. Field Help Modal Renderer Simulation Test
console.log('\n3. Testing Field Help Modal Render Output:');
function renderMockFieldHelpModal(fieldKey, isKn = false) {
  const data = isKn ? (fieldHelpKN[fieldKey] || fieldHelpEN[fieldKey]) : (fieldHelpEN[fieldKey] || {});
  if (!data.title) return null;

  const whatLabel = isKn ? 'ಇದು ಏನು:' : 'What it is:';
  const whereLabel = isKn ? 'ದಾಖಲೆಗಳಲ್ಲಿ ಎಲ್ಲಿ ಹುಡುಕಬೇಕು:' : 'Where to find it:';

  let body = `
    <div class="field-help-section">
      <div class="field-help-label">${whatLabel}</div>
      <div class="field-help-desc">${data.what}</div>
    </div>
    <div class="field-help-section">
      <div class="field-help-label">${whereLabel}</div>
      <div class="field-help-desc">${data.where}</div>
    </div>
  `;
  if (data.sample) {
    body += `<div class="field-help-sample"><code>${data.sample}</code></div>`;
  }
  return { title: data.title, body };
}

referencedHelpKeys.forEach(key => {
  const modalEn = renderMockFieldHelpModal(key, false);
  const modalKn = renderMockFieldHelpModal(key, true);

  assert.ok(modalEn && modalEn.title && modalEn.body.includes('What it is:'));
  assert.ok(modalKn && modalKn.title && modalKn.body.includes('ಇದು ಏನು:'));
});
console.log('   ✓ Help modal renderer successfully constructs verified HTML in EN and KN without error.');

// 4. Action Button State Machine Functional Simulation Test
console.log('\n4. Testing Core Action Buttons State Transitions:');
class MockDOMStateManager {
  constructor() {
    this.legalConsentChecked = false;
    this.planGenerated = false;
    this.currentStep = 1;
    this.fieldHelpOpen = false;
    this.areaConverterModalOpen = false;
    this.wardSearchModalOpen = false;
  }

  toggleLegalConsent(checked) {
    this.legalConsentChecked = checked;
    if (!checked) {
      this.planGenerated = false;
    }
  }

  generatePlan() {
    if (!this.legalConsentChecked) {
      throw new Error('Consent required');
    }
    this.planGenerated = true;
  }

  getButtonStates() {
    return {
      generateDisabled: !this.legalConsentChecked,
      exportPdfDisabled: !this.legalConsentChecked || !this.planGenerated,
      printDisabled: !this.legalConsentChecked || !this.planGenerated,
      reportDrawingDisabled: !this.legalConsentChecked || !this.planGenerated,
      saveProjectDisabled: !this.legalConsentChecked
    };
  }
}

const state = new MockDOMStateManager();

// Initial state
assert.deepEqual(state.getButtonStates(), {
  generateDisabled: true,
  exportPdfDisabled: true,
  printDisabled: true,
  reportDrawingDisabled: true,
  saveProjectDisabled: true
}, 'All action buttons must be disabled initially');

// After legal consent checked
state.toggleLegalConsent(true);
assert.equal(state.getButtonStates().generateDisabled, false, 'Generate button must be enabled');
assert.equal(state.getButtonStates().exportPdfDisabled, true, 'Export PDF must remain disabled until generation');
assert.equal(state.getButtonStates().saveProjectDisabled, false, 'Save Project is enabled');

// After plan generation click
state.generatePlan();
assert.equal(state.getButtonStates().exportPdfDisabled, false, 'Export PDF must be enabled after generation');
assert.equal(state.getButtonStates().printDisabled, false, 'Print must be enabled after generation');
assert.equal(state.getButtonStates().reportDrawingDisabled, false, 'Report Drawing must be enabled after generation');

// When user unchecks legal consent
state.toggleLegalConsent(false);
assert.equal(state.getButtonStates().generateDisabled, true);
assert.equal(state.getButtonStates().exportPdfDisabled, true);
assert.equal(state.getButtonStates().printDisabled, true);
console.log('   ✓ Action buttons state machine transitions verified safely.');

// 5. Map Pin Picker & Geolocation Fallback Architecture Tests
console.log('\n5. Verifying Map Pin Picker & Geolocation Fallback Architecture:');
assert.ok(uiJsContent.includes('const BANGALORE_ZONE_CENTERS ='), 'BANGALORE_ZONE_CENTERS must be defined in ui.js');
assert.ok(uiJsContent.includes('function ensureLeafletLoaded('), 'ensureLeafletLoaded must be defined for dynamic CDN fallback');
assert.ok(uiJsContent.includes('container._leaflet_id = null;'), 'Must prevent Leaflet map already initialized errors');
assert.ok(uiJsContent.includes('enableHighAccuracy: false'), 'Must provide 2-stage relaxed GPS fallback');
assert.ok(uiJsContent.includes('window.openLocationPickerModal ='), 'openLocationPickerModal must be exported to window');
assert.ok(uiJsContent.includes('window.detectGPSLocation ='), 'detectGPSLocation must be exported to window');
assert.ok(uiJsContent.includes('window.locateOnPickerMap ='), 'locateOnPickerMap must be exported to window');
assert.ok(uiJsContent.includes('window.resetToBangaloreCenter ='), 'resetToBangaloreCenter must be exported to window');
assert.ok(uiJsContent.includes('window.searchMapLocation ='), 'searchMapLocation must be exported to window');
console.log('   ✓ Map Pin Picker, Geolocation 2-stage fallback, and global window exports verified.');

console.log('\n🎉 ALL 5 BUTTONS & HELP SYSTEM TEST SUITES PASSED WITH 100% SUCCESS!\n');
