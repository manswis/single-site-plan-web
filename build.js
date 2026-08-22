/**
 * @file build.js
 * @description Ultra-fast production build & minification pipeline using esbuild.
 * Minifies all client-side JavaScript CAD engine modules and CSS styles.
 */

import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const JS_FILES = [
  'js/admin.js',
  'js/analytics.js',
  'js/contact.js',
  'js/renderer.js',
  'js/theme.js',
  'js/ui.js',
  'js/validator.js',
  'js/wizard.js',
  'js/i18n.js',
  'js/data/bbmpWards.js'
];

async function runBuild() {
  console.log('\n🏛️ [e-Plan Studio] Starting Production Asset Minification...\n');
  const startTime = Date.now();

  let totalOriginal = 0;
  let totalMinified = 0;

  // 1. Minify individual JS modules
  for (const file of JS_FILES) {
    if (!fs.existsSync(file)) continue;

    const origSize = fs.statSync(file).size;
    totalOriginal += origSize;

    const outFile = file.replace(/\.js$/, '.min.js');

    await esbuild.build({
      entryPoints: [file],
      outfile: outFile,
      bundle: file === 'js/i18n.js' || file === 'js/ui.js',
      minify: true,
      sourcemap: false,
      legalComments: 'none',
      target: ['es2020']
    });

    const minSize = fs.statSync(outFile).size;
    totalMinified += minSize;

    const savings = (((origSize - minSize) / origSize) * 100).toFixed(1);
    console.log(`  ✓ ${file.padEnd(20)} -> ${outFile.padEnd(22)} ${(origSize / 1024).toFixed(1)} KB -> ${(minSize / 1024).toFixed(1)} KB (-${savings}%)`);
  }

  // 2. Build combined Workbench Studio bundle for maximum page speed
  const studioBundleInput = 'js/studio.bundle.js';
  const studioBundleContent = `
    import './wizard.js';
    import './ui.js';
    import './validator.js';
    import './renderer.js';
    import './analytics.js';
  `;
  fs.writeFileSync(studioBundleInput, studioBundleContent);

  const studioBundleOut = 'js/studio.bundle.min.js';
  await esbuild.build({
    entryPoints: [studioBundleInput],
    outfile: studioBundleOut,
    bundle: true,
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    target: ['es2020']
  });

  if (fs.existsSync(studioBundleInput)) {
    fs.unlinkSync(studioBundleInput);
  }

  const bundleSize = fs.statSync(studioBundleOut).size;
  console.log(`  ✓ Combined Studio Bundle -> ${studioBundleOut.padEnd(22)} ${(bundleSize / 1024).toFixed(1)} KB (All 5 CAD modules in 1 file)`);

  // 3. Minify CSS Stylesheet
  const cssFile = 'css/styles.css';
  const cssOutFile = 'css/styles.min.css';
  if (fs.existsSync(cssFile)) {
    const cssOrigSize = fs.statSync(cssFile).size;
    totalOriginal += cssOrigSize;

    await esbuild.build({
      entryPoints: [cssFile],
      outfile: cssOutFile,
      minify: true,
      sourcemap: false,
      legalComments: 'none'
    });

    const cssMinSize = fs.statSync(cssOutFile).size;
    totalMinified += cssMinSize;

    const cssSavings = (((cssOrigSize - cssMinSize) / cssOrigSize) * 100).toFixed(1);
    console.log(`  ✓ ${cssFile.padEnd(20)} -> ${cssOutFile.padEnd(22)} ${(cssOrigSize / 1024).toFixed(1)} KB -> ${(cssMinSize / 1024).toFixed(1)} KB (-${cssSavings}%)`);
  }

  const elapsed = Date.now() - startTime;
  const overallSavings = (((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(1);
  console.log(`\n🎉 Build complete in ${elapsed}ms! Total size reduced from ${(totalOriginal / 1024).toFixed(1)} KB to ${(totalMinified / 1024).toFixed(1)} KB (-${overallSavings}%)\n`);
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
