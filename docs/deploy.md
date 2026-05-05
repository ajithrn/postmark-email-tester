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

## Without PHP

The copy-to-clipboard buttons still work without a PHP backend:
- **Copy as cURL** — paste in terminal to send via API
- **Copy SMTP command** — paste in terminal to send via SMTP
