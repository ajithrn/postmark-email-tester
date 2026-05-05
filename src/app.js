// ─── State ──────────────────────────────────────────────────────────────────
var currentMode = 'api'; // 'api' or 'smtp'
var currentSenderType = 'email'; // 'email' or 'domain'
var activeTab = 'node';

// Worker URL — set this to your Cloudflare Worker URL
var WORKER_URL = '';

// ─── Init ───────────────────────────────────────────────────────────────────
function init() {
    loadTemplate();
    setMode('api');
    setSenderType('email');
    // Check for worker URL in page (allows self-hosted config)
    var workerMeta = document.querySelector('meta[name="worker-url"]');
    if (workerMeta) {
        WORKER_URL = workerMeta.getAttribute('content');
    }
    window.addEventListener('beforeunload', clearAll);
}

function loadTemplate() {
    document.getElementById('htmlBody').value = getEmailTemplate(currentMode);
}

// ─── Mode toggle (API vs SMTP) ─────────────────────────────────────────────
function setMode(mode) {
    currentMode = mode;
    document.getElementById('btnModeApi').classList.toggle('active', mode === 'api');
    document.getElementById('btnModeSmtp').classList.toggle('active', mode === 'smtp');

    // SMTP reference section
    document.getElementById('smtpSection').classList.toggle('hidden', mode !== 'smtp');
    // Mode hints
    document.getElementById('modeHintApi').classList.toggle('hidden', mode !== 'api');
    document.getElementById('modeHintSmtp').classList.toggle('hidden', mode !== 'smtp');
    // Update button labels
    var sendBtn = document.getElementById('btnSend');
    var curlBtn = document.getElementById('btnCurl');
    if (mode === 'api') {
        sendBtn.textContent = 'Send via API \u2192';
        curlBtn.textContent = 'Copy as cURL';
    } else {
        sendBtn.textContent = 'Send via SMTP \u2192';
        curlBtn.textContent = 'Copy SMTP command';
    }

    if (mode === 'smtp') {
        updateSmtpConfig();
    }

    // Refresh template to reflect the mode
    loadTemplate();
}

// ─── Sender type toggle ────────────────────────────────────────────────────
function setSenderType(type) {
    currentSenderType = type;
    document.getElementById('btnVerifiedEmail').classList.toggle('active', type === 'email');
    document.getElementById('btnVerifiedDomain').classList.toggle('active', type === 'domain');
    document.getElementById('senderEmailGroup').classList.toggle('hidden', type !== 'email');
    document.getElementById('senderDomainGroup').classList.toggle('hidden', type !== 'domain');
}

function getSenderAddress() {
    if (currentSenderType === 'email') {
        return document.getElementById('senderEmail').value.trim();
    }
    var local = document.getElementById('domainLocalPart').value.trim();
    var domain = document.getElementById('domainName').value.trim();
    return local && domain ? (local + '@' + domain) : '';
}

// ─── SMTP Config Display ───────────────────────────────────────────────────
function updateSmtpConfig() {
    var token = document.getElementById('serverToken').value.trim() || '(enter token above)';
    var from = getSenderAddress() || '(enter sender above)';
    var to = document.getElementById('recipientEmail').value.trim() || '(enter recipient above)';

    document.getElementById('smtpHost').textContent = 'smtp.postmarkapp.com';
    document.getElementById('smtpPort').textContent = '587 (STARTTLS) or 443 (SSL)';
    document.getElementById('smtpUsername').textContent = token;
    document.getElementById('smtpPassword').textContent = token;
    document.getElementById('smtpFrom').textContent = from;
    document.getElementById('smtpTo').textContent = to;
}

// ─── Code examples toggle & tabs ───────────────────────────────────────────
function toggleCodeExamples() {
    var el = document.getElementById('codeExamples');
    var isHidden = el.classList.contains('hidden');
    el.classList.toggle('hidden');
    if (isHidden) {
        updateCodeExamples();
    }
}

function showTab(tab) {
    activeTab = tab;
    var tabs = document.querySelectorAll('.code-tab');
    for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
    // Find the clicked tab
    var tabBtns = document.querySelectorAll('.code-tab');
    for (var j = 0; j < tabBtns.length; j++) {
        if (tabBtns[j].getAttribute('data-tab') === tab) {
            tabBtns[j].classList.add('active');
        }
    }
    document.getElementById('codeNode').classList.toggle('hidden', tab !== 'node');
    document.getElementById('codePython').classList.toggle('hidden', tab !== 'python');
    document.getElementById('codePhp').classList.toggle('hidden', tab !== 'php');
}

