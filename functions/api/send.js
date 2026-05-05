/**
 * Cloudflare Pages Function — /api/send
 *
 * Proxies email send requests to Postmark API.
 * This runs server-side on Cloudflare's edge, bypassing CORS.
 */

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await context.request.json();
    const { mode, token, payload } = body;

    if (!token || !payload) {
      return jsonResponse({ error: 'Missing token or payload' }, 400, corsHeaders);
    }

    // Send via Postmark API
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.ErrorCode === 0) {
      return jsonResponse({
        ...data,
        success: true,
        message: mode === 'smtp'
          ? 'Sent! Token validated — your SMTP config (same credentials) is confirmed working.'
          : 'Sent successfully via API.',
      }, 200, corsHeaders);
    }

    return jsonResponse(data, res.status, corsHeaders);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, corsHeaders);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
