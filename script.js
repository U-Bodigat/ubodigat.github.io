// U:Bodigat.com — gemeinsames Frontend-Script (Navbar-Dropdown, Theme, Wetter, Footer-Jahr)

// Google Consent Mode v2 — muss VOR jedem Google-Tag gesetzt werden, sonst
// erkennt Google (auch der Tag Assistant) keinen Einwilligungsstatus. Laeuft
// hier als reiner dataLayer-Stub, ganz ohne dass gtag.js/GTM selbst schon
// geladen wird - die eigentlichen Google-Skripte bleiben bis zur Einwilligung
// weiterhin komplett deaktiviert (siehe activateConsentScripts weiter unten).
// Alles startet auf "denied"; erst ein echter Klick auf "Alle akzeptieren"
// setzt analytics_storage per consent-update auf "granted".
window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}
gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
});

function syncNavbarHeight() {
    const navEl = document.querySelector('.navbar');
    const navInner = document.querySelector('.navbar .navbar-inner');
    if (!navEl || !navInner) return;

    const border = parseFloat(getComputedStyle(navEl).borderBottomWidth) || 0;
    const h = navInner.getBoundingClientRect().height + border;
    if (!h) return;

    document.body.style.paddingTop = h + 'px';
}

window.addEventListener('DOMContentLoaded', syncNavbarHeight);
window.addEventListener('load', syncNavbarHeight);
window.addEventListener('resize', syncNavbarHeight);
setTimeout(syncNavbarHeight, 300);

// Logo-Bilder je nach Theme (weiß auf Dunkel, schwarz auf Hell)
const LOGO_DARK = '/bilder/logo/ubodigatlogo-breit-weiss.svg';
const LOGO_LIGHT = '/bilder/logo/ubodigatlogo-breit-schwarz.svg';

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    // Nur das Navbar-Logo wechselt mit dem Theme. Das große Logo im Hero
    // liegt immer auf einem dunklen Foto und bleibt deshalb immer hell.
    document.querySelectorAll('.brand-logo').forEach(img => {
        img.src = theme === 'light' ? LOGO_LIGHT : LOGO_DARK;
    });
}

const savedTheme = localStorage.getItem('ubodigat-theme') || 'dark';
applyTheme(savedTheme);

