<?php
// Webhook endpoint for GitHub auto-deploy
// Only responds to POST requests with valid GitHub signature

// Block direct browser access — return 404 as if this file doesn't exist
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(404);
    exit;
}

$secret = getenv('WEBHOOK_SECRET');
$deployPath = getenv('DEPLOY_PATH');

if (!$secret || !$deployPath) {
    http_response_code(404);
    exit;
}

// Verify GitHub signature
$hubSignature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expectedSignature, $hubSignature)) {
    http_response_code(404);
    exit;
}

// Only deploy on pushes to main branch
$data = json_decode($payload, true);
if (($data['ref'] ?? '') !== 'refs/heads/main') {
    http_response_code(200);
    exit;
}

// Run git pull
$output = shell_exec('cd ' . escapeshellarg($deployPath) . ' && git pull origin main 2>&1');

// Log output
$logPath = dirname($deployPath) . '/deploy-log.txt';
file_put_contents($logPath, date('Y-m-d H:i:s') . "\n" . $output . "\n\n", FILE_APPEND);

http_response_code(200);
echo "Deployed successfully";
