/**
 * @file dom_simulation.test.js
 * @description Comprehensive End-to-End DOM Simulation & Functional Execution Test Suite.
 * Evaluates the production JavaScript bundles (js/studio.bundle.min.js and js/i18n.min.js) in a simulated browser
 * runtime environment, executing every onclick handler, testing all 7 modal state lifecycles, and validating
 * full wizard step-by-step navigation flows.
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

console.log('\n🧪 [Test Runner] Starting Comprehensive End-to-End DOM & Button Execution Suite...\n');

// 1. Load HTML and Bundled JavaScript files
const studioHtml = fs.readFileSync(path.resolve('studio.html'), 'utf8');
const studioBundleMinJs = fs.readFileSync(path.resolve('js/studio.bundle.min.js'), 'utf8');
const i18nMinJs = fs.readFileSync(path.resolve('js/i18n.min.js'), 'utf8');
const themeMinJs = fs.readFileSync(path.resolve('js/theme.min.js'), 'utf8');

// 2. Build DOM Simulation Mock Engine
class MockClassList {
  constructor(el) {
    this.el = el;
    this.classes = new Set();
  }
  add(...names) { names.forEach(n => this.classes.add(n)); }
  remove(...names) { names.forEach(n => this.classes.delete(n)); }
  contains(name) { return this.classes.has(name); }
  toggle(name) {
    if (this.classes.has(name)) { this.classes.delete(name); return false; }
    this.classes.add(name); return true;
  }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this._value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.src = '';
    this.checked = false;
    this.disabled = false;
    this.dataset = {};
    this.attributes = new Map();
    this.style = {
      display: 'none',
      setProperty(prop, val, priority) { this[prop] = val; }
    };
    this.classList = new MockClassList(this);
    this.children = [];
    this.parentElement = null;
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v ?? ''); }

  getAttribute(name) { return this.attributes.get(name) || null; }
  setAttribute(name, val) { this.attributes.set(name, String(val)); }
  removeAttribute(name) { this.attributes.delete(name); }
  focus() { }
  select() { }
  scrollIntoView() { }
  click() { }
  closest(selector) { return this.parentElement; }
  querySelectorAll(sel) { return []; }
  querySelector(sel) { return null; }
  appendChild(child) {
    this.children.push(child);
    if (child instanceof MockElement) child.parentElement = this;
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    return child;
  }
  addEventListener() { }
  removeEventListener() { }
  toDataURL() { return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; }
  remove() {
    if (this.parentElement) this.parentElement.removeChild(this);
  }
}

class MockDocument {
  constructor() {
    this.elements = new Map();
    this.documentElement = new MockElement('html', 'html');
    this.head = new MockElement('head', 'head');
    this.body = new MockElement('body', 'body');
  }

  getElementById(id) {
    if (!this.elements.has(id)) {
      const el = new MockElement(id);
      this.elements.set(id, el);
    }
    return this.elements.get(id);
  }

  querySelector(selector) {
    if (selector.startsWith('#')) return this.getElementById(selector.slice(1));
    return null;
  }

  querySelectorAll(selector) {
    return [];
  }

  createElement(tagName) {
    return new MockElement('', tagName);
  }

  createElementNS(ns, tagName) {
    return new MockElement('', tagName);
  }

  addEventListener() { }
  removeEventListener() { }
}

// 3. Create Sandbox Environment
const mockDoc = new MockDocument();
const mockWindow = {
  document: mockDoc,
  navigator: {
    geolocation: {
      getCurrentPosition: (success, error, options) => {
        success({
          coords: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 10
          }
        });
      }
    }
  },
  localStorage: {
    store: new Map(),
    getItem: (k) => mockWindow.localStorage.store.get(k) || null,
    setItem: (k, v) => mockWindow.localStorage.store.set(k, String(v)),
    removeItem: (k) => mockWindow.localStorage.store.delete(k),
    clear: () => mockWindow.localStorage.store.clear()
  },
  sessionStorage: {
    store: new Map(),
    getItem: (k) => mockWindow.sessionStorage.store.get(k) || null,
    setItem: (k, v) => mockWindow.sessionStorage.store.set(k, String(v)),
    removeItem: (k) => mockWindow.sessionStorage.store.delete(k),
    clear: () => mockWindow.sessionStorage.store.clear()
  },
  setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
  clearTimeout: () => { },
  setInterval: () => 1,
  clearInterval: () => { },
  Image: class {
    constructor() {
      this._src = '';
      this.width = 100;
      this.height = 100;
      this.naturalWidth = 100;
      this.naturalHeight = 100;
      this.onload = null;
      this.onerror = null;
    }
    get src() { return this._src; }
    set src(v) {
      this._src = v;
      if (typeof this.onload === 'function') {
        this.onload();
      }
    }
  },
  alert: () => { },
  confirm: () => true,
  prompt: () => '',
  addEventListener: () => { },
  removeEventListener: () => { },
  location: { search: '' }
};
mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

// Mock canvas context on elements
MockElement.prototype.getContext = function () {
  return {
    fillRect: () => { },
    clearRect: () => { },
    drawImage: () => { },
    beginPath: () => { },
    arc: () => { },
    fill: () => { },
    stroke: () => { },
    save: () => { },
    restore: () => { },
    translate: () => { },
    rotate: () => { },
    scale: () => { },
    getImageData: () => ({ data: new Uint8ClampedArray(400) }),
    putImageData: () => { }
  };
};

const context = vm.createContext(mockWindow);

console.log('1. Evaluating Production JavaScript Bundles in VM Sandbox:');
try {
  vm.runInContext(themeMinJs, context);
  vm.runInContext(i18nMinJs, context);
  vm.runInContext(studioBundleMinJs, context);
  console.log('   ✓ Production bundles (theme.min.js, i18n.min.js & studio.bundle.min.js) evaluated with 0 ReferenceErrors or syntax crashes.');
} catch (err) {
  assert.fail(`CRITICAL ERROR during VM evaluation: ${err.message}\n${err.stack}`);
}

// 4. Modal Lifecycle State Machine Tests (Open & Close on all 7 modals)
console.log('\n2. Testing All 7 Modal Open & Close State Lifecycles:');

const MODAL_TEST_SPECS = [
  {
    name: 'Map Location Picker Modal',
    id: 'locationPickerModal',
    openFn: 'openLocationPickerModal',
    closeFn: 'closeLocationPickerModal'
  },
  {
    name: 'BBMP Zone & Ward Search Directory Modal',
    id: 'bbmpWardModal',
    openFn: 'openWardSearchModal',
    closeFn: 'closeWardSearchModal'
  },
  {
    name: 'Karnataka Land Area Converter Modal',
    id: 'landConverterModal',
    openFn: 'openAreaConverterModal',
    closeFn: 'closeAreaConverterModal'
  },
  {
    name: 'Signature Chroma & Crop Tool Modal',
    id: 'signatureCropModal',
    openFn: 'openSignatureCropModal',
    openArgs: ['owner', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
    closeFn: 'closeSignatureCropModal'
  },
  {
    name: 'Field Question Help Modal',
    id: 'fieldHelpModal',
    openFn: 'showFieldHelp',
    openArgs: ['gpsCoords'],
    closeFn: 'closeFieldHelp'
  },
  {
    name: 'Draft Session Restore Modal',
    id: 'draftRestoreModal',
    openFn: 'showDraftRestoreModal',
    openArgs: [{ formData: { ownerName: 'Test Owner' }, currentStep: 2, timestamp: Date.now() }],
    closeFn: 'discardDraft'
  },
  {
    name: 'Project Import Error Modal',
    id: 'projectImportErrorModal',
    openFn: 'showProjectImportErrorModal',
    openArgs: [['Error parameter 1', 'Error parameter 2']],
    closeFn: 'closeProjectImportErrorModal'
  }
];

MODAL_TEST_SPECS.forEach(spec => {
  const modalEl = mockDoc.getElementById(spec.id);
  modalEl.style.display = 'none';
  modalEl.classList.remove('active');

  assert.ok(typeof mockWindow[spec.openFn] === 'function', `Modal open function '${spec.openFn}' must be globally exported.`);
  assert.ok(typeof mockWindow[spec.closeFn] === 'function', `Modal close function '${spec.closeFn}' must be globally exported.`);

  if (spec.setup) spec.setup();

  // Test Open
  const args = spec.openArgs || [];
  mockWindow[spec.openFn](...args);
  assert.equal(modalEl.style.display, 'flex', `Modal '${spec.name}' (#${spec.id}) must have display: flex after opening.`);
  assert.ok(modalEl.classList.contains('active'), `Modal '${spec.name}' (#${spec.id}) must have .active class after opening.`);

  // Test Close
  mockWindow[spec.closeFn]();
  assert.equal(modalEl.style.display, 'none', `Modal '${spec.name}' (#${spec.id}) must have display: none after closing.`);
  assert.ok(!modalEl.classList.contains('active'), `Modal '${spec.name}' (#${spec.id}) must not have .active class after closing.`);

  console.log(`   ✓ ${spec.name} (#${spec.id}): Open (flex + active) ➔ Close (none) lifecycle verified.`);
});

// 5. Static Extraction & Live Execution of ALL HTML Button Onclick Attributes
console.log('\n3. Extracting and Executing Every Onclick Button in studio.html:');
const buttonRegex = /<button[^>]*onclick="([^"]+)"[^>]*>([\s\S]*?)<\/button>/gi;
let btnMatch;
let totalButtonsTested = 0;

while ((btnMatch = buttonRegex.exec(studioHtml)) !== null) {
  const onclickCode = btnMatch[1];
  const buttonContent = btnMatch[2].replace(/<[^>]+>/g, '').trim() || 'Icon Button';

  // Ignore simple inline close logic like `if(event.target===this)`
  if (onclickCode.includes('event.target===this')) continue;

  try {
    const mockEvent = { stopPropagation: () => { }, preventDefault: () => { }, target: {} };
    vm.runInContext(`(function(event) { ${onclickCode} })`, context)(mockEvent);
    totalButtonsTested++;
  } catch (err) {
    assert.fail(`CRITICAL FAILURE executing button onclick="${onclickCode}" (${buttonContent}): ${err.message}`);
  }
}
console.log(`   ✓ All ${totalButtonsTested} HTML button onclick handlers executed cleanly without errors.`);

// 6. Geolocation & Real-Time Coordinate Pipeline Tests
console.log('\n4. Testing Real-Time Geolocation & Live Coordinate Sync:');
const gpsInput = mockDoc.getElementById('gpsCoords');
gpsInput.value = '12.9716, 77.5946';

// Test onGpsCoordsInput()
mockWindow.onGpsCoordsInput();
assert.equal(mockDoc.getElementById('err-gpsCoords').style.display, 'none', 'Error message must be hidden for valid GPS coordinates');
assert.ok(!gpsInput.classList.contains('error'), 'Error class must be removed from gpsCoords input');

// Test detectGPSLocation()
gpsInput.value = '';
mockWindow.detectGPSLocation();
assert.ok(gpsInput.value.includes('12.9716'), 'detectGPSLocation must populate latitude');
assert.ok(gpsInput.value.includes('77.5946'), 'detectGPSLocation must populate longitude');

// Test resetToBangaloreCenter()
mockWindow.openLocationPickerModal();
mockWindow.resetToBangaloreCenter();
mockWindow.closeLocationPickerModal();
assert.ok(mockDoc.getElementById('gpsCoords').value.includes('12.9716'));

// Test flyPickerToZone for all 8 BBMP zones
const zonesToTest = ['East', 'West', 'South', 'Mahadevapura', 'Yelahanka', 'Rajarajeshwari Nagar', 'Dasarahalli', 'Bommanahalli'];
zonesToTest.forEach(z => {
  mockWindow.flyPickerToZone(z);
  mockWindow.applyPickerLocation();
  assert.ok(gpsInput.value.length > 0, `flyPickerToZone(${z}) must set valid coordinates`);
});

// Test applyPickerLocation()
mockWindow.openLocationPickerModal();
mockWindow.applyPickerLocation();
assert.ok(gpsInput.value.includes('12.'), 'applyPickerLocation must copy picker coords to input');
console.log('   ✓ Real-time Geolocation, GPS input sync, Map Picker zone chips & coordinate bridge verified.');

// 7. Full 7-Step Wizard Validation Flow Test
console.log('\n5. Testing 7-Step Form Wizard Forward & Backward Validation Flow:');

// Step 1: Legal Identification
mockDoc.getElementById('ownerName').value = 'Ramesh Kumar';
mockDoc.getElementById('epId').value = '151-12345';
assert.ok(mockWindow.validateStep(1, true), 'Step 1 must pass validation with valid owner and ePID');

// Step 2: Municipal Location & Ward
mockDoc.getElementById('surveyNo').value = 'Sy.No 45/2';
mockDoc.getElementById('bbmpZone').value = 'East';
mockDoc.getElementById('wardNo').value = '151';
mockDoc.getElementById('wardName').value = 'Koramangala';
mockDoc.getElementById('address').value = 'No. 12, 4th Block, Koramangala, Bangalore';
mockDoc.getElementById('gpsCoords').value = '12.9352, 77.6245';
assert.ok(mockWindow.validateStep(2, true), 'Step 2 must pass validation with full ward and GPS data');

// Step 3: Geometry & Dimensions
mockDoc.getElementById('plotArea').value = '1200';
mockDoc.getElementById('roadWidth').value = '30';
mockDoc.getElementById('roadFacing').value = 'North';
mockDoc.getElementById('regNorthSouth').value = '40';
mockDoc.getElementById('regEastWest').value = '30';
assert.ok(mockWindow.validateStep(3, true), 'Step 3 must pass validation with standard 30x40 plot');

// Step 4: Setbacks & Height
mockDoc.getElementById('bldgType').value = 'Residential';
mockDoc.getElementById('noOfFloors').value = 'G+1';
assert.ok(mockWindow.validateStep(4, true), 'Step 4 setback feasibility must pass');

// Step 5: Boundaries & Abutting Properties
mockDoc.getElementById('typeNorth').value = 'road';
mockDoc.getElementById('typeSouth').value = 'plot';
mockDoc.getElementById('typeEast').value = 'plot';
mockDoc.getElementById('typeWest').value = 'plot';
assert.ok(mockWindow.validateStep(5, true), 'Step 5 boundary validation must pass');

// Step 6: Road Widening & Buffers
assert.ok(mockWindow.validateStep(6, true), 'Step 6 must pass');

// Step 7: Legal Consent & Plan Generation
const consentCheck = mockDoc.getElementById('legalConsentCheck');
consentCheck.checked = false;
assert.equal(mockWindow.validateStep(7, false), false, 'Step 7 must fail when consent is unchecked');
consentCheck.checked = true;
assert.ok(mockWindow.validateStep(7, true), 'Step 7 must pass when consent is checked');

console.log('   ✓ Full 7-step wizard validation, step gating, and plan generation verified.');

console.log('\n🎉 ALL DOM SIMULATION & BUTTON EXECUTION TEST SUITES PASSED WITH 100% SUCCESS!\n');
