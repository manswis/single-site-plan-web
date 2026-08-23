/**
 * @file step_i18n_translation.test.js
 * @description Exhaustive Automated Verification of 100% Bilingual Translation Parity
 * for all Form Labels, Placeholders, Error Messages, Dropdown Options, and Tooltips
 * across Steps 1 through 7 in studio.html.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { en } from '../js/i18n/en.js';
import { kn } from '../js/i18n/kn.js';
import { I18nManager } from '../js/i18n.js';

console.log('\n🌐 [Test Runner] Starting Comprehensive All-Steps I18n Translation Test Suite...\n');

const studioHtml = fs.readFileSync(path.resolve(process.cwd(), 'studio.html'), 'utf8');

// 1. Verify that all data-i18n* keys in studio.html exist in both catalogs
console.log('1. Verifying all data-i18n tags in studio.html exist in EN & KN catalogs:');
const i18nRegex = /data-i18n(?:-placeholder|-html|-title|-alt)?="([^"]+)"/g;
let match;
const tagsFound = new Set();
while ((match = i18nRegex.exec(studioHtml)) !== null) {
  tagsFound.add(match[1]);
}

console.log(`   Found ${tagsFound.size} unique translation keys embedded in studio.html.`);
let missingEn = 0;
let missingKn = 0;

tagsFound.forEach(key => {
  if (en[key] === undefined) {
    console.error(`   ❌ Missing EN key: ${key}`);
    missingEn++;
  }
  if (kn[key] === undefined) {
    console.error(`   ❌ Missing KN key: ${key}`);
    missingKn++;
  }
});

assert.strictEqual(missingEn, 0, `All studio.html keys must exist in English catalog (${missingEn} missing)`);
assert.strictEqual(missingKn, 0, `All studio.html keys must exist in Kannada catalog (${missingKn} missing)`);
console.log(`   ✓ All ${tagsFound.size} embedded keys exist in 100% of English & Kannada catalogs.`);

// 2. Step-by-Step Translation Assertions for Steps 1 through 7
console.log('\n2. Verifying Per-Step Dynamic Translation for Steps 1 to 7:');

// Helper to simulate lightweight DOM node
class FakeElement {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = { ...attrs };
    this.textContent = '';
    this.innerHTML = '';
    this.children = [];
  }
  getAttribute(name) {
    return this.attributes[name] || null;
  }
  setAttribute(name, val) {
    this.attributes[name] = val;
  }
  querySelectorAll(sel) {
    const results = [];
    const attrMatch = sel.match(/^\[([^\]=]+)(?:="([^"]+)")?\]$/);
    if (attrMatch) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2];
      const walk = (node) => {
        if (node.attributes && node.attributes[attrName] !== undefined) {
          if (attrVal === undefined || node.attributes[attrName] === attrVal) {
            results.push(node);
          }
        }
        (node.children || []).forEach(walk);
      };
      walk(this);
    }
    return results;
  }
}

const manager = new I18nManager();

for (let s = 1; s <= 7; s++) {
  const stepRegex = new RegExp(`<div id="wizardStep${s}"[\\s\\S]*?(?=<div id="wizardStep${s+1}"|<!-- STEP|<!-- Bottom Action Navigation|<!-- Form Card -->)`);
  const stepMatch = studioHtml.match(stepRegex);
  assert.ok(stepMatch, `Step ${s} markup must exist in studio.html`);

  const stepHtml = stepMatch[0];
  const stepKeys = new Set();
  let stepKeyMatch;
  const stepKeyRegex = /data-i18n(?:-placeholder|-html|-title|-alt)?="([^"]+)"/g;
  while ((stepKeyMatch = stepKeyRegex.exec(stepHtml)) !== null) {
    stepKeys.add(stepKeyMatch[1]);
  }

  assert.ok(stepKeys.size >= 10, `Step ${s} must have at least 10 translation keys (found ${stepKeys.size})`);

  // Verify translations for all keys in step s
  stepKeys.forEach(k => {
    const enVal = manager.catalog.en[k];
    const knVal = manager.catalog.kn[k];
    assert.ok(enVal && enVal.trim() !== '', `Step ${s} EN translation for '${k}' must be non-empty`);
    assert.ok(knVal && knVal.trim() !== '', `Step ${s} KN translation for '${k}' must be non-empty`);
  });

  console.log(`   ✓ Step ${s}: Verified ${stepKeys.size} bilingual translation keys.`);
}

// 3. Verify Specific Step 2 UI Elements Translate to Kannada
console.log('\n3. Verifying Specific Step 2 Controls & Badges:');
assert.strictEqual(manager.catalog.kn['step2.surveyNo.label'], 'ಸರ್ವೇ ನಂಬರ್');
assert.strictEqual(manager.catalog.kn['step2.bbmpZone.label'], 'ಬಿಬಿಎಂಪಿ ಆಡಳಿತ ವಲಯ');
assert.strictEqual(manager.catalog.kn['step2.wardNo.label'], 'ಬಿಬಿಎಂಪಿ ವಾರ್ಡ್ ಸಂಖ್ಯೆ');
assert.strictEqual(manager.catalog.kn['step2.wardName.label'], 'ವಾರ್ಡ್ / ಬಡಾವಣೆಯ ಹೆಸರು');
assert.strictEqual(manager.catalog.kn['step2.address.label'], 'ಸಂಪೂರ್ಣ ಆಸ್ತಿ ವಿಳಾಸ');
assert.strictEqual(manager.catalog.kn['step2.gpsCoords.label'], 'ನಿವೇಶನದ ಜಿಪಿಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳು (ಐಚ್ಛಿಕ)');
assert.strictEqual(manager.catalog.kn['step2.pickOnMap'], 'ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಿ');
assert.strictEqual(manager.catalog.kn['step2.locateMe'], 'ನನ್ನ ಸ್ಥಳ ಗುರುತಿಸಿ');
assert.strictEqual(manager.catalog.kn['step2.keyPlanPreview'], 'ಕೀ ಪ್ಲಾನ್ ನೇರ ಮುನ್ನೋಟ');
assert.strictEqual(manager.catalog.kn['step2.mapZoomLevel'], 'ನಕ್ಷೆಯ ಜೂಮ್ ಮಟ್ಟ:');
assert.strictEqual(manager.catalog.kn['step2.zoomWide'], 'ವಿಸ್ತೃತ (೧೪)');
assert.strictEqual(manager.catalog.kn['step2.zoomClose'], 'ಹತ್ತಿರದ (೧೮)');
console.log('   ✓ Step 2 GPS, Ward directory, Map controls, and Badges verified in Kannada.');

console.log('\n======================================================');
console.log('🎉 ALL 7 STEPS I18N TRANSLATION TESTS PASSED 100%!');
console.log('======================================================\n');
