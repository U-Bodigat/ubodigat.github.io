// QR-Code-Generator — nutzt die freie Bibliothek "qrcode-generator" (MIT) fuer die Berechnung,
// Zeichnen (Canvas/PNG) und SVG-Export passieren hier.
(function () {
    'use strict';
    const { $, $$, downloadBlob, debounce, copyText, toast } = WZ;

    if (typeof qrcode === 'undefined') {
        $('#qrEmpty').textContent = 'Die QR-Bibliothek konnte nicht geladen werden.';
        $('#qrEmpty').classList.remove('wz-hidden');
        return;
    }
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

    const S = { qr: null, count: 0, payload: '' };

    // ---- Inhalte -------------------------------------------------------------------------
    const escWifi = s => String(s).replace(/([\\;,:"])/g, '\\$1');

    function payload() {
        const type = $('input[name=type]:checked').value;
        const v = id => $('#' + id).value.trim();
        switch (type) {
            case 'text': return $('#fText').value;
            case 'wifi': {
                if (!v('fSsid')) return '';
                const enc = $('input[name=enc]:checked').value;
                return 'WIFI:T:' + enc + ';S:' + escWifi(v('fSsid')) + ';' + (enc === 'nopass' ? '' : 'P:' + escWifi($('#fWpass').value) + ';') + ($('#fHidden').checked ? 'H:true;' : '') + ';';
            }
            case 'mail': {
                if (!v('fMailTo')) return '';
                const q = [];
                if (v('fMailSub')) q.push('subject=' + encodeURIComponent(v('fMailSub')));
                if ($('#fMailBody').value.trim()) q.push('body=' + encodeURIComponent($('#fMailBody').value.trim()));
                return 'mailto:' + v('fMailTo') + (q.length ? '?' + q.join('&') : '');
            }
            case 'tel': return v('fTel') ? 'tel:' + v('fTel').replace(/[^\d+]/g, '') : '';
            case 'sms': return v('fSmsNum') ? 'SMSTO:' + v('fSmsNum').replace(/[^\d+]/g, '') + ':' + $('#fSmsMsg').value.trim() : '';
            case 'card': {
                if (!v('fFirst') && !v('fLast')) return '';
                const l = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + v('fLast') + ';' + v('fFirst') + ';;;', 'FN:' + (v('fFirst') + ' ' + v('fLast')).trim()];
                if (v('fOrg')) l.push('ORG:' + v('fOrg'));
                if (v('fCardTel')) l.push('TEL;TYPE=CELL:' + v('fCardTel'));
                if (v('fCardMail')) l.push('EMAIL:' + v('fCardMail'));
                if (v('fCardUrl')) l.push('URL:' + v('fCardUrl'));
                l.push('END:VCARD');
                return l.join('\n');
            }
        }
        return '';
    }

    // ---- Farben / Kontrast -------------------------------------------------------------------
    function lum(hex) {
        const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }

    function contrastWarning() {
        const a = lum($('#fg').value), b = lum($('#bg').value);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (a > b) return 'Vordergrund ist heller als der Hintergrund (invertiert) — viele Scanner lesen solche Codes nicht.';
        if (ratio < 3) return 'Der Kontrast ist sehr niedrig (' + ratio.toFixed(1).replace('.', ',') + ' : 1) — der Code lässt sich vermutlich schlecht scannen.';
        return '';
    }

    // ---- Zeichnen -------------------------------------------------------------------------------
    function layout(targetSize, floor) {
        const margin = +$('#margin').value, total = S.count + margin * 2;
        const m = Math.max(1, floor ? Math.floor(targetSize / total) : Math.round(targetSize / total));
        return { margin, total, m, px: m * total };
    }

    // forDownload: Modulgroesse gerundet (Ausgabe ~ Wunschgroesse); sonst abgerundet (Vorschau immer ganzzahlig = scharf).
    function drawTo(canvas, targetSize, forDownload) {
        const L = layout(targetSize, !forDownload);
        const round = $('input[name=shape]:checked').value === 'round';
        canvas.width = L.px;
        canvas.height = canvas.width;
        const ctx = canvas.getContext('2d');
        const k = canvas.width / L.total;
        ctx.fillStyle = $('#bg').value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = $('#fg').value;
        for (let r = 0; r < S.count; r++) {
            for (let c = 0; c < S.count; c++) {
                if (!S.qr.isDark(r, c)) continue;
                const x = (c + L.margin) * k, y = (r + L.margin) * k;
                if (round) {
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(x, y, k, k, k * 0.32); else ctx.rect(x, y, k, k);
                    ctx.fill();
                } else {
                    const x0 = Math.floor(x), y0 = Math.floor(y);
                    ctx.fillRect(x0, y0, Math.ceil(x + k) - x0, Math.ceil(y + k) - y0);
                }
            }
        }
        return L;
    }

    function svgString() {
        const L = layout(+$('#size').value), round = $('input[name=shape]:checked').value === 'round';
        let body = '';
        for (let r = 0; r < S.count; r++) for (let c = 0; c < S.count; c++) {
            if (!S.qr.isDark(r, c)) continue;
            body += round ? '<rect x="' + (c + L.margin) + '" y="' + (r + L.margin) + '" width="1" height="1" rx="0.32"/>'
                : '<rect x="' + (c + L.margin) + '" y="' + (r + L.margin) + '" width="1" height="1"/>';
        }
        return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + L.total + ' ' + L.total + '" width="' + L.px + '" height="' + L.px + '"' + (round ? '' : ' shape-rendering="crispEdges"') + '>'
            + '<rect width="' + L.total + '" height="' + L.total + '" fill="' + $('#bg').value + '"/><g fill="' + $('#fg').value + '">' + body + '</g></svg>\n';
    }

    // ---- Render -----------------------------------------------------------------------------------
    function render() {
        const text = payload();
        S.payload = text;
        const canvas = $('#qrCanvas'), empty = $('#qrEmpty');
        const buttons = [$('#dlPng'), $('#dlSvg'), $('#copyPng')];
        $('#qrWarn').classList.add('wz-hidden');
        if (!text) {
            S.qr = null;
            canvas.classList.add('wz-hidden');
            empty.classList.remove('wz-hidden');
            empty.textContent = 'Gib links etwas ein.';
            $('#qrInfo').textContent = '–';
            buttons.forEach(b => { b.disabled = true; });
            return;
        }
        try {
            const qr = qrcode(0, $('input[name=ec]:checked').value);
            qr.addData(text, 'Byte');
            qr.make();
            S.qr = qr;
            S.count = qr.getModuleCount();
        } catch (e) {
            S.qr = null;
            canvas.classList.add('wz-hidden');
            empty.classList.remove('wz-hidden');
            empty.textContent = 'Zu viel Inhalt für einen QR-Code. Kürze den Text oder wähle eine niedrigere Fehlerkorrektur (L).';
            $('#qrInfo').textContent = '–';
            buttons.forEach(b => { b.disabled = true; });
            return;
        }
        empty.classList.add('wz-hidden');
        canvas.classList.remove('wz-hidden');
        buttons.forEach(b => { b.disabled = false; });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        drawTo(canvas, Math.round(300 * dpr), false);
        const L = layout(+$('#size').value);
        const version = (S.count - 17) / 4;
        $('#qrInfo').textContent = S.count + ' × ' + S.count + ' Module (Version ' + version + ') · ' + new TextEncoder().encode(text).length + ' Byte · Ausgabe ' + L.px + ' × ' + L.px + ' px';
        const w = contrastWarning();
        if (w) { $('#qrWarnText').textContent = w; $('#qrWarn').classList.remove('wz-hidden'); }
    }

    // ---- Downloads -----------------------------------------------------------------------------------
    function pngBlob() {
        return new Promise(res => {
            const c = document.createElement('canvas');
            drawTo(c, +$('#size').value, true);
            c.toBlob(res, 'image/png');
        });
    }

    $('#dlPng').addEventListener('click', async () => downloadBlob(await pngBlob(), 'qr-code.png'));
    $('#dlSvg').addEventListener('click', () => S.qr && downloadBlob(new Blob([svgString()], { type: 'image/svg+xml' }), 'qr-code.svg'));
    $('#copyPng').addEventListener('click', async () => {
        try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': await pngBlob() })]);
            toast('QR-Code als Bild kopiert');
        } catch (e) {
            toast('Bild kopieren wird von diesem Browser nicht unterstützt');
        }
    });

    // ---- Verdrahten --------------------------------------------------------------------------------------------
    const rerender = debounce(render, 80);
    $$('input, textarea').forEach(i => { i.addEventListener('input', rerender); i.addEventListener('change', rerender); });
    $('#types').addEventListener('change', () => {
        const t = $('input[name=type]:checked').value;
        $$('.qr-form').forEach(f => f.classList.toggle('wz-hidden', f.dataset.type !== t));
        render();
    });
    $('#margin').addEventListener('input', () => { $('#marginOut').textContent = $('#margin').value; });
    $('#size').addEventListener('input', () => { $('#sizeOut').textContent = $('#size').value + ' px'; });

    render();
    window.UBQr = { render, payload, state: S };
})();
