// ============================================================
// Build script: copies web source files into www/ for Capacitor.
// Run with: npm run build
// ============================================================

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'www');

// Only these items are copied — keeps node_modules, android/, scripts/ out of the bundle.
const INCLUDE = [
  'index.html',
  'manifest.json',
  'privacy.html',
  'terms.html',
  'sw.js',
  'css',
  'js',
  'assets',
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Wipe and recreate www/
if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST);

let copied = 0;
let missing = 0;
for (const item of INCLUDE) {
  const src  = path.join(ROOT, item);
  const dest = path.join(DEST, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    console.log(`  ✓  ${item}`);
    copied++;
  } else {
    console.log(`  -  ${item}  (not found — skipped)`);
    missing++;
  }
}

console.log(`\nBuild complete → www/   (${copied} items copied${missing ? ', ' + missing + ' skipped' : ''})`);
