/**
 * @file legal.unit.test.js
 * @module tests/unit
 * @description Comprehensive Legal Terms Regression Suite for e-Plan Studio.
 *
 * ARCHITECTURAL CONTRACT:
 *   This test suite is the authoritative regression barrier for legal.html.
 *   It enforces structural, semantic, bilingual, and content invariants across
 *   all 20 Terms of Service sections. Any modification to legal content must
 *   pass every assertion in this suite before shipping to production.
 *
 * COVERAGE MATRIX:
 *   [1] Section count regression guard — §1–§20 completeness in both catalogs
 *   [2] Clause body substance guard — no stubs, no placeholders (<80 chars)
 *   [3] Zero-liability sentinel clause enforcement — §3, §5, §10, §11, §19
 *   [4] HTML data-i18n binding completeness for all 20 sections in legal.html
 *   [5] Bilingual parity — untranslated copy-paste detection via Kannada Unicode
 *   [6] Hero / navigation / metadata binding integrity
 *   [7] Specific clause regression guardrails — §1, §6, §9, §12, §17, §20
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { en } from '../../js/i18n/en.js';
import { kn } from '../../js/i18n/kn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT_DIR   = path.resolve(__dirname, '../../');

const suite = new TestSuite('Legal Terms Compliance & Regression Suite', '⚖️');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Total ToS section count. Changing this is a deliberate, breaking change. */
const REQUIRED_SECTION_COUNT = 20;

/** Minimum character length for a legally meaningful clause body. */
const MIN_CLAUSE_BODY_LENGTH = 80;

/** Sentinel phrases each key MUST contain to certify developer protection. */
const ZERO_LIABILITY_SENTINELS = {
  'legal.sec3.desc':  ['as-is', 'as-available', 'zero liability', '₹0.00'],
  'legal.sec5.desc':  ['fiduciary', 'non-refundable'],
  'legal.sec10.desc': ['uncitral', 'forum non conveniens', 'arbitration'],
  'legal.sec11.desc': ['severed', 'full force and effect'],
  'legal.sec19.desc': ['waive', 'any jurisdiction'],
};

/** Computed array of { title, desc } key pairs for §1–§20. */
const SECTION_KEYS = Array.from(
  { length: REQUIRED_SECTION_COUNT },
  (_, i) => ({
    title: `legal.sec${i + 1}.title`,
    desc:  `legal.sec${i + 1}.desc`,
  })
);

const legalHtml = fs.readFileSync(path.join(ROOT_DIR, 'legal.html'), 'utf-8');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Section Count Regression Guard
// ─────────────────────────────────────────────────────────────────────────────

suite.section('1. Section Count & Structural Regression Guard');

suite.test(`English catalog defines all ${REQUIRED_SECTION_COUNT} section title keys`, () => {
  SECTION_KEYS.forEach(({ title }) => {
    assert.ok(title in en,
      `Missing EN title key: "${title}". Section count must be ${REQUIRED_SECTION_COUNT}.`);
  });
});

suite.test(`English catalog defines all ${REQUIRED_SECTION_COUNT} section description keys`, () => {
  SECTION_KEYS.forEach(({ desc }) => {
    assert.ok(desc in en,
      `Missing EN description key: "${desc}". Legal content is incomplete.`);
  });
});

suite.test(`Kannada catalog defines all ${REQUIRED_SECTION_COUNT} section title keys`, () => {
  SECTION_KEYS.forEach(({ title }) => {
    assert.ok(title in kn,
      `Missing KN title key: "${title}". Bilingual parity is broken.`);
  });
});