function updateCodeExamples() {
    var token = document.getElementById('serverToken').value.trim() || 'YOUR_SERVER_TOKEN';
    var from = getSenderAddress() || 'sender@yourdomain.com';
    var to = document.getElementById('recipientEmail').value.trim() || 'recipient@example.com';

    document.getElementById('codeNode').textContent = [
        'const nodemailer = require("nodemailer");',
        '',
        'const transport = nodemailer.createTransport({',
        '  host: "smtp.postmarkapp.com",',
        '  port: 587,',
        '  secure: false,',
        '  auth: {',
        '    user: "' + token + '",',
        '    pass: "' + token + '"',
        '  }',
        '});',
        '',
        'await transport.sendMail({',
        '  from: "' + from + '",',
        '  to: "' + to + '",',
        '  subject: "Test Email",',
        '  html: "<p>Hello from Postmark SMTP!</p>"',
        '});'
    ].join('\n');

    document.getElementById('codePython').textContent = [
        'import smtplib',
        'from email.mime.text import MIMEText',
        '',
        'msg = MIMEText("<p>Hello from Postmark SMTP!</p>", "html")',
        'msg["Subject"] = "Test Email"',
        'msg["From"] = "' + from + '"',
        'msg["To"] = "' + to + '"',
        '',
        'with smtplib.SMTP("smtp.postmarkapp.com", 587) as server:',
        '    server.starttls()',
        '    server.login("' + token + '", "' + token + '")',
        '    server.send_message(msg)'
    ].join('\n');

    document.getElementById('codePhp').textContent = [
        '$mail = new PHPMailer(true);',
        '$mail->isSMTP();',
        '$mail->Host = "smtp.postmarkapp.com";',
        '$mail->SMTPAuth = true;',
        '$mail->Username = "' + token + '";',
        '$mail->Password = "' + token + '";',
        '$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;',
        '$mail->Port = 587;',
        '$mail->setFrom("' + from + '");',
        '$mail->addAddress("' + to + '");',
        '$mail->Subject = "Test Email";',
        '$mail->Body = "<p>Hello from Postmark SMTP!</p>";',
        '$mail->send();'
    ].join('\n');
}

function copyCurrentCode() {
    var el;
    if (activeTab === 'node') el = document.getElementById('codeNode');
    else if (activeTab === 'python') el = document.getElementById('codePython');
    else el = document.getElementById('codePhp');

    navigator.clipboard.writeText(el.textContent).then(function() {
        showResult('success', 'Code copied to clipboard!');
    }).catch(function() {
        showResult('info', 'Select and copy the code manually.');
    });
}

// ─── Build payload ─────────────────────────────────────────────────────────
function buildPayload() {
    return {
        From: getSenderAddress(),
        To: document.getElementById('recipientEmail').value.trim(),
        Subject: document.getElementById('subject').value.trim(),
        HtmlBody: document.getElementById('htmlBody').value.trim(),
        TextBody: 'Postmark Test - Sent ' + new Date().toISOString() + '. Your config is working.',
        MessageStream: 'outbound'
    };
}

// ─── Preview ───────────────────────────────────────────────────────────────
function togglePreview() {
    var frame = document.getElementById('previewFrame');
    if (frame.style.display === 'none' || !frame.style.display) {
        frame.style.display = 'block';
        var iframe = document.getElementById('previewIframe');
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(document.getElementById('htmlBody').value);
        doc.close();
    } else {
        frame.style.display = 'none';
    }
}

// ─── Result display ────────────────────────────────────────────────────────
function showResult(type, msg) {
    var el = document.getElementById('result');
    el.className = 'result ' + type;
    el.textContent = msg;
}

// ─── Copy command ──────────────────────────────────────────────────────────
function copyCurl() {
    var token = document.getElementById('serverToken').value.trim();
    var payload = buildPayload();

    if (!token) { showResult('error', 'Enter your Server API Token first.'); return; }
    if (!payload.From) { showResult('error', 'Enter a sender address first.'); return; }
    if (!payload.To) { showResult('error', 'Enter a recipient address first.'); return; }

    var cmd;
    if (currentMode === 'api') {
        cmd = 'curl "https://api.postmarkapp.com/email" \\\n'
            + '  -X POST \\\n'
            + '  -H "Accept: application/json" \\\n'
            + '  -H "Content-Type: application/json" \\\n'
            + '  -H "X-Postmark-Server-Token: ' + token + '" \\\n'
            + "  -d '" + JSON.stringify(payload, null, 2) + "'";
    } else {
        // SMTP curl command
        var subject = payload.Subject || 'Postmark SMTP Test';
        cmd = [
            'curl --url "smtp://smtp.postmarkapp.com:587" \\',
            '  --ssl-reqd \\',
            '  --user "' + token + ':' + token + '" \\',
            '  --mail-from "' + payload.From + '" \\',
            '  --mail-rcpt "' + payload.To + '" \\',
            "  -T - << 'EOF'",
            'From: ' + payload.From,
            'To: ' + payload.To,
            'Subject: ' + subject,
            'Content-Type: text/html; charset=utf-8',
            'X-PM-Message-Stream: outbound',
            '',
            payload.HtmlBody,
            'EOF'
        ].join('\n');
    }

    navigator.clipboard.writeText(cmd).then(function() {
        showResult('curl', 'Copied! Paste in your terminal:\n\n' + cmd);
    }).catch(function() {
        showResult('curl', 'Copy and run in terminal:\n\n' + cmd);
    });
}

