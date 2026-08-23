/**
 * @file analytics.unit.test.js
 * @description Unit tests for local telemetry logging and event buffer management.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('Analytics & Telemetry Unit Tests', '📊');

class MockAnalyticsTracker {
  constructor(maxBufferSize = 50) {
    this.buffer = [];
    this.maxBufferSize = maxBufferSize;
  }

  track(eventName, properties = {}) {
    if (!eventName || typeof eventName !== 'string') return;
    const event = {
      event: eventName,
      properties,
      timestamp: Date.now()
    };
    this.buffer.push(event);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift(); // FIFO eviction
    }
    return event;
  }

  getEvents() {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

const analytics = new MockAnalyticsTracker();

suite.section('1. Event Logging & Payloads');

suite.test('Logs wizard step transition events accurately', () => {
  analytics.clear();
  const evt = analytics.track('wizard_step_change', { fromStep: 1, toStep: 2 });
  assert.equal(evt.event, 'wizard_step_change');
  assert.equal(evt.properties.fromStep, 1);
  assert.equal(evt.properties.toStep, 2);
  assert.ok(evt.timestamp > 0);
  assert.equal(analytics.getEvents().length, 1);
});

suite.test('Logs CAD generation and export events', () => {
  analytics.track('plan_generated', { format: 'png', plotAreaSqFt: 1200 });
  analytics.track('project_exported', { fileName: 'BBMP_Plan.eplan' });
  const events = analytics.getEvents();
  assert.equal(events.length, 3);
});

suite.section('2. Buffer Size Management & Overflow Eviction');

suite.test('Evicts oldest events when buffer limit is exceeded (FIFO)', () => {
  const smallTracker = new MockAnalyticsTracker(3);
  smallTracker.track('event_1');
  smallTracker.track('event_2');
  smallTracker.track('event_3');
  smallTracker.track('event_4'); // Should evict event_1

  const events = smallTracker.getEvents();
  assert.equal(events.length, 3);
  assert.equal(events[0].event, 'event_2');
  assert.equal(events[2].event, 'event_4');
});

suite.test('Ignores null or invalid event names', () => {
  analytics.clear();
  analytics.track(null);
  analytics.track(undefined);
  analytics.track(123);
  assert.equal(analytics.getEvents().length, 0);
});

suite.section('3. 127.0.0.1 & Localhost Counter Inflation Protection');

suite.test('isLocalEnvironment accurately detects 127.0.0.1, localhost, and file protocols', async () => {
  const { isLocalEnvironment } = await import('../../js/analytics.js');

  // Test 127.0.0.1
  global.window = { location: { hostname: '127.0.0.1', protocol: 'http:' } };
  assert.equal(isLocalEnvironment(), true, '127.0.0.1 must be identified as local environment');

  // Test localhost
  global.window = { location: { hostname: 'localhost', protocol: 'http:' } };
  assert.equal(isLocalEnvironment(), true, 'localhost must be identified as local environment');

  // Test 0.0.0.0
  global.window = { location: { hostname: '0.0.0.0', protocol: 'http:' } };
  assert.equal(isLocalEnvironment(), true, '0.0.0.0 must be identified as local environment');

  // Test LAN IP 192.168.x.x
  global.window = { location: { hostname: '192.168.1.45', protocol: 'http:' } };
  assert.equal(isLocalEnvironment(), true, '192.168.x.x must be identified as local environment');

  // Test file:// protocol
  global.window = { location: { hostname: '', protocol: 'file:' } };
  assert.equal(isLocalEnvironment(), true, 'file: protocol must be identified as local environment');

  // Test production live domain
  global.window = { location: { hostname: 'eplan-studio.karnataka.gov.in', protocol: 'https:' } };
  assert.equal(isLocalEnvironment(), false, 'Production public domain must NOT be local environment');

  global.window = { location: { hostname: 'single-site-plan.cranbear.workers.dev', protocol: 'https:' } };
  assert.equal(isLocalEnvironment(), false, 'Cloudflare workers domain must NOT be local environment');
});

suite.section('4. Instant Cache Rendering & Formatting');

suite.test('updateStatElements formats numerical values with local thousands separators', async () => {
  const { updateStatElements } = await import('../../js/analytics.js');
  
  // Setup mock document
  const mockElem = { textContent: '' };
  global.document = {
    querySelectorAll: (selector) => {
      if (selector === '#statVisits') return [mockElem];
      return [];
    }
  };

  updateStatElements('statVisits', 12345);
  assert.equal(mockElem.textContent, (12345).toLocaleString());
  
  updateStatElements('statVisits', 195);
  assert.equal(mockElem.textContent, '195');
});

suite.test('renderImmediateStats executes safely and renders baseline numbers', async () => {
  const { renderImmediateStats } = await import('../../js/analytics.js');
  const visitsEl = { textContent: '' };
  const plansEl = { textContent: '' };
  
  global.document = {
    querySelectorAll: (selector) => {
      if (selector === '#statVisits') return [visitsEl];
      if (selector === '#statPlans') return [plansEl];
      return [];
    }
  };

  renderImmediateStats();
  assert.ok(visitsEl.textContent.length > 0, 'Visits must be rendered immediately');
  assert.ok(plansEl.textContent.length > 0, 'Plans must be rendered immediately');
});

suite.section('5. Localhost vs Production Behavior Parity');

suite.test('Localhost displays counter but skips increment network calls', async () => {
  const { initLiveStats, trackPlanGenerated } = await import('../../js/analytics.js');
  
  // Configure environment as localhost
  global.window = { location: { hostname: 'localhost', protocol: 'http:' } };
  
  const visitsEl = { textContent: '' };
  const plansEl = { textContent: '' };
  global.document = {
    querySelectorAll: (selector) => {
      if (selector === '#statVisits') return [visitsEl];
      if (selector === '#statPlans') return [plansEl];
      return [];
    }
  };

  const fetchCalls = [];
  global.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, method: options.method || 'GET' });
    return {
      ok: true,
      json: async () => ({ visits: 200, plans: 180 })
    };
  };

  // Run initLiveStats(true) on localhost
  initLiveStats(true);
  
  // Must render counter immediately
  assert.ok(visitsEl.textContent.length > 0, 'Counter must be displayed on localhost');
  assert.ok(plansEl.textContent.length > 0, 'Plans counter must be displayed on localhost');
  
  // Must NOT have called any /hit/ endpoint or ?hit=true on localhost
  const hitCall = fetchCalls.find(c => c.url.includes('hit=true') || c.url.includes('/hit/'));
  assert.equal(hitCall, undefined, 'Localhost must never invoke increment hit endpoint');

  // Trigger plan generation on localhost
  trackPlanGenerated();
  const planHit = fetchCalls.find(c => c.url.includes('/api/stats/plan') || c.url.includes('/hit/bbmp_eplan_studio_plans'));
  assert.equal(planHit, undefined, 'Localhost must never increment production plan counter');
});

suite.test('Production site requests increment on new session and plan generation', async () => {
  const { initLiveStats, trackPlanGenerated } = await import('../../js/analytics.js');
  
  // Configure environment as production
  global.window = { location: { hostname: 'single-site-plan.cranbear.workers.dev', protocol: 'https:' } };
  
  const visitsEl = { textContent: '' };
  const plansEl = { textContent: '' };
  global.document = {
    querySelectorAll: (selector) => {
      if (selector === '#statVisits') return [visitsEl];
      if (selector === '#statPlans') return [plansEl];
      return [];
    }
  };
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {}
  };

  const fetchCalls = [];
  global.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, method: options.method || 'GET' });
    return {
      ok: true,
      json: async () => ({ visits: 205, plans: 185 })
    };
  };

  // Run initLiveStats(true) on production
  initLiveStats(true);
  
  // Check that increment endpoint was requested
  const hasHit = fetchCalls.some(c => c.url.includes('hit=true') || c.url.includes('/hit/'));
  assert.ok(hasHit, 'Production site must request visit increment on initial session');

  // Trigger trackPlanGenerated on production
  trackPlanGenerated();
  const planPost = fetchCalls.find(c => c.url.includes('/api/stats/plan') || c.url.includes('/hit/'));
  assert.ok(planPost !== undefined, 'Production site must trigger plan increment call');
});

suite.finish();
