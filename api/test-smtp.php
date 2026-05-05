<?php
/**
 * SMTP Connection Test — verifies credentials without sending an email.
 * Does EHLO + AUTH LOGIN, then QUITs immediately.
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

// Block direct browser access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(404);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing token']);
    exit;
}

$token = $input['token'];

// Connect to Postmark SMTP (port 587 with STARTTLS)
$host = 'smtp.postmarkapp.com';
$port = 587;
$timeout = 10;

$socket = @fsockopen($host, $port, $errno, $errstr, $timeout);

if (!$socket) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => "Connection failed: $errstr ($errno)",
        'step' => 'connect'
    ]);
    exit;
}

$smtpResponse = '';

$sendCmd = function($cmd = null) use ($socket, &$smtpResponse) {
    if ($cmd !== null) {
        fwrite($socket, $cmd . "\r\n");
    }
    $response = '';
    while ($line = fgets($socket, 515)) {
        $response .= $line;
        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }
    $smtpResponse = trim($response);
    return (int)substr($response, 0, 3);
};

try {
    // Read greeting
    $code = $sendCmd();
    if ($code !== 220) {
        throw new Exception("Server greeting failed: $smtpResponse", 1);
    }

    // EHLO
    $code = $sendCmd("EHLO postmark-email-tester");
    if ($code !== 250) {
        throw new Exception("EHLO failed: $smtpResponse", 2);
    }

    // STARTTLS
    $code = $sendCmd("STARTTLS");
    if ($code !== 220) {
        throw new Exception("STARTTLS failed: $smtpResponse", 3);
    }

    // Upgrade connection to TLS
    $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
    if (!$crypto) {
        throw new Exception("TLS handshake failed", 3);
    }

    // EHLO again after STARTTLS
    $code = $sendCmd("EHLO postmark-email-tester");
    if ($code !== 250) {
        throw new Exception("EHLO after STARTTLS failed: $smtpResponse", 2);
    }

    // AUTH LOGIN
    $code = $sendCmd("AUTH LOGIN");
    if ($code !== 334) {
        throw new Exception("AUTH not supported: $smtpResponse", 4);
    }

    // Username (token)
    $code = $sendCmd(base64_encode($token));
    if ($code !== 334) {
        throw new Exception("Invalid token (username rejected): $smtpResponse", 5);
    }

    // Password (token)
    $code = $sendCmd(base64_encode($token));
    if ($code !== 235) {
        throw new Exception("Authentication failed — check your Server API Token: $smtpResponse", 6);
    }

    // Success — QUIT gracefully
    $sendCmd("QUIT");
    fclose($socket);

    $response = [
        'success' => true,
        'message' => 'SMTP connection successful. Authentication verified.',
        'details' => [
            'host' => 'smtp.postmarkapp.com',
            'port' => 587,
            'auth' => 'LOGIN (verified)',
            'encryption' => 'STARTTLS'
        ]
    ];

    echo json_encode($response);

} catch (Exception $e) {
    @fwrite($socket, "QUIT\r\n");
    @fclose($socket);

    $step = ['connect', 'greeting', 'ehlo', 'starttls', 'auth_init', 'auth_user', 'auth_pass'][$e->getCode()] ?? 'unknown';

    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'step' => $step
    ]);
}
