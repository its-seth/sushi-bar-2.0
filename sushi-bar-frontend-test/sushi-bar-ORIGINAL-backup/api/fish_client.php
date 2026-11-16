<?php
/*
 * fish_client.php
 * Talks to the Fish Game API (a PHP web service on another server) over HTTPS
 * and turns its answer into a simple array:
 *   ['image' => <data URL or URL>, 'fish' => int, 'chests' => int|null]
 *
 * It asks for JSON first: { question: <image address>, fish: <int>, chest: <int> }. If that fails it
 * falls back to the CSV format used in the lecturer's Java example
 * ("<base64 image>,<solution>"), which has no chest count.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 * Fish Game API by Marc Conrad: https://marcconrad.com/uob/fish/doc.php
 */

require_once __DIR__ . '/config.php';

/** Downloads a URL with curl. Throws an exception if the request fails. */
function http_get(string $url): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,      // don't keep the player waiting forever
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    // WAMP's PHP has no list of trusted certificate authorities, so HTTPS fails
    // with "unable to get local issuer certificate". If api/cacert.pem exists
    // (from https://curl.se/docs/caextract.html), use it. Certificate checks stay ON.
    $caFile = __DIR__ . '/cacert.pem';
    if (is_file($caFile)) {
        curl_setopt($ch, CURLOPT_CAINFO, $caFile);
    }
    $body = curl_exec($ch);
    $error = curl_error($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $status >= 400) {
        throw new RuntimeException("Fish API request failed (HTTP $status): $error");
    }
    return $body;
}

/** Finds the first value whose key contains one of the given words (case-insensitive). */
function find_field(array $data, array $words)
{
    foreach ($words as $word) {
        foreach ($data as $key => $value) {
            if (stripos((string) $key, $word) !== false) {
                return $value;
            }
        }
    }
    return null;
}

/**
 * Turns whatever the API gives for the picture into a data URL an <img> can show.
 *
 * The API's image addresses contain the answer in the file name
 * (e.g. ..._005x005.png = 5 fish, 5 chests). So if we get an address, the server
 * downloads the picture itself and only the picture data goes to the browser.
 */
function to_image_src(string $value): string
{
    $value = trim($value);
    if (str_starts_with($value, 'data:')) {
        return $value;
    }
    if (str_starts_with($value, 'http')) {
        $bytes = http_get($value);
        $type = class_exists('finfo') ? ((new finfo(FILEINFO_MIME_TYPE))->buffer($bytes) ?: 'image/png') : 'image/png';
        if (!str_starts_with($type, 'image/')) {
            throw new RuntimeException("Fish API image wasn't a picture ($type).");
        }
        return 'data:' . $type . ';base64,' . base64_encode($bytes);
    }
    return 'data:image/png;base64,' . $value; // plain base64 picture data
}

/** Returns ['image' => ..., 'fish' => int, 'chests' => int|null]. */
function fetch_fish_crate(): array
{
    // 1) JSON: has named fields, including the chest count.
    try {
        $data = json_decode(http_get(FISH_API_JSON), true);
        if (is_array($data)) {
            // Some APIs wrap the result one level down.
            if (count($data) === 1 && is_array(reset($data))) {
                $data = reset($data);
            }
            $image  = find_field($data, ['image', 'img', 'picture', 'question']);
            $fish   = find_field($data, ['fish', 'solution', 'answer', 'count']);
            $chests = find_field($data, ['chest', 'treasure']);
            if (is_string($image) && is_numeric($fish)) {
                return [
                    'image'  => to_image_src($image),
                    'fish'   => (int) $fish,
                    'chests' => is_numeric($chests) ? (int) $chests : null,
                ];
            }
        }
    } catch (RuntimeException $e) {
        error_log($e->getMessage()); // try CSV instead
    }

    // 2) CSV: "<base64 image>,<solution>" (no chest count).
    $parts = explode(',', trim(http_get(FISH_API_CSV)));
    if (count($parts) >= 2 && is_numeric(end($parts))) {
        $fish = (int) array_pop($parts);
        return ['image' => to_image_src(implode(',', $parts)), 'fish' => $fish, 'chests' => null];
    }
    throw new RuntimeException('The Fish API answered in a format this game doesn’t recognise.');
}
