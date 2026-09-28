// Passwort-Generator — alles lokal, Zufall kommt von crypto.getRandomValues.
(function () {
    'use strict';
    const { $, $$, fmtNum, copyText, esc } = WZ;

    // Gut tippbare deutsche Woerter (ohne Umlaute), 236 Stueck => ca. 7,9 Bit Entropie pro Wort.
    const WORDS = ('apfel arzt auto bach ball bank baum berg biene birne blatt blume boden boot brot buch bus dach dorf drache eimer eis engel ente erde esel '
        + 'fabrik fahne feder feld feuer fisch fluss forst frosch fuchs gabel garten gast gelb geld glas gold gras gurke hafen hahn hand hase haus heft held herbst '
        + 'himmel hirsch holz honig hund insel jacke jagd kaese kamel katze kerze kiste klee knopf koch korb kran kreis krone kuchen kugel kuh lampe land leiter licht '
        + 'lied loewe luft mais markt maus meer mehl milch mond moos motor mund musik nadel nebel nest nuss ofen orgel palme papier pferd pilz pizza platz quelle rabe '
        + 'rad regen reis ring robbe rose sand schaf schiff schlaf schnee schuh segel seife sessel socke sommer sonne spiegel sport stadt stein stern stier strand stuhl '
        + 'sturm suppe tafel tasche tasse tier tinte tisch tomate torte traube treppe tuer turm uhr vogel wald wand wasser watte weg wiese wind winter wolke wolle wurm '
        + 'zahn zaun zebra zelt zitrone zucker zug adler anker atlas beere bilder blitz bogen bruecke burg clown delfin donner eiche fackel falke fenster flagge floete '
        + 'gemuese giraffe gitarre glocke hammer harfe hecht hummel igel jaguar kabel kaktus kanne kapitaen kerl kissen klavier koffer kompass kraut kuerbis lawine '
        + 'lupe magnet marmor medaille mohn nashorn ozean panda pinsel planet pudding rakete rucksack safran salat schere schloss seehund sirup skizze tiger tunnel '
        + 'vulkan waage walnuss wecker werkzeug zirkus').split(/\s+/);
    const WORD_LIST = Array.from(new Set(WORDS));

    const COMMON = new Set(('123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon 123123 baseball abc123 football monkey letmein 696969 shadow master 666666 '
        + 'qwertyuiop 123321 mustang 1234567890 michael 654321 superman 1qaz2wsx 7777777 121212 000000 qazwsx 123qwe killer trustno1 jordan jennifer zxcvbnm asdfgh hunter '
        + 'buster soccer harley batman andrew tigger sunshine iloveyou 2000 charlie robert thomas hockey ranger daniel starwars 112233 george computer michelle jessica '
        + 'pepper 1111 zxcvbn 555555 11111111 131313 freedom 777777 pass maggie 159753 aaaaaa ginger princess joshua cheese amanda summer love ashley nicole chelsea biteme '
        + 'matthew access yankees 987654321 dallas austin thunder taylor matrix passwort hallo hallo123 passwort1 qwertz qwertz123 geheim sommer schatz fussball test test123 '
        + 'admin welcome login master123 abc12345 password1 password123 iloveyou1 letmein1 zaq12wsx').split(/\s+/));

    const SETS = {
        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digit: '0123456789',
        sym: '!@#$%&*+-=?_.,;:~()[]{}<>/',
    };
    const AMBIGUOUS = /[0O1lI|]/g;

    // ---- Zufall ------------------------------------------------------------------------
    function randInt(n) {
        if (n <= 1) return 0;
        const lim = Math.floor(4294967296 / n) * n, a = new Uint32Array(1);
        do { crypto.getRandomValues(a); } while (a[0] >= lim);
        return a[0] % n;
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) { const j = randInt(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
        return arr;
    }

    // ---- Generatoren -----------------------------------------------------------------------
    function currentSets() {
        const noAmb = $('#noAmb').checked;
        const list = [];
        if ($('#setLower').checked) list.push(SETS.lower);
        if ($('#setUpper').checked) list.push(SETS.upper);
        if ($('#setDigit').checked) list.push(SETS.digit);
        if ($('#setSym').checked) list.push(SETS.sym);
        return list.map(s => noAmb ? s.replace(AMBIGUOUS, '') : s).filter(Boolean);
    }

    function genPassword() {
        const len = +$('#len').value, sets = currentSets();
        if (!sets.length) return { text: '', bits: 0 };
        const pool = sets.join('');
        const chars = [];
        if ($('#eachSet').checked) sets.forEach(s => chars.push(s[randInt(s.length)]));
        while (chars.length < len) chars.push(pool[randInt(pool.length)]);
        shuffle(chars);
        return { text: chars.slice(0, len).join(''), bits: len * Math.log2(pool.length) };
    }

    function genPassphrase() {
        const n = +$('#words').value, sep = $('input[name=sep]:checked').value, cap = $('#ppCap').checked, num = $('#ppNum').checked;
        const parts = [];
        for (let i = 0; i < n; i++) {
            let w = WORD_LIST[randInt(WORD_LIST.length)];
            if (cap) w = w[0].toUpperCase() + w.slice(1);
            parts.push(w);
        }
        let text = parts.join(sep), bits = n * Math.log2(WORD_LIST.length);
        if (num) { text += (sep || '') + randInt(1000); bits += Math.log2(1000); }
        return { text, bits };
    }

    // ---- Bewertung ------------------------------------------------------------------------------
    const RATINGS = [
        [40, 'Sehr schwach', 1], [60, 'Schwach', 2], [80, 'Ordentlich', 3], [100, 'Stark', 4], [Infinity, 'Sehr stark', 5],
    ];

    function crackText(bits) {
        const sec = Math.pow(2, Math.max(0, bits - 1)) / 1e10;
        const f = n => fmtNum(n, n < 10 ? 1 : 0);
        if (sec < 1) return 'weniger als eine Sekunde';
        if (sec < 60) return f(sec) + ' Sekunden';
        if (sec < 3600) return f(sec / 60) + ' Minuten';
        if (sec < 86400) return f(sec / 3600) + ' Stunden';
        const yr = sec / 31557600;
        if (yr < 1) return f(sec / 86400) + ' Tage';
        if (yr < 1e3) return f(yr) + ' Jahre';
        if (yr < 1e6) return f(yr / 1e3) + ' Tausend Jahre';
        if (yr < 1e9) return f(yr / 1e6) + ' Millionen Jahre';
        if (yr < 1.38e10) return f(yr / 1e9) + ' Milliarden Jahre';
        return 'länger als das Alter des Universums';
    }

    function rate(bits) {
        const r = RATINGS.find(x => bits < x[0]);
        return { label: r[1], score: r[2] };
    }

    function setMeter(box, bits, extra) {
        const r = rate(bits);
        box.dataset.score = bits > 0 ? r.score : 0;
        $('.js-label', box).textContent = bits > 0 ? r.label : '–';
        $('.js-detail', box).textContent = bits > 0 ? '≈ ' + Math.round(bits) + ' Bit · Knacken dauert ca. ' + crackText(bits) + (extra || '') : '';
    }

    function analyze(pw) {
        const chars = Array.from(pw), len = chars.length;
        const has = { l: /[a-z]/.test(pw), u: /[A-Z]/.test(pw), d: /\d/.test(pw), s: /[^A-Za-z0-9]/.test(pw) };
        const pool = (has.l ? 26 : 0) + (has.u ? 26 : 0) + (has.d ? 10 : 0) + (has.s ? 33 : 0);
        const lower = pw.toLowerCase();
        const stripped = lower.replace(/[^a-z]+$/, '');
        const common = COMMON.has(lower) || COMMON.has(stripped) || COMMON.has(lower.replace(/\d+$/, ''));
        const unique = new Set(chars).size, repeat = len - unique;
        let seq = 0;
        for (let i = 0; i < len - 2; i++) {
            const a = pw.charCodeAt(i), b = pw.charCodeAt(i + 1), c = pw.charCodeAt(i + 2);
            if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) seq++;
        }
        const rows = ['qwertzuiop', 'qwertyuiop', 'asdfghjkl', 'yxcvbnm', 'zxcvbnm', '1234567890'];
        let kb = 0;
        rows.forEach(r => { for (let i = 0; i <= r.length - 4; i++) { const p = r.slice(i, i + 4); if (lower.includes(p) || lower.includes(p.split('').reverse().join(''))) { kb++; break; } } });
        const year = /(19|20)\d{2}/.test(pw);
        let eff = len - repeat * 0.6 - seq * 1.2 - kb * 3 - (year ? 2 : 0);
        eff = Math.max(1, eff);
        let bits = eff * Math.log2(Math.max(pool, 2));
        if (common) bits = Math.min(bits, 8);
        // Wort-Trennzeichen-Wort (z. B. correct-horse-battery): wie eine Passphrase schaetzen (~13 Bit je Wort)
        const segs = pw.split(/[-_. ]+/).filter(Boolean);
        if (segs.length >= 2 && segs.every(s => /^[A-Za-zÄÖÜäöüß]{2,}$/.test(s))) bits = Math.min(bits, segs.length * 13);
        const simple = seq === 0 && kb === 0 && repeat < len * 0.3 && !year;
        return { len, has, bits, common, simple };
    }

    const CHECK = '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
    const CROSS = '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

    function renderChecks(a) {
        const items = [
            [a.len >= 12, 'Mindestens 12 Zeichen'],
            [a.has.l && a.has.u, 'Groß- und Kleinbuchstaben gemischt'],
            [a.has.d, 'Enthält Ziffern'],
            [a.has.s, 'Enthält Sonderzeichen'],
            [!a.common, 'Steht nicht in der Liste häufiger Passwörter'],
            [a.simple, 'Keine leichten Muster (123, abc, qwertz, 2024 …)'],
        ];
        $('#checks').innerHTML = items.map(i => '<li class="' + (i[0] ? 'is-ok' : 'is-no') + '">' + (i[0] ? CHECK : CROSS) + i[1] + '</li>').join('');
    }

    // ---- Anzeige ----------------------------------------------------------------------------------------
    function paint(text) {
        if (!text) return '–';
        return Array.from(text).map(ch => {
            const e = esc(ch);
            if (/\d/.test(ch)) return '<span class="pw-d">' + e + '</span>';
            if (/[^A-Za-z0-9]/.test(ch)) return '<span class="pw-s">' + e + '</span>';
            return e;
        }).join('');
    }

    let current = '';

    function mode() { return $('input[name=mode]:checked').value; }

    function generate() {
        const g = mode() === 'pp' ? genPassphrase : genPassword;
        const r = g();
        current = r.text;
        $('#pwOut').innerHTML = paint(r.text);
        setMeter($('#meterGen'), r.bits);
        const alts = $('#alts');
        alts.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const a = g();
            if (!a.text) break;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pw-alt';
            b.innerHTML = paint(a.text);
            b.addEventListener('click', () => copyText(a.text, 'Passwort kopiert'));
            alts.appendChild(b);
        }
        if (!r.text) $('#pwOut').textContent = 'Wähle mindestens eine Zeichengruppe.';
    }

    function syncMode() {
        const m = mode();
        $('#viewGen').classList.toggle('wz-hidden', m === 'chk');
        $('#viewChk').classList.toggle('wz-hidden', m !== 'chk');
        $('#optPw').classList.toggle('wz-hidden', m !== 'pw');
        $('#optPp').classList.toggle('wz-hidden', m !== 'pp');
        if (m !== 'chk') generate(); else evaluate();
    }

    function evaluate() {
        const pw = $('#chkInput').value;
        $('#pwnBtn').disabled = !pw;
        clearPwnStatus();
        if (!pw) {
            setMeter($('#meterChk'), 0);
            $('#meterChk .js-detail').textContent = 'Gib ein Passwort ein.';
            $('#checks').innerHTML = '';
            return;
        }
        const a = analyze(pw);
        setMeter($('#meterChk'), a.bits, a.common ? ' — steht auf Listen häufiger Passwörter!' : '');
        renderChecks(a);
    }

    // ---- Have I Been Pwned (k-Anonymitaet) ---------------------------------------------------------------------
    const PWN_ICONS = {
        loading: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"></path></svg>',
        safe: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
        pwned: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"></path><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path></svg>',
        error: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"></path><circle cx="12" cy="12" r="9"></circle></svg>',
    };

    function setPwnStatus(state, title, detail) {
        const out = $('#pwnResult');
        out.className = 'wz-status is-' + state;
        out.innerHTML = PWN_ICONS[state] + '<div><strong>' + title + '</strong><span>' + (detail || '') + '</span></div>';
    }

    function clearPwnStatus() {
        const out = $('#pwnResult');
        out.className = 'wz-status wz-hidden';
        out.innerHTML = '';
    }

    async function pwnCheck() {
        const pw = $('#chkInput').value;
        if (!pw) return;
        setPwnStatus('loading', 'Wird geprüft …', 'Verbindung zu haveibeenpwned.com wird aufgebaut.');
        try {
            const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
            const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            const res = await fetch('https://api.pwnedpasswords.com/range/' + hex.slice(0, 5), { headers: { 'Add-Padding': 'true' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const line = (await res.text()).split('\n').map(l => l.trim()).find(l => l.startsWith(hex.slice(5)));
            const n = line ? parseInt(line.split(':')[1], 10) : 0;
            if (n > 0) {
                setPwnStatus('pwned', 'Dieses Passwort ist geleakt!', 'Es taucht in ' + fmtNum(n) + ' bekannten Datenlecks auf — bitte nicht mehr verwenden.');
            } else {
                setPwnStatus('safe', 'Kein bekanntes Datenleck gefunden.', 'Das heißt nicht automatisch, dass das Passwort sicher ist — nutze es trotzdem nur einmal.');
            }
        } catch (e) {
            setPwnStatus('error', 'Prüfung fehlgeschlagen.', 'Kein Zugriff auf haveibeenpwned.com — Werbeblocker, Firewall oder offline?');
        }
    }

    // ---- Einwilligungs-Dialog vor der HIBP-Abfrage ------------------------------------------------------------
    const PWN_CONSENT_KEY = 'ub_pwn_consent_v1';

    function openPwnConsent() {
        $('#pwnRemember').checked = false;
        $('#pwnConsent').classList.remove('wz-hidden');
    }

    function closePwnConsent() {
        $('#pwnConsent').classList.add('wz-hidden');
    }

    function requestPwnCheck() {
        if (!$('#chkInput').value) return;
        clearPwnStatus();
        if (localStorage.getItem(PWN_CONSENT_KEY) === '1') { pwnCheck(); return; }
        openPwnConsent();
    }

    $('#pwnConsentCancel').addEventListener('click', closePwnConsent);
    $('#pwnConsent').addEventListener('click', e => { if (e.target.id === 'pwnConsent') closePwnConsent(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#pwnConsent').classList.contains('wz-hidden')) closePwnConsent(); });
    $('#pwnConsentOk').addEventListener('click', () => {
        if ($('#pwnRemember').checked) localStorage.setItem(PWN_CONSENT_KEY, '1');
        closePwnConsent();
        pwnCheck();
    });

    // ---- Verdrahten ------------------------------------------------------------------------------------------------
    $('#tabs').addEventListener('change', syncMode);
    ['#len', '#words'].forEach(s => $(s).addEventListener('input', () => { $(s + 'Out').textContent = $(s).value; generate(); }));
    $$('#sets input, #noAmb, #eachSet, #ppCap, #ppNum, input[name=sep]').forEach(i => i.addEventListener('change', generate));
    $('#regen').addEventListener('click', generate);
    $('#copyPw').addEventListener('click', () => current && copyText(current, 'Passwort kopiert'));
    $('#pwOut').addEventListener('click', () => current && copyText(current, 'Passwort kopiert'));
    $('#chkInput').addEventListener('input', evaluate);
    $('#chkToggle').addEventListener('click', () => { const i = $('#chkInput'); i.type = i.type === 'password' ? 'text' : 'password'; });
    $('#pwnBtn').addEventListener('click', requestPwnCheck);

    generate();
    window.UBPass = { generate, analyze, WORD_LIST };
})();
