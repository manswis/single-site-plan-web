/**
 * @file index.js
 * @description Master Multi-Tier Enterprise Test Suite Runner for e-Plan Studio.
 * Discovers and executes all Unit, Integration, Localization, Statutory, and E2E test suites
 * with clean tier-by-tier aggregation and consolidated quality reporting.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_TIERS = [
  {
    name: 'Tier 1: Pure Mathematical & Algorithmic Unit Tests',
    icon: '📐',
    files: [
      'unit/validator.unit.test.js',
      'unit/converter.unit.test.js',
      'unit/autotab.unit.test.js',
      'unit/wards.unit.test.js',
      'unit/i18n.unit.test.js',
      'unit/theme.unit.test.js',
      'unit/contact.unit.test.js',
      'unit/analytics.unit.test.js',
      'unit/smart_fill.unit.test.js',
      'unit/step_navigation.unit.test.js',
      'unit/seo.unit.test.js'
    ]
  },
  {
    name: 'Tier 2: Subsystem & Workflow Integration Tests',
    icon: '⚙️',
    files: [
      'integration/navigation_routing.test.js',
      'integration/support_tip_modal.test.js',
      'integration/map_picker_geocoding.test.js',
      'integration/signature_crop_chroma.test.js',
      'integration/draft_session_lifecycle.test.js',
      'review.test.js',
      'all_steps_workflow.test.js'
    ]
  },
  {
    name: 'Tier 3: Bilingual Localization & Declarative HTML Bindings',
    icon: '🌐',
    files: [
      'localization/catalog_parity.test.js',
      'localization/html_bindings.test.js',
      'step_i18n_translation.test.js',
      'i18n.test.js'
    ]
  },
  {
    name: 'Tier 4: Statutory Bye-Laws & Sakala Compliance Mandates',
    icon: '🏛️',
    files: [
      'statutory/bbmp_bye_laws_compliance.test.js',
      'statutory/cad_scaling_aspect_ratios.test.js',
      'statutory/sakala_drawing_output.test.js'
    ]
  },
  {
    name: 'Tier 5: End-to-End DOM Simulation & Quality Guardrails',
    icon: '🛡️',
    files: [
      'buttons_and_help.test.js',
      'all_inputs_controls.test.js',
      'dom_simulation.test.js',
      'po_concrete_quality.test.js',
      'ward.test.js',
      'converter.test.js',
      'autotab.test.js'
    ]
  }
];

console.log('🏛️  ======================================================');
console.log('🏛️  [e-Plan Studio] Enterprise Multi-Tier Quality Test Runner');
console.log('🏛️  ======================================================\n');

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
const failures = [];

const startTime = Date.now();

for (const tier of TEST_TIERS) {
  console.log(`\n${tier.icon}  ${tier.name.toUpperCase()}`);
  console.log('='.repeat(tier.name.length + 4));

  for (const relativePath of tier.files) {
    const fullPath = path.join(__dirname, relativePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`⚠️ Warning: Test file '${relativePath}' not found.`);
      continue;
    }

    totalTests++;
    const result = spawnSync('node', [fullPath], {
      stdio: 'inherit',
      shell: false
    });

    if (result.status === 0) {
      totalPassed++;
    } else {
      totalFailed++;
      failures.push(relativePath);
      console.error(`\n❌ [FAILURE] Test Suite '${relativePath}' failed with exit code ${result.status}`);
    }
  }
}

const durationMs = Date.now() - startTime;

console.log('\n======================================================');
console.log(`📊 MASTER TEST SUITE SUMMARY:`);
console.log(`   • Total Suites Executed: ${totalTests}`);
console.log(`   • Suites Passed:         ${totalPassed}`);
console.log(`   • Suites Failed:         ${totalFailed}`);
console.log(`   • Total Execution Time:  ${durationMs}ms`);
console.log('======================================================\n');

if (totalFailed > 0) {
  console.error(`❌ REGRESSION DETECTED: ${totalFailed} test suite(s) failed:`);
  failures.forEach(f => console.error(`   - ${f}`));
  console.error('');
  process.exit(1);
} else {
  console.log(`🎉 100% SUCCESS: ALL ${totalPassed} ENTERPRISE TEST SUITES PASSED CLEANLY!\n`);
  process.exit(0);
}
