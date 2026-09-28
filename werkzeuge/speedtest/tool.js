// Speedtest — misst Ping, Jitter, Download und Upload gegen speed.cloudflare.com.
// Die Oberflaeche (Warp-Sternenfeld, Tacho, Ringe, Sparklines) ist vom Netzwerk-
// Teil getrennt: window.UBSpeed.setTransport() erlaubt einen Ersatz (z. B. zum Testen).
(function () {
    'use strict';
    const { $, $$, fmtNum, fmtBytes, esc, copyText, toast } = WZ;
    const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // =====================================================================
    //  Netzwerk (Cloudflare Speed Test)
    // =====================================================================
    function abortError() { return new DOMException('Abgebrochen', 'AbortError'); }

    function runSampler(opts) {
        const { duration, getBytes, onSample, signal } = opts;
        const start = performance.now();
        const pts = [{ t: 0, b: 0 }];
        let lastB = 0, lastMove = 0;
        return new Promise((resolve, reject) => {
            const iv = setInterval(() => {
                if (signal.aborted) { clearInterval(iv); return reject(abortError()); }
                const el = performance.now() - start;
                const b = getBytes();
                pts.push({ t: el, b });
                let i = pts.length - 1;
                while (i > 0 && el - pts[i - 1].t <= 1000) i--;
                const a = pts[i], win = (el - a.t) / 1000;
                const mbps = win > 0.05 ? ((b - a.b) * 8) / 1e6 / win : 0;
                onSample(mbps, Math.min(1, el / duration), b);
                if (b > lastB) { lastB = b; lastMove = el; }
                else if (el - lastMove > 8000) { clearInterval(iv); return reject(new Error('Es kommen keine Daten an.')); }
                if (el >= duration) {
                    clearInterval(iv);
                    const warm = Math.min(2000, duration * 0.25);
                    const w = pts.find(p => p.t >= warm) || pts[0];
                    const dt = (el - w.t) / 1000;
                    resolve({ mbps: dt > 0 ? ((b - w.b) * 8) / 1e6 / dt : 0, bytes: b });
                }
            }, 100);
        });
    }

    function createCloudflareTransport() {
        const BASE = 'https://speed.cloudflare.com';
        const meta = {};

        // Cloudflare liefert Standort/AS/Testserver nicht (mehr) ueber die
        // cf-meta-*-Antwort-Kopfzeilen von /__down (nur cf-meta-ip ist dort
        // noch vorhanden) — stattdessen ueber einen eigenen JSON-Endpunkt.
        async function fetchMeta() {
            try {
                const res = await fetch(BASE + '/meta', { cache: 'no-store' });
                const j = await res.json();
                meta.colo = (j.colo && j.colo.iata) || '';
                meta.city = j.city || '';
                meta.country = j.country || '';
                meta.asn = j.asn != null ? String(j.asn) : '';
                meta.asOrg = j.asOrganization || '';
                meta.ip = j.clientIp || '';
            } catch (e) { /* Zusatzinfos sind optional, die eigentliche Messung braucht sie nicht */ }
        }

        function serverMs(res) {
            const m = /cfSpeedWorker;dur=([\d.]+)/.exec(res.headers.get('server-timing') || '');
            return m ? parseFloat(m[1]) : 0;
        }

        async function ping(cb, signal) {
            const metaPromise = fetchMeta();
            const times = [];
            for (let i = 0; i < 14; i++) {
                const url = BASE + '/__down?bytes=0&_=' + Date.now() + '-' + i;
                const t0 = performance.now();
                const res = await fetch(url, { cache: 'no-store', signal });
                await res.arrayBuffer();
                const t1 = performance.now();
                if (i === 0) continue; // Verbindungsaufbau zaehlt nicht
                let ms = t1 - t0 - serverMs(res);
                const e = performance.getEntriesByName(url)[0];
                if (e && e.requestStart > 0 && e.responseStart > 0) ms = Math.min(ms, e.responseStart - e.requestStart - serverMs(res));
                ms = Math.max(0.5, ms);
                times.push(ms);
                cb(ms, times);
            }
            try { performance.clearResourceTimings(); } catch (e) { /* egal */ }
            await metaPromise;
            const sorted = times.slice().sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            let jit = 0;
            for (let i = 1; i < times.length; i++) jit += Math.abs(times[i] - times[i - 1]);
            return { ping: median, jitter: times.length > 1 ? jit / (times.length - 1) : 0 };
        }

        async function download(cb, signal, o) {
            const ladder = [2e6, 8e6, 25e6, 50e6, 100e6];
            let total = 0, stop = false;
            const ctl = new AbortController();
            signal.addEventListener('abort', () => ctl.abort());

            async function worker() {
                let step = 0;
                while (!stop) {
                    const size = ladder[Math.min(step++, ladder.length - 1)];
                    try {
                        const res = await fetch(BASE + '/__down?bytes=' + size + '&_=' + Math.random(), { cache: 'no-store', signal: ctl.signal });
                        if (!res.body) { total += (await res.arrayBuffer()).byteLength; continue; }
                        const reader = res.body.getReader();
                        for (;;) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            total += value.length;
                            if (stop) { reader.cancel(); break; }
                        }
                    } catch (e) {
                        if (stop || ctl.signal.aborted) return;
                        throw e;
                    }
                }
            }

            const workers = Array.from({ length: o.streams }, worker);
            const sampler = runSampler({ duration: o.duration, getBytes: () => total, onSample: cb, signal });
            try {
                return await Promise.race([sampler, ...workers.map(w => w.then(() => new Promise(() => {})))]);
            } finally {
                stop = true;
                ctl.abort();
            }
        }

        function makePayload(size) {
            const block = new Uint8Array(1 << 20);
            for (let o = 0; o < block.length; o += 65536) crypto.getRandomValues(block.subarray(o, o + 65536));
            const parts = [];
            let rem = size;
            while (rem > 0) {
                const n = Math.min(rem, block.length);
                parts.push(n === block.length ? block : block.subarray(0, n));
                rem -= n;
            }
            return new Blob(parts, { type: 'text/plain' });
        }

        async function upload(cb, signal, o) {
            const ladder = [1e6, 4e6, 10e6, 25e6, 50e6];
            const payloads = ladder.map(makePayload);
            let total = 0, stop = false;
            const active = new Set();

            function send(blob) {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    let last = 0;
                    active.add(xhr);
                    xhr.open('POST', BASE + '/__up?_=' + Math.random());
                    xhr.upload.onprogress = e => { total += e.loaded - last; last = e.loaded; };
                    xhr.onload = () => { active.delete(xhr); total += blob.size - last; resolve(); };
                    xhr.onerror = () => { active.delete(xhr); reject(new Error('Upload fehlgeschlagen')); };
                    xhr.onabort = () => { active.delete(xhr); resolve(); };
                    xhr.send(blob);
                });
            }

            async function worker() {
                let step = 0;
                while (!stop) await send(payloads[Math.min(step++, payloads.length - 1)]);
            }

            const workers = Array.from({ length: o.streams }, worker);
            const sampler = runSampler({ duration: o.duration, getBytes: () => total, onSample: cb, signal });
            try {
                return await Promise.race([sampler, ...workers.map(w => w.then(() => new Promise(() => {})))]);
            } finally {
                stop = true;
                active.forEach(x => x.abort());
            }
        }

        return { meta, ping, download, upload };
    }

    let T = createCloudflareTransport();

    // =====================================================================
    //  Oberflaeche
    // =====================================================================
    const stage = $('#stage'), arc = $('#arc'), needle = $('#needle'), ticksG = $('#ticks');
    const numEl = $('#speedNum'), unitEl = $('#speedUnit'), phaseText = $('#phaseText'), startBtn = $('#startBtn');
    const tile = k => $('.st-tile[data-k="' + k + '"]');
    const ARC_LEN = Math.PI * 118;
    const MAX_SPEED = 1000, MAX_PING = 300;

    const scales = {
        speed: v => Math.max(0, Math.min(1, Math.log10(1 + v) / Math.log10(1 + MAX_SPEED))),
        ping: v => Math.max(0, Math.min(1, Math.log10(1 + v) / Math.log10(1 + MAX_PING))),
    };
    const tickSets = { speed: [0, 5, 10, 25, 50, 100, 250, 500, 1000], ping: [0, 5, 10, 25, 50, 100, 300] };

    const S = { phase: 'idle', mode: 'speed', running: false, ctl: null, disp: 0, target: 0, num: 0, numTarget: 0, flow: 0.04, boost: 0, results: {}, spark: { ping: [], jitter: [], download: [], upload: [] }, bytes: 0 };

    function renderTicks() {
        const R = 118, cx = 160, cy = 168;
        let h = '';
        tickSets[S.mode].forEach(v => {
            const a = Math.PI + scales[S.mode](v) * Math.PI, c = Math.cos(a), s = Math.sin(a);
            h += '<line class="st-tick" x1="' + (cx + c * (R + 12)) + '" y1="' + (cy + s * (R + 12)) + '" x2="' + (cx + c * (R + 19)) + '" y2="' + (cy + s * (R + 19)) + '"></line>'
                + '<text class="st-tick-label" x="' + (cx + c * (R + 32)) + '" y="' + (cy + s * (R + 32)) + '">' + v + '</text>';
        });
        ticksG.innerHTML = h;
    }

    function setMode(m) {
        S.mode = m;
        unitEl.textContent = m === 'ping' ? 'ms' : 'Mbit/s';
        renderTicks();
    }

    function fmtVal(n) {
        if (S.mode === 'ping') return fmtNum(n, n < 10 ? 1 : 0);
        return n < 10 ? fmtNum(n, 2) : n < 100 ? fmtNum(n, 1) : fmtNum(n, 0);
    }

    function setPhase(p, text) {
        S.phase = p;
        stage.dataset.phase = p;
        phaseText.textContent = text;
        $$('.st-tile').forEach(t => {
            const k = t.dataset.k;
            t.classList.toggle('is-active', (p === 'ping' && (k === 'ping' || k === 'jitter')) || p === k);
        });
    }

    function ring() {
        if (reduced) return;
        const r = document.createElement('i');
        r.className = 'st-ring';
        r.addEventListener('animationend', () => r.remove());
        $('#rings').appendChild(r);
    }

    // ---- Sparklines ---------------------------------------------------------------
    function drawSpark(k) {
        const arr = S.spark[k];
        const poly = $('polyline', tile(k));
        if (arr.length < 2) { poly.setAttribute('points', ''); return; }
        const max = Math.max(...arr, 0.0001);
        const step = Math.max(1, Math.ceil(arr.length / 100));
        const pts = [];
        for (let i = 0; i < arr.length; i += step) pts.push((i / (arr.length - 1) * 100).toFixed(1) + ',' + (28 - (arr[i] / max) * 26).toFixed(1));
        poly.setAttribute('points', pts.join(' '));
    }

    function pushSpark(k, v) {
        S.spark[k].push(v);
        drawSpark(k);
    }

    function pop(k) {
        const t = tile(k);
        t.classList.remove('is-pop');
        void t.offsetWidth;
        t.classList.add('is-pop');
        t.classList.add('is-done');
    }

    // ---- Warp-Sternenfeld (Canvas) ------------------------------------------------------
    const warp = (() => {
        const c = $('#warp'), ctx = c.getContext('2d');
        const palette = {
            idle: ['#7aa2ff', '#ffffff'], ping: ['#b48cff', '#ff6ec7'], download: ['#2d7bff', '#2dd4ff'],
            upload: ['#02a34a', '#b8f36a'], done: ['#2d7bff', '#4ade80'], error: ['#ff5d5d', '#ff9f1c'],
        };
        const N = reduced ? 40 : 190;
        const stars = [];
        let w = 0, h = 0;

        function resize() {
            const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
            w = r.width; h = r.height;
            c.width = Math.max(1, Math.round(w * dpr));
            c.height = Math.max(1, Math.round(h * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = '#04060a';
            ctx.fillRect(0, 0, w, h);
        }

        function spawn(s, anywhere, inward) {
            s.a = Math.random() * Math.PI * 2;
            s.r = anywhere ? Math.random() : inward ? 1 : Math.random() * 0.04;
            s.v = 0.25 + Math.random() * 0.75;
            s.k = Math.random() < 0.5 ? 0 : 1;
        }

        for (let i = 0; i < N; i++) { const s = {}; spawn(s, true, false); stars.push(s); }
        if (window.ResizeObserver) new ResizeObserver(resize).observe(c); else window.addEventListener('resize', resize);
        resize();

        function draw(dt, flow, phase) {
            const inward = phase === 'upload';
            const dir = inward ? -1 : 1;
            const col = palette[phase] || palette.idle;
            const cx = w / 2, cy = h * 0.46, R = Math.hypot(w, h) * 0.5;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(4,6,10,' + (reduced ? 1 : 0.34 - flow * 0.16).toFixed(3) + ')';
            ctx.fillRect(0, 0, w, h);
            if (reduced) return;
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            const speed = 0.06 + flow * 2.1;
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.r += dir * s.v * speed * dt * 0.5 * (0.35 + s.r * 1.5);
                if (s.r > 1.05 || s.r < 0.01) { spawn(s, false, inward); continue; }
                const trail = (0.008 + flow * 0.1) * s.v * (0.4 + s.r);
                const r0 = s.r - dir * trail;
                const ca = Math.cos(s.a), sa = Math.sin(s.a);
                ctx.globalAlpha = Math.min(1, (0.12 + s.r * 0.9) * (0.35 + flow * 0.65));
                ctx.strokeStyle = col[s.k];
                ctx.lineWidth = 0.5 + s.r * (1.1 + flow * 2.4);
                ctx.beginPath();
                ctx.moveTo(cx + ca * r0 * R, cy + sa * r0 * R);
                ctx.lineTo(cx + ca * s.r * R, cy + sa * s.r * R);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        return { draw };
    })();

    // ---- Animations-Schleife -----------------------------------------------------------------
    let last = performance.now(), shownNum = '';
    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        S.disp += (S.target - S.disp) * (1 - Math.exp(-dt * (reduced ? 30 : 7)));
        S.num += (S.numTarget - S.num) * (1 - Math.exp(-dt * (reduced ? 30 : 9)));
        S.boost = Math.max(0, S.boost - dt * 1.4);
        arc.style.strokeDashoffset = (ARC_LEN * (1 - S.disp)).toFixed(2);
        needle.style.transform = 'rotate(' + (S.disp * 180).toFixed(2) + 'deg)';
        const txt = fmtVal(S.num);
        if (txt !== shownNum) { numEl.textContent = txt; shownNum = txt; }
        let flow;
        if (S.phase === 'download' || S.phase === 'upload') flow = 0.12 + Math.sqrt(S.disp) * 0.88;
        else if (S.phase === 'ping') flow = 0.16 + S.boost * 0.5;
        else if (S.phase === 'done') flow = 0.1;
        else flow = 0.04;
        S.flow += (flow - S.flow) * (1 - Math.exp(-dt * 3));
        warp.draw(dt, S.flow, S.phase);
        requestAnimationFrame(frame);
    }

    // =====================================================================
    //  Ablauf
    // =====================================================================
    function resetUi() {
        S.results = {}; S.spark = { ping: [], jitter: [], download: [], upload: [] }; S.bytes = 0;
        ['tPing', 'tJitter', 'tDown', 'tUp'].forEach(id => { $('#' + id).textContent = '–'; });
        $$('.st-tile').forEach(t => { t.classList.remove('is-done', 'is-active', 'is-pop'); $('polyline', t).setAttribute('points', ''); });
        S.disp = S.target = S.num = S.numTarget = 0;
        $('#copyBtn').disabled = true;
    }

    function setButton(running) {
        startBtn.textContent = running ? 'Abbrechen' : 'Test starten';
        startBtn.classList.toggle('btn-primary', !running);
        startBtn.classList.toggle('btn-secondary', running);
        ubReserveButtonWidth(startBtn);
        stage.dataset.running = running ? '1' : '0';
    }

    async function run() {
        if (S.running) { S.ctl.abort(); return; }
        S.running = true;
        S.ctl = new AbortController();
        const signal = S.ctl.signal;
        const dur = +$('input[name=dur]:checked').value;
        resetUi();
        setButton(true);
        try {
            setMode('ping');
            setPhase('ping', 'Ping wird gemessen …');
            ring();
            const p = await T.ping((ms, arr) => {
                S.numTarget = ms; S.target = scales.ping(ms); S.boost = 1; ring();
                $('#tPing').textContent = fmtNum(ms, ms < 10 ? 1 : 0);
                pushSpark('ping', ms);
            }, signal);
            S.results.ping = p.ping; S.results.jitter = p.jitter;
            $('#tPing').textContent = fmtNum(p.ping, p.ping < 10 ? 1 : 0);
            $('#tJitter').textContent = fmtNum(p.jitter, p.jitter < 10 ? 1 : 0);
            pushSpark('jitter', p.jitter);
            pop('ping'); pop('jitter');
            const m = T.meta || {};
            $('#kvServer').textContent = m.colo ? 'Cloudflare ' + m.colo : '–';
            $('#kvLoc').textContent = [m.city, m.country].filter(Boolean).join(', ') || '–';
            $('#kvAsn').textContent = m.asn ? ('AS' + m.asn + (m.asOrg ? ' · ' + m.asOrg : '')) : '–';
            $('#kvIp').textContent = m.ip || '–';

            setMode('speed');
            S.target = 0; S.numTarget = 0;
            setPhase('download', 'Download wird gemessen …');
            ring();
            const d = await T.download((mbps) => {
                S.numTarget = mbps; S.target = scales.speed(mbps);
                $('#tDown').textContent = fmtVal(mbps);
                pushSpark('download', mbps);
            }, signal, { duration: dur, streams: 4 });
            S.results.download = d.mbps; S.bytes += d.bytes;
            $('#tDown').textContent = fmtVal(d.mbps);
            S.numTarget = d.mbps; S.target = scales.speed(d.mbps);
            pop('download'); ring();
            await new Promise(r => setTimeout(r, 700));

            S.target = 0; S.numTarget = 0;
            setPhase('upload', 'Upload wird gemessen …');
            ring();
            const u = await T.upload((mbps) => {
                S.numTarget = mbps; S.target = scales.speed(mbps);
                $('#tUp').textContent = fmtVal(mbps);
                pushSpark('upload', mbps);
            }, signal, { duration: dur, streams: 3 });
            S.results.upload = u.mbps; S.bytes += u.bytes;
            $('#tUp').textContent = fmtVal(u.mbps);
            pop('upload');

            finish();
        } catch (e) {
            if (e && e.name === 'AbortError') {
                setPhase('idle', 'Test abgebrochen');
                S.target = 0; S.numTarget = 0;
            } else {
                console.error(e);
                setPhase('error', 'Messung fehlgeschlagen');
                $('#verdictTitle').textContent = 'Keine Verbindung zum Testserver';
                $('#verdictText').textContent = 'speed.cloudflare.com ist nicht erreichbar. Häufige Ursachen: Werbeblocker, Firewall/VPN oder keine Internetverbindung. (' + (e && e.message ? e.message : 'unbekannter Fehler') + ')';
                $('#uses').innerHTML = '';
                S.target = 0; S.numTarget = 0;
            }
        } finally {
            S.running = false;
            setButton(false);
        }
    }

    function finish() {
        const r = S.results;
        setPhase('done', 'Fertig — Ergebnis unten');
        S.numTarget = r.download; S.target = scales.speed(r.download);
        unitEl.textContent = 'Mbit/s · Download';
        ring();
        setTimeout(ring, 250);
        setTimeout(ring, 500);
        renderVerdict(r);
        $('#kvData').textContent = '≈ ' + fmtBytes(S.bytes);
        $('#copyBtn').disabled = false;
        saveHistory({ t: Date.now(), ping: r.ping, jitter: r.jitter, down: r.download, up: r.upload, colo: (T.meta || {}).colo || '' });
    }

    // ---- Einschaetzung ---------------------------------------------------------------------------
    const CHECK = '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
    const CROSS = '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

    function renderVerdict(r) {
        const d = r.download;
        const grade = d < 10 ? ['Langsam', 'Für E-Mails und einfaches Surfen reicht das, bei Videos und großen Downloads wird es zäh.']
            : d < 50 ? ['Solide', 'Surfen, Musik und HD-Videos laufen problemlos, mehrere Geräte gleichzeitig können aber bremsen.']
            : d < 150 ? ['Schnell', 'Auch mehrere Streams, Videocalls und Downloads gleichzeitig sind kein Problem.']
            : d < 500 ? ['Sehr schnell', 'Große Dateien, 4K-Streams und mehrere Nutzer parallel — deine Leitung hat reichlich Reserve.']
            : ['Ultraschnell', 'Gigabit-Klasse: Die Leitung ist praktisch nie der Flaschenhals.'];
        $('#verdictTitle').textContent = grade[0] + ' · ' + fmtNum(d, d < 10 ? 1 : 0) + ' Mbit/s';
        $('#verdictText').textContent = grade[1];
        const uses = [
            ['Videocalls', d >= 3 && r.upload >= 3 && r.ping < 150],
            ['HD-Streaming', d >= 5],
            ['4K-Streaming', d >= 25],
            ['Online-Gaming', r.ping < 60 && r.jitter < 20],
            ['Große Downloads & Cloud', d >= 100 && r.upload >= 20],
        ];
        $('#uses').innerHTML = uses.map(u => '<span class="st-use ' + (u[1] ? 'is-ok' : 'is-no') + '">' + (u[1] ? CHECK : CROSS) + u[0] + '</span>').join('');
    }

    // ---- Verlauf (localStorage) -----------------------------------------------------------------------
    const KEY = 'ubodigat-speedtest-history';
    function loadHistory() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
    function saveHistory(entry) {
        const h = loadHistory();
        h.unshift(entry);
        try { localStorage.setItem(KEY, JSON.stringify(h.slice(0, 8))); } catch (e) { /* voll/gesperrt */ }
        renderHistory();
    }
    function renderHistory() {
        const h = loadHistory(), box = $('#history');
        if (!h.length) { box.innerHTML = '<div class="wz-empty">Noch keine Messungen gespeichert.</div>'; return; }
        const f = n => fmtNum(n, n < 10 ? 1 : 0);
        box.innerHTML = '<div style="overflow-x:auto"><table class="st-hist"><thead><tr><th>Zeit</th><th>Ping</th><th>Download</th><th>Upload</th></tr></thead><tbody>'
            + h.map(e => '<tr><td>' + new Date(e.t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + f(e.ping) + ' ms</td><td>' + f(e.down) + ' Mbit/s</td><td>' + f(e.up) + ' Mbit/s</td></tr>').join('')
            + '</tbody></table></div>';
    }

    // ---- Verdrahten ----------------------------------------------------------------------------------------------
    startBtn.addEventListener('click', run);
    $('#clearHistory').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) { /* egal */ } renderHistory(); toast('Verlauf gelöscht'); });
    $('#ipToggle').addEventListener('click', () => $('#kvIp').classList.toggle('is-shown'));
    $('#copyBtn').addEventListener('click', () => {
        const r = S.results;
        if (r.download == null) return;
        const f = n => fmtNum(n, n < 10 ? 1 : 0);
        copyText('Speedtest (ubodigat.com/werkzeuge/speedtest) — Ping ' + f(r.ping) + ' ms, Jitter ' + f(r.jitter) + ' ms, Download ' + f(r.download) + ' Mbit/s, Upload ' + f(r.upload) + ' Mbit/s', 'Ergebnis kopiert');
    });

    setMode('speed');
    renderHistory();
    requestAnimationFrame(frame);

    window.UBSpeed = { setTransport(t) { T = t; }, createCloudflareTransport, state: S };
})();
