# Architecture

## Overview

```
┌─────────────────────────────────────────────────┐
│  Browser (static HTML)                          │
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
          │ POST /api/send
          ▼
┌─────────────────────────────┐
│  CF Pages Function          │
│  (functions/api/send.js)    │
│                             │
│  - Receives {mode, token,   │
│    payload}                 │
│  - Forwards to Postmark API │
│  - Returns response + CORS  │
└─────────────┬───────────────┘
              │ POST https://api.postmarkapp.com/email
              ▼
┌─────────────────────────────┐
│  Postmark API               │
│  - Validates token          │
│  - Sends email              │
│  - Returns MessageID        │
└─────────────────────────────┘
```

## Data Flow

1. User fills in token, sender, recipient, message
2. Clicks "Send via API →" or "Send via SMTP →"
3. Browser POSTs to `/api/send` with `{ mode, token, payload }`
4. CF Function forwards to Postmark with the token as auth header
5. Postmark responds with success/error
6. CF Function relays response back to browser
7. Browser shows result (MessageID on success, error details on failure)

## Security Model

- **No secrets stored anywhere** — token is provided by the user at runtime
- **Token transit**: Browser → CF edge (HTTPS) → Postmark (HTTPS)
- **CF Function is stateless** — no logging, no persistence
- **Browser state** — all in-memory, cleared on `beforeunload`
- **No external dependencies** — zero CDN scripts, no analytics, no tracking

## Layout (CSS Grid)

```
Desktop (≥1024px):          Mobile (<1024px):
┌────────────┬─────────┐    ┌──────────────────┐
│            │         │    │                  │
│   Form     │  Info   │    │      Form        │
│   (60%)    │  (40%)  │    │                  │
│            │         │    ├──────────────────┤
│            │ sticky  │    │      Info        │
│            │         │    │                  │
└────────────┴─────────┘    └──────────────────┘

grid-template-columns: 3fr 2fr (desktop)
grid-template-columns: 1fr (mobile)
```

## File Responsibilities

| File | Role |
|------|------|
| `src/index.html` | HTML structure, layout, all UI elements |
| `src/styles.css` | Visual styling, grid layout, responsive breakpoints |
| `src/template.js` | Generates the test email HTML (mode-aware) |
| `src/app.js` | All interactivity: mode toggle, send, copy, preview |
| `functions/api/send.js` | Server-side proxy to Postmark (CORS bypass) |
| `build.sh` | Combines src/ into a single deployable HTML file |
