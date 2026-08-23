/**
 * @file test_assert.js
 * @description Test harness and reporting utility for e-Plan Studio test suites.
 */

import { strict as assert } from 'assert';

export class TestSuite {
  constructor(name, icon = '🧪') {
    this.name = name;
    this.icon = icon;
    this.testsRun = 0;
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.currentSection = '';
    console.log(`\n${this.icon} [Test Runner] Starting ${this.name}...\n`);
  }

  section(title) {
    this.currentSection = title;
    console.log(`\n--- ${title} ---`);
  }

  test(description, fn) {
    this.testsRun++;
    try {
      fn();
      this.testsPassed++;
      console.log(`   ✓ ${description}`);
    } catch (err) {
      this.testsFailed++;
      console.error(`   ❌ FAIL: ${description}`);
      console.error(`      Error: ${err.message}`);
      throw err;
    }
  }

  finish() {
    console.log(`\n======================================================`);
    if (this.testsFailed === 0) {
      console.log(`🎉 [${this.name}] PASSED 100% (${this.testsPassed}/${this.testsRun} assertions verified)`);
      console.log(`======================================================\n`);
    } else {
      console.error(`❌ [${this.name}] FAILED (${this.testsFailed} failures, ${this.testsPassed} passed)`);
      console.log(`======================================================\n`);
      process.exit(1);
    }
  }
}

export { assert };
