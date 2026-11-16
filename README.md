# lit `styleMap` vs strict `style-src` CSP — PoC

Related: https://github.com/lit/lit/issues/4719, https://github.com/lit/lit/issues/5427

    pnpm install
    pnpm start     # http://localhost:8080

The server sends `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'`.

* `/stock/*`   serves unpatched `lit-html` (`lit-html-stock` = `npm:lit-html@3.3.0`; its `style-map.js` is byte-identical to 3.3.1)
* `/patched/*` serves `lit-html@3.3.1` with `patches/lit-html@3.3.1.patch` applied (`pnpm patch`). The whole fix is that ~10-line patch to `update()`; `render()` is untouched.

Expected output of the page (Chromium):

    stock    backgroundColor              first render: rgba(0, 0, 0, 0)   update: rgb(0, 0, 255)   <- first render blocked by CSP
    stock    backgroundColor !important   first render: rgba(0, 0, 0, 0)   update: rgba(0, 0, 0, 0)  <- (also #5427 on update)
    patched  backgroundColor              first render: rgb(255, 0, 0)     update: rgb(0, 0, 255)
    patched  backgroundColor !important   first render: rgb(255, 0, 0)     update: rgb(0, 0, 255)
    style-src-attr violations: 2   (expected: 2, both from stock; 0 from patched)

Cause: on the first render `StyleMapDirective.update()` returns `this.render(styleInfo)` (a CSS string) and lit-html commits it
with `setAttribute('style', ...)`, which `style-src-attr` blocks. Later updates write `element.style.*` and return `noChange`.
For a binding that is the whole attribute value, returning `noChange` on the first render is enough: `AttributePart._$setValue`
commits nothing (single-value branch).
