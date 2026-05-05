// ─── State ──────────────────────────────────────────────────────────────────
var currentMode = 'api'; // 'api' or 'smtp'
var currentSenderType = 'email'; // 'email' or 'domain'
var activeTab = 'node';

// Worker URL — set this to your backend URL
var WORKER_URL = '';

// ─── Init ───────────────────────────────────────────────────────────────────
function init() {
    loadTemplate();
    setMode('api');
    setSenderType('email');
    // Auto-detect backend URL
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
        sendBtn.textContent = 'Send via API';
        curlBtn.textContent = 'Copy as cURL';
    } else {
        sendBtn.textContent = 'Send via SMTP';
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

// ─── Copy SMTP test command (alias for copyCurl in SMTP mode) ──────────────
function copySmtpTestCommand() {
    var prevMode = currentMode;
    currentMode = 'smtp';
    copyCurl();
    currentMode = prevMode;
}

// ─── Test SMTP Connection ──────────────────────────────────────────────────
async function testSmtpConnection() {
    var token = document.getElementById('serverToken').value.trim();
    var resultEl = document.getElementById('smtpTestResult');

    if (!token) {
        resultEl.className = 'result smtp-test-result error';
        resultEl.textContent = 'Enter your Server API Token first.';
        return;
    }

    var btn = document.getElementById('btnTestSmtp');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"><\/span>Testing...';
    resultEl.className = 'result smtp-test-result info';
    resultEl.textContent = 'Connecting to smtp.postmarkapp.com...';

    try {
        var url = WORKER_URL ? WORKER_URL.replace('send.php', 'test-smtp.php') : 'api/test-smtp.php';
        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });

        var text = await res.text();
        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('Server returned invalid response. Make sure api/test-smtp.php is deployed and PHP is working.\n\nResponse: ' + text.substring(0, 200));
        }

        if (data.success) {
            var msg = '✓ ' + data.message;
            if (data.details) {
                msg += '\n\nHost: ' + data.details.host;
                msg += '\nPort: ' + data.details.port;
                msg += '\nAuth: ' + data.details.auth;
                msg += '\nEncryption: ' + data.details.encryption;
            }
            msg += '\n\nMake sure your From address is a verified Sender Signature or belongs to a verified domain in your Postmark server — otherwise emails will not be delivered.';
            resultEl.className = 'result smtp-test-result success';
            resultEl.textContent = msg;
        } else {
            resultEl.className = 'result smtp-test-result error';
            resultEl.textContent = '✗ ' + (data.error || 'Connection failed') + '\n\nFailed at step: ' + (data.step || 'unknown');
        }
    } catch (err) {
        resultEl.className = 'result smtp-test-result error';
        resultEl.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Test SMTP Connection';
    }
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
    if (!payload.From) { showResult('error', 'Sender address is required.\n\nThe From address must be a verified Sender Signature or belong to a verified domain in your Postmark server.'); return; }
    if (!payload.To) { showResult('error', 'Recipient address is required.'); return; }
    if (!payload.Subject) { showResult('error', 'Subject is required.'); return; }

    var btn = document.getElementById('btnSend');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"><\/span>Sending...';
    document.getElementById('corsNote').style.display = 'none';
    showResult('info', 'Sending via ' + (currentMode === 'api' ? 'API' : 'SMTP') + '...');

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

        // Parse response safely
        var text = await res.text();
        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('Server returned invalid response (not JSON). Make sure the PHP backend is deployed and accessible.\n\nHTTP ' + res.status);
        }

        if (res.ok && (data.ErrorCode === 0 || data.success)) {
            var msg = 'Sent successfully via ' + (currentMode === 'api' ? 'API' : 'SMTP') + '!';
            if (data.MessageID) msg += '\n\nMessageID: ' + data.MessageID;
            if (data.To) msg += '\nTo: ' + data.To;
            if (data.SubmittedAt) msg += '\nSubmitted: ' + data.SubmittedAt;
            if (data.message) msg += '\n\n' + data.message;
            msg += '\n\n⚠️ Note: Postmark accepted this email, but it will only be delivered if the From address (' + payload.From + ') is a verified Sender Signature or belongs to a verified domain in your Postmark server. If not verified, the email may be silently dropped.';
            showResult('success', msg);
        } else {
            var errMsg = '';

            // Friendly error messages for common Postmark error codes
            if (data.ErrorCode === 400) {
                errMsg = 'Bad Request\n\n' + (data.Message || data.error || 'The request was invalid.');
            } else if (data.ErrorCode === 405 || data.ErrorCode === 406) {
                errMsg = 'Sender Not Allowed\n\n' + (data.Message || data.error || '');
                errMsg += '\n\n💡 Your From address (' + payload.From + ') is not authorized to send from this Postmark server. Make sure it is either:\n• A confirmed Sender Signature, or\n• An address on a verified domain (with DKIM + Return-Path DNS records set up)';
            } else if (data.ErrorCode === 300) {
                errMsg = 'Invalid Email Request\n\n' + (data.Message || data.error || '');
                errMsg += '\n\n💡 Check that From, To, and Subject are all valid.';
            } else if (data.ErrorCode === 401 || res.status === 401) {
                errMsg = 'Unauthorized\n\n' + (data.Message || data.error || '');
                errMsg += '\n\n💡 Your Server API Token is invalid or inactive. Double-check it in Postmark → Server → API Tokens.';
            } else if (data.ErrorCode === 422 || res.status === 422) {
                errMsg = 'Unprocessable\n\n' + (data.Message || data.error || '');
                errMsg += '\n\n💡 Postmark rejected the request. Common causes:\n• From address not verified\n• Invalid recipient address\n• Missing required fields';
            } else {
                errMsg = 'Error';
                if (data.ErrorCode) errMsg += ' (' + data.ErrorCode + ')';
                errMsg += '\n\n' + (data.Message || data.error || 'Unknown error');
            }

            errMsg += '\n\nHTTP ' + res.status;
            showResult('error', errMsg);
        }
    } catch (err) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            document.getElementById('corsNote').style.display = 'block';
            showResult('error', 'Network error: Could not reach the server.\n\nMake sure the app is hosted on a PHP server with api/send.php accessible.');
        } else {
            showResult('error', err.message);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = currentMode === 'api' ? 'Send via API' : 'Send via SMTP';
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
