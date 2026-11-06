<?php
// Entrega de fotos moderadas / subidas
$file = basename($_GET['file'] ?? '');
if (empty($file) || !preg_match('/^[a-f0-9]{32}\.jpg$/i', $file)) {
    http_response_code(404);
    exit('No encontrado.');
}

$path = __DIR__ . '/data/photos/' . $file;
if (!is_file($path)) {
    http_response_code(404);
    exit('Foto no encontrada.');
}

header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=2592000');
header('Content-Length: ' . filesize($path));
header('X-Content-Type-Options: nosniff');
readfile($path);
exit;
