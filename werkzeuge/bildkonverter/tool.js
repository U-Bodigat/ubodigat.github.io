// Bildkonverter — wandelt Bilder lokal per Canvas um (PNG, JPG, WebP, AVIF, ICO, BMP).
(function () {
    'use strict';
    const { $, $$, fmtBytes, fmtNum, esc, downloadBlob, debounce, toast } = WZ;

    const FORMATS = {
        png: { mime: 'image/png', ext: 'png', label: 'PNG' },
        jpg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', noAlpha: true, lossy: true },
        webp: { mime: 'image/webp', ext: 'webp', label: 'WebP', lossy: true },
        avif: { mime: 'image/avif', ext: 'avif', label: 'AVIF', lossy: true },
        ico: { mime: 'image/x-icon', ext: 'ico', label: 'ICO' },
        bmp: { mime: 'image/bmp', ext: 'bmp', label: 'BMP', noAlpha: true },
    };

    const el = {
        drop: $('#drop'), list: $('#fileList'), empty: $('#emptyHint'), bulk: $('#bulkActions'),
        zip: $('#zipBtn'), clear: $('#clearBtn'), count: $('#countBadge'),
        quality: $('#quality'), qualityOut: $('#qualityOut'), qualityField: $('#qualityField'),
        icoField: $('#icoField'), sizeField: $('#sizeField'), bgField: $('#bgField'),
        pct: $('#pct'), pctOut: $('#pctOut'), pctRow: $('#pctRow'), maxRow: $('#maxRow'),
        maxW: $('#maxW'), maxH: $('#maxH'), bg: $('#bgColor'), suffix: $('#suffix'),
        settings: $('#settings'),
    };

    const items = [];
    let nextId = 1;
    let runId = 0;

    // ---- Einstellungen ------------------------------------------------------------
    function settings() {
        return {
            fmt: $('input[name=fmt]:checked').value,
            quality: +el.quality.value,
            bg: el.bg.value,
            icoSizes: $$('#icoSizes input:checked').map(i => +i.value),
            rs: $('input[name=rs]:checked').value,
            pct: +el.pct.value,
            maxW: parseInt(el.maxW.value, 10) || 0,
            maxH: parseInt(el.maxH.value, 10) || 0,
            suffix: el.suffix.value.trim().replace(/[\\/:*?"<>|]+/g, ''),
        };
    }

    function syncUi() {
        const s = settings();
        const f = FORMATS[s.fmt];
        el.qualityField.classList.toggle('wz-hidden', !f.lossy);
        el.icoField.classList.toggle('wz-hidden', s.fmt !== 'ico');
        el.sizeField.classList.toggle('wz-hidden', s.fmt === 'ico');
        el.bgField.classList.toggle('wz-hidden', !f.noAlpha);
        el.pctRow.classList.toggle('wz-hidden', s.rs !== 'pct' || s.fmt === 'ico');
        el.maxRow.classList.toggle('wz-hidden', s.rs !== 'max' || s.fmt === 'ico');
        el.qualityOut.textContent = s.quality + ' %';
        el.pctOut.textContent = s.pct + ' %';
    }

    // ---- Bilder laden -------------------------------------------------------------------
    async function fixedSvgBlob(file) {
        // SVGs ohne feste Breite/Hoehe haben keine Eigengroesse -> aus viewBox ableiten.
        const text = await file.text();
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const root = doc.documentElement;
        if (!root || root.nodeName.toLowerCase() !== 'svg') throw new Error('Ungültige SVG-Datei');
        const hasSize = /^[\d.]+(px)?$/.test(root.getAttribute('width') || '') && /^[\d.]+(px)?$/.test(root.getAttribute('height') || '');
        if (!hasSize) {
            const vb = (root.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
            const w = vb.length === 4 && vb[2] > 0 ? vb[2] : 512;
            const h = vb.length === 4 && vb[3] > 0 ? vb[3] : 512;
            root.setAttribute('width', w);
            root.setAttribute('height', h);
        }
        return new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' });
    }

    async function decode(file) {
        const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
        if (!isSvg && 'createImageBitmap' in window) {
            try {
                const bmp = await createImageBitmap(file);
                return { src: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
            } catch (e) { /* Fallback auf <img> */ }
        }
        const blob = isSvg ? await fixedSvgBlob(file) : file;
        const url = URL.createObjectURL(blob);
        try {
            const img = new Image();
            img.src = url;
            await img.decode();
            if (!img.naturalWidth || !img.naturalHeight) throw new Error('leer');
            return { src: img, w: img.naturalWidth, h: img.naturalHeight, close: () => {} };
        } catch (e) {
            throw new Error('Dieses Bild kann der Browser nicht lesen (evtl. HEIC oder beschädigt).');
        } finally {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    // ---- Umwandeln ---------------------------------------------------------------------------
    const toBlob = (canvas, mime, q) => new Promise(res => canvas.toBlob(res, mime, q));

    function targetSize(dec, s) {
        let w = dec.w, h = dec.h;
        if (s.rs === 'pct') {
            w = Math.round(w * s.pct / 100);
            h = Math.round(h * s.pct / 100);
        } else if (s.rs === 'max' && (s.maxW || s.maxH)) {
            const k = Math.min(1, s.maxW ? s.maxW / w : Infinity, s.maxH ? s.maxH / h : Infinity);
            w = Math.round(w * k);
            h = Math.round(h * k);
        }
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function encodeBmp(imageData) {
        const { width: w, height: h, data } = imageData;
        const rowSize = (w * 3 + 3) & ~3;
        const size = 54 + rowSize * h;
        const buf = new ArrayBuffer(size);
        const dv = new DataView(buf);
        dv.setUint8(0, 0x42); dv.setUint8(1, 0x4D);
        dv.setUint32(2, size, true);
        dv.setUint32(10, 54, true);
        dv.setUint32(14, 40, true);
        dv.setInt32(18, w, true);
        dv.setInt32(22, h, true);
        dv.setUint16(26, 1, true);
        dv.setUint16(28, 24, true);
        dv.setUint32(34, rowSize * h, true);
        dv.setInt32(38, 2835, true);
        dv.setInt32(42, 2835, true);
        const out = new Uint8Array(buf);
        for (let y = 0; y < h; y++) {
            let o = 54 + (h - 1 - y) * rowSize;
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                out[o++] = data[i + 2];
                out[o++] = data[i + 1];
                out[o++] = data[i];
            }
        }
        return new Blob([buf], { type: 'image/bmp' });
    }

    async function makeIco(dec, s) {
        const sizes = s.icoSizes.slice().sort((a, b) => a - b);
        if (!sizes.length) throw new Error('Bitte mindestens eine Icon-Größe wählen.');
        const pngs = [];
        for (const size of sizes) {
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingQuality = 'high';
            const k = Math.min(size / dec.w, size / dec.h);
            const dw = dec.w * k, dh = dec.h * k;
            ctx.drawImage(dec.src, (size - dw) / 2, (size - dh) / 2, dw, dh);
            const blob = await toBlob(c, 'image/png');
            pngs.push(new Uint8Array(await blob.arrayBuffer()));
        }
        const headerSize = 6 + 16 * pngs.length;
        const total = pngs.reduce((n, p) => n + p.length, headerSize);
        const buf = new ArrayBuffer(total);
        const dv = new DataView(buf);
        dv.setUint16(2, 1, true);
        dv.setUint16(4, pngs.length, true);
        let offset = headerSize;
        pngs.forEach((p, i) => {
            const o = 6 + 16 * i, sz = sizes[i];
            dv.setUint8(o, sz >= 256 ? 0 : sz);
            dv.setUint8(o + 1, sz >= 256 ? 0 : sz);
            dv.setUint16(o + 4, 1, true);
            dv.setUint16(o + 6, 32, true);
            dv.setUint32(o + 8, p.length, true);
            dv.setUint32(o + 12, offset, true);
            new Uint8Array(buf, offset, p.length).set(p);
            offset += p.length;
        });
        const top = sizes[sizes.length - 1];
        return { blob: new Blob([buf], { type: 'image/x-icon' }), w: top, h: top, note: sizes.join(', ') + ' px' };
    }

    async function render(dec, s) {
        if (s.fmt === 'ico') return makeIco(dec, s);
        const f = FORMATS[s.fmt];
        const { w, h } = targetSize(dec, s);
        if (w * h > 200e6) throw new Error('Das Zielbild wäre zu groß (' + w + ' × ' + h + ' px).');
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: s.fmt === 'bmp' });
        if (f.noAlpha) {
            ctx.fillStyle = s.bg;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(dec.src, 0, 0, w, h);
        if (s.fmt === 'bmp') return { blob: encodeBmp(ctx.getImageData(0, 0, w, h)), w, h };
        const blob = await toBlob(c, f.mime, f.lossy ? s.quality / 100 : undefined);
        if (!blob || blob.type !== f.mime) throw new Error(f.label + ' wird von diesem Browser nicht unterstützt.');
        return { blob, w, h };
    }

    function outName(it, s) {
        return it.base + s.suffix + '.' + FORMATS[s.fmt].ext;
    }

    async function convertItem(it, s) {
        try {
            if (!it.dec) it.dec = await decode(it.file);
            const r = await render(it.dec, s);
            it.result = { blob: r.blob, name: outName(it, s), w: r.w, h: r.h, note: r.note };
            it.error = null;
        } catch (e) {
            it.result = null;
            it.error = e && e.message ? e.message : 'Unbekannter Fehler';
        }
        paint(it);
    }

    async function convertAll() {
        const my = ++runId;
        const s = settings();
        items.forEach(it => { it.busy = true; paint(it); });
        for (const it of items.slice()) {
            if (my !== runId) return;
            await convertItem(it, s);
            it.busy = false;
            paint(it);
        }
    }

    const scheduleConvert = debounce(convertAll, 250);

    // ---- Anzeige -----------------------------------------------------------------------------------
    function paint(it) {
        const row = it.row;
        if (!row) return;
        const name = $('.wz-file-name', row), meta = $('.wz-file-meta', row), save = $('.js-save', row);
        if (it.busy || (!it.result && !it.error)) {
            name.textContent = it.file.name;
            meta.innerHTML = '<span>Wird umgewandelt …</span>';
            save.disabled = true;
            return;
        }
        if (it.error) {
            name.textContent = it.file.name;
            meta.innerHTML = '<span class="wz-badge is-err">Fehler</span><span>' + esc(it.error) + '</span>';
            save.disabled = true;
            return;
        }
        const r = it.result, o = it.file.size, n = r.blob.size;
        const diff = Math.round((1 - n / o) * 100);
        const badge = diff > 0 ? '<span class="wz-badge is-good">−' + diff + ' %</span>'
            : diff < 0 ? '<span class="wz-badge is-bad">+' + Math.abs(diff) + ' %</span>' : '';
        const dims = it.dec ? (it.dec.w === r.w && it.dec.h === r.h ? it.dec.w + ' × ' + it.dec.h + ' px'
            : it.dec.w + ' × ' + it.dec.h + ' → ' + r.w + ' × ' + r.h + ' px') : '';
        name.textContent = it.file.name + '  →  ' + r.name;
        name.title = name.textContent;
        meta.innerHTML = '<span>' + (r.note ? esc(r.note) : dims) + '</span><span>' + fmtBytes(o) + ' → ' + fmtBytes(n) + '</span>' + badge;
        save.disabled = false;
    }

    function updateChrome() {
        el.empty.classList.toggle('wz-hidden', items.length > 0);
        el.bulk.classList.toggle('wz-hidden', items.length === 0);
        el.count.textContent = items.length + (items.length === 1 ? ' Datei' : ' Dateien');
        el.zip.textContent = items.length === 1 ? 'Speichern' : 'Alle als ZIP speichern';
        ubReserveButtonWidth(el.zip);
    }

    function addRow(it) {
        const row = document.createElement('div');
        row.className = 'wz-file';
        row.innerHTML = '<img class="wz-file-thumb" alt="" src="' + it.thumb + '">'
            + '<div style="min-width:0"><div class="wz-file-name"></div><div class="wz-file-meta"></div></div>'
            + '<div class="wz-file-actions">'
            + '<button type="button" class="btn btn-secondary btn-compact js-save">Speichern</button>'
            + '<button type="button" class="wz-icon-btn js-remove" title="Entfernen" aria-label="Entfernen"><svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>'
            + '</div>';
        $('.js-save', row).addEventListener('click', () => {
            if (it.result) downloadBlob(it.result.blob, it.result.name);
        });
        $('.js-remove', row).addEventListener('click', () => removeItem(it));
        it.row = row;
        el.list.appendChild(row);
    }

    function removeItem(it) {
        const i = items.indexOf(it);
        if (i < 0) return;
        items.splice(i, 1);
        it.row.remove();
        URL.revokeObjectURL(it.thumb);
        if (it.dec) it.dec.close();
        updateChrome();
    }

    // ---- Dateien hinzufuegen ------------------------------------------------------------------------
    function addFiles(files) {
        const ok = files.filter(f => f.type.startsWith('image/') || /\.(ico|svg|bmp|avif|png|jpe?g|gif|webp)$/i.test(f.name));
        if (ok.length < files.length) toast((files.length - ok.length) + ' Datei(en) sind keine Bilder und wurden übersprungen');
        ok.forEach(file => {
            const it = { id: nextId++, file, base: file.name.replace(/\.[^.]+$/, '') || 'bild', thumb: URL.createObjectURL(file), busy: true };
            items.push(it);
            addRow(it);
            paint(it);
        });
        if (ok.length) {
            updateChrome();
            convertAll();
        }
    }

    // ---- ZIP (ohne Kompression) ---------------------------------------------------------------------------
    let crcTable;
    function crc32(u8) {
        if (!crcTable) {
            crcTable = new Uint32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
                crcTable[n] = c >>> 0;
            }
        }
        let c = 0xFFFFFFFF;
        for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    function makeZip(entries) {
        const enc = new TextEncoder();
        const parts = [], central = [];
        const d = new Date();
        const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
        const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
        let offset = 0;
        entries.forEach(e => {
            const nameB = enc.encode(e.name), crc = crc32(e.data), len = e.data.length;
            const lh = new DataView(new ArrayBuffer(30));
            lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
            lh.setUint16(10, time, true); lh.setUint16(12, date, true);
            lh.setUint32(14, crc, true); lh.setUint32(18, len, true); lh.setUint32(22, len, true);
            lh.setUint16(26, nameB.length, true);
            parts.push(new Uint8Array(lh.buffer), nameB, e.data);
            const ch = new DataView(new ArrayBuffer(46));
            ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
            ch.setUint16(12, time, true); ch.setUint16(14, date, true);
            ch.setUint32(16, crc, true); ch.setUint32(20, len, true); ch.setUint32(24, len, true);
            ch.setUint16(28, nameB.length, true); ch.setUint32(42, offset, true);
            central.push(new Uint8Array(ch.buffer), nameB);
            offset += 30 + nameB.length + len;
        });
        const cdSize = central.reduce((n, p) => n + p.length, 0);
        const end = new DataView(new ArrayBuffer(22));
        end.setUint32(0, 0x06054b50, true);
        end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
        end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
        return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
    }

    async function saveAll() {
        const done = items.filter(i => i.result);
        if (!done.length) return;
        if (done.length === 1) return downloadBlob(done[0].result.blob, done[0].result.name);
        const used = new Set(), entries = [];
        for (const it of done) {
            let name = it.result.name, n = 2;
            const dot = name.lastIndexOf('.');
            while (used.has(name.toLowerCase())) name = name.slice(0, dot) + ' (' + n++ + ')' + name.slice(dot);
            used.add(name.toLowerCase());
            entries.push({ name, data: new Uint8Array(await it.result.blob.arrayBuffer()) });
        }
        downloadBlob(makeZip(entries), 'umgewandelt.zip');
    }

    // ---- Formate pruefen (WebP/AVIF sind nicht ueberall verfuegbar) ----------------------------------------
    async function detectSupport() {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const webp = await toBlob(c, 'image/webp', 0.8);
        if (!webp || webp.type !== 'image/webp') {
            const inp = $('#fmt-webp');
            inp.disabled = true;
            inp.nextElementSibling.title = 'Dein Browser kann kein WebP erzeugen';
        }
        const avif = await toBlob(c, 'image/avif', 0.8);
        if (avif && avif.type === 'image/avif') {
            const seg = $('#fmtSeg');
            seg.insertAdjacentHTML('beforeend', '<input type="radio" name="fmt" id="fmt-avif" value="avif"><label for="fmt-avif">AVIF</label>');
        }
    }

    // ---- Verdrahten -------------------------------------------------------------------------------------------
    WZ.bindDrop(el.drop, addFiles);
    el.settings.addEventListener('input', () => { syncUi(); scheduleConvert(); });
    el.settings.addEventListener('change', () => { syncUi(); scheduleConvert(); });
    el.zip.addEventListener('click', saveAll);
    el.clear.addEventListener('click', () => items.slice().forEach(removeItem));

    document.addEventListener('paste', e => {
        const files = Array.from((e.clipboardData && e.clipboardData.files) || []);
        if (!files.length) return;
        e.preventDefault();
        addFiles(files.map((f, i) => f.name && f.name !== 'image.png' ? f : new File([f], 'Einfügung ' + (i + 1) + '.' + (f.type.split('/')[1] || 'png'), { type: f.type })));
    });

    syncUi();
    detectSupport();
    window.UBImgConv = { addFiles, items, settings };
})();
