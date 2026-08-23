/**
 * @file navigation_routing.test.js
 * @description Integration and Page Architecture test suite validating that all 6 HTML pages
 * strictly adhere to the standardized Information Architecture (IA) navigation order,
 * active link routing, and bilingual metadata attributes across desktop and mobile.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';

const suite = new TestSuite('Navigation & Page Architecture Integration Tests', '🧭');

const HTML_PAGES = [
  'index.html',
  'studio.html',
  'pricing.html',
  'faq.html',
  'contact.html',
  'legal.html'
];

const EXPECTED_NAV_ORDER = [
  { href: 'index.html', i18nKey: 'nav.home' },
  { href: 'studio.html', i18nKey: 'nav.workbench' },
  { href: 'pricing.html', i18nKey: 'nav.pricing' },
  { href: 'faq.html', i18nKey: 'nav.faq' },
  { href: 'contact.html', i18nKey: 'nav.contact' },
  { href: 'legal.html', i18nKey: 'nav.legal' }
];

suite.section('1. Desktop Navigation Bar (.desktop-nav-bar) Strict IA Hierarchy');

HTML_PAGES.forEach(page => {
  suite.test(`${page} desktop navbar contains exact 6-link IA order`, () => {
    const html = fs.readFileSync(path.resolve(page), 'utf8');

    const desktopNavMatch = html.match(/<nav class="apple-nav-links desktop-nav-bar">([\s\S]*?)<\/nav>/);
    assert.ok(desktopNavMatch, `${page} must contain .desktop-nav-bar`);

    const navBlock = desktopNavMatch[1];
    const linkMatches = [...navBlock.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*data-i18n="([^"]+)"[^>]*>/g)];

    assert.equal(linkMatches.length, 6, `${page} desktop nav must have exactly 6 links`);

    EXPECTED_NAV_ORDER.forEach((expected, idx) => {
      const match = linkMatches[idx];
      assert.ok(match, `${page} link #${idx + 1} must exist`);
      assert.equal(match[1], expected.href, `${page} link #${idx + 1} href must be ${expected.href}`);
      assert.equal(match[2], expected.i18nKey, `${page} link #${idx + 1} data-i18n must be ${expected.i18nKey}`);
    });
  });
});

suite.section('2. Mobile Navigation Slider (.mobile-nav-slider) Strict IA Hierarchy');

HTML_PAGES.forEach(page => {
  suite.test(`${page} mobile nav slider contains exact 6-link IA order`, () => {
    const html = fs.readFileSync(path.resolve(page), 'utf8');

    const mobileNavMatch = html.match(/<div class="mobile-nav-slider">([\s\S]*?)<\/div>/);
    assert.ok(mobileNavMatch, `${page} must contain .mobile-nav-slider`);

    const navBlock = mobileNavMatch[1];
    const linkMatches = [...navBlock.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*data-i18n="([^"]+)"[^>]*>/g)];

    assert.equal(linkMatches.length, 6, `${page} mobile nav must have exactly 6 links`);

    EXPECTED_NAV_ORDER.forEach((expected, idx) => {
      const match = linkMatches[idx];
      assert.ok(match, `${page} mobile link #${idx + 1} must exist`);
      assert.equal(match[1], expected.href, `${page} mobile link #${idx + 1} href must be ${expected.href}`);
      assert.equal(match[2], expected.i18nKey, `${page} mobile link #${idx + 1} data-i18n must be ${expected.i18nKey}`);
    });
  });
});

suite.section('3. Active Page Route Highlighting Integrity');

HTML_PAGES.forEach(page => {
  suite.test(`${page} marks itself active in both desktop and mobile navigation`, () => {
    const html = fs.readFileSync(path.resolve(page), 'utf8');

    const desktopActiveMatch = html.match(/<nav class="apple-nav-links desktop-nav-bar">[\s\S]*?<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*active[^"]*"[^>]*>/);
    assert.ok(desktopActiveMatch, `${page} desktop nav must have an active link`);
    assert.equal(desktopActiveMatch[1], page, `${page} desktop active link must point to ${page}`);

    const mobileActiveMatch = html.match(/<div class="mobile-nav-slider">[\s\S]*?<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*active[^"]*"[^>]*>/);
    assert.ok(mobileActiveMatch, `${page} mobile nav must have an active link`);
    assert.equal(mobileActiveMatch[1], page, `${page} mobile active link must point to ${page}`);
  });
});
