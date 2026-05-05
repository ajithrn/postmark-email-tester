<?php
/**
 * Postmark Email Tester — Server-side send handler
 * Supports both REST API and real SMTP sending.
 *
 * No dependencies required — uses PHP built-in functions.
 */

// Suppress PHP warnings/notices from breaking JSON output
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST only']);
    exit;
}

// Parse request
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['token']) || empty($input['payload'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token or payload']);
    exit;
}

$mode = $input['mode'] ?? 'api';
$token = $input['token'];
$payload = $input['payload'];

if ($mode === 'smtp') {
    sendViaSMTP($token, $payload);
} else {
    sendViaAPI($token, $payload);
}

/**
 * Send via Postmark REST API
 */
function sendViaAPI($token, $payload) {
    $ch = curl_init('https://api.postmarkapp.com/email');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'X-Postmark-Server-Token: ' . $token,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    unset($ch);

    if ($error) {
        http_response_code(500);
        echo json_encode(['error' => 'cURL error: ' . $error]);
        return;
    }

    $data = json_decode($response, true);

    if ($httpCode === 200 && isset($data['ErrorCode']) && $data['ErrorCode'] === 0) {
        $data['success'] = true;
        $data['message'] = 'Sent successfully via REST API.';
    }

    http_response_code($httpCode);
    echo json_encode($data);
}

/**
 * Send via real SMTP connection to smtp.postmarkapp.com
 */
function sendViaSMTP($token, $payload) {
    $from = $payload['From'] ?? '';
    $to = $payload['To'] ?? '';
    $subject = $payload['Subject'] ?? 'Test Email';
    $htmlBody = $payload['HtmlBody'] ?? '';
    $textBody = $payload['TextBody'] ?? '';

    if (!$from || !$to) {
        http_response_code(400);
        echo json_encode(['error' => 'From and To are required']);
        return;
    }

    // Connect to Postmark SMTP (port 587 with STARTTLS)
    $host = 'smtp.postmarkapp.com';
    $port = 587;
    $timeout = 30;

    $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);

    if (!$socket) {
        http_response_code(500);
        echo json_encode(['error' => "SMTP connection failed: $errstr ($errno)"]);
        return;
    }

    // Helper to send command and get response
    $smtpResponse = '';
    $sendCmd = function($cmd = null) use ($socket, &$smtpResponse) {
        if ($cmd !== null) {
            fwrite($socket, $cmd . "\r\n");
        }
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // Check if this is the last line (4th char is space, not dash)
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        $smtpResponse = $response;
        return (int)substr($response, 0, 3);
    };

    try {
        // Read greeting
        $code = $sendCmd();
        if ($code !== 220) {
            throw new Exception("SMTP greeting failed: $smtpResponse");
        }

        // EHLO
        $code = $sendCmd("EHLO postmark-email-tester");
        if ($code !== 250) {
            throw new Exception("EHLO failed: $smtpResponse");
        }

        // STARTTLS
        $code = $sendCmd("STARTTLS");
        if ($code !== 220) {
            throw new Exception("STARTTLS failed: $smtpResponse");
        }

        // Upgrade connection to TLS
        $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
        if (!$crypto) {
            throw new Exception("TLS handshake failed");
        }

        // EHLO again after STARTTLS
        $code = $sendCmd("EHLO postmark-email-tester");
        if ($code !== 250) {
            throw new Exception("EHLO after STARTTLS failed: $smtpResponse");
        }

        // AUTH LOGIN
        $code = $sendCmd("AUTH LOGIN");
        if ($code !== 334) {
            throw new Exception("AUTH LOGIN failed: $smtpResponse");
        }

        // Username (token)
        $code = $sendCmd(base64_encode($token));
        if ($code !== 334) {
            throw new Exception("AUTH username failed: $smtpResponse");
        }

        // Password (token)
        $code = $sendCmd(base64_encode($token));
        if ($code !== 235) {
            throw new Exception("AUTH password failed (invalid token?): $smtpResponse");
        }

        // MAIL FROM
        $code = $sendCmd("MAIL FROM:<$from>");
        if ($code !== 250) {
            throw new Exception("MAIL FROM failed: $smtpResponse");
        }

        // RCPT TO
        $code = $sendCmd("RCPT TO:<$to>");
        if ($code !== 250) {
            throw new Exception("RCPT TO failed: $smtpResponse");
        }

        // DATA
        $code = $sendCmd("DATA");
        if ($code !== 354) {
            throw new Exception("DATA failed: $smtpResponse");
        }

        // Build email message
        $boundary = md5(uniqid(time()));
        $message = "From: $from\r\n";
        $message .= "To: $to\r\n";
        $message .= "Subject: $subject\r\n";
        $message .= "X-PM-Message-Stream: outbound\r\n";
        $message .= "MIME-Version: 1.0\r\n";
        $message .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
        $message .= "\r\n";

        // Text part
        if ($textBody) {
            $message .= "--$boundary\r\n";
            $message .= "Content-Type: text/plain; charset=utf-8\r\n\r\n";
            $message .= $textBody . "\r\n";
        }

        // HTML part
        if ($htmlBody) {
            $message .= "--$boundary\r\n";
            $message .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
            $message .= $htmlBody . "\r\n";
        }

        $message .= "--$boundary--\r\n";

        // Send message (escape dots at start of lines)
        $lines = explode("\n", str_replace("\r\n", "\n", $message));
        foreach ($lines as $line) {
            if (isset($line[0]) && $line[0] === '.') {
                $line = '.' . $line;
            }
            fwrite($socket, $line . "\r\n");
        }

        // End DATA with .
        $code = $sendCmd(".");
        if ($code !== 250) {
            throw new Exception("Message rejected: $smtpResponse");
        }

        // Extract message ID from response if available
        $messageId = '';
        if (preg_match('/([a-f0-9-]{36})/i', $smtpResponse, $matches)) {
            $messageId = $matches[1];
        }

        // QUIT
        $sendCmd("QUIT");
        fclose($socket);

        echo json_encode([
            'success' => true,
            'message' => 'Sent successfully via SMTP.',
            'MessageID' => $messageId,
            'To' => $to,
            'SubmittedAt' => gmdate('Y-m-d\TH:i:s\Z'),
            'ErrorCode' => 0,
        ]);

    } catch (Exception $e) {
        @fwrite($socket, "QUIT\r\n");
        @fclose($socket);

        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
