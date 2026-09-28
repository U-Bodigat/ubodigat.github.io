// Video zu Audio — dekodiert die Tonspur lokal (Web Audio) und kodiert sie als MP3 (lamejs) oder WAV.
(function () {
    'use strict';
    const { $, $$, fmtBytes, fmtNum, downloadBlob, debounce } = WZ;

    const el = {
        drop: $('#drop'), loading: $('#loading'), loadingText: $('#loadingText'), errBox: $('#errorBox'), errText: $('#errorText'),
        editor: $('#editor'), title: $('#fileTitle'), badge: $('#fileBadge'), wave: $('#wave'),
        s: $('#trimStart'), e: $('#trimEnd'), sOut: $('#startOut'), eOut: $('#endOut'), sel: $('#selInfo'), play: $('#playBtn'),
        convert: $('#convertBtn'), progress: $('#progress'), progressBar: $('#progress i'), progressText: $('#progressText'),
        result: $('#resultPanel'), audio: $('#resultAudio'), save: $('#saveBtn'), resultBadge: $('#resultBadge'),
        brField: $('#brField'),
    };

    const S = { file: null, buffer: null, peaks: null, result: null, resultName: '', playCtx: null, playSrc: null, playStart: 0, playDur: 0, playing: false, busy: false };
    const DECODE_RATE = 48000;
    const yieldUi = () => new Promise(r => setTimeout(r, 0));

    // ---- Hilfen -------------------------------------------------------------------------
    function fmtTime(sec) {
        const m = Math.floor(sec / 60), s = sec - m * 60;
        return m + ':' + (s < 10 ? '0' : '') + fmtNum(s, 1);
    }

    function showError(msg) {
        el.errText.textContent = msg;
        el.errBox.classList.remove('wz-hidden');
    }

    function selection() {
        const dur = S.buffer ? S.buffer.duration : 0;
        const a = (+el.s.value / 1000) * dur, b = (+el.e.value / 1000) * dur;
        return { start: Math.min(a, b), end: Math.max(a, b) };
    }

    // ---- Datei laden ------------------------------------------------------------------------
    async function load(files) {
        const file = files[0];
        stopPlay();
        el.errBox.classList.add('wz-hidden');
        el.editor.classList.add('wz-hidden');
        el.result.classList.add('wz-hidden');
        el.convert.disabled = true;
        S.buffer = null;
        S.result = null;
        if (file.size > 2 * 1024 * 1024 * 1024) return showError('Die Datei ist größer als 2 GB — das schafft der Browser nicht zuverlässig. Bitte kürze oder komprimiere das Video zuerst.');
        el.loading.classList.remove('wz-hidden');
        el.loadingText.textContent = 'Datei wird gelesen (' + fmtBytes(file.size) + ') …';
        try {
            const ab = await file.arrayBuffer();
            el.loadingText.textContent = 'Tonspur wird dekodiert …';
            await yieldUi();
            const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, 1, DECODE_RATE);
            const buf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
            S.file = file;
            S.buffer = buf;
            computePeaks();
            el.title.textContent = file.name;
            el.title.title = file.name;
            el.badge.textContent = fmtTime(buf.duration) + ' · ' + buf.numberOfChannels + (buf.numberOfChannels === 1 ? ' Kanal' : ' Kanäle');
            el.s.value = 0; el.e.value = 1000;
            WZ.bindRange(el.s); WZ.bindRange(el.e);
            el.editor.classList.remove('wz-hidden');
            el.convert.disabled = false;
            updateSel();
            drawWave();
        } catch (err) {
            console.error(err);
            showError('Aus dieser Datei konnte kein Ton gelesen werden. Entweder enthält sie keine Tonspur, oder der Browser kennt das Format/den Codec nicht (z. B. AC3, DTS, HEVC-Ton). Versuche eine MP4 (AAC) oder WebM-Datei.');
        } finally {
            el.loading.classList.add('wz-hidden');
        }
    }

    // ---- Wellenform ------------------------------------------------------------------------------
    function computePeaks() {
        const b = S.buffer, n = 1200, len = b.length, step = len / n;
        const ch = [];
        for (let c = 0; c < b.numberOfChannels; c++) ch.push(b.getChannelData(c));
        const peaks = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const from = Math.floor(i * step), to = Math.min(len, Math.floor((i + 1) * step));
            const stride = Math.max(1, Math.floor((to - from) / 200));
            let max = 0;
            for (let c = 0; c < ch.length; c++) for (let j = from; j < to; j += stride) { const v = Math.abs(ch[c][j]); if (v > max) max = v; }
            peaks[i] = max;
        }
        S.peaks = peaks;
    }

    function drawWave(playFrac) {
        const c = el.wave, dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = c.clientWidth, h = c.clientHeight;
        if (!w) return;
        if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
        const ctx = c.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (!S.peaks) return;
        const css = getComputedStyle(document.documentElement);
        const on = css.getPropertyValue('--accent-bright').trim() || '#02a34a';
        const off = css.getPropertyValue('--border-strong').trim() || '#444';
        const sel = selection(), dur = S.buffer.duration;
        const x0 = (sel.start / dur) * w, x1 = (sel.end / dur) * w;
        const bars = Math.floor(w / 4), mid = h / 2;
        for (let i = 0; i < bars; i++) {
            const p = S.peaks[Math.min(S.peaks.length - 1, Math.floor((i / bars) * S.peaks.length))];
            const bh = Math.max(2, p * (h - 6));
            const x = i * 4 + 1;
            ctx.fillStyle = x >= x0 - 2 && x <= x1 ? on : off;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, mid - bh / 2, 2.4, bh, 1.2) : ctx.rect(x, mid - bh / 2, 2.4, bh);
            ctx.fill();
        }
        if (playFrac != null) {
            const x = playFrac * w;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 1, 0, 2, h);
        }
    }

    function updateSel() {
        const sel = selection();
        el.sOut.textContent = fmtTime(sel.start);
        el.eOut.textContent = fmtTime(sel.end);
        el.sel.textContent = 'Auswahl: ' + fmtTime(sel.end - sel.start) + ' von ' + fmtTime(S.buffer.duration);
        drawWave();
    }

    // ---- Vorhoeren ------------------------------------------------------------------------------------
    function stopPlay() {
        if (S.playSrc) { try { S.playSrc.onended = null; S.playSrc.stop(); } catch (e) { /* egal */ } }
        if (S.playCtx) { try { S.playCtx.close(); } catch (e) { /* egal */ } }
        S.playSrc = S.playCtx = null;
        S.playing = false;
        el.play.textContent = 'Vorhören';
        ubReserveButtonWidth(el.play);
        if (S.buffer) drawWave();
    }

    function startPlay() {
        const sel = selection();
        if (sel.end - sel.start < 0.05) return;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createBufferSource();
        src.buffer = S.buffer;
        src.connect(ctx.destination);
        S.playCtx = ctx; S.playSrc = src; S.playStart = sel.start; S.playDur = sel.end - sel.start; S.playing = true;
        src.onended = stopPlay;
        src.start(0, sel.start, S.playDur);
        el.play.textContent = 'Stopp';
        ubReserveButtonWidth(el.play);
        const t0 = ctx.currentTime;
        (function loop() {
            if (!S.playing) return;
            const frac = (S.playStart + (ctx.currentTime - t0)) / S.buffer.duration;
            drawWave(Math.min(1, frac));
            requestAnimationFrame(loop);
        })();
    }

    // ---- Verarbeitung -------------------------------------------------------------------------------------
    async function processAudio(opts) {
        const b = S.buffer, sel = selection();
        const i0 = Math.floor(sel.start * b.sampleRate), i1 = Math.min(b.length, Math.ceil(sel.end * b.sampleRate));
        const len = i1 - i0;
        const nch = opts.channels === 1 ? 1 : Math.min(2, b.numberOfChannels);
        const srcData = [];
        for (let c = 0; c < b.numberOfChannels; c++) srcData.push(b.getChannelData(c).subarray(i0, i1));

        // Kanaele bilden (Mono = Mittelwert aus L/R)
        let chans = [];
        if (nch === 1) {
            const m = new Float32Array(len);
            const n = b.numberOfChannels;
            for (let i = 0; i < len; i++) { let s = 0; for (let c = 0; c < n; c++) s += srcData[c][i]; m[i] = s / n; }
            chans = [m];
        } else {
            chans = [Float32Array.from(srcData[0]), Float32Array.from(srcData[b.numberOfChannels > 1 ? 1 : 0])];
        }

        // Neu abtasten
        let rate = b.sampleRate;
        if (opts.rate !== b.sampleRate) {
            const outLen = Math.ceil(len * opts.rate / b.sampleRate);
            const off = new OfflineAudioContext(nch, outLen, opts.rate);
            const tmp = off.createBuffer(nch, len, b.sampleRate);
            chans.forEach((d, c) => tmp.copyToChannel(d, c));
            const node = off.createBufferSource();
            node.buffer = tmp;
            node.connect(off.destination);
            node.start();
            const out = await off.startRendering();
            chans = [];
            for (let c = 0; c < nch; c++) chans.push(out.getChannelData(c));
            rate = opts.rate;
        }

        // Normalisieren
        if (opts.normalize) {
            let peak = 0;
            chans.forEach(d => { for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; } });
            if (peak > 0.0001) { const g = 0.97 / peak; chans.forEach(d => { for (let i = 0; i < d.length; i++) d[i] *= g; }); }
        }

        // Ein-/Ausblenden
        if (opts.fade) {
            const n = Math.min(Math.floor(rate * 0.5), Math.floor(chans[0].length / 4));
            chans.forEach(d => {
                for (let i = 0; i < n; i++) { const g = i / n; d[i] *= g; d[d.length - 1 - i] *= g; }
            });
        }
        return { chans, rate };
    }

    const toInt16 = f => { const s = Math.max(-1, Math.min(1, f)); return s < 0 ? s * 0x8000 : s * 0x7FFF; };

    function encodeWav(chans, rate) {
        const nch = chans.length, len = chans[0].length, bytes = len * nch * 2;
        const buf = new ArrayBuffer(44 + bytes), dv = new DataView(buf);
        const wr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
        wr(0, 'RIFF'); dv.setUint32(4, 36 + bytes, true); wr(8, 'WAVE'); wr(12, 'fmt ');
        dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nch, true);
        dv.setUint32(24, rate, true); dv.setUint32(28, rate * nch * 2, true); dv.setUint16(32, nch * 2, true); dv.setUint16(34, 16, true);
        wr(36, 'data'); dv.setUint32(40, bytes, true);
        let o = 44;
        for (let i = 0; i < len; i++) for (let c = 0; c < nch; c++) { dv.setInt16(o, toInt16(chans[c][i]), true); o += 2; }
        return new Blob([buf], { type: 'audio/wav' });
    }

    async function encodeMp3(chans, rate, kbps, onProgress) {
        if (typeof lamejs === 'undefined') throw new Error('MP3-Encoder konnte nicht geladen werden.');
        const nch = chans.length, len = chans[0].length;
        const enc = new lamejs.Mp3Encoder(nch, rate, kbps);
        const block = 1152 * 10, parts = [];
        const i16 = chans.map(d => { const a = new Int16Array(d.length); for (let i = 0; i < d.length; i++) a[i] = toInt16(d[i]); return a; });
        for (let p = 0, n = 0; p < len; p += block, n++) {
            const l = i16[0].subarray(p, p + block);
            const chunk = nch === 2 ? enc.encodeBuffer(l, i16[1].subarray(p, p + block)) : enc.encodeBuffer(l);
            if (chunk.length) parts.push(new Uint8Array(chunk));
            if (n % 40 === 0) { onProgress(p / len); await yieldUi(); }
        }
        const tail = enc.flush();
        if (tail.length) parts.push(new Uint8Array(tail));
        return new Blob(parts, { type: 'audio/mpeg' });
    }

    async function convert() {
        if (S.busy || !S.buffer) return;
        S.busy = true;
        stopPlay();
        el.convert.disabled = true;
        el.result.classList.add('wz-hidden');
        el.progress.classList.remove('wz-hidden');
        const setP = (f, t) => { el.progressBar.style.width = Math.round(f * 100) + '%'; el.progressText.textContent = t || ''; };
        try {
            const fmt = $('input[name=fmt]:checked').value;
            const opts = {
                channels: +$('input[name=ch]:checked').value, rate: +$('input[name=sr]:checked').value,
                normalize: $('#normalize').checked, fade: $('#fade').checked,
            };
            setP(0.03, 'Ton wird aufbereitet …');
            await yieldUi();
            const { chans, rate } = await processAudio(opts);
            let blob;
            if (fmt === 'wav') {
                setP(0.6, 'WAV wird geschrieben …');
                await yieldUi();
                blob = encodeWav(chans, rate);
            } else {
                blob = await encodeMp3(chans, rate, +$('input[name=br]:checked').value, f => setP(0.1 + f * 0.88, 'MP3 wird kodiert … ' + Math.round(f * 100) + ' %'));
            }
            setP(1, 'Fertig.');
            const base = S.file.name.replace(/\.[^.]+$/, '') || 'audio';
            S.result = blob;
            S.resultName = base + '.' + (fmt === 'wav' ? 'wav' : 'mp3');
            if (el.audio.src) URL.revokeObjectURL(el.audio.src);
            el.audio.src = URL.createObjectURL(blob);
            el.resultBadge.textContent = fmtBytes(blob.size) + ' · ' + S.resultName.split('.').pop().toUpperCase();
            el.result.classList.remove('wz-hidden');
        } catch (err) {
            console.error(err);
            setP(0, '');
            showError('Beim Umwandeln ist etwas schiefgelaufen: ' + (err && err.message ? err.message : err));
        } finally {
            S.busy = false;
            el.convert.disabled = false;
            setTimeout(() => el.progress.classList.add('wz-hidden'), 800);
        }
    }

    // ---- Verdrahten ------------------------------------------------------------------------------------------
    WZ.bindDrop(el.drop, load);
    [el.s, el.e].forEach(i => i.addEventListener('input', () => { stopPlay(); updateSel(); }));
    el.play.addEventListener('click', () => (S.playing ? stopPlay() : startPlay()));
    el.convert.addEventListener('click', convert);
    el.save.addEventListener('click', () => S.result && downloadBlob(S.result, S.resultName));
    $$('input[name=fmt]').forEach(r => r.addEventListener('change', () => el.brField.classList.toggle('wz-hidden', $('input[name=fmt]:checked').value !== 'mp3')));
    window.addEventListener('resize', debounce(() => S.buffer && drawWave(), 150));
    window.UBVideoAudio = { load, convert, state: S };
})();
