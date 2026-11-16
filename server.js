// Minimal static server that sends a strict CSP (no 'unsafe-inline' for styles).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };

// style-src falls back for style-src-attr, so style="..." attributes (and setAttribute('style', ...)) are blocked.
// Writes through element.style (CSSOM) are NOT affected by CSP.
// connect-src: DevTools fetches source maps; without it they show up as unrelated console errors.
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'";

http
	.createServer(async (req, res) => {
		const path = new URL(req.url, 'http://x').pathname;
		// /patched/* = lit-html 3.3.1 with patches/lit-html@3.3.1.patch applied, /stock/* = unpatched lit-html (same style-map.js)
		const rel = path === '/' ? '/public/index.html'
			: path.startsWith('/patched/') ? path.replace('/patched/', '/node_modules/lit-html/development/')
			: path.startsWith('/stock/') ? path.replace('/stock/', '/node_modules/lit-html-stock/development/')
			: `/public${path}`;
		const file = join(root, normalize(rel));
		if (!file.startsWith(root)) return res.writeHead(403).end();
		try {
			const body = await readFile(file);
			res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'content-security-policy': CSP });
			res.end(body);
		} catch {
			res.writeHead(404).end('not found');
		}
	})
	.listen(8080, () => console.log('http://localhost:8080  (CSP: ' + CSP + ')'));
