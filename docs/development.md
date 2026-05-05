# Development Guide

## Project Structure

```
index.html          ← App entry point (root)
src/
  styles.css        ← All styles (CSS Grid layout)
  template.js       ← Email HTML template generator
  app.js            ← Application logic
  icon.svg          ← Favicon source
api/
  send.php          ← Backend (API + SMTP sending)
docs/
  deploy.md
  development.md
  architecture.md
```

## Local Development

### With PHP (full functionality)

```bash
php -S localhost:8000
# Open http://localhost:8000
```

Both send buttons work — API and SMTP.

### Without PHP (frontend only)

```bash
open index.html
# or
npx serve .
```

Send buttons won't work, but copy-to-clipboard buttons do.

## Key Design Decisions

### Why PHP?

- Available on virtually every hosting provider
- Built-in socket support for real SMTP connections
- Built-in cURL for API calls
- No dependencies, no composer, no build step
- Single file backend

### Why string arrays instead of template literals?

The email template in `template.js` uses `[...].join('\n')` instead of backtick template literals. This avoids a browser parsing issue where `</script>` or `</body>` inside a `<script>` tag gets interpreted as closing the script block.

### Why escape `</` as `<\/` in JS strings?

Same reason — the HTML parser scans for `</` sequences inside `<script>` tags. Escaping prevents false matches.

### SMTP implementation

The `api/send.php` implements a raw SMTP client using PHP's `fsockopen()`:
1. Opens SSL connection to `smtp.postmarkapp.com:465`
2. EHLO handshake
3. AUTH LOGIN (base64-encoded token)
4. MAIL FROM, RCPT TO, DATA commands
5. Sends email with proper MIME formatting
6. Extracts Message ID from Postmark's response

This is a real SMTP transaction — not a simulation.

## Adding Features

### New code example language

1. Add a tab button with `data-tab="lang"` in the SMTP section HTML
2. Add a `<pre>` with `id="codeLang"`
3. Update `showTab()` and `updateCodeExamples()` in `app.js`
