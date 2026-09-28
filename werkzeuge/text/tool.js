// Text-Werkzeuge — zaehlen, umwandeln, sortieren, ersetzen. Alles lokal.
(function () {
    'use strict';
    const { $, $$, esc, fmtNum, copyText, downloadBlob, toast } = WZ;

    const area = $('#txt');
    const undoStack = [];
    const MAX_UNDO = 60;

    // ---- Statistik ---------------------------------------------------------------------
    const STOP = new Set(('und der die das nicht ist ein eine einen einem einer eines mit für auf den dem des von zum zur sich auch als aber wenn oder wie bei noch nach wird sind war '
        + 'hat haben dass kann nur über aus sie wir ihr ich du er es im in an am um so dann dass diese dieser dieses diesen dort hier sein seine ihre unser mehr sehr schon wurde werden '
        + 'wurden immer weil ohne doch bis zwischen gegen unter durch vor vom').split(/\s+/));

    const WORD_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

    function fmtDuration(sec) {
        if (sec < 1) return '< 1 s';
        const m = Math.floor(sec / 60), s = Math.round(sec % 60);
        return m ? m + ' min ' + (s ? s + ' s' : '') : s + ' s';
    }

    function stats(text) {
        const chars = Array.from(text).length;
        const noSpace = Array.from(text.replace(/\s/g, '')).length;
        const words = text.match(WORD_RE) || [];
        const lines = text ? text.split('\n').length : 0;
        const sentences = text.split(/[.!?…]+(?:\s|$)/).filter(s => s.trim()).length;
        const paragraphs = text.split(/\n\s*\n/).filter(s => s.trim()).length;
        const longest = words.reduce((a, w) => (w.length > a.length ? w : a), '');
        const avg = words.length ? words.reduce((n, w) => n + w.length, 0) / words.length : 0;
        return { chars, noSpace, words: words.length, lines, sentences, paragraphs, longest, avg, list: words,
            read: (words.length / 200) * 60, speak: (words.length / 130) * 60 };
    }

    function renderStats() {
        const s = stats(area.value);
        const tile = (label, val, sub) => '<div class="wz-stat"><small>' + label + '</small><b>' + val + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>';
        $('#stats').innerHTML =
            tile('Zeichen', fmtNum(s.chars), fmtNum(s.noSpace) + ' ohne Leerzeichen')
            + tile('Wörter', fmtNum(s.words), 'Ø ' + fmtNum(s.avg, 1) + ' Buchstaben')
            + tile('Sätze', fmtNum(s.sentences), fmtNum(s.paragraphs) + ' Absätze')
            + tile('Zeilen', fmtNum(s.lines), '')
            + tile('Lesezeit', fmtDuration(s.read), 'bei 200 Wörtern/min')
            + tile('Sprechzeit', fmtDuration(s.speak), 'bei 130 Wörtern/min');

        const freq = {};
        s.list.forEach(w => { const k = w.toLowerCase(); if (k.length >= 4 && !STOP.has(k)) freq[k] = (freq[k] || 0) + 1; });
        const top = Object.entries(freq).filter(e => e[1] > 1 || s.list.length < 40).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de')).slice(0, 8);
        $('#topWords').innerHTML = top.length ? top.map(([w, n]) => '<span class="pc-chip"><b style="color:var(--text)">' + esc(w) + '</b> ' + n + '×</span>').join('') : '<span class="wz-note">–</span>';

        const limits = [['X / Twitter', 280], ['SMS (1 Nachricht)', 160], ['Meta-Beschreibung', 155], ['Instagram-Bio', 150]];
        $('#limits').innerHTML = limits.map(([name, max]) => {
            const over = s.chars > max, pct = Math.min(100, (s.chars / max) * 100);
            return '<div class="tx-limit' + (over ? ' is-over' : '') + '"><div class="tx-limit-head"><span>' + name + '</span><span>' + fmtNum(s.chars) + ' / ' + max + (over ? ' (+' + (s.chars - max) + ')' : '') + '</span></div><div class="wz-progress"><i style="width:' + pct + '%"></i></div></div>';
        }).join('');
    }

    // ---- Umwandlungen ------------------------------------------------------------------------
    const lines = t => t.split('\n');
    const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

    function slugify(t) {
        return t.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
            .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const utf8ToB64 = t => { const b = new TextEncoder().encode(t); let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return btoa(s); };
    const b64ToUtf8 = t => { const s = atob(t.replace(/\s+/g, '')); return new TextDecoder().decode(Uint8Array.from(s, c => c.charCodeAt(0))); };

    const OPS = {
        upper: t => t.toLocaleUpperCase('de'),
        lower: t => t.toLocaleLowerCase('de'),
        title: t => t.toLocaleLowerCase('de').replace(/(^|[\s("„»])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('de')),
        sentence: t => t.toLocaleLowerCase('de').replace(/(^|[.!?…]\s+|\n)(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('de')),
        swap: t => Array.from(t).map(c => (c === c.toLocaleUpperCase('de') ? c.toLocaleLowerCase('de') : c.toLocaleUpperCase('de'))).join(''),
        sortAZ: t => lines(t).sort(collator.compare).join('\n'),
        sortZA: t => lines(t).sort((a, b) => collator.compare(b, a)).join('\n'),
        sortLen: t => lines(t).sort((a, b) => a.length - b.length || collator.compare(a, b)).join('\n'),
        reverseLines: t => lines(t).reverse().join('\n'),
        shuffle: t => {
            const a = lines(t);
            for (let i = a.length - 1; i > 0; i--) { const r = new Uint32Array(1); crypto.getRandomValues(r); const j = r[0] % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
            return a.join('\n');
        },
        dedupe: t => { const seen = new Set(); return lines(t).filter(l => { const k = l.trim(); if (seen.has(k)) return false; seen.add(k); return true; }).join('\n'); },
        noEmpty: t => lines(t).filter(l => l.trim()).join('\n'),
        number: t => lines(t).map((l, i) => (i + 1) + '. ' + l).join('\n'),
        trim: t => lines(t).map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim(),
        oneLine: t => t.replace(/\s*\n\s*/g, ' ').replace(/ {2,}/g, ' ').trim(),
        reverseText: t => Array.from(t).reverse().join(''),
        slug: t => lines(t).map(slugify).join('\n'),
        b64enc: t => utf8ToB64(t),
        b64dec: t => b64ToUtf8(t),
        urlenc: t => encodeURIComponent(t),
        urldec: t => decodeURIComponent(t.replace(/\+/g, ' ')),
    };

    function setText(v) {
        area.value = v;
        renderStats();
    }

    function apply(op) {
        const before = area.value;
        try {
            const after = OPS[op](before);
            if (after === before) { toast('Keine Änderung'); return; }
            pushUndo(before);
            setText(after);
        } catch (e) {
            toast(op === 'b64dec' ? 'Das ist kein gültiges Base64' : op === 'urldec' ? 'Ungültige URL-Kodierung' : 'Umwandlung nicht möglich');
        }
    }

    function pushUndo(v) {
        undoStack.push(v);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        $('#undoBtn').disabled = false;
    }

    // ---- Suchen & Ersetzen -----------------------------------------------------------------------
    function buildRegex() {
        const q = $('#findIn').value;
        if (!q) return null;
        const flags = 'g' + ($('#fCase').checked ? '' : 'i') + 'u';
        try {
            return new RegExp($('#fRegex').checked ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        } catch (e) { return false; }
    }

    function updateFindInfo() {
        const re = buildRegex(), info = $('#findInfo');
        if (re === false) { info.textContent = 'Ungültiger Ausdruck'; return; }
        if (!re) { info.textContent = ''; return; }
        const n = (area.value.match(re) || []).length;
        info.textContent = n + (n === 1 ? ' Treffer' : ' Treffer');
    }

    $('#replBtn').addEventListener('click', () => {
        const re = buildRegex();
        if (!re) return;
        const before = area.value, after = before.replace(re, $('#replIn').value);
        if (after === before) { toast('Nichts gefunden'); return; }
        pushUndo(before);
        setText(after);
        updateFindInfo();
    });

    // ---- Verdrahten ----------------------------------------------------------------------------------------
    area.addEventListener('input', () => { renderStats(); updateFindInfo(); });
    $$('[data-op]').forEach(b => b.addEventListener('click', () => apply(b.dataset.op)));
    ['#findIn', '#fCase', '#fRegex'].forEach(s => $(s).addEventListener('input', updateFindInfo));
    $('#undoBtn').addEventListener('click', () => {
        if (!undoStack.length) return;
        setText(undoStack.pop());
        $('#undoBtn').disabled = !undoStack.length;
        updateFindInfo();
    });
    $('#clearBtn').addEventListener('click', () => { if (area.value) { pushUndo(area.value); setText(''); updateFindInfo(); } });
    $('#copyBtn').addEventListener('click', () => area.value && copyText(area.value, 'Text kopiert'));
    $('#saveBtn').addEventListener('click', () => area.value && downloadBlob(new Blob([area.value], { type: 'text/plain;charset=utf-8' }), 'text.txt'));

    renderStats();
    window.UBText = { stats, OPS };
})();