function ubReserveButtonWidth(btn) {
    btn.style.minWidth = '';

    const restClone = btn.cloneNode(true);
    restClone.removeAttribute('id');
    restClone.setAttribute('data-btn-measure', '');
    restClone.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:-9999px;width:auto;max-width:none;';
    document.body.appendChild(restClone);
    const restWidth = restClone.getBoundingClientRect().width;
    restClone.remove();

    const hoverClone = btn.cloneNode(true);
    hoverClone.removeAttribute('id');
    hoverClone.setAttribute('data-btn-measure', '');
    hoverClone.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:-9999px;width:auto;max-width:none;font-weight:800;';
    document.body.appendChild(hoverClone);
    const hoverWidth = hoverClone.getBoundingClientRect().width;
    hoverClone.remove();

    btn.style.minWidth = Math.ceil(Math.max(restWidth, hoverWidth)) + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(savedTheme);
    const fontWarmup = document.createElement('span');
    fontWarmup.textContent = 'AgÄÖÜäöüß';
    fontWarmup.setAttribute('aria-hidden', 'true');
    fontWarmup.style.cssText = 'position:absolute;left:-9999px;top:-9999px;font-family:Arimo,sans-serif;font-weight:800;font-size:1px;';
    document.body.appendChild(fontWarmup);

    const BTN_SELECTOR = '.btn, .btn-primary, .btn-secondary, .btn-ghost';
    document.querySelectorAll(BTN_SELECTOR).forEach(ubReserveButtonWidth);
    new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType !== 1 || node.hasAttribute('data-btn-measure')) return;
                if (node.matches(BTN_SELECTOR)) ubReserveButtonWidth(node);
                node.querySelectorAll && node.querySelectorAll(BTN_SELECTOR).forEach(ubReserveButtonWidth);
            });
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    });

    // Aktuelles Jahr im Footer
    document.querySelectorAll('[data-year]').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // Theme-Umschalter
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const next = isLight ? 'dark' : 'light';
            applyTheme(next);
            localStorage.setItem('ubodigat-theme', next);
        });
    }

    // Mobiles Dropdown-Menü
    const toggle = document.getElementById('navToggle');
    const dropdown = document.getElementById('navDropdown');

    if (toggle && dropdown) {
        toggle.addEventListener('click', () => {
            const isOpen = dropdown.classList.toggle('open');
            toggle.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        dropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                dropdown.classList.remove('open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 860) {
                dropdown.classList.remove('open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Wetter München in der Navbar
    const weatherEls = document.querySelectorAll('.nav-weather-value');
    if (weatherEls.length) {
        const apiKey = '516ad7cf647d0ef14dc8563616e85ec4';
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Munich&units=metric&lang=de&appid=${apiKey}`;
        fetch(weatherUrl)
            .then(res => res.json())
            .then(data => {
                const t = Math.round(data.main.temp);
                weatherEls.forEach(el => {
                    el.textContent = `${t}°C München`;
                });
            })
            .catch(() => {
                weatherEls.forEach(el => {
                    el.textContent = 'n. v.';
                });
            });
    }

    const cookieConsent = localStorage.getItem('ubodigat-cookie-consent');
    if (cookieConsent === 'accepted') {
        gtag('consent', 'update', {
            analytics_storage: 'granted'
        });
        activateConsentScripts('analytics');
    } else if (!cookieConsent) {
        showCookieConsentBanner(false);
    }

    // Zeigt auf der Datenschutzseite an, was aktuell gewählt ist, und
    // verlinkt den "Auswahl ändern"-Button dort mit showCookieConsentBanner().
    const statusEl = document.getElementById('cookieSettingsStatus');
    if (statusEl) {
        const labels = {
            accepted: 'Aktuell gewählt: Alle akzeptieren (inkl. Google Analytics &amp; Tag Manager).',
            rejected: 'Aktuell gewählt: Nur technisch notwendige Cookies.'
        };
        statusEl.innerHTML = labels[cookieConsent] || 'Es wurde noch keine Auswahl getroffen — der Cookie-Hinweis erscheint beim nächsten Laden automatisch.';
    }
});

// Eigenes Popup anstelle des nativen alert() — läuft komplett eigenständig
// (eigenes <style>), damit es auf JEDER Seite funktioniert, auch auf fremden
// Unterseiten ohne style.css.
function ensureUbodigatAlertStyles() {
    if (document.getElementById('ubodigatAlertStyles')) return;
    const style = document.createElement('style');
    style.id = 'ubodigatAlertStyles';
    style.textContent = `
        .ubodigat-alert-overlay {
            position: fixed;
            inset: 0;
            z-index: 999998;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .ubodigat-alert-box {
            max-width: 440px;
            width: 100%;
            background: #0d0d0d;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            padding: 26px;
            color: #fff;
            text-align: left;
            font-family: 'Arimo', Arial, sans-serif;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
        }
        .ubodigat-alert-box p {
            margin: 0 0 20px;
            font-size: 14px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.85);
            white-space: pre-line;
        }
        .ubodigat-alert-box .ubodigat-alert-ok {
            display: block;
            margin-left: auto;
            border: unset;
            padding: 10px 22px;
            border-radius: 7px;
            font-weight: 600;
            font-size: 14px;
            font-family: inherit;
            cursor: pointer;
            transition: background-color 0.5s, color 0.5s;
            background-color: #012f6b;
            color: #fff;
            box-shadow: 0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%);
        }
        .ubodigat-alert-box .ubodigat-alert-ok:hover {
            transition: background-color 0.5s, color 0.5s;
            background-color: #006eff;
            color: #003a1e;
        }
    `;
    document.head.appendChild(style);
}

function ubodigatAlert(message) {
    ensureUbodigatAlertStyles();

    const overlay = document.createElement('div');
    overlay.className = 'ubodigat-alert-overlay';
    overlay.innerHTML = `
        <div class="ubodigat-alert-box" role="alertdialog" aria-modal="true">
            <p></p>
            <button type="button" class="ubodigat-alert-ok">OK</button>
        </div>
    `;
    overlay.querySelector('p').textContent = message;
    document.body.appendChild(overlay);

    const okButton = overlay.querySelector('.ubodigat-alert-ok');

    function close() {
        overlay.remove();
        document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
        if (e.key === 'Escape' || e.key === 'Enter') close();
    }

    okButton.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', onKeydown);
    okButton.focus();
}

// Cookie-Hinweis — muss aktiv bestätigt/abgelehnt werden, kein Wegklicken
// möglich (kein Klick-außerhalb, kein Escape). Läuft komplett eigenständig
// (eigenes <style>), damit er auf JEDER Seite funktioniert, auch auf
// fremden Unterseiten ohne style.css.
//
// TTDSG §25 / DSGVO: nicht notwendige Dienste (Google Analytics/Tag
// Manager) duerfen erst NACH Einwilligung laden. Diese Scripts liegen im
// HTML deshalb als type="text/plain" data-consent="analytics" vor
// (fuehren sich dadurch nicht selbst aus) und werden erst hier aktiviert —
// entweder sofort, wenn schon einmal zugestimmt wurde, oder per Klick auf
// "Alle akzeptieren".
function activateConsentScripts(category) {
    document.querySelectorAll(`script[type="text/plain"][data-consent="${category}"]`).forEach(oldScript => {
        const newScript = document.createElement('script');
        for (const attr of oldScript.attributes) {
            if (attr.name === 'type') continue;
            newScript.setAttribute(attr.name, attr.value);
        }
        if (oldScript.dataset.src) {
            newScript.src = oldScript.dataset.src;
        } else {
            newScript.textContent = oldScript.textContent;
        }
        oldScript.replaceWith(newScript);
    });
}

// Zeigt den Cookie-Banner an — beim ersten Besuch automatisch, oder erneut
// per "Auswahl ändern"-Button auf der Datenschutzseite. Bei erneutem Öffnen
// (isSettingsChange=true) laedt die Seite nach der neuen Wahl einmal neu,
// damit ein bereits geladenes GTM/gtag sauber gestoppt bzw. neu aktiviert
// wird — sonst liesse sich eine einmal erteilte Einwilligung technisch nicht
// zuverlaessig rueckgaengig machen.
function showCookieConsentBanner(isSettingsChange) {
    const existing = document.querySelector('.cookie-consent-overlay');
    if (existing) existing.remove();

    if (!document.getElementById('cookieConsentStyles')) {
        const style = document.createElement('style');
        style.id = 'cookieConsentStyles';
        style.textContent = `
            .cookie-consent-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .cookie-consent-box {
                max-width: 480px;
                width: 100%;
                background: #0d0d0d;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 30px;
                color: #fff;
                text-align: center;
                font-family: 'Arimo', Arial, sans-serif;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
            }
            .cookie-consent-box h2 {
                margin: 0 0 12px;
                font-size: 20px;
                font-family: 'Inconsolata', 'Arimo', monospace;
            }
            .cookie-consent-box p {
                margin: 0 0 10px;
                font-size: 14px;
                line-height: 1.6;
                color: rgba(255, 255, 255, 0.75);
                text-align: left;
            }
            .cookie-consent-box ul {
                margin: 0 0 20px;
                padding: 0 0 0 18px;
                text-align: left;
                font-size: 13px;
                line-height: 1.6;
                color: rgba(255, 255, 255, 0.65);
            }
            .cookie-consent-box a { color: #02a34a; text-decoration: underline; }
            .cookie-consent-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .cookie-consent-box button {
                flex: 1 1 auto;
                min-width: 160px;
                border: unset;
                padding: 12px;
                border-radius: 7px;
                font-weight: 600;
                font-size: 14px;
                font-family: inherit;
                cursor: pointer;
                transition: background-color 0.5s, color 0.5s;
                background-color: #012f6b;
                color: #fff;
                box-shadow: 0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%);
            }
            .cookie-consent-box button:hover {
                transition: background-color 0.5s, color 0.5s;
                background-color: #006eff;
                color: #003a1e;
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'cookie-consent-overlay';
    overlay.innerHTML = `
        <div class="cookie-consent-box" role="dialog" aria-modal="true" aria-labelledby="cookieConsentTitle">
            <h2 id="cookieConsentTitle">Cookies &amp; Datenschutz</h2>
            <p>
                Wir nutzen Cookies bzw. vergleichbare Technologien. Technisch notwendige sind für den
                Betrieb der Seite immer aktiv. Für die folgenden nicht notwendigen Dienste bitten wir um
                deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, § 25 TTDSG:
            </p>
            <ul>
                <li><strong>Google Analytics &amp; Tag Manager</strong> — Reichweitenmessung/Statistik</li>
            </ul>
            <p style="margin-bottom:22px;">
                Du kannst frei wählen und deine Wahl jederzeit über unsere
                <a href="/datenschutz">Datenschutzerklärung</a> widerrufen.
            </p>
            <div class="cookie-consent-actions">
                <button type="button" id="cookieConsentReject">Nur notwendige</button>
                <button type="button" id="cookieConsentAccept">Alle akzeptieren</button>
            </div>
        </div>
    `;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(overlay);

    function closeCookieBanner() {
        document.documentElement.style.overflow = previousOverflow;
        overlay.remove();
        if (isSettingsChange) location.reload();
    }

    document.getElementById('cookieConsentAccept').addEventListener('click', () => {
        localStorage.setItem('ubodigat-cookie-consent', 'accepted');
        gtag('consent', 'update', {
            analytics_storage: 'granted'
        });
        activateConsentScripts('analytics');
        closeCookieBanner();
    });

    document.getElementById('cookieConsentReject').addEventListener('click', () => {
        localStorage.setItem('ubodigat-cookie-consent', 'rejected');
        gtag('consent', 'update', {
            analytics_storage: 'denied'
        });
        closeCookieBanner();
    });
}

// Text in die Zwischenablage kopieren (z. B. Support-Hinweise)
function copyText() {
    var text = "Dieser Text ist leider nicht konfiguriert, melden sie sich beim Webseite-Betrieber. Ihr U:Bodigat.com Support Team: 'kontakt@ubodigat.com'";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}