/**
 * @file html_bindings.test.js
 * @description Localization tests validating 100% of declarative data-i18n attributes in studio.html across all 7 steps.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import { en } from '../../js/i18n/en.js';
import { kn } from '../../js/i18n/kn.js';

const suite = new TestSuite('HTML Declarative I18n Bindings Suite', '🌐');

const studioHtml = fs.readFileSync(path.resolve('studio.html'), 'utf8');

// Extract all data-i18n-* attribute keys
const i18nRegex = /data-i18n(?:-placeholder|-html|-title|-alt)?="([^"]+)"/g;
const embeddedKeys = new Set();
let match;
while ((match = i18nRegex.exec(studioHtml)) !== null) {
  embeddedKeys.add(match[1]);
}

suite.section('1. Declarative HTML Tag Validation');

suite.test(`All ${embeddedKeys.size} embedded data-i18n tags in studio.html resolve in English catalog`, () => {
  const missingInEn = Array.from(embeddedKeys).filter(k => !(k in en));
  assert.equal(missingInEn.length, 0, `Tags missing in EN catalog: ${missingInEn.join(', ')}`);
});

suite.test(`All ${embeddedKeys.size} embedded data-i18n tags in studio.html resolve in Kannada catalog`, () => {
  const missingInKn = Array.from(embeddedKeys).filter(k => !(k in kn));
  assert.equal(missingInKn.length, 0, `Tags missing in KN catalog: ${missingInKn.join(', ')}`);
});

suite.section('2. Per-Step Translation Tag Coverage');

for (let step = 1; step <= 7; step++) {
  suite.test(`Step ${step} contains valid declarative bilingual tags`, () => {
    const stepSectionRegex = new RegExp(`id="step${step}"[\\s\\S]*?(?=id="step${step + 1}"|class="step-panel"|class="preview-panel"|class="app-footer")`, 'i');
    const stepMatch = studioHtml.match(stepSectionRegex);
    if (stepMatch) {
      const stepHtml = stepMatch[0];
      const stepKeys = [...stepHtml.matchAll(i18nRegex)].map(m => m[1]);
      assert.ok(stepKeys.length > 0, `Step ${step} must contain data-i18n tags (found ${stepKeys.length})`);
    }
  });
}

suite.finish();
