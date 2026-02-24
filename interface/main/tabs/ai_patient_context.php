<?php

/**
 * Returns medications and active problems for a patient given their PID.
 * Used by the AI assistant panel to provide patient context without OAuth.
 *
 * @package OpenEMR
 * @link    https://www.open-emr.org
 * @license https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */

require_once(__DIR__ . '/../../globals.php');

use OpenEMR\Common\Csrf\CsrfUtils;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

if (!CsrfUtils::verifyCsrfToken($_GET['csrf_token'] ?? '')) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid CSRF token']);
    exit();
}

$pid = intval($_GET['pid'] ?? 0);
if (!$pid) {
    http_response_code(400);
    echo json_encode(['error' => 'pid is required']);
    exit();
}

$medications = [];
$med_result = sqlStatement(
    "SELECT title FROM lists WHERE pid = ? AND type = 'medication' AND activity = 1 ORDER BY title",
    [$pid]
);
while ($row = sqlFetchArray($med_result)) {
    $medications[] = $row['title'];
}

$problems = [];
$prob_result = sqlStatement(
    "SELECT title, diagnosis FROM lists WHERE pid = ? AND type = 'medical_problem' AND activity = 1 ORDER BY title",
    [$pid]
);
while ($row = sqlFetchArray($prob_result)) {
    $entry = $row['title'];
    if (!empty($row['diagnosis'])) {
        $entry .= ' (' . $row['diagnosis'] . ')';
    }
    $problems[] = $entry;
}

echo json_encode(['medications' => $medications, 'problems' => $problems]);
