/**
 * @file index.js
 * @description Master Test Suite Runner for e-Plan Studio.
 * Allows running `node tests` or `node tests/index.js` directly to execute
 * all 7 automated test suites with consolidated status reporting.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILES = [
  'ward.test.js',
  'converter.test.js',
  'autotab.test.js',
  'review.test.js',
  'buttons_and_help.test.js',
  'i18n.test.js',
  'dom_simulation.test.js',
  'all_steps_workflow.test.js'
];

console.log('🏛️  [e-Plan Studio] Starting Complete Automated Quality Test Suite...\n');

let failedCount = 0;
let passedCount = 0;

for (const file of TEST_FILES) {
  const filePath = path.join(__dirname, file);
  const result = spawnSync('node', [filePath], {
    stdio: 'inherit',
    shell: false
  });

  if (result.status === 0) {
    passedCount++;
  } else {
    failedCount++;
    console.error(`\n❌ Test Suite '${file}' exited with code ${result.status}`);
  }
}

console.log('\n======================================================');
console.log(`📊 TEST SUITE SUMMARY: ${passedCount} Passed, ${failedCount} Failed (${TEST_FILES.length} Suites Total)`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TEST SUITES PASSED WITH 100% SUCCESS!\n');
  process.exit(0);
}
