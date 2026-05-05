# Postmark Email Tester

A simple tool to test sending emails via [Postmark](https://postmarkapp.com) — supports both REST API and real SMTP sending.

> Not affiliated with Postmark or ActiveCampaign.

## Features

- Send test emails via REST API or SMTP (both actually send)
- Verified Email and Verified Domain sender options
- SMTP config display with code examples (Node.js, Python, PHP)
- Copy-to-clipboard terminal commands
- Built-in HTML email template
- Developer resources and FAQ
- Zero storage — nothing persisted, all in-memory

## Requirements

- PHP 7.4+ with `curl` and `openssl` extensions
- Any web server (Apache, Nginx, etc.)

## Local Development

```bash
# Full functionality with PHP built-in server
php -S localhost:8000
# Open http://localhost:8000
```

## Deploy

Upload to any PHP hosting. No dependencies, no build step, no composer.

See [docs/deploy.md](docs/deploy.md) for details.

## Docs

- [Deployment Guide](docs/deploy.md)
- [Development Guide](docs/development.md)
- [Architecture](docs/architecture.md)

## License

MIT
