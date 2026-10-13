// Local preview only. Explicit allowlist excludes source workbooks and scripts.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = new Set(['index.html','dashboard.css','data.js','live-summary.js','benchmarks.js','dashboard.js','map-layout.js','dashboard-v2.js','player-report.js','team-config.js','PretendardVariable.woff2','logo-white.png','logo-black.png']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.woff2':'font/woff2'};
http.createServer((req,res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (!files.has(name)) {res.writeHead(404); return res.end('Not found');}
  fs.readFile(path.join(__dirname,name),(error,data) => {
    if(error){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(data);
  });
}).listen(Number(process.env.PORT || 5513),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(process.env.PORT || 5513)));
