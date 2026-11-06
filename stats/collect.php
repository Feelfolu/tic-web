<?php
/* TIC látogatásszámláló – gyűjtőpont. A site.js küldi ide oldalbetöltéskor (sendBeacon). */
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); exit; }

$ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 400);
if (tic_is_bot($ua)) { http_response_code(204); exit; }

$raw = (string) file_get_contents('php://input', false, null, 0, 2048);
$in = json_decode($raw, true);
if (!is_array($in)) { http_response_code(400); exit; }

$self = strtolower(preg_replace('/^www\./', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
$pageFull = substr((string) ($in['p'] ?? '/'), 0, 300);
$path = (string) parse_url($pageFull, PHP_URL_PATH);
if ($path === '' || $path[0] !== '/' || !preg_match('#^/[a-z0-9/._-]*$#i', $path)) { http_response_code(400); exit; }
if ($path === '/index.html') { $path = '/'; }
if (strpos($path, '/stats/') === 0) { http_response_code(204); exit; }

$lang = in_array($in['l'] ?? '', ['hu', 'ro', 'en'], true) ? $in['l'] : '?';
$w = (int) ($in['w'] ?? 0);
$device = ($w > 0 && $w < 768) || preg_match('/Mobile|Android|iPhone/i', $ua) ? 'Mobil' : 'Asztali';
$source = tic_source(substr((string) ($in['r'] ?? ''), 0, 500), $self, $pageFull);

$dir = tic_data_dir();
if (!is_dir($dir)) { http_response_code(503); exit; }
$day = tic_today();
$salt = tic_daily_salt($dir, $day);
if ($salt === '') { http_response_code(503); exit; }
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$vid = substr(hash('sha256', $salt . '|' . $ip . '|' . $ua), 0, 16);

tic_update(tic_month_file($dir, $day), function (array $d) use ($day, $vid, $path, $source, $device, $lang): array {
    $x = $d['days'][$day] ?? ['views' => 0, 'v' => [], 'pages' => [], 'src' => [], 'dev' => [], 'lang' => []];
    if (count($x['v']) > 20000) { return $d; }           // védelem elárasztás ellen
    $isNew = !isset($x['v'][$vid]);
    $x['views']++;
    $x['v'][$vid] = 1;
    $x['pages'][$path] = ($x['pages'][$path] ?? 0) + 1;
    if ($isNew) {                                         // forrás, eszköz, nyelv: látogatónként egyszer
        $x['src'][$source] = ($x['src'][$source] ?? 0) + 1;
        $x['dev'][$device] = ($x['dev'][$device] ?? 0) + 1;
        $x['lang'][$lang] = ($x['lang'][$lang] ?? 0) + 1;
    }
    $d['days'][$day] = $x;
    foreach ($d['days'] as $k => $dd) {                   // lezárt napok: a hash-ek helyett csak a darabszám marad
        if ($k !== $day && isset($dd['v'])) {
            $d['days'][$k]['uniq'] = count($dd['v']);
            unset($d['days'][$k]['v']);
        }
    }
    return $d;
});

http_response_code(204);
