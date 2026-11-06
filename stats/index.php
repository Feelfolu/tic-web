<?php
/* TIC látogatásszámláló – összesítő oldal. Csak a titkos kulccsal nyílik meg:
   /stats/?k=<kulcs>  (a kulcs a webrooton kívül, a tic-stats/key.txt fájlban van). */
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

$dir = tic_data_dir();
$key = is_file($dir . '/key.txt') ? trim((string) file_get_contents($dir . '/key.txt')) : '';
$given = (string) ($_GET['k'] ?? '');
if ($key === '' || strlen($given) < 20 || !hash_equals($key, $given)) {
    http_response_code(404);
    echo 'Not Found';
    exit;
}

$range = (int) ($_GET['d'] ?? 30);
if (!in_array($range, [7, 30, 90, 365], true)) { $range = 30; }

$tz = new DateTimeZone(TIC_TZ);
$end = new DateTime('today', $tz);
$start = (clone $end)->modify('-' . ($range - 1) . ' days');
$todayKey = $end->format('Y-m-d');

$months = [];
$days = [];
for ($d = clone $start; $d <= $end; $d->modify('+1 day')) {
    $k = $d->format('Y-m-d');
    $ym = substr($k, 0, 7);
    if (!isset($months[$ym])) { $months[$ym] = tic_load_month($dir, $ym); }
    $x = $months[$ym]['days'][$k] ?? null;
    $days[$k] = $x;
}

$totViews = 0; $totUniq = 0; $pages = []; $src = []; $dev = []; $lang = [];
$series = [];
foreach ($days as $k => $x) {
    $u = 0; $v = 0;
    if ($x) {
        $u = isset($x['v']) ? count($x['v']) : (int) ($x['uniq'] ?? 0);
        $v = (int) ($x['views'] ?? 0);
        foreach (($x['pages'] ?? []) as $name => $c) { $pages[$name] = ($pages[$name] ?? 0) + (int) $c; }
        foreach (($x['src'] ?? []) as $name => $c) { $src[$name] = ($src[$name] ?? 0) + (int) $c; }
        foreach (($x['dev'] ?? []) as $name => $c) { $dev[$name] = ($dev[$name] ?? 0) + (int) $c; }
        foreach (($x['lang'] ?? []) as $name => $c) { $lang[$name] = ($lang[$name] ?? 0) + (int) $c; }
    }
    $series[$k] = $u; $totUniq += $u; $totViews += $v;
}
arsort($pages); arsort($src); arsort($dev); arsort($lang);
$today = $series[$todayKey] ?? 0;

$e = function ($s): string { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); };
$fmtDay = function (string $k): string {
    static $m = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
    return $m[(int) substr($k, 5, 2) - 1] . ' ' . (int) substr($k, 8, 2) . '.';
};
$pageNames = [
    '/' => 'Főoldal', '/calendar.html' => 'Pályázati naptár', '/blog.html' => 'Blog (lista)',
];
$langNames = ['hu' => 'Magyar', 'ro' => 'Román', 'en' => 'Angol', '?' => 'Ismeretlen'];

function bars(array $rows, int $total, callable $label, int $limit = 12): string {
    if (!$rows) { return '<p class="muted">Még nincs adat.</p>'; }
    $max = max($rows);
    $h = '<table class="bars">';
    $i = 0;
    foreach ($rows as $name => $n) {
        if ($i++ >= $limit) { break; }
        $pct = $total > 0 ? round($n * 100 / $total) : 0;
        $w = $max > 0 ? max(2, (int) round($n * 100 / $max)) : 0;
        $h .= '<tr><th scope="row">' . $label($name) . '</th><td class="num">' . $n . '</td><td class="pct">' . $pct . '%</td>'
            . '<td class="bar"><span style="width:' . $w . '%"></span></td></tr>';
    }
    return $h . '</table>';
}

