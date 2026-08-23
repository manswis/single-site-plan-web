/**
 * @file map_picker_geocoding.test.js
 * @description Integration tests for Map Location Picker, Satellite/Street layers, GPS fallbacks, and 8 BBMP zones.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import { createMockBrowserEnvironment } from '../helpers/mock_dom.js';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const suite = new TestSuite('Map Picker & Geolocation Integration Tests', '🗺️');

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
  console.error('CRITICAL VM EVAL ERROR:', err.message, err.stack);
}

suite.section('1. Modal Open, Close and Keyboard Dismissal Lifecycle');

suite.test('Opens and closes location picker modal with correct CSS classes', () => {
  mockWindow.openLocationPickerModal();
  const modal = mockDoc.getElementById('locationPickerModal');
  assert.equal(modal.style.display, 'flex');
  assert.ok(modal.classList.contains('active'));

  mockWindow.closeLocationPickerModal();
  assert.equal(modal.style.display, 'none');
  assert.ok(!modal.classList.contains('active'));
});

suite.section('2. 8 BBMP Administrative Zone Coordinate Navigation');

const BBMP_ZONE_COORDS = [
  { name: 'East', lat: 12.9719, lon: 77.6412 },
  { name: 'West', lat: 12.9982, lon: 77.5630 },
  { name: 'South', lat: 12.9299, lon: 77.5824 },
  { name: 'Mahadevapura', lat: 12.9904, lon: 77.6974 },
  { name: 'Yelahanka', lat: 13.1007, lon: 77.5963 },
  { name: 'Rajarajeshwari Nagar', lat: 12.9272, lon: 77.5154 },
  { name: 'Dasarahalli', lat: 13.0458, lon: 77.5126 },
  { name: 'Bommanahalli', lat: 12.8984, lon: 77.6256 }
];

suite.test('Quick-navigation chips fly picker map to all 8 BBMP zones accurately', () => {
  mockWindow.openLocationPickerModal();
  BBMP_ZONE_COORDS.forEach(zone => {
    mockWindow.flyPickerToZone(zone.name);
    const display = mockDoc.getElementById('pickerCoordsDisplay').textContent;
    assert.ok(display.includes(zone.lat.toFixed(4)), `Zone ${zone.name} latitude mismatch in display`);
    assert.ok(display.includes(zone.lon.toFixed(4)), `Zone ${zone.name} longitude mismatch in display`);

    mockWindow.applyPickerLocation();
    const gpsInput = mockDoc.getElementById('gpsCoords').value;
    assert.ok(gpsInput.includes(zone.lat.toFixed(4)), `Zone ${zone.name} not copied to gpsCoords input`);
  });
  mockWindow.closeLocationPickerModal();
});

suite.section('3. Satellite vs. Street View Tile Layer Switching');

suite.test('Switches between Street and Satellite view with button state updates', () => {
  mockWindow.openLocationPickerModal();

  mockWindow.setMapLayerType('satellite');
  const btnSat = mockDoc.getElementById('btnMapLayerSatellite');
  const btnStreet = mockDoc.getElementById('btnMapLayerStreet');
  assert.ok(btnSat.classList.contains('active'), 'Satellite button should have active class');
  assert.ok(!btnStreet.classList.contains('active'), 'Street button should not have active class');

  mockWindow.setMapLayerType('street');
  assert.ok(btnStreet.classList.contains('active'), 'Street button should have active class');
  assert.ok(!btnSat.classList.contains('active'), 'Satellite button should not have active class');

  mockWindow.closeLocationPickerModal();
});

suite.section('4. 4-Tier Geolocation Fallback Matrix');

suite.test('Tier 1: High Accuracy GPS Navigation', () => {
  mockDoc.getElementById('gpsCoords').value = '';
  mockWindow.detectGPSLocation();
  const val = mockDoc.getElementById('gpsCoords').value;
  assert.ok(val.includes('12.9716'), 'GPS must populate latitude');
  assert.ok(val.includes('77.5946'), 'GPS must populate longitude');
});

suite.test('Tier 4: One-Tap Bangalore Center Restore', () => {
  mockWindow.openLocationPickerModal();
  mockWindow.resetToBangaloreCenter();
  mockWindow.applyPickerLocation();
  mockWindow.closeLocationPickerModal();
  const val = mockDoc.getElementById('gpsCoords').value;
  assert.ok(val.includes('12.9716') || val.includes('12.9791'), 'Bangalore center must populate fallback coords');
});

suite.finish();
