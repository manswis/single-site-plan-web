/**
 * @file contact.unit.test.js
 * @description Unit tests for contact form input validation, phone/email validation, and inquiry payloads.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('Contact & Inquiry Form Validation Unit Tests', '✉️');

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13 && /^\d+$/.test(cleaned);
}

function validateInquiryPayload(payload) {
  const errors = [];
  if (!payload.name || payload.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!validateEmail(payload.email)) errors.push('Invalid email address');
  if (!validatePhone(payload.phone)) errors.push('Invalid phone number (10-13 digits)');
  if (!payload.message || payload.message.trim().length < 10) errors.push('Message must be at least 10 characters');
  return {
    isValid: errors.length === 0,
    errors
  };
}

suite.section('1. Email Address Validation');

suite.test('Accepts valid email formats', () => {
  const validEmails = ['user@example.com', 'architect.blr@bbmp.gov.in', 'test.name+tag@sub.domain.co'];
  validEmails.forEach(e => assert.ok(validateEmail(e), `Email '${e}' should be valid`));
});

suite.test('Rejects invalid email formats', () => {
  const invalidEmails = ['invalid', 'user@', '@domain.com', 'user@domain', 'user name@domain.com'];
  invalidEmails.forEach(e => assert.ok(!validateEmail(e), `Email '${e}' should be invalid`));
});

suite.section('2. Phone Number Validation');

suite.test('Accepts valid Indian mobile numbers (10 digits, +91 format)', () => {
  const validPhones = ['9876543210', '+91 98765 43210', '080-22223333', '+919876543210'];
  validPhones.forEach(p => assert.ok(validatePhone(p), `Phone '${p}' should be valid`));
});

suite.test('Rejects incomplete or non-numeric phone numbers', () => {
  const invalidPhones = ['123', 'abcde', '98765-xyz', ''];
  invalidPhones.forEach(p => assert.ok(!validatePhone(p), `Phone '${p}' should be invalid`));
});

suite.section('3. Inquiry Payload Validation');

suite.test('Validates complete inquiry form payload', () => {
  const payload = {
    name: 'Suresh Kumar',
    email: 'suresh@example.com',
    phone: '9845012345',
    message: 'Need help with A-Khata site plan drawing for Ward 112.'
  };
  const res = validateInquiryPayload(payload);
  assert.ok(res.isValid);
  assert.equal(res.errors.length, 0);
});

suite.test('Catches missing and undersized message fields', () => {
  const payload = {
    name: 'S',
    email: 'bademail',
    phone: '123',
    message: 'Hi'
  };
  const res = validateInquiryPayload(payload);
  assert.ok(!res.isValid);
  assert.equal(res.errors.length, 4);
});

suite.finish();
