<?php
/* TIC látogatásszámláló – közös függvények.
   Adatvédelem: nincs süti, IP-címet nem tárolunk. Az egyedi látogatót egy napi,
   naponta cserélődő titkos sóval képzett hash azonosítja (IP + böngésző + só),
   a só másnap törlődik, így a hash-ek később senkihez nem köthetők vissza.
   Az adatok a webrooton KÍVÜL vannak: /home/<felhasználó>/tic-stats/ */

declare(strict_types=1);

const TIC_TZ = 'Europe/Bucharest';

function tic_data_dir(): string {
    return dirname(__DIR__, 2) . '/tic-stats';
}

function tic_today(): string {
    $d = new DateTime('now', new DateTimeZone(TIC_TZ));
    return $d->format('Y-m-d');
}

/* Napi só: egy fájl naponta; a régieket törli. */
function tic_daily_salt(string $dir, string $day): string {
    $f = $dir . '/salt-' . $day . '.txt';
    if (!is_file($f)) {
        foreach (glob($dir . '/salt-*.txt') ?: [] as $old) {
            if ($old !== $f) { @unlink($old); }
        }
        @file_put_contents($f, bin2hex(random_bytes(32)), LOCK_EX);
        @chmod($f, 0600);
    }
    $s = @file_get_contents($f);
    return is_string($s) ? trim($s) : '';
}

function tic_is_bot(string $ua): bool {
    if ($ua === '' || stripos($ua, 'mozilla') === false) { return true; }
    return (bool) preg_match('/bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|scan|python|curl|wget|httpclient|java\//i', $ua);
}

/* A hivatkozó oldalt kategóriába sorolja; teljes URL-t nem tárolunk. */
function tic_source(string $ref, string $self, string $page): string {
    if (strpos($page, 'fbclid=') !== false) { return 'Facebook'; }
    if ($ref === '') { return 'Közvetlen'; }
    $h = strtolower((string) parse_url($ref, PHP_URL_HOST));
    $h = preg_replace('/^www\./', '', $h);
    if ($h === '' ) { return 'Közvetlen'; }
    if ($h === $self) { return 'Saját oldal'; }
    $map = [
        'facebook' => 'Facebook', 'fb.me' => 'Facebook', 'instagram' => 'Instagram',
        'google' => 'Google', 'bing.' => 'Bing', 'duckduckgo' => 'DuckDuckGo',
        'linkedin' => 'LinkedIn', 't.co' => 'X (Twitter)', 'whatsapp' => 'WhatsApp',
        'mail.' => 'E-mail', 'outlook' => 'E-mail', 'chatgpt' => 'ChatGPT', 'claude.ai' => 'Claude',
    ];
    foreach ($map as $needle => $name) {
        if (strpos($h, $needle) !== false) { return $name; }
    }
    return substr($h, 0, 60);
}

function tic_month_file(string $dir, string $day): string {
    return $dir . '/' . substr($day, 0, 7) . '.json';
}

/* Fájlzárral olvas-módosít-ír. */
function tic_update(string $file, callable $fn): void {
    $fh = @fopen($file, 'c+');
    if (!$fh) { return; }
    if (flock($fh, LOCK_EX)) {
        $raw = stream_get_contents($fh);
        $data = $raw ? json_decode($raw, true) : null;
        if (!is_array($data)) { $data = ['days' => []]; }
        $data = $fn($data);
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
    @chmod($file, 0600);
}

function tic_load_month(string $dir, string $ym): array {
    $f = $dir . '/' . $ym . '.json';
    if (!is_file($f)) { return ['days' => []]; }
    $d = json_decode((string) file_get_contents($f), true);
    return is_array($d) ? $d : ['days' => []];
}
