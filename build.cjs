// Publish only browser assets; the preview server is not a deployment entrypoint.
const fs = require('node:fs');
const path = require('node:path');
const files = ['index.html', 'dashboard.css', 'data.js', 'live-summary.js', 'benchmarks.js', 'dashboard.js', 'map-layout.js', 'dashboard-v2.js', 'player-report.js', 'team-config.js', 'PretendardVariable.woff2', 'logo-white.png', 'logo-black.png'];
const output = path.join(__dirname, 'dist');
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const file of files) fs.copyFileSync(path.join(__dirname, file), path.join(output, file));
console.log(`Built ${files.length} static assets in dist/`);
