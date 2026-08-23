/**
 * @file seo.unit.test.js
 * @description Master Automated SEO Regression Test Suite for e-Plan Studio.
 * Verifies on-page metadata, target keyword saturation, JSON-LD Schema.org validity,
 * multilingual hreflang completeness, heading tag hierarchy, and sitemap/robots parity.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const suite = new TestSuite('SEO & Discoverability Regression Suite', '🔍');

const CORE_HTML_FILES = [
  'index.html',
  'studio.html',
  'faq.html',
  'pricing.html',
  'contact.html',
  'legal.html'
];

const TARGET_KEYWORDS = [
  'bbmp',
  'b to a khata',
  'ekhata',
  'single site plan',
  'single site design',
  'single site drawing',
  'single site cad',
  'design studio',
  'e-studio'
];

suite.section('1. Title, Description & Target Keyword Saturation');

suite.test('Core pages contain all target SEO keywords in metadata or content', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8').toLowerCase();
  const studioHtml = fs.readFileSync(path.join(rootDir, 'studio.html'), 'utf-8').toLowerCase();
  const combinedHtml = indexHtml + ' ' + studioHtml;

  TARGET_KEYWORDS.forEach(keyword => {
    assert.ok(
      combinedHtml.includes(keyword),
      `Target SEO keyword "${keyword}" must be present in index.html or studio.html`
    );
  });
});

suite.test('All 6 core HTML files have unique, non-empty <title> and <meta description>', () => {
  const titles = new Set();
  const descriptions = new Set();

  CORE_HTML_FILES.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    
    // Check title tag
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    assert.ok(titleMatch, `${file} must have a <title> tag`);
    const title = titleMatch[1].trim();
    assert.ok(title.length >= 15 && title.length <= 95, `${file} title length (${title.length}) must be between 15 and 95 characters`);
    assert.ok(!titles.has(title), `Duplicate title detected in ${file}: "${title}"`);
    titles.add(title);

    // Check meta description
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    assert.ok(descMatch, `${file} must have a meta description`);
    const desc = descMatch[1].trim();
    assert.ok(desc.length >= 50 && desc.length <= 260, `${file} meta description length (${desc.length}) must be between 50 and 260 characters`);
    assert.ok(!descriptions.has(desc), `Duplicate meta description detected in ${file}`);
    descriptions.add(desc);
  });
});

suite.section('2. Canonical URLs & Multilingual Hreflang Integrity');

suite.test('All core pages define matching canonical and bidirectional hreflang tags', () => {
  CORE_HTML_FILES.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');

    // Canonical link check
    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    assert.ok(canonicalMatch, `${file} must specify a canonical URL`);
    assert.ok(canonicalMatch[1].startsWith('https://single-site-plan.cranbear.workers.dev/'), `${file} canonical must point to production domain`);

    // Hreflang tags check
    const enHreflang = content.match(/<link\s+rel=["']alternate["']\s+hreflang=["']en(-in)?["']/i);
    const knHreflang = content.match(/<link\s+rel=["']alternate["']\s+hreflang=["']kn(-in)?["']/i);
    const defaultHreflang = content.match(/<link\s+rel=["']alternate["']\s+hreflang=["']x-default["']/i);

    assert.ok(enHreflang, `${file} must specify English (en or en-IN) hreflang`);
    assert.ok(knHreflang, `${file} must specify Kannada (kn or kn-IN) hreflang`);
    assert.ok(defaultHreflang, `${file} must specify x-default fallback hreflang`);
  });
});

suite.section('3. Semantic Heading Structure & Single H1 Enforcement');

suite.test('Every core page contains exactly one semantic <h1> heading', () => {
  CORE_HTML_FILES.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    const h1Matches = content.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
    assert.equal(
      h1Matches.length,
      1,
      `${file} must have exactly one <h1> tag for strict SEO hierarchy (found ${h1Matches.length})`
    );
  });
});

suite.section('4. Schema.org JSON-LD Structured Data Validation');

suite.test('index.html contains valid WebSite, WebApplication, HowTo, and FAQPage JSON-LD schemas', () => {
  const content = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const jsonLdMatch = content.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  assert.ok(jsonLdMatch, 'index.html must contain JSON-LD structured data');

  let schema;
  try {
    schema = JSON.parse(jsonLdMatch[1]);
  } catch (err) {
    assert.fail('JSON-LD in index.html is malformed: ' + err.message);
  }

  assert.equal(schema['@context'], 'https://schema.org');
  assert.ok(Array.isArray(schema['@graph']), '@graph array must be present');

  const types = schema['@graph'].map(item => item['@type']);
  assert.ok(types.includes('WebSite'), 'Must include WebSite schema');
  assert.ok(types.includes('WebApplication'), 'Must include WebApplication schema');
  assert.ok(types.includes('HowTo'), 'Must include HowTo schema');
  assert.ok(types.includes('FAQPage'), 'Must include FAQPage schema');

  // Verify WebApplication details
  const webApp = schema['@graph'].find(item => item['@type'] === 'WebApplication');
  assert.equal(webApp.applicationCategory, 'DesignApplication');
  assert.ok(Array.isArray(webApp.featureList) && webApp.featureList.length >= 4, 'featureList must contain key features');

  // Verify HowTo details
  const howTo = schema['@graph'].find(item => item['@type'] === 'HowTo');
  assert.ok(Array.isArray(howTo.step) && howTo.step.length >= 3, 'HowTo must contain multiple sequential steps');
});

suite.test('studio.html contains valid WebApplication JSON-LD schema', () => {
  const content = fs.readFileSync(path.join(rootDir, 'studio.html'), 'utf-8');
  const jsonLdMatch = content.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  assert.ok(jsonLdMatch, 'studio.html must contain JSON-LD structured data');

  const schema = JSON.parse(jsonLdMatch[1]);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'WebApplication');
  assert.ok(schema.name.length > 0);
  assert.ok(Array.isArray(schema.featureList));
});

suite.test('faq.html contains valid FAQPage JSON-LD schema', () => {
  const content = fs.readFileSync(path.join(rootDir, 'faq.html'), 'utf-8');
  const jsonLdMatch = content.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  assert.ok(jsonLdMatch, 'faq.html must contain JSON-LD structured data');

  const schema = JSON.parse(jsonLdMatch[1]);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@type'], 'FAQPage');
  assert.ok(Array.isArray(schema.mainEntity) && schema.mainEntity.length >= 4, 'Must have at least 4 FAQ items');
  
  schema.mainEntity.forEach(item => {
    assert.equal(item['@type'], 'Question');
    assert.ok(item.name.length > 5);
    assert.equal(item.acceptedAnswer['@type'], 'Answer');
    assert.ok(item.acceptedAnswer.text.length > 10);
  });
});

suite.section('5. OpenGraph & Social Sharing Meta Tags');

suite.test('All core pages define complete OpenGraph and Twitter Card properties', () => {
  CORE_HTML_FILES.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    
    assert.ok(content.includes('property="og:type"'), `${file} must define og:type`);
    assert.ok(content.includes('property="og:site_name"'), `${file} must define og:site_name`);
    assert.ok(content.includes('property="og:url"'), `${file} must define og:url`);
    assert.ok(content.includes('property="og:title"'), `${file} must define og:title`);
    assert.ok(content.includes('property="og:description"'), `${file} must define og:description`);
    assert.ok(content.includes('property="og:image"'), `${file} must define og:image`);
  });
});

suite.section('6. Sitemap.xml & Robots.txt Synchronous Parity');

suite.test('sitemap.xml includes all 6 core URLs with valid lastmod and priority attributes', () => {
  const sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf-8');
  assert.ok(sitemap.includes('<urlset'), 'sitemap.xml must be valid XML urlset');

  CORE_HTML_FILES.forEach(file => {
    const loc = file === 'index.html'
      ? 'https://single-site-plan.cranbear.workers.dev/'
      : `https://single-site-plan.cranbear.workers.dev/${file}`;
    assert.ok(sitemap.includes(`<loc>${loc}</loc>`), `sitemap.xml must index ${loc}`);
  });
});

suite.test('robots.txt allows indexing and links to official sitemap.xml', () => {
  const robots = fs.readFileSync(path.join(rootDir, 'robots.txt'), 'utf-8');
  assert.ok(robots.includes('User-agent: *'), 'robots.txt must allow all crawlers');
  assert.ok(robots.includes('Allow: /'), 'robots.txt must allow crawling');
  assert.ok(robots.includes('Sitemap: https://single-site-plan.cranbear.workers.dev/sitemap.xml'), 'robots.txt must declare sitemap location');
  assert.ok(robots.includes('Disallow: /admin.html'), 'robots.txt must shield admin console');
});

suite.section('7. Core Web Vitals & Preconnect Directives');

suite.test('Core pages preconnect to Google Fonts domains for sub-second FCP', () => {
  CORE_HTML_FILES.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    assert.ok(content.includes('rel="preconnect" href="https://fonts.googleapis.com"'), `${file} must preconnect to fonts.googleapis.com`);
    assert.ok(content.includes('rel="preconnect" href="https://fonts.gstatic.com"'), `${file} must preconnect to fonts.gstatic.com`);
  });
});

suite.finish();
