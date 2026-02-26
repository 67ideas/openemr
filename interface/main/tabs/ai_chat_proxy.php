<?php

/**
 * Proxy for the AI agent chat endpoint.
 * Forwards POST /chat requests to the local agent server so the browser
 * never needs a direct connection to localhost:3001.
 *
 * @package OpenEMR
 * @link    https://www.open-emr.org
 * @license https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */

require_once(__DIR__ . '/../../globals.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$agentBase = rtrim(getenv('AGENT_URL') ?: 'http://host.docker.internal:3001', '/chat');
$agentBase = rtrim($agentBase, '/');
$url = $agentBase . '/chat';

$body = file_get_contents('php://input');

$headers = ['Content-Type: application/json'];
$agentApiKey = getenv('AGENT_API_KEY');
if ($agentApiKey) {
    $headers[] = 'Authorization: Bearer ' . $agentApiKey;
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => 120,
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json');

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Agent unreachable: ' . $curlError, 'url' => $url]);
    exit;
}

http_response_code($httpCode);
echo $response;
