/**
 * @file cad_scaling_aspect_ratios.test.js
 * @description Statutory tests verifying CAD vector auto-scaling and aspect ratio viewport bounds.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('CAD Vector Auto-Scaling & Geometry Bounds Suite', '📐');

function computeAutoFitScale(plotW, plotD, canvasW = 800, canvasH = 600, padding = 80) {
  if (!plotW || !plotD || plotW <= 0 || plotD <= 0) return 1.0;
  const availW = canvasW - (padding * 2);
  const availH = canvasH - (padding * 2);
  const scaleX = availW / plotW;
  const scaleY = availH / plotD;
  return Math.min(scaleX, scaleY);
}

suite.section('1. Extreme Aspect Ratio Viewport Scaling');

const TEST_RATIOS = [
  { desc: 'Standard 30x40 (Ratio 3:4)', w: 30, d: 40 },
  { desc: 'Narrow Strip 10x100 (Ratio 1:10)', w: 10, d: 100 },
  { desc: 'Wide Ribbon 100x10 (Ratio 10:1)', w: 100, d: 10 },
  { desc: 'Square 50x50 (Ratio 1:1)', w: 50, d: 50 },
  { desc: 'Commercial Super-Plot 200x300 (Ratio 2:3)', w: 200, d: 300 }
];

TEST_RATIOS.forEach(({ desc, w, d }) => {
  suite.test(`Calculates stable scaling factor for ${desc}`, () => {
    const scale = computeAutoFitScale(w, d);
    assert.ok(scale > 0, `Scale factor must be positive for ${desc}`);
    assert.ok(isFinite(scale), `Scale factor must be finite for ${desc}`);

    // Verify rendered width & height fit strictly within canvas bounds (800x600 with 80px padding)
    const renderedW = w * scale;
    const renderedH = d * scale;
    assert.ok(renderedW <= 640.01, `Rendered width ${renderedW} exceeds available width`);
    assert.ok(renderedH <= 440.01, `Rendered height ${renderedH} exceeds available height`);
  });
});

suite.section('2. Zero and Malformed Boundary Protection');

suite.test('Returns fallback scale of 1.0 safely for zero or negative dimensions', () => {
  assert.equal(computeAutoFitScale(0, 40), 1.0);
  assert.equal(computeAutoFitScale(30, 0), 1.0);
  assert.equal(computeAutoFitScale(-10, 40), 1.0);
});

suite.finish();
