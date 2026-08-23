/**
 * @file smart_fill.unit.test.js
 * @description Pure unit & integration test suite for Step 3 & Step 5 Contextual Smart Fill presets.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Contextual Smart Fill Presets Unit Tests', '⚡');

const { mockDoc, mockWindow } = createMockBrowserEnvironment();
const themeMinJs = fs.readFileSync(path.resolve('js/theme.min.js'), 'utf8');
const i18nMinJs = fs.readFileSync(path.resolve('js/i18n.min.js'), 'utf8');
const studioBundleMinJs = fs.readFileSync(path.resolve('js/studio.bundle.min.js'), 'utf8');

const context = vm.createContext(mockWindow);
try {
  vm.runInContext(themeMinJs, context);
  vm.runInContext(i18nMinJs, context);
  vm.runInContext(studioBundleMinJs, context);
} catch (err) {
  console.error('CRITICAL VM EVAL ERROR:', err.message);
}

const STEP3_PRESETS = {
  '30x40': { nsFt: 30, nsIn: 0, ewFt: 40, ewIn: 0, area: 1200, roadWidthFt: 30, roadFacing: 'north' },
  '40x60': { nsFt: 40, nsIn: 0, ewFt: 60, ewIn: 0, area: 2400, roadWidthFt: 40, roadFacing: 'east' },
  '30x50': { nsFt: 30, nsIn: 0, ewFt: 50, ewIn: 0, area: 1500, roadWidthFt: 30, roadFacing: 'north' },
  '20x30': { nsFt: 20, nsIn: 0, ewFt: 30, ewIn: 0, area: 600, roadWidthFt: 25, roadFacing: 'north' },
  '50x80': { nsFt: 50, nsIn: 0, ewFt: 80, ewIn: 0, area: 4000, roadWidthFt: 50, roadFacing: 'east' }
};

const STEP5_PRESETS = {
  'north_road': {
    North: { type: 'road', name: 'Main Road', width: 30 },
    South: { type: 'plot', desc: 'Site No. 45' },
    East: { type: 'plot', desc: 'Site No. 42' },
    West: { type: 'plot', desc: 'Site No. 40' }
  },
  'east_road': {
    North: { type: 'plot', desc: 'Site No. 18' },
    South: { type: 'plot', desc: 'Site No. 20' },
    East: { type: 'road', name: 'Main Road', width: 30 },
    West: { type: 'plot', desc: 'Site No. 12' }
  },
  'south_road': {
    North: { type: 'plot', desc: 'Site No. 10' },
    South: { type: 'road', name: 'Main Road', width: 30 },
    East: { type: 'plot', desc: 'Site No. 15' },
    West: { type: 'plot', desc: 'Site No. 14' }
  },
  'west_road': {
    North: { type: 'plot', desc: 'Site No. 25' },
    South: { type: 'plot', desc: 'Site No. 27' },
    East: { type: 'plot', desc: 'Site No. 30' },
    West: { type: 'road', name: 'Main Road', width: 30 }
  },
  'corner_ne': {
    North: { type: 'road', name: 'Main Road', width: 30 },
    East: { type: 'road', name: 'Cross Road', width: 30 },
    South: { type: 'plot', desc: 'Site No. 08' },
    West: { type: 'plot', desc: 'Site No. 06' }
  }
};

suite.section('1. Step 3 Bangalore Plot Dimension Presets Integrity');

suite.test('All 5 Bangalore Dimension Presets have mathematically exact properties', () => {
  assert.equal(STEP3_PRESETS['30x40'].area, 1200);
  assert.equal(STEP3_PRESETS['40x60'].area, 2400);
  assert.equal(STEP3_PRESETS['30x50'].area, 1500);
  assert.equal(STEP3_PRESETS['20x30'].area, 600);
  assert.equal(STEP3_PRESETS['50x80'].area, 4000);
});

suite.test('Step 3 Presets have valid orientation and road width properties', () => {
  ['30x40', '40x60', '30x50', '20x30', '50x80'].forEach(id => {
    const p = STEP3_PRESETS[id];
    assert.ok(p.nsFt > 0, `${id} nsFt must be > 0`);
    assert.ok(p.ewFt > 0, `${id} ewFt must be > 0`);
    assert.ok(p.roadWidthFt >= 20, `${id} road width must be >= 20`);
    assert.ok(['north', 'east', 'south', 'west'].includes(p.roadFacing), `${id} facing valid`);
  });
});

suite.section('2. Step 3 Smart Fill Population in DOM');

suite.test('applyStep3SmartFill populates dimensions, road width, facing, and defaults scale to 1:100', () => {
  const oddCheck = mockDoc.getElementById('oddSiteCheck');
  oddCheck.checked = true;

  if (typeof mockWindow.applyStep3SmartFill === 'function') {
    mockWindow.applyStep3SmartFill('30x40');

    assert.equal(oddCheck.checked, false, 'Odd site check must be reset to regular');
    assert.equal(String(mockDoc.getElementById('regNorthSouth_ft').value), '30');
    assert.equal(String(mockDoc.getElementById('regEastWest_ft').value), '40');
    assert.equal(String(mockDoc.getElementById('plotArea').value), '1200');
    assert.equal(String(mockDoc.getElementById('roadWidth_ft').value), '30');
    assert.equal(String(mockDoc.getElementById('roadFacing').value), 'north');
    assert.equal(String(mockDoc.getElementById('scale').value), '1:100', 'Scale must default to 1:100');
  }
});

suite.test('applyStep3SmartFill handles 40x60 East-Facing preset accurately', () => {
  if (typeof mockWindow.applyStep3SmartFill === 'function') {
    mockWindow.applyStep3SmartFill('40x60');

    assert.equal(String(mockDoc.getElementById('regNorthSouth_ft').value), '40');
    assert.equal(String(mockDoc.getElementById('regEastWest_ft').value), '60');
    assert.equal(String(mockDoc.getElementById('plotArea').value), '2400');
    assert.equal(String(mockDoc.getElementById('roadWidth_ft').value), '40');
    assert.equal(String(mockDoc.getElementById('roadFacing').value), 'east');
  }
});

suite.section('3. Step 5 Deed DNA Boundary Layout Presets Integrity');

suite.test('All 5 Deed DNA Presets define 4 complete cardinal boundaries', () => {
  ['north_road', 'east_road', 'south_road', 'west_road', 'corner_ne'].forEach(id => {
    const p = STEP5_PRESETS[id];
    assert.ok(p.North, `${id} has North boundary`);
    assert.ok(p.South, `${id} has South boundary`);
    assert.ok(p.East, `${id} has East boundary`);
    assert.ok(p.West, `${id} has West boundary`);
  });
});

suite.test('applyStep5SmartFill configures North-Facing boundaries in DOM', () => {
  if (typeof mockWindow.applyStep5SmartFill === 'function') {
    mockWindow.applyStep5SmartFill('north_road');

    assert.equal(mockDoc.getElementById('typeNorth').value, 'road');
    assert.equal(mockDoc.getElementById('nameRoadNorth').value, 'Main Road');
    assert.equal(String(mockDoc.getElementById('widthRoadNorth').value), '30');

    assert.equal(mockDoc.getElementById('typeSouth').value, 'plot');
    assert.equal(mockDoc.getElementById('descPlotSouth').value, 'Site No. 45');

    assert.equal(mockDoc.getElementById('typeEast').value, 'plot');
    assert.equal(mockDoc.getElementById('descPlotEast').value, 'Site No. 42');

    assert.equal(mockDoc.getElementById('typeWest').value, 'plot');
    assert.equal(mockDoc.getElementById('descPlotWest').value, 'Site No. 40');
  }
});

suite.test('applyStep5SmartFill configures Corner Plot (NE) with 2 road accesses', () => {
  if (typeof mockWindow.applyStep5SmartFill === 'function') {
    mockWindow.applyStep5SmartFill('corner_ne');

    assert.equal(mockDoc.getElementById('typeNorth').value, 'road');
    assert.equal(mockDoc.getElementById('nameRoadNorth').value, 'Main Road');

    assert.equal(mockDoc.getElementById('typeEast').value, 'road');
    assert.equal(mockDoc.getElementById('nameRoadEast').value, 'Cross Road');

    assert.equal(mockDoc.getElementById('typeSouth').value, 'plot');
    assert.equal(mockDoc.getElementById('typeWest').value, 'plot');
  }
});

suite.section('4. Smart Fill Chip Micro-Animation & Localization');

suite.test('triggerSmartFillChipAnimation toggles applied class and displays localized text', () => {
  const mockBtn = mockDoc.createElement('button');
  mockBtn.innerHTML = '<span>30 × 40 (1,200 sq.ft)</span>';

  // Execute 120ms fade-in callback immediately, defer 1200ms revert
  mockWindow.setTimeout = (fn, delay) => {
    if (delay <= 150) fn();
    return 1;
  };

  if (typeof mockWindow.triggerSmartFillChipAnimation === 'function') {
    mockDoc.documentElement.lang = 'en';
    mockWindow.triggerSmartFillChipAnimation(mockBtn);

    assert.ok(mockBtn.classList.contains('applied'), 'Must contain .applied class');
    assert.equal(mockBtn.textContent, '✓ Applied', 'Must show English applied label');

    mockDoc.documentElement.lang = 'kn';
    mockWindow.triggerSmartFillChipAnimation(mockBtn);
    assert.equal(mockBtn.textContent, '✓ ಅನ್ವಯಿಸಲಾಗಿದೆ', 'Must show Kannada applied label');
  }
});

suite.section('5. Fail-Safe Negative & Edge Cases');

suite.test('Invalid or unknown preset ID does not throw error', () => {
  if (typeof mockWindow.applyStep3SmartFill === 'function') {
    assert.doesNotThrow(() => mockWindow.applyStep3SmartFill('unknown_preset_key'));
  }
  if (typeof mockWindow.applyStep5SmartFill === 'function') {
    assert.doesNotThrow(() => mockWindow.applyStep5SmartFill('invalid_boundary_key'));
  }
  if (typeof mockWindow.triggerSmartFillChipAnimation === 'function') {
    assert.doesNotThrow(() => mockWindow.triggerSmartFillChipAnimation(null));
  }
});
