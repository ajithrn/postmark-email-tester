# Deployment Guide

## Cloudflare Pages (Recommended)

This is the recommended approach — gives you both static hosting and the server-side proxy that makes the send buttons work.

### Steps

1. Push this repo to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
3. Click **Connect to Git** and select your repo
4. Configure build settings:
   - **Build command:** `./build.sh`
   - **Build output directory:** `dist`
5. Click **Deploy**

Cloudflare automatically detects the `functions/` directory and creates the `/api/send` server-side endpoint. No extra config needed.

### How it works

```
Browser  →  /api/send (CF Pages Function)  →  Postmark API  →  Email delivered
```

The `functions/api/send.js` file runs on Cloudflare's edge. It receives the request from your browser, forwards it to Postmark with proper auth, and returns the response. This bypasses CORS restrictions.

### Custom domain

After deploying, go to your Pages project → **Custom domains** → add your domain. CF handles SSL automatically.

---

## Self-hosted / Other platforms

Run `./build.sh` and host `dist/index.html` anywhere. Without the CF Pages Function, the send buttons won't work but the copy commands will.

To add proxy support on other platforms, implement a POST endpoint at `/api/send` that:
1. Accepts `{ mode, token, payload }` as JSON
2. Forwards `payload` to `https://api.postmarkapp.com/email` with `X-Postmark-Server-Token: token` header
3. Returns the Postmark response with CORS headers

See `functions/api/send.js` for reference.
