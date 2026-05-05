// Email HTML template — accepts mode ('api' or 'smtp') to reflect the send method
function getEmailTemplate(mode) {
    var timestamp = new Date().toISOString();
    var isSmtp = (mode === 'smtp');
    var methodLabel = isSmtp ? 'SMTP (port 587, STARTTLS)' : 'REST API (/email)';
    var sentVia = isSmtp ? 'Sent via Postmark SMTP' : 'Sent via Postmark API';
    var desc = isSmtp
        ? 'sent via <strong>Postmark SMTP<\/strong> to confirm your SMTP configuration works correctly.'
        : 'sent via the <strong>Postmark API<\/strong> to confirm your sending configuration works correctly.';

    var lines = [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '  <style>',
        '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }',
        '    .wrap { max-width: 560px; margin: 0 auto; padding: 20px; }',
        '    .hdr { background: #ffde00; padding: 16px 24px; border-radius: 8px 8px 0 0; }',
        '    .hdr h1 { margin: 0; color: #1a1a2e; font-size: 18px; font-weight: 700; }',
        '    .bdy { background: #ffffff; padding: 24px; border: 1px solid #e8e8e8; border-top: none; }',
        '    .bdy p { color: #444; line-height: 1.6; margin: 0 0 12px; font-size: 14px; }',
        '    .badge { display: inline-block; background: #27ae60; color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }',
        '    .meta { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 12px 16px; margin: 16px 0; }',
        '    .meta table { width: 100%; border-collapse: collapse; }',
        '    .meta td { padding: 4px 0; font-size: 12px; color: #666; }',
        '    .meta td:first-child { font-weight: 600; color: #444; width: 100px; }',
        '    .ftr { background: #1a1a2e; padding: 12px 24px; border-radius: 0 0 8px 8px; text-align: center; }',
        '    .ftr p { color: #888; font-size: 11px; margin: 0; }',
        '  <\/style>',
        '<\/head>',
        '<body>',
        '  <div class="wrap">',
        '    <div class="hdr"><h1>Postmark Test Email<\/h1><\/div>',
        '    <div class="bdy">',
        '      <p>Hello!<\/p>',
        '      <p>This is a <strong>test email<\/strong> ' + desc + '<\/p>',
        '      <p><span class="badge">Delivery Successful<\/span><\/p>',
        '      <div class="meta">',
        '        <table>',
        '          <tr><td>Service<\/td><td>Postmark Transactional Email<\/td><\/tr>',
        '          <tr><td>Method<\/td><td>' + methodLabel + '<\/td><\/tr>',
        '          <tr><td>Stream<\/td><td>Outbound<\/td><\/tr>',
        '          <tr><td>Timestamp<\/td><td>' + timestamp + '<\/td><\/tr>',
        '        <\/table>',
        '      <\/div>',
        '      <p>If you received this, your integration is working!<\/p>',
        '    <\/div>',
        '    <div class="ftr"><p>' + sentVia + ' - Test email<\/p><p style="margin-top:4px;font-size:10px;color:#666;">Sent using <a href="https://github.com/ajithrn/postmark-email-tester" style="color:#ffde00;">Postmark Email Tester<\/a> by ajithrn<\/p><\/div>',
        '  <\/div>',
        '<\/body>',
        '<\/html>'
    ];
    return lines.join('\n');
}
