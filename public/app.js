const out = [];
const violations = [];
// Only count style attribute violations; with DevTools open, source map fetches are reported too.
document.addEventListener('securitypolicyviolation', e => {
	if (e.violatedDirective === 'style-src-attr') violations.push(e.violatedDirective);
});

for (const variant of ['stock', 'patched']) {
	const { html, render } = await import(`/${variant}/lit-html.js`);
	const { styleMap } = await import(`/${variant}/directives/style-map.js`);

	for (const [label, first, second] of [
		['backgroundColor', { backgroundColor: 'rgb(255, 0, 0)' }, { backgroundColor: 'rgb(0, 0, 255)' }],
		['backgroundColor !important', { backgroundColor: 'rgb(255, 0, 0) !important' }, { backgroundColor: 'rgb(0, 0, 255) !important' }],
	]) {
		const host = document.createElement('div');
		document.body.append(host);
		const view = s => html`<div style=${styleMap(s)}>${variant}: ${label}</div>`;
		const bg = () => getComputedStyle(host.firstElementChild).backgroundColor;
		render(view(first), host);
		const afterFirst = bg();
		render(view(second), host);
		out.push(`${variant.padEnd(8)} ${label.padEnd(28)} first render: ${afterFirst.padEnd(18)} update: ${bg()}`);
	}
}

setTimeout(() => {
	out.push('', `style-src-attr violations: ${violations.length}   (expected: 2, both from stock; 0 from patched)`);
	document.getElementById('log').textContent = out.join('\n');
}, 200);
