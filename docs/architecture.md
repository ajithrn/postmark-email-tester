# Architecture

## Overview

```
┌─────────────────────────────────────────────────┐
│  Browser (index.html + src/*.js)                │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Mode     │  │ Form     │  │ Info Panel   │  │
│  │ Toggle   │  │ (auth,   │  │ (resources,  │  │
│  │ API/SMTP │  │  sender, │  │  FAQ, code   │  │
│  │          │  │  message) │  │  examples)   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                     │                           │
│         ┌───────────┼───────────┐               │
│         ▼           ▼           ▼               │
│  [Send Button] [Copy cURL] [Copy SMTP cmd]      │
└─────────┬───────────────────────────────────────┘
          │ POST api/send.php
          ▼
┌─────────────────────────────────┐
│  PHP Backend (api/send.php)     │
│                                 │
│  mode === 'api'                 │
│    → cURL to Postmark REST API  │
│                                 │
│  mode === 'smtp'                │
│    → TCP socket to Postmark     │
│      SMTP (real SMTP handshake) │
└─────────────┬───────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌────────────┐  ┌──────────────────┐
│ Postmark   │  │ Postmark SMTP    │
│ REST API   │  │ smtp.postmark    │
│            │  │ app.com:465      │
└────────────┘  └──────────────────┘
```

## Data Flow

1. User fills in token, sender, recipient, message
2. Clicks "Send via API" or "Send via SMTP"
3. Browser POSTs to `api/send.php` with `{ mode, token, payload }`
4. PHP backend either:
   - **API mode**: cURL POST to `api.postmarkapp.com/email`
   - **SMTP mode**: Opens socket to `smtp.postmarkapp.com:465`, authenticates, sends email
5. Backend returns JSON response to browser
6. Browser shows result (MessageID on success, error on failure)

## Security Model

- **No secrets stored** — token provided by user at runtime
- **Token transit**: Browser → your server (same origin) → Postmark (HTTPS)
- **PHP is stateless** — no logging, no file writes, no database
- **Browser state** — all in-memory, cleared on page close
- **No external JS dependencies** — zero CDN scripts, no analytics

## Layout (CSS Grid)

```
Desktop (>=1024px):         Mobile (<1024px):
┌────────────┬─────────┐   ┌──────────────────┐
│            │         │   │                  │
│   Form     │  Info   │   │      Form        │
│   (60%)    │  (40%)  │   │                  │
│            │         │   ├──────────────────┤
│            │ sticky  │   │      Info        │
│            │         │   │                  │
└────────────┴─────────┘   └──────────────────┘

grid-template-columns: 3fr 2fr (desktop)
grid-template-columns: 1fr (mobile)
```

## File Responsibilities

| File | Role |
|------|------|
| `index.html` | HTML structure, layout, all UI elements |
| `src/styles.css` | Visual styling, grid layout, responsive breakpoints |
| `src/template.js` | Generates the test email HTML (mode-aware) |
| `src/app.js` | All interactivity: mode toggle, send, copy, preview |
| `api/send.php` | Server-side: API sending (cURL) + SMTP sending (socket) |
