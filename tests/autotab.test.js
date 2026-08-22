/**
 * @file autotab.test.js
 * @description Exhaustive unit test suite for Smart Numeric Field Auto-Tabbing & Keyboard Accelerators.
 * Verifies delimiter shift keys, 2-digit length detection, architectural text parsing,
 * backward backspace navigation, and decimal feet ($ft + in/12$) calculation.
 */

import { strict as assert } from 'assert';

function parseFeetInchesString(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const cleaned = rawText.trim();
  if (!cleaned) return null;

  // Case 1: Standard decimal "30.6" or "30.11"
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const ft = parts[0].replace(/\D/g, '');
    const inPart = parts[1].replace(/\D/g, '').slice(0, 2);
    return { ft, in: inPart };
  }

  // Case 2: Architectural quote notation e.g. 30' 6" or 30'6
  if (cleaned.includes("'")) {
    const parts = cleaned.split("'");
    const ft = parts[0].replace(/\D/g, '');
    const inPart = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    return { ft, in: inPart };
  }

  // Case 3: Hyphenated notation e.g. 30-6 or 30 - 6
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const ft = parts[0].replace(/\D/g, '');
    const inPart = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    return { ft, in: inPart };
  }

  // Case 4: Pure integer feet
  const digits = cleaned.replace(/\D/g, '');
  if (digits) {
    return { ft: digits, in: '' };
  }

  return null;
}

function calculateDecimalFeet(ftRaw, inRaw) {
  const ftStr = (ftRaw !== undefined && ftRaw !== null) ? String(ftRaw).trim() : '';
  const inStr = (inRaw !== undefined && inRaw !== null) ? String(inRaw).trim() : '';

  if (ftStr === '' && inStr === '') return '';
  const ftVal = parseFloat(ftStr) || 0;
  const inVal = parseFloat(inStr) || 0;
  const decimalVal = ftVal + (inVal / 12);
  return Math.round(decimalVal * 10000) / 10000;
}

function shouldAdvanceFocus(currentFtValue, inputType) {
  if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
    return false;
  }
  if (!currentFtValue || currentFtValue.includes('.')) {
    return false;
  }
  return currentFtValue.length >= 2;
}

function isDelimiterKey(key) {
  return ['.', ' ', 'Enter', ','].includes(key);
}

function shouldShiftBackOnBackspace(currentInValue, key) {
  return key === 'Backspace' && (!currentInValue || currentInValue.trim() === '');
}

console.log('\n⌨️  [Test Runner] Starting Smart Numeric Auto-Tabbing & Dimension Parsing Tests...\n');

// 1. Delimiter Key Detection
console.log('1. Verifying Delimiter Shift Keys:');
assert.equal(isDelimiterKey('.'), true, 'Period must trigger advance');
assert.equal(isDelimiterKey(' '), true, 'Spacebar must trigger advance');
assert.equal(isDelimiterKey('Enter'), true, 'Enter key must trigger advance');
assert.equal(isDelimiterKey(','), true, 'Comma must trigger advance');
assert.equal(isDelimiterKey('a'), false, 'Letter must not trigger delimiter advance');
assert.equal(isDelimiterKey('3'), false, 'Digit must not trigger delimiter advance');
console.log('   ✓ Period, Space, Enter, and Comma recognized as delimiter shift keys.');

// 2. 2-Digit Auto-advance Logic
console.log('\n2. Verifying 2-Digit Auto-Advance Logic:');
assert.equal(shouldAdvanceFocus('3', 'insertText'), false, 'Single digit must not auto-advance');
assert.equal(shouldAdvanceFocus('30', 'insertText'), true, '2 digits (e.g. 30) must trigger auto-advance');
assert.equal(shouldAdvanceFocus('100', 'insertText'), true, '3 digits must trigger auto-advance');
assert.equal(shouldAdvanceFocus('30', 'deleteContentBackward'), false, 'Deleting back to 2 digits must not auto-advance');
assert.equal(shouldAdvanceFocus('3.5', 'insertText'), false, 'Decimal strings in ft must not auto-advance');
console.log('   ✓ 2-digit threshold and deletion protection verified.');

// 3. Backspace Backward Navigation
console.log('\n3. Verifying Backward Navigation on Empty Inches:');
assert.equal(shouldShiftBackOnBackspace('', 'Backspace'), true, 'Backspace on empty inches must shift back to feet');
assert.equal(shouldShiftBackOnBackspace(' ', 'Backspace'), true, 'Backspace on whitespace inches must shift back to feet');
assert.equal(shouldShiftBackOnBackspace('6', 'Backspace'), false, 'Backspace on filled inches must delete character, not shift');
assert.equal(shouldShiftBackOnBackspace('', 'Delete'), false, 'Non-backspace keys must not trigger backward shift');
console.log('   ✓ Safe backward focus transitions verified.');

// 4. Survey Text & String Parsing
console.log('\n4. Verifying Diverse Dimension String Parsing:');
const p1 = parseFeetInchesString('30.6');
assert.deepEqual(p1, { ft: '30', in: '6' }, '30.6 must parse to 30ft 6in');

const p2 = parseFeetInchesString("40' 8\"");
assert.deepEqual(p2, { ft: '40', in: '8' }, '40\' 8" must parse to 40ft 8in');

const p3 = parseFeetInchesString('50-11');
assert.deepEqual(p3, { ft: '50', in: '11' }, '50-11 must parse to 50ft 11in');

const p4 = parseFeetInchesString('60');
assert.deepEqual(p4, { ft: '60', in: '' }, '60 must parse to 60ft');

const p5 = parseFeetInchesString('  25.0  ');
assert.deepEqual(p5, { ft: '25', in: '0' }, 'Whitespace padded decimal must parse cleanly');

assert.equal(parseFeetInchesString(''), null, 'Empty string must return null');
assert.equal(parseFeetInchesString(null), null, 'Null must return null');
assert.equal(parseFeetInchesString(undefined), null, 'Undefined must return null');
console.log('   ✓ Decimal, architectural quote, hyphenated, and integer strings parsed accurately.');

// 5. Decimal Feet ($ft + in/12$) Mathematical Precision
console.log('\n5. Verifying Decimal Feet ($ft + in/12$) Calculations:');
assert.equal(calculateDecimalFeet('30', '6'), 30.5, '30ft 6in must equal 30.5 ft');
assert.equal(calculateDecimalFeet('40', '0'), 40, '40ft 0in must equal 40 ft');
assert.equal(calculateDecimalFeet('50', '9'), 50.75, '50ft 9in must equal 50.75 ft');
assert.equal(calculateDecimalFeet('60', '3'), 60.25, '60ft 3in must equal 60.25 ft');
assert.equal(calculateDecimalFeet('', ''), '', 'Empty inputs must return empty string');
console.log('   ✓ Decimal feet mathematical precision verified.');

console.log('\n🎉 ALL 5 SMART AUTO-TABBING TEST SUITES PASSED WITH 100% SUCCESS!\n');
