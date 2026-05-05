# Postmark Email Tester

A simple tool to test sending emails via [Postmark](https://postmarkapp.com) — supports both REST API and SMTP modes.

> Not affiliated with Postmark or ActiveCampaign.

## Features

- Send test emails via REST API or SMTP
- Verified Email and Verified Domain sender options
- SMTP config display with code examples (Node.js, Python, PHP)
- Copy-to-clipboard terminal commands (cURL / SMTP)
- Built-in HTML email template
- Developer resources and FAQ
- Zero storage — nothing persisted, all in-memory

## Local Development

```bash
# Open directly in browser
open src/index.html

# Or use a local server
npx serve src
python3 -m http.server -d src
```

### With proxy (send buttons work)

```bash
# Install wrangler if you haven't
npm install -g wrangler

# Build and run locally with CF Pages Functions
./build.sh
npx wrangler pages dev dist
```

This starts a local environment at `http://localhost:8788` with the `/api/send` proxy working.

### Build

```bash
./build.sh
# → dist/index.html (single self-contained file)
```

## Docs

- [Deployment Guide](docs/deploy.md)
- [Development Guide](docs/development.md)
- [Architecture](docs/architecture.md)

## License

MIT
