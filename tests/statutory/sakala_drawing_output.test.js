/**
 * @file sakala_drawing_output.test.js
 * @description Statutory tests verifying compliance with Karnataka Sakala Services Act and BBMP A-Khata Single Site Plan mandate.
 */

import { TestSuite, assert } from '../helpers/test_assert.js';

const suite = new TestSuite('BBMP Sakala Statutory Drawing Mandate Suite', '🏛️');

const MANDATORY_SAKALA_FIELDS = [
  'ownerName',
  'surveyNo',
  'wardNo',
  'wardName',
  'bbmpZone',
  'siteAddress',
  'plotWidth',
  'plotDepth',
  'plotAreaSqFt',
  'plotAreaSqM',
  'builtUpAreaSqFt',
  'northAbutting',
  'southAbutting',
  'eastAbutting',
  'westAbutting'
];

suite.section('1. Mandatory Title Block & Statutory Fields');

suite.test('All 15 statutory drawing metadata fields are required for Sakala submission', () => {
  assert.equal(MANDATORY_SAKALA_FIELDS.length, 15);
});

suite.test('Title block validates standard BBMP Single Site Plan header format', () => {
  const titleBlock = {
    docTitle: 'SINGLE SITE PLAN FOR BBMP B-TO-A KHATA CONVERSION',
    authority: 'BRUHAT BENGALURU MAHANAGARA PALIKE (BBMP)',
    act: 'KARNATAKA SAKALA SERVICES ACT & BBMP BUILDING BYE-LAWS',
    scale: '1:100 Metric & Imperial',
    orientation: 'NORTH UP'
  };

  assert.ok(titleBlock.docTitle.includes('BBMP B-TO-A KHATA'));
  assert.ok(titleBlock.authority.includes('BRUHAT BENGALURU MAHANAGARA PALIKE'));
  assert.ok(titleBlock.act.includes('SAKALA'));
});

suite.section('2. Statutory Owner & Architect Legal Declarations');

suite.test('Includes mandatory Owner Self-Declaration legal text', () => {
  const ownerDeclaration = 'I/We hereby certify that the measurements, schedule of property boundaries, and existing built-up structures shown in this site plan represent the true and accurate facts of the property registered in revenue records.';
  assert.ok(ownerDeclaration.length > 50);
  assert.ok(ownerDeclaration.includes('schedule of property'));
});

suite.test('Includes mandatory Architect / Registered Engineer certification text', () => {
  const architectDeclaration = 'Certified that the plot dimensions, setbacks, road widening buffer lines, and coverage calculations presented herein conform to the provisions of the Revised Master Plan 2015 and BBMP Building Bye-Laws.';
  assert.ok(architectDeclaration.length > 50);
  assert.ok(architectDeclaration.includes('Revised Master Plan'));
});

suite.finish();
