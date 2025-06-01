<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = filter_var($_POST["email"], FILTER_SANITIZE_EMAIL);
    $vorname = htmlspecialchars($_POST["vorname"]);
    $nachname = htmlspecialchars($_POST["nachname"]);
    $discord = htmlspecialchars($_POST["discord"]);

    $nachricht = "Neue Bewerbung als Gruppenhilfe\n\n";
    foreach ($_POST as $key => $value) {
        $nachricht .= ucfirst($key) . ": " . htmlspecialchars($value) . "\n";
    }

    $empfaenger = "bewerbung@ubodigat.com";
    $betreff = "Bewerbung Gruppenhilfe – {$vorname} {$nachname} | {$discord}";
    $header = "From: {$email}\r\n";
    $header .= "Reply-To: {$email}\r\n";
    $header .= "Content-Type: text/plain; charset=utf-8";

    if (mail($empfaenger, $betreff, $nachricht, $header)) {
        echo "OK";
    } else {
        echo "MAIL_ERROR";
    }
} else {
    echo "FEHLER";
}