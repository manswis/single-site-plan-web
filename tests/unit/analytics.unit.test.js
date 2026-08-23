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

suite.finish();