// ─── Send email ────────────────────────────────────────────────────────────
async function sendEmail() {
    var token = document.getElementById('serverToken').value.trim();
    var payload = buildPayload();

    if (!token) { showResult('error', 'Server API Token is required.'); return; }
    if (!payload.From) { showResult('error', 'Sender address is required.'); return; }
    if (!payload.To) { showResult('error', 'Recipient address is required.'); return; }
    if (!payload.Subject) { showResult('error', 'Subject is required.'); return; }

    var btn = document.getElementById('btnSend');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"><\/span>Sending\u2026';
    document.getElementById('corsNote').style.display = 'none';
    showResult('info', 'Sending via ' + (currentMode === 'api' ? 'API' : 'SMTP') + '\u2026');

    // Determine endpoint
    var url;
    var body;
    var headers;

    if (WORKER_URL) {
        // Use Cloudflare Worker proxy
        url = WORKER_URL;
        body = JSON.stringify({
            mode: currentMode,
            token: token,
            payload: payload
        });
        headers = {
            'Content-Type': 'application/json'
        };
    } else {
        // Direct to Postmark (will fail with CORS on hosted sites)
        url = 'https://api.postmarkapp.com/email';
        body = JSON.stringify(payload);
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': token
        };
    }

    try {
        var res = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        var data = await res.json();

        if (res.ok && (data.ErrorCode === 0 || data.success)) {
            var msg = 'Sent successfully via ' + (currentMode === 'api' ? 'API' : 'SMTP') + '!';
            if (data.MessageID) msg += '\n\nMessageID: ' + data.MessageID;
            if (data.To) msg += '\nTo: ' + data.To;
            if (data.SubmittedAt) msg += '\nSubmitted: ' + data.SubmittedAt;
            if (data.message) msg += '\n\n' + data.message;
            showResult('success', msg);
        } else {
            var errMsg = 'Error';
            if (data.ErrorCode) errMsg += ' (' + data.ErrorCode + ')';
            errMsg += '\n\n' + (data.Message || data.error || 'Unknown error');
            errMsg += '\n\nHTTP ' + res.status;
            showResult('error', errMsg);
        }
    } catch (err) {
        document.getElementById('corsNote').style.display = 'block';
        showResult('error',
            'Request failed: ' + err.message
            + '\n\nUse the copy button to get a terminal command, or deploy the Cloudflare Worker for browser-based sending.'
        );
    } finally {
        btn.disabled = false;
        btn.textContent = currentMode === 'api' ? 'Send via API \u2192' : 'Send via SMTP \u2192';
    }
}

// ─── Clear ─────────────────────────────────────────────────────────────────
function clearAll() {
    document.getElementById('serverToken').value = '';
    document.getElementById('senderEmail').value = '';
    document.getElementById('domainLocalPart').value = '';
    document.getElementById('domainName').value = '';
    document.getElementById('recipientEmail').value = '';
    document.getElementById('subject').value = 'Postmark Test Email';
    document.getElementById('result').className = 'result';
    document.getElementById('corsNote').style.display = 'none';
    document.getElementById('previewFrame').style.display = 'none';
    document.getElementById('codeExamples').classList.add('hidden');
    setSenderType('email');
    setMode('api');
    loadTemplate();
}

// ─── Listen for input changes ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    init();
    var inputs = ['serverToken', 'senderEmail', 'domainLocalPart', 'domainName', 'recipientEmail'];
    inputs.forEach(function(id) {
        document.getElementById(id).addEventListener('input', function() {
            if (currentMode === 'smtp') {
                updateSmtpConfig();
                if (!document.getElementById('codeExamples').classList.contains('hidden')) {
                    updateCodeExamples();
                }
            }
        });
    });
});
