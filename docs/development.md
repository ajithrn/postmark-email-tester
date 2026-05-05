# Development Guide

## Project Structure

```
src/
  index.html      ← Main HTML structure
  styles.css      ← All styles (CSS Grid layout, Postmark-inspired palette)
  template.js     ← Email HTML template generator
  app.js          ← Application logic (modes, send, copy, etc.)
functions/
  api/send.js     ← Cloudflare Pages Function (server-side proxy)
docs/             ← Documentation
build.sh          ← Build script (combines src/ into single dist/index.html)
dist/             ← Build output (gitignored)
```

## Local Development

Open `src/index.html` directly in a browser — the separate CSS/JS files load fine over `file://` or any local server.

```bash
# Simple options:
open src/index.html
npx serve src
python3 -m http.server -d src
```

The **send buttons won't work locally** (no proxy), but everything else does. Use the copy-to-clipboard buttons to test via terminal.

### Testing with the proxy locally

Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/) and run:

```bash
./build.sh
npx wrangler pages dev dist
```

This starts a local CF Pages environment with the Functions working.

## Build

```bash
./build.sh
```

Produces `dist/index.html` — a single self-contained file with all CSS and JS inlined. The build:
1. Writes the HTML head with inlined CSS
2. Extracts the `<body>` content from `src/index.html`
3. Inlines `template.js` and `app.js` into a `<script>` block
4. Removes the external `<script src="...">` references

## Key Design Decisions

### Why string arrays instead of template literals?

The email template in `template.js` uses `[...].join('\n')` instead of backtick template literals. This avoids a browser parsing issue where `</script>`, `</style>`, or `</body>` inside a `<script>` tag's template literal gets interpreted as closing the script block.

### Why escape `</` as `<\/` in JS strings?

Same reason — the HTML parser scans for `</` sequences inside `<script>` tags. Escaping the forward slash (`<\/`) prevents false matches while producing identical output.

### Why CF Pages Functions instead of a standalone Worker?

CF Pages Functions are co-deployed with the static site from the same repo. No separate worker deployment, no separate URL to configure. The `functions/api/send.js` file automatically becomes the `/api/send` endpoint.

### Why does SMTP mode use the API under the hood?

Postmark uses the same Server API Token for both API and SMTP authentication. If a send succeeds via the API, the same token will work for SMTP. True SMTP requires TCP sockets which aren't available in the browser or easily in edge functions. The proxy validates the token works, confirming SMTP will too.

## Adding Features

### New send mode or provider

1. Add a button to the mode toggle in `src/index.html`
2. Handle the new mode in `setMode()` in `app.js`
3. Update `sendEmail()` to pass the mode to the proxy
4. Update `functions/api/send.js` to handle the new mode

### New code example language

1. Add a tab button with `data-tab="lang"` in the SMTP section HTML
2. Add a `<pre>` with `id="codeLang"`
3. Update `showTab()` and `updateCodeExamples()` in `app.js`
