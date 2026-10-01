<?php
// Kapcsolati űrlap feldolgozása – a weboldal üzeneteit az office@ címre küldi.
// A címzett rögzített, a látogató nem tudja megváltoztatni.

date_default_timezone_set('Europe/Bucharest');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const TO_ADDRESS   = 'office@transylvanianinstitute.ro';
const FROM_ADDRESS = 'office@transylvanianinstitute.ro';
const FROM_NAME    = 'TIC weboldal';
const RATE_LIMIT   = 5;     // ennyi üzenet engedélyezett...
const RATE_WINDOW  = 3600;  // ...ennyi másodperc alatt, IP-címenként

function reply(bool $ok, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['ok' => $ok]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(false, 405);
}

// Robotcsapda: ezt a mezőt ember nem látja, tehát nem tölti ki.
if (!empty($_POST['website'])) {
    reply(true); // a robot sikert lát, de levél nem megy ki
}

function field(string $key, int $max): string {
    $v = isset($_POST[$key]) && is_string($_POST[$key]) ? trim($_POST[$key]) : '';
    return mb_substr($v, 0, $max, 'UTF-8');
}
function oneLine(string $v): string {
    // fejléc-befecskendezés ellen: sortörések és vezérlőkarakterek ki
    return trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v));
}

$name    = oneLine(field('name', 120));
$email   = oneLine(field('email', 160));
$phone   = oneLine(field('phone', 40));
$message = field('message', 5000);
$lang    = in_array($_POST['lang'] ?? '', ['hu', 'ro', 'en'], true) ? $_POST['lang'] : 'hu';

$subjects = [
    'hu' => 'Megkeresés a weboldalról',
    'ro' => 'Solicitare de pe site',
    'en' => 'Enquiry from the website',
];

if ($message === '') {
    reply(false, 422);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $email = ''; // érvénytelen címet nem teszünk Reply-To-ba
}
if ($email === '' && $phone === '') {
    reply(false, 422);
}
if ($phone !== '' && !preg_match('/^[0-9+()\/.\s-]{6,40}$/', $phone)) {
    reply(false, 422);
}

// Egyszerű IP-alapú korlátozás az elárasztás ellen.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile = rtrim(sys_get_temp_dir(), '/') . '/tic_contact_' . hash('sha256', $ip);
$now = time();
$hits = [];
if (is_readable($rlFile)) {
    $hits = array_filter(
        array_map('intval', explode(',', (string) @file_get_contents($rlFile))),
        fn($t) => $t > $now - RATE_WINDOW
    );
}
if (count($hits) >= RATE_LIMIT) {
    reply(false, 429);
}
$hits[] = $now;
@file_put_contents($rlFile, implode(',', $hits), LOCK_EX);

$langNames = ['hu' => 'magyar', 'ro' => 'román', 'en' => 'angol'];
$subject = $subjects[$lang] . ($name !== '' ? ' – ' . $name : '');

$body  = "Új üzenet a transylvanianinstitute.ro kapcsolati űrlapjáról\n";
$body .= str_repeat('-', 56) . "\n";
$body .= 'Név:      ' . ($name  !== '' ? $name  : '(nem adta meg)') . "\n";
$body .= 'E-mail:   ' . ($email !== '' ? $email : '(nem adta meg)') . "\n";
$body .= 'Telefon:  ' . ($phone !== '' ? $phone : '(nem adta meg)') . "\n";
$body .= 'Nyelv:    ' . $langNames[$lang] . "\n";
$body .= 'Időpont:  ' . date('Y-m-d H:i') . "\n";
$body .= str_repeat('-', 56) . "\n\n";
$body .= $message . "\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$encodedFrom    = '=?UTF-8?B?' . base64_encode(FROM_NAME) . '?= <' . FROM_ADDRESS . '>';

$headers   = [];
$headers[] = 'From: ' . $encodedFrom;
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'Content-Transfer-Encoding: 8bit';
$headers[] = 'X-Mailer: TIC-contact-form';

$sent = @mail(TO_ADDRESS, $encodedSubject, $body, implode("\r\n", $headers), '-f' . FROM_ADDRESS);

reply($sent, $sent ? 200 : 500);