suite.test(`Kannada catalog defines all ${REQUIRED_SECTION_COUNT} section description keys`, () => {
  SECTION_KEYS.forEach(({ desc }) => {
    assert.ok(desc in kn,
      `Missing KN description key: "${desc}". Bilingual parity is broken.`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Clause Body Substance Guard
// ─────────────────────────────────────────────────────────────────────────────

suite.section('2. Clause Body Substance Guard (No Stubs / No Placeholders)');

suite.test(`All ${REQUIRED_SECTION_COUNT} English descriptions exceed ${MIN_CLAUSE_BODY_LENGTH} characters`, () => {
  SECTION_KEYS.forEach(({ desc }) => {
    const len = (en[desc] || '').trim().length;
    assert.ok(len >= MIN_CLAUSE_BODY_LENGTH,
      `EN "${desc}" is ${len} chars — below the ${MIN_CLAUSE_BODY_LENGTH}-char minimum. Stub detected.`);
  });
});

suite.test(`All ${REQUIRED_SECTION_COUNT} Kannada descriptions exceed ${MIN_CLAUSE_BODY_LENGTH} characters`, () => {
  SECTION_KEYS.forEach(({ desc }) => {
    const len = (kn[desc] || '').trim().length;
    assert.ok(len >= MIN_CLAUSE_BODY_LENGTH,
      `KN "${desc}" is ${len} chars — incomplete translation or stub detected.`);
  });
});

suite.test('English section titles are all unique — no duplicate headings permitted', () => {
  const seen = new Set();
  SECTION_KEYS.forEach(({ title }) => {
    const normalized = (en[title] || '').toLowerCase().replace(/^\d+\.\s*/, '').trim();
    assert.ok(!seen.has(normalized),
      `Duplicate EN section title: "${en[title]}". Each section must have a unique heading.`);
    seen.add(normalized);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Zero-Liability Sentinel Clause Enforcement
// ─────────────────────────────────────────────────────────────────────────────

suite.section('3. Zero-Liability & Developer Protection Sentinel Clauses');

suite.test('§3 AS-IS / AS-AVAILABLE disclaimer contains all mandatory zero-liability sentinels', () => {
  const text = (en['legal.sec3.desc'] || '').toLowerCase();
  ZERO_LIABILITY_SENTINELS['legal.sec3.desc'].forEach(sentinel => {
    assert.ok(text.includes(sentinel),
      `§3 (Liability) missing sentinel: "${sentinel}". Zero-liability clause is incomplete.`);
  });
});

suite.test('§3 zero-liability cap is expressed in multi-currency (₹, $, €) for global enforceability', () => {
  const text = en['legal.sec3.desc'] || '';
  ['₹0.00', '$0.00', '€0.00'].forEach(currency => {
    assert.ok(text.includes(currency),
      `§3 must state liability cap as ${currency} for global enforcement.`);
  });
});

suite.test('§5 Donations clause explicitly disclaims fiduciary duty and non-refundability', () => {
  const text = (en['legal.sec5.desc'] || '').toLowerCase();
  ZERO_LIABILITY_SENTINELS['legal.sec5.desc'].forEach(sentinel => {
    assert.ok(text.includes(sentinel),
      `§5 (Donations) missing sentinel: "${sentinel}". Donation insulation is deficient.`);
  });
});

suite.test('§2 Nature of tool explicitly declares zero professional or fiduciary relationship', () => {
  const text = (en['legal.sec2.desc'] || '').toLowerCase();
  ['no professional', 'fiduciary'].forEach(phrase => {
    assert.ok(text.includes(phrase),
      `§2 must contain "${phrase}". Professional non-relationship disclaimer is missing.`);
  });
});

suite.test('§10 Jurisdiction clause references UNCITRAL arbitration and forum non conveniens waiver', () => {
  const text = (en['legal.sec10.desc'] || '').toLowerCase();
  ZERO_LIABILITY_SENTINELS['legal.sec10.desc'].forEach(sentinel => {
    assert.ok(text.includes(sentinel),
      `§10 (Jurisdiction) missing sentinel: "${sentinel}". International jurisdiction clause is deficient.`);
  });
});

suite.test('§11 Severability clause asserts surviving provisions remain in full force', () => {
  const text = (en['legal.sec11.desc'] || '').toLowerCase();
  ZERO_LIABILITY_SENTINELS['legal.sec11.desc'].forEach(sentinel => {
    assert.ok(text.includes(sentinel),
      `§11 (Severability) missing sentinel: "${sentinel}". Severability clause is deficient.`);
  });
});

suite.test('§19 Informed Consent clause contains global waiver language', () => {
  const text = (en['legal.sec19.desc'] || '').toLowerCase();
  ZERO_LIABILITY_SENTINELS['legal.sec19.desc'].forEach(sentinel => {
    assert.ok(text.includes(sentinel),
      `§19 (Risk Waiver) missing sentinel: "${sentinel}". Global waiver clause is incomplete.`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. HTML Rendering Completeness — legal.html
// ─────────────────────────────────────────────────────────────────────────────

suite.section('4. HTML Rendering Completeness — legal.html Declarative Bindings');

suite.test(`legal.html contains all ${REQUIRED_SECTION_COUNT} section title data-i18n bindings`, () => {
  SECTION_KEYS.forEach(({ title }) => {
    assert.ok(legalHtml.includes(`data-i18n="${title}"`),
      `legal.html missing binding: data-i18n="${title}". Section will not render.`);
  });
});

suite.test(`legal.html contains all ${REQUIRED_SECTION_COUNT} section description data-i18n bindings`, () => {
  SECTION_KEYS.forEach(({ desc }) => {
    assert.ok(legalHtml.includes(`data-i18n="${desc}"`),
      `legal.html missing binding: data-i18n="${desc}". Section description will not render.`);
  });
});

suite.test('legal.html contains exactly one <h1> tag (strict SEO page hierarchy)', () => {
  const h1Count = (legalHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || []).length;
  assert.equal(h1Count, 1,
    `legal.html must have exactly one <h1>. Found ${h1Count}. SEO hierarchy is violated.`);
});

suite.test('legal.html canonical URL points to production domain', () => {
  const m = legalHtml.match(/rel="canonical"\s+href="([^"]+)"/i);
  assert.ok(m, 'legal.html must define a canonical URL');
  assert.ok(m[1].startsWith('https://single-site-plan.cranbear.workers.dev/'),
    `legal.html canonical must point to production: "${m[1]}"`);
});

suite.test('legal.html includes en-IN, kn-IN, and x-default hreflang alternate links', () => {
  assert.ok(/hreflang="en-IN"/.test(legalHtml), 'legal.html must specify hreflang="en-IN"');
  assert.ok(/hreflang="kn-IN"/.test(legalHtml), 'legal.html must specify hreflang="kn-IN"');
  assert.ok(/hreflang="x-default"/.test(legalHtml), 'legal.html must specify hreflang="x-default"');
});

suite.test('legal.html <title> tag is 15–95 characters (SEO optimal window)', () => {
  const m = legalHtml.match(/<title>([^<]+)<\/title>/i);
  assert.ok(m, 'legal.html must contain a <title> tag');
  const len = m[1].trim().length;
  assert.ok(len >= 15 && len <= 95,
    `legal.html <title> is ${len} chars. Must be 15–95 chars. Got: "${m[1].trim()}"`);
});

suite.test('legal.html meta description is 50–260 characters (SEO snippet optimal window)', () => {
  const m = legalHtml.match(/meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    || legalHtml.match(/name="description"\s+content="([^"]+)"/i);
  assert.ok(m, 'legal.html must contain a meta description');
  const len = m[1].trim().length;
  assert.ok(len >= 50 && len <= 260,
    `legal.html meta description is ${len} chars. Must be 50–260 chars.`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Bilingual Parity — Content Authenticity Guard
// ─────────────────────────────────────────────────────────────────────────────

suite.section('5. Bilingual Content Authenticity Guard');

suite.test('Kannada descriptions are not character-identical copies of English (untranslated)', () => {
  const untranslated = SECTION_KEYS
    .filter(({ desc }) => en[desc] && en[desc] === kn[desc])
    .map(({ desc }) => desc);
  assert.equal(untranslated.length, 0,
    `Kannada descriptions identical to English (copy-paste, untranslated): ${untranslated.join(', ')}`);
});

suite.test('All Kannada section titles contain at least 3 Kannada Unicode characters (ಕನ್ನಡ script)', () => {
  SECTION_KEYS.forEach(({ title }) => {
    const knTitle = kn[title] || '';
    const kannadaCount = (knTitle.match(/[\u0C80-\u0CFF]/g) || []).length;
    assert.ok(kannadaCount >= 3,
      `KN title "${title}" = "${knTitle}" has only ${kannadaCount} Kannada chars. Untranslated title suspected.`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Hero, Navigation & Metadata Binding Integrity
// ─────────────────────────────────────────────────────────────────────────────

suite.section('6. Hero, Navigation & Metadata Binding Integrity');

suite.test('legal.hero.title and legal.hero.subtitle are bound in legal.html', () => {
  assert.ok(legalHtml.includes('data-i18n="legal.hero.title"'),
    'legal.html must bind data-i18n="legal.hero.title"');
  assert.ok(legalHtml.includes('data-i18n="legal.hero.subtitle"'),
    'legal.html must bind data-i18n="legal.hero.subtitle"');
});

suite.test('English legal.hero.title explicitly references "Liability" or "Zero Liability"', () => {
  const title = (en['legal.hero.title'] || '').toLowerCase();
  assert.ok(title.includes('liability'),
    `legal.hero.title must contain "Liability". Got: "${en['legal.hero.title']}"`);
});

suite.test('legal.hero.subtitle references current year 2026 — document is not stale', () => {
  const subtitle = (en['legal.hero.subtitle'] || '').toLowerCase();
  assert.ok(subtitle.includes('2026'),
    `legal.hero.subtitle must reference "2026". Terms may be stale.`);
});

suite.test('legal.html navigation bar contains active "Legal Disclaimer" link', () => {
  assert.ok(legalHtml.includes('class="active"') && legalHtml.includes('legal.html'),
    'legal.html must have an active nav link pointing to legal.html for user orientation.');
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Specific Clause Regression Guardrails
// ─────────────────────────────────────────────────────────────────────────────

suite.section('7. Specific Clause Regression Guardrails');

suite.test('§1 Acceptance clause mandates 18+ years of age and Contract Act §11 legal competency', () => {
  const text = (en['legal.sec1.desc'] || '').toLowerCase();
  assert.ok(text.includes('18'),
    '§1 must assert the 18-year minimum age requirement.');
  assert.ok(text.includes('competent') || text.includes('capacity'),
    '§1 must reference legal competency under Contract Act §11.');
});

suite.test('§1 Entire Agreement clause supersedes prior GitHub, email, and social media representations', () => {
  const text = (en['legal.sec1.desc'] || '').toLowerCase();
  ['supersede', 'entire'].forEach(phrase => {
    assert.ok(text.includes(phrase),
      `§1 must contain "${phrase}" to enforce the entire agreement / merger clause.`);
  });
});

suite.test('§6 Government disclaimer explicitly lists BBMP, BDA, Sakala, COA, and Government of India', () => {
  const text = (en['legal.sec6.desc'] || '').toLowerCase();
  ['bbmp', 'bda', 'sakala', 'coa', 'government of india'].forEach(entity => {
    assert.ok(text.includes(entity),
      `§6 Government disclaimer must explicitly disclaim affiliation with: "${entity}".`);
  });
});

suite.test('§9 Indemnification covers attorney fees, government show-cause notices, and survives termination', () => {
  const text = (en['legal.sec9.desc'] || '').toLowerCase();
  ["attorney's fees", 'show-cause', 'indemnify', 'survives'].forEach(phrase => {
    assert.ok(text.includes(phrase),
      `§9 must contain "${phrase}". Indemnification clause is structurally deficient.`);
  });
});

suite.test('§12 Right-to-Modify clause states continued use constitutes binding acceptance of revised terms', () => {
  const text = (en['legal.sec12.desc'] || '').toLowerCase();
  assert.ok(text.includes('continued'),
    '§12 must state that continued use = binding acceptance of revised Terms.');
});

suite.test('§17 Export Limitation clause prohibits submission without COA architect certification', () => {
  const text = (en['legal.sec17.desc'] || '').toLowerCase();
  ['coa', 'must not', 'certified'].forEach(phrase => {
    assert.ok(text.includes(phrase),
      `§17 must contain "${phrase}". Export limitation is structurally deficient.`);
  });
});

suite.test('§20 Effective Date references August 2026 as the governing date', () => {
  const text = (en['legal.sec20.desc'] || '').toLowerCase();
  assert.ok(text.includes('2026'),
    '§20 must reference the current effective date (August 2026).');
});

suite.finish();
