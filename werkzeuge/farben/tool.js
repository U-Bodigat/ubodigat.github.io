// Farbwerkzeug — HEX/RGB/HSL/HSV/CMYK, Paletten, WCAG-Kontrast. Alles lokal.
(function () {
    'use strict';
    const { $, $$, esc, copyText, toast } = WZ;

    const NAMED = ('aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 '
        + 'brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b '
        + 'darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 '
        + 'darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 '
        + 'dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 '
        + 'greenyellow adff2f honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd '
        + 'lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa '
        + 'lightskyblue 87cefa lightslategray 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa '
        + 'mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc mediumvioletred c71585 '
        + 'midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 '
        + 'orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 '
        + 'purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d '
        + 'silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 '
        + 'violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32').split(' ');
    const NAMED_LIST = [];
    for (let i = 0; i < NAMED.length; i += 2) {
        const h = NAMED[i + 1];
        NAMED_LIST.push({ name: NAMED[i], r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) });
    }

    // ---- Umrechnungen -----------------------------------------------------------------------
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const hex2 = n => Math.round(n).toString(16).padStart(2, '0');
    const toHex = c => ('#' + hex2(c.r) + hex2(c.g) + hex2(c.b)).toUpperCase();

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
        let h = 0, s = 0;
        if (d) {
            s = d / (1 - Math.abs(2 * l - 1));
            h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        return { h, s: s * 100, l: l * 100 };
    }

    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d) {
            h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        return { h, s: max ? (d / max) * 100 : 0, v: max * 100 };
    }

    function hsvToRgb(h, s, v) {
        s /= 100; v /= 100;
        const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
        return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
    }

    function rgbToCmyk(r, g, b) {
        const k = 1 - Math.max(r, g, b) / 255;
        if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
        return { c: (1 - r / 255 - k) / (1 - k) * 100, m: (1 - g / 255 - k) / (1 - k) * 100, y: (1 - b / 255 - k) / (1 - k) * 100, k: k * 100 };
    }

    function cmykToRgb(c, m, y, k) {
        c /= 100; m /= 100; y /= 100; k /= 100;
        return { r: Math.round(255 * (1 - c) * (1 - k)), g: Math.round(255 * (1 - m) * (1 - k)), b: Math.round(255 * (1 - y) * (1 - k)) };
    }

    function parseHex(str) {
        let s = str.trim().replace(/^#/, '');
        if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map(c => c + c).join('');
        if (/^[0-9a-f]{8}$/i.test(s)) s = s.slice(0, 6);
        if (!/^[0-9a-f]{6}$/i.test(s)) return null;
        return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
    }

    function relLum(c) {
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }

    const contrast = (a, b) => { const x = relLum(a), y = relLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

    function nearestName(c) {
        let best = NAMED_LIST[0], bd = Infinity;
        NAMED_LIST.forEach(n => {
            const d = (n.r - c.r) ** 2 + (n.g - c.g) ** 2 + (n.b - c.b) ** 2;
            if (d < bd) { bd = d; best = n; }
        });
        return { name: best.name, exact: bd === 0 };
    }

    // ---- Zustand ------------------------------------------------------------------------------------
    const S = { r: 30, g: 144, b: 255, h: 210 };
    const round = (v, d) => { const p = Math.pow(10, d || 0); return Math.round(v * p) / p; };

    function setRgb(c, keepHue) {
        S.r = clamp(Math.round(c.r), 0, 255); S.g = clamp(Math.round(c.g), 0, 255); S.b = clamp(Math.round(c.b), 0, 255);
        const hsl = rgbToHsl(S.r, S.g, S.b);
        if (!keepHue && hsl.s > 0.5 && hsl.l > 0.5 && hsl.l < 99.5) S.h = hsl.h;
        render();
    }

    function render(skip) {
        const c = { r: S.r, g: S.g, b: S.b }, hex = toHex(c);
        const hsl = rgbToHsl(c.r, c.g, c.b), hsv = rgbToHsv(c.r, c.g, c.b), cmyk = rgbToCmyk(c.r, c.g, c.b);
        const put = (id, v) => { if (skip !== id) $('#' + id).value = v; };
        put('hex', hex);
        $('#picker').value = hex.toLowerCase();
        put('r', c.r); put('g', c.g); put('b', c.b);
        put('hh', round(hsl.s < 0.5 || hsl.l < 0.5 || hsl.l > 99.5 ? S.h : hsl.h)); put('ss', round(hsl.s)); put('ll', round(hsl.l));
        put('vh', round(hsv.s < 0.5 || hsv.v < 0.5 ? S.h : hsv.h)); put('vs', round(hsv.s)); put('vv', round(hsv.v));
        put('c', round(cmyk.c)); put('m', round(cmyk.m)); put('y', round(cmyk.y)); put('k', round(cmyk.k));
        $('#swatch').style.background = hex;
        const n = nearestName(c);
        const sw = $('#colorName');
        sw.textContent = (n.exact ? '' : '≈ ') + n.name;
        sw.style.color = contrast(c, { r: 0, g: 0, b: 0 }) > contrast(c, { r: 255, g: 255, b: 255 }) ? '#000' : '#fff';
        const cw = contrast(c, { r: 255, g: 255, b: 255 }), cb = contrast(c, { r: 0, g: 0, b: 0 });
        $('#lumInfo').innerHTML = 'Wahrgenommene Helligkeit: <b>' + round(relLum(c) * 100, 1).toLocaleString('de-DE') + ' %</b> · bester Text darauf: <b>' + (cb > cw ? 'schwarz' : 'weiß') + '</b>';

        const f = v => round(v).toLocaleString('de-DE', { maximumFractionDigits: 0 });
        const list = [
            ['HEX', hex],
            ['HEX (klein)', hex.toLowerCase()],
            ['RGB', 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')'],
            ['HSL', 'hsl(' + f(hsl.h) + ', ' + f(hsl.s) + '%, ' + f(hsl.l) + '%)'],
            ['HSV', 'hsv(' + f(hsv.h) + ', ' + f(hsv.s) + '%, ' + f(hsv.v) + '%)'],
            ['CMYK', 'cmyk(' + f(cmyk.c) + '%, ' + f(cmyk.m) + '%, ' + f(cmyk.y) + '%, ' + f(cmyk.k) + '%)'],
            ['CSS-Variable', '--farbe: ' + hex.toLowerCase() + ';'],
        ];
        $('#copyList').innerHTML = list.map(([l, v]) => '<button type="button" class="fw-copy-item" data-v="' + esc(v) + '"><span>' + l + '</span><code>' + esc(v) + '</code></button>').join('');

        renderPalette();
        renderContrast();
    }

    // ---- Palette ------------------------------------------------------------------------------------------
    let paletteColors = [];

    function renderPalette() {
        const h = S.h, hsl = rgbToHsl(S.r, S.g, S.b), s = hsl.s, l = hsl.l, scheme = $('#scheme').value;
        const rot = d => hslToRgb((h + d + 360) % 360, s, l);
        const base = { r: S.r, g: S.g, b: S.b };
        const mix = (t, to) => ({ r: base.r + (to - base.r) * t, g: base.g + (to - base.g) * t, b: base.b + (to - base.b) * t });
        let cols;
        switch (scheme) {
            case 'complementary': cols = [base, rot(180)]; break;
            case 'analogous': cols = [rot(-30), rot(-15), base, rot(15), rot(30)]; break;
            case 'triad': cols = [base, rot(120), rot(240)]; break;
            case 'tetrad': cols = [base, rot(90), rot(180), rot(270)]; break;
            case 'split': cols = [base, rot(150), rot(210)]; break;
            case 'mono': cols = [12, 28, 44, 60, 76, 90].map(li => hslToRgb(h, s, li)); break;
            case 'shades': cols = [0, 0.2, 0.4, 0.6, 0.8].map(t => mix(t, 0)); break;
            default: cols = [0, 0.2, 0.4, 0.6, 0.8].map(t => mix(t, 255));
        }
        paletteColors = cols.map(c => ({ r: clamp(Math.round(c.r), 0, 255), g: clamp(Math.round(c.g), 0, 255), b: clamp(Math.round(c.b), 0, 255) }));
        $('#palette').innerHTML = paletteColors.map((c, i) => {
            const hex = toHex(c), dark = contrast(c, { r: 0, g: 0, b: 0 }) > contrast(c, { r: 255, g: 255, b: 255 });
            return '<button type="button" class="fw-pal" data-i="' + i + '" style="background:' + hex + ';color:' + (dark ? '#000' : '#fff') + '"><span>' + hex + '</span></button>';
        }).join('');
    }

    // ---- Kontrast --------------------------------------------------------------------------------------------
    function renderContrast() {
        const fg = { r: S.r, g: S.g, b: S.b }, bgHex = $('#ctBg').value, bg = parseHex(bgHex);
        const ratio = contrast(fg, bg);
        $('#ctPreview').style.background = bgHex;
        $('#ctPreview').style.color = toHex(fg);
        $('#ctFgChip').style.background = toHex(fg);
        $('#ctFgChip').textContent = toHex(fg);
        $('#ctFgChip').style.color = contrast(fg, { r: 0, g: 0, b: 0 }) > contrast(fg, { r: 255, g: 255, b: 255 }) ? '#000' : '#fff';
        $('#ctRatio').textContent = round(ratio, 2).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' : 1';
        const badge = (label, ok) => '<span class="fw-badge ' + (ok ? 'is-ok' : 'is-no') + '"><svg class="icon" viewBox="0 0 24 24">' + (ok ? '<path d="M5 12.5l4.5 4.5L19 7.5"></path>' : '<path d="M6 6l12 12M18 6L6 18"></path>') + '</svg>' + label + '</span>';
        $('#ctBadges').innerHTML =
            badge('AA · normaler Text (4,5)', ratio >= 4.5) + badge('AA · großer Text (3)', ratio >= 3)
            + badge('AAA · normaler Text (7)', ratio >= 7) + badge('AAA · großer Text (4,5)', ratio >= 4.5);
    }

    // ---- Eingaben ----------------------------------------------------------------------------------------------------
    const num = id => parseFloat($('#' + id).value);
    const ok = (...v) => v.every(x => isFinite(x));

    $('#hex').addEventListener('input', () => { const c = parseHex($('#hex').value); if (c) setRgbSkip(c, 'hex'); });
    $('#picker').addEventListener('input', () => setRgb(parseHex($('#picker').value)));
    ['r', 'g', 'b'].forEach(id => $('#' + id).addEventListener('input', () => { if (ok(num('r'), num('g'), num('b'))) setRgbSkip({ r: num('r'), g: num('g'), b: num('b') }, id); }));
    ['hh', 'ss', 'll'].forEach(id => $('#' + id).addEventListener('input', () => {
        if (!ok(num('hh'), num('ss'), num('ll'))) return;
        S.h = clamp(num('hh'), 0, 360);
        setRgbSkip(hslToRgb(S.h, clamp(num('ss'), 0, 100), clamp(num('ll'), 0, 100)), id, true);
    }));
    ['vh', 'vs', 'vv'].forEach(id => $('#' + id).addEventListener('input', () => {
        if (!ok(num('vh'), num('vs'), num('vv'))) return;
        S.h = clamp(num('vh'), 0, 360);
        setRgbSkip(hsvToRgb(S.h, clamp(num('vs'), 0, 100), clamp(num('vv'), 0, 100)), id, true);
    }));
    ['c', 'm', 'y', 'k'].forEach(id => $('#' + id).addEventListener('input', () => {
        if (ok(num('c'), num('m'), num('y'), num('k'))) setRgbSkip(cmykToRgb(clamp(num('c'), 0, 100), clamp(num('m'), 0, 100), clamp(num('y'), 0, 100), clamp(num('k'), 0, 100)), id);
    }));

    function setRgbSkip(c, skipId, keepHue) {
        S.r = clamp(Math.round(c.r), 0, 255); S.g = clamp(Math.round(c.g), 0, 255); S.b = clamp(Math.round(c.b), 0, 255);
        const hsl = rgbToHsl(S.r, S.g, S.b);
        if (!keepHue && hsl.s > 0.5 && hsl.l > 0.5 && hsl.l < 99.5) S.h = hsl.h;
        render(skipId);
    }

    $('#rndBtn').addEventListener('click', () => {
        const a = new Uint32Array(3);
        crypto.getRandomValues(a);
        setRgb(hslToRgb(a[0] % 360, 45 + (a[1] % 50), 30 + (a[2] % 45)));
    });

    if ('EyeDropper' in window) {
        $('#eyeBtn').classList.remove('wz-hidden');
        $('#eyeBtn').addEventListener('click', async () => {
            try { const r = await new EyeDropper().open(); setRgb(parseHex(r.sRGBHex)); } catch (e) { /* abgebrochen */ }
        });
    }

    $('#copyList').addEventListener('click', e => {
        const b = e.target.closest('.fw-copy-item');
        if (b) copyText(b.dataset.v, b.dataset.v + ' kopiert');
    });

    $('#scheme').addEventListener('change', renderPalette);
    $('#ctBg').addEventListener('input', renderContrast);
    $('#ctSwap').addEventListener('click', () => {
        const bg = parseHex($('#ctBg').value), fg = { r: S.r, g: S.g, b: S.b };
        $('#ctBg').value = toHex(fg).toLowerCase();
        setRgb(bg);
    });

    let lastTap = 0, lastI = -1;
    $('#palette').addEventListener('click', e => {
        const b = e.target.closest('.fw-pal');
        if (!b) return;
        const i = +b.dataset.i, now = Date.now();
        if (i === lastI && now - lastTap < 400) { setRgb(paletteColors[i]); lastI = -1; return; }
        lastI = i; lastTap = now;
        copyText(toHex(paletteColors[i]), toHex(paletteColors[i]) + ' kopiert');
    });
    $('#copyPalette').addEventListener('click', () => copyText(paletteColors.map((c, i) => '--farbe-' + (i + 1) + ': ' + toHex(c).toLowerCase() + ';').join('\n'), 'Palette kopiert'));

    render();
    window.UBColor = { rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb, rgbToCmyk, cmykToRgb, contrast, parseHex, NAMED_LIST };
})();