/* Napi látogatók oszlopdiagram (inline SVG) */
$n = count($series); $W = 720; $H = 180; $pad = 26;
$maxU = max(1, max($series));
$bw = ($W - $pad) / $n;
$svg = '<svg viewBox="0 0 ' . $W . ' ' . ($H + 26) . '" role="img" aria-label="Napi látogatók">';
$ticks = array_unique([0, (int) floor($maxU / 2), $maxU]);
foreach ($ticks as $val) {
    $y = round($H - ($val / $maxU) * ($H - 10), 1);
    $svg .= '<line x1="' . $pad . '" x2="' . $W . '" y1="' . $y . '" y2="' . $y . '" class="grid"/>'
          . '<text x="' . ($pad - 6) . '" y="' . ($y + 4) . '" class="ax" text-anchor="end">' . $val . '</text>';
}
$i = 0; $step = max(1, (int) ceil($n / 8));
foreach ($series as $k => $u) {
    $h = $u > 0 ? max(2, ($u / $maxU) * ($H - 10)) : 0;
    $x = $pad + $i * $bw + $bw * 0.15;
    $svg .= '<rect x="' . round($x, 1) . '" y="' . round($H - $h, 1) . '" width="' . round($bw * 0.7, 1) . '" height="' . round($h, 1) . '" rx="2"><title>' . $fmtDay($k) . ': ' . $u . ' látogató</title></rect>';
    if (($i % $step === 0 && $n - 1 - $i >= $step / 2) || $i === $n - 1) {
        $svg .= '<text x="' . round($x + $bw * 0.35, 1) . '" y="' . ($H + 18) . '" class="ax" text-anchor="middle">' . $fmtDay($k) . '</text>';
    }
    $i++;
}
$svg .= '</svg>';
$link = function (int $d) use ($given, $range, $e): string {
    $cur = $d === $range ? ' aria-current="page"' : '';
    $t = $d === 365 ? '1 év' : $d . ' nap';
    return '<a' . $cur . ' href="?k=' . $e(urlencode($given)) . '&amp;d=' . $d . '">' . $t . '</a>';
};
?><!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Látogatottság – transylvanianinstitute.ro</title>
<style>
:root{--paper:#F6F1E8;--card:#FFFDF8;--ink:#2A211C;--muted:#6E625A;--line:#E4D9C8;--brick:#923A39;--gold:#B8893C}
@media (prefers-color-scheme:dark){:root{--paper:#1E1916;--card:#28211D;--ink:#F1E9DE;--muted:#B6A899;--line:#3D332C;--brick:#D4776F;--gold:#D8AE62}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:28px 16px 60px}
h1{font-size:1.5rem;margin:0 0 4px}
h2{font-size:1.05rem;margin:0 0 12px}
.muted{color:var(--muted);font-size:.9rem}
.ranges{display:flex;gap:6px;flex-wrap:wrap;margin:18px 0 22px}
.ranges a{padding:6px 12px;border:1px solid var(--line);border-radius:999px;color:var(--ink);text-decoration:none;font-size:.9rem;background:var(--card)}
.ranges a[aria-current]{background:var(--brick);border-color:var(--brick);color:#fff}
.kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
.kpi,.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px}
.kpi b{display:block;font-size:1.9rem;line-height:1.1;font-variant-numeric:tabular-nums}
.kpi span{color:var(--muted);font-size:.86rem}
.card{margin-bottom:16px}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.grid2 .card{margin:0}
svg{width:100%;height:auto;display:block}
svg rect{fill:var(--brick)}
svg .grid{stroke:var(--line);stroke-width:1}
svg .ax{fill:var(--muted);font-size:11px}
table.bars{width:100%;border-collapse:collapse;font-size:.92rem}
.bars th{text-align:left;font-weight:500;padding:5px 8px 5px 0;max-width:0;width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bars td{padding:5px 0}
.bars .num{text-align:right;font-variant-numeric:tabular-nums;width:3.5em;padding-right:8px}
.bars .pct{text-align:right;color:var(--muted);width:3em;padding-right:10px;font-size:.84rem}
.bars .bar span{display:block;height:8px;border-radius:4px;background:var(--gold)}
footer{margin-top:26px}
@media (max-width:640px){.kpis{grid-template-columns:1fr 1fr}.kpis .kpi:last-child{grid-column:1 / -1}.grid2{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <h1>Látogatottság</h1>
  <p class="muted">transylvanianinstitute.ro · robotok nélkül, sütik nélkül · romániai idő szerint</p>
  <nav class="ranges" aria-label="Időszak"><?= $link(7) . $link(30) . $link(90) . $link(365) ?></nav>

  <div class="kpis">
    <div class="kpi"><b><?= $today ?></b><span>látogató ma</span></div>
    <div class="kpi"><b><?= $totUniq ?></b><span>látogató, <?= $range === 365 ? 'egy év' : $range . ' nap' ?> alatt</span></div>
    <div class="kpi"><b><?= $totViews ?></b><span>oldalmegtekintés</span></div>
  </div>

  <section class="card">
    <h2>Napi látogatók</h2>
    <?= $svg ?>
  </section>

  <section class="card">
    <h2>Leglátogatottabb oldalak</h2>
    <?= bars($pages, $totViews, function ($p) use ($pageNames, $e) {
        if (isset($pageNames[$p])) { return $e($pageNames[$p]); }
        if (strpos($p, '/blog/') === 0) { return 'Cikk: ' . $e(substr($p, 6, -5)); }
        return $e($p);
    }, 15) ?>
  </section>

  <div class="grid2">
    <section class="card">
      <h2>Honnan jöttek</h2>
      <?= bars($src, max(1, array_sum($src)), $e) ?>
    </section>
    <section class="card">
      <h2>Eszköz és nyelv</h2>
      <?= bars($dev, max(1, array_sum($dev)), $e) ?>
      <div style="height:14px"></div>
      <?= bars($lang, max(1, array_sum($lang)), function ($l) use ($langNames, $e) { return $e($langNames[$l] ?? $l); }) ?>
    </section>
  </div>

  <footer class="muted">
    <p>Egy látogató = egy eszköz egy napon. A „Honnan jöttek”, az eszköz és a nyelv látogatónként egyszer számít, az oldalak megtekintésenként. Ebből a böngészőből a saját látogatásaid nem számítanak bele.</p>
  </footer>
</div>
<script>try { localStorage.setItem('tic-nostat', '1'); } catch (e) {}</script>
</body>
</html>
