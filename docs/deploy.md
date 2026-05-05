# Deployment Guide

## Requirements

- PHP 7.4+ with `curl` and `openssl` extensions enabled
- Any web server (Apache, Nginx, LiteSpeed, etc.)

## Deploy

1. Upload the entire project to your PHP server
2. Point your domain/subdomain to the project root
3. Open the site — it works immediately

Structure on your server:

```
/your-site/
  index.html        ← app entry point (root)
  webhook.php       ← GitHub auto-deploy endpoint
  .env.example      ← env variable reference
  src/
    styles.css
    template.js
    app.js
    icon.svg
  api/
    send.php        ← backend handler
  docs/
    ...
```

### Apache

No special config needed. Works out of the box.

### Nginx

Make sure PHP-FPM is configured for `.php` files:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/project;
    index index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## How It Works

```
Browser  →  api/send.php (your server)  →  Postmark (API or SMTP)
                                                ↓
                                          Email delivered
```

- **API mode**: PHP uses cURL to POST to `api.postmarkapp.com/email`
- **SMTP mode**: PHP opens a real TCP socket to `smtp.postmarkapp.com:465` and does the full SMTP handshake (EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA)

Both modes actually send the email.

## Verify PHP Extensions

```bash
php -m | grep -E "curl|openssl"
```

Both `curl` and `openssl` should be listed. These are enabled by default on most PHP installations.

---

## Auto-Deploy with GitHub Webhook

The project includes a `webhook.php` that auto-deploys on every push to `main`.

### How It Works

```
git push → GitHub → POST to webhook.php → git pull on server → site updated
```

### Environment Variables

The webhook reads sensitive config from environment variables (never hardcoded):

| Variable | Description |
|----------|-------------|
| `WEBHOOK_SECRET` | Secret key shared between GitHub and your server |
| `DEPLOY_PATH` | Absolute path to the site root on the server |

Copy `.env.example` to `.env` for local reference:

```bash
cp .env.example .env
```

### Server Setup (CloudPanel)

1. **SSH into your server and clone the repo:**

```bash
ssh pmtester@your-server-ip
cd /home/pmtester/htdocs/pmtester.ajithrn.com
git clone https://github.com/your-username/your-repo.git .
```

2. **Set environment variables in the Vhost config:**

In CloudPanel → Sites → your site → Vhost, add inside the `server` block:

```nginx
fastcgi_param WEBHOOK_SECRET "your-actual-secret-here";
fastcgi_param DEPLOY_PATH "/home/pmtester/htdocs/pmtester.ajithrn.com";
```

3. **Configure the webhook on GitHub:**

Go to your repo → Settings → Webhooks → Add webhook:

| Field | Value |
|-------|-------|
| Payload URL | `https://pmtester.ajithrn.com/webhook.php` |
| Content type | `application/json` |
| Secret | Same value as `WEBHOOK_SECRET` on server |
| Events | Just the push event |
| Active | ✓ |

4. **Test it:** Push a commit and check GitHub → Webhooks → Recent Deliveries for a green checkmark.

### Troubleshooting

| Problem | Fix |
|---------|-----|
| 403 in GitHub deliveries | Secret mismatch between GitHub and server env |
| 500 error | Check PHP error logs or missing env variables |
| `shell_exec` not running | Check CloudPanel PHP → disable_functions |
| Permission denied on git pull | Ensure site user owns the `.git` folder |

Deploy log is written to `/home/pmtester/deploy-log.txt`.

---

## Without PHP

The copy-to-clipboard buttons still work without a PHP backend:
- **Copy as cURL** — paste in terminal to send via API
- **Copy SMTP command** — paste in terminal to send via SMTP
