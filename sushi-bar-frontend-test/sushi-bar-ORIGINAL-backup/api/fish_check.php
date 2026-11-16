<?php
/*
 * fish_check.php  (DEVELOPMENT ONLY: delete before you submit)
 * Shows what the Fish Game API actually returns, so you can confirm the field
 * names that fish_client.php looks for. Only works from your own computer.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/fish_client.php';
header('Content-Type: text/plain; charset=utf-8');

if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('Only available on localhost.');
}

echo "curl enabled: " . (function_exists('curl_init') ? 'yes' : 'NO, enable it in WAMP (PHP > PHP extensions > curl)') . "\n\n";

foreach (['JSON' => FISH_API_JSON, 'CSV' => FISH_API_CSV] as $label => $url) {
    echo "=== $label: $url\n";
    try {
        $raw = http_get($url);
        if ($label === 'JSON') {
            $data = json_decode($raw, true);
            if (!is_array($data)) { echo "Not valid JSON. First 200 characters:\n" . substr($raw, 0, 200) . "\n\n"; continue; }
            foreach ($data as $key => $value) {
                $shown = is_string($value) && strlen($value) > 60 ? '(' . strlen($value) . ' characters, probably the image)' : json_encode($value);
                echo "  $key => $shown\n";
            }
        } else {
            $parts = explode(',', trim($raw));
            echo "  " . count($parts) . " parts; last part = " . end($parts) . "\n";
        }
    } catch (RuntimeException $e) {
        echo "  FAILED: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

echo "=== What the game will use\n";
try {
    $crate = fetch_fish_crate();
    echo "  fish = {$crate['fish']}\n  chests = " . var_export($crate['chests'], true) . "\n  image = " . substr($crate['image'], 0, 40) . "...\n";
} catch (RuntimeException $e) {
    echo "  FAILED: " . $e->getMessage() . "\n";
}
