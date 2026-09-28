// PC-Info — liest lokal aus, was der Browser ueber Geraet, Bildschirm, Netzwerk usw. preisgibt.
(function () {
    'use strict';
    const { $, esc, fmtNum, fmtBytes, copyText, downloadBlob } = WZ;

    const ICON = {
        system: '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
        hardware: '<rect x="6" y="6" width="12" height="12" rx="2"></rect><rect x="9.5" y="9.5" width="5" height="5" rx="1"></rect><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"></path>',
        screen: '<rect x="3" y="4" width="18" height="12" rx="1.5"></rect><path d="M8 20h8M12 16v4"></path>',
        network: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"></path><circle cx="12" cy="19.2" r="1"></circle>',
        battery: '<rect x="2" y="7" width="17" height="10" rx="2"></rect><path d="M22 11v2M6 10v4M10 10v4"></path>',
        input: '<rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"></path>',
        features: '<path d="M4 12l5 5L20 6"></path>',
        storage: '<ellipse cx="12" cy="6" rx="8" ry="3"></ellipse><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>',
    };

    const SECTIONS = [
        ['system', 'System & Browser'],
        ['hardware', 'Prozessor & Grafik'],
        ['screen', 'Bildschirm & Fenster'],
        ['network', 'Netzwerk'],
        ['battery', 'Akku'],
        ['input', 'Eingabe & Geräte'],
        ['storage', 'Speicherplatz des Browsers'],
        ['features', 'Browser-Funktionen'],
    ];

    const data = {};      // fuer Export: { Abschnitt: { Bezeichnung: Wert } }
    const featureData = {};

    // ---- Aufbau ------------------------------------------------------------------
    const grid = $('#pcGrid');
    SECTIONS.forEach(([key, title]) => {
        data[key] = {};
        const sec = document.createElement('section');
        sec.className = 'wz-panel';
        sec.innerHTML = '<div class="wz-panel-title"><svg class="icon" viewBox="0 0 24 24">' + ICON[key] + '</svg>' + esc(title) + '</div>'
            + (key === 'features' ? '<div class="pc-chips" id="kv-features"></div>' : '<dl class="wz-kv" id="kv-' + key + '"></dl>');
        grid.appendChild(sec);
    });

    const rowEls = {};
    function set(key, label, value) {
        const text = value == null || value === '' ? '–' : String(value);
        data[key][label] = text;
        const id = key + '|' + label;
        let dd = rowEls[id];
        if (!dd) {
            const dl = $('#kv-' + key);
            const dt = document.createElement('dt');
            dt.textContent = label;
            dd = document.createElement('dd');
            dl.append(dt, dd);
            rowEls[id] = dd;
        }
        dd.textContent = text;
    }

    function feature(label, ok, hint) {
        featureData[label] = !!ok;
        const box = $('#kv-features');
        let chip = box.querySelector('[data-f="' + label + '"]');
        if (!chip) {
            chip = document.createElement('span');
            chip.dataset.f = label;
            box.appendChild(chip);
        }
        chip.className = 'pc-chip ' + (ok ? 'is-ok' : 'is-no');
        chip.title = hint || '';
        chip.innerHTML = '<svg class="icon" viewBox="0 0 24 24">' + (ok ? '<path d="M5 12.5l4.5 4.5L19 7.5"></path>' : '<path d="M6 6l12 12M18 6L6 18"></path>') + '</svg>' + esc(label);
    }

    const yn = v => (v ? 'Ja' : 'Nein');

    // ---- Browser / OS erkennen ---------------------------------------------------------
    function parseUA() {
        const ua = navigator.userAgent;
        let browser = 'Unbekannt', version = '';
        const m = (re) => { const r = re.exec(ua); return r ? r[1] : ''; };
        if (/Edg\//.test(ua)) { browser = 'Microsoft Edge'; version = m(/Edg\/([\d.]+)/); }
        else if (/OPR\//.test(ua)) { browser = 'Opera'; version = m(/OPR\/([\d.]+)/); }
        else if (/Firefox\//.test(ua)) { browser = 'Firefox'; version = m(/Firefox\/([\d.]+)/); }
        else if (/Chrome\//.test(ua)) { browser = 'Chrome / Chromium'; version = m(/Chrome\/([\d.]+)/); }
        else if (/Safari\//.test(ua)) { browser = 'Safari'; version = m(/Version\/([\d.]+)/); }
        let os = 'Unbekannt';
        if (/Windows NT 10/.test(ua)) os = 'Windows 10 / 11';
        else if (/Windows/.test(ua)) os = 'Windows';
        else if (/Android ([\d.]+)/.test(ua)) os = 'Android ' + m(/Android ([\d.]+)/);
        else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS / iPadOS';
        else if (/Mac OS X/.test(ua)) os = 'macOS';
        else if (/CrOS/.test(ua)) os = 'ChromeOS';
        else if (/Linux/.test(ua)) os = 'Linux';
        const engine = /Firefox\//.test(ua) ? 'Gecko' : /AppleWebKit/.test(ua) ? (/Chrome\//.test(ua) ? 'Blink' : 'WebKit') : 'Unbekannt';
        return { browser, version, os, engine };
    }

    async function systemInfo() {
        const p = parseUA();
        let os = p.os, arch = '', model = '', browser = p.browser, version = p.version;
        const uad = navigator.userAgentData;
        if (uad && uad.getHighEntropyValues) {
            try {
                const h = await uad.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'fullVersionList']);
                if (uad.platform === 'Windows') {
                    const major = parseInt((h.platformVersion || '0').split('.')[0], 10);
                    os = major >= 13 ? 'Windows 11' : 'Windows 10';
                } else if (uad.platform) {
                    os = uad.platform + (h.platformVersion ? ' ' + h.platformVersion : '');
                }
                arch = [h.architecture, h.bitness ? h.bitness + ' Bit' : ''].filter(Boolean).join(' · ');
                model = h.model || '';
                const list = (h.fullVersionList || []).filter(b => !/Not.?A.?Brand/i.test(b.brand));
                const pick = list.find(b => /Edge|Opera|Chrome|Chromium/i.test(b.brand));
                if (pick) { version = pick.version; if (/Edge/.test(pick.brand)) browser = 'Microsoft Edge'; }
            } catch (e) { /* nicht erlaubt */ }
        }
        set('system', 'Betriebssystem', os);
        if (arch) set('system', 'Architektur', arch);
        if (model) set('system', 'Gerätemodell', model);
        set('system', 'Browser', browser + (version ? ' ' + version : ''));
        set('system', 'Browser-Engine', p.engine);
        set('system', 'Sprache', (navigator.languages || [navigator.language]).join(', '));
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const off = -new Date().getTimezoneOffset() / 60;
            set('system', 'Zeitzone', tz + ' (UTC' + (off >= 0 ? '+' : '') + off + ')');
        } catch (e) { /* egal */ }
        set('system', 'Cookies erlaubt', yn(navigator.cookieEnabled));
        set('system', '„Do Not Track“', navigator.doNotTrack === '1' ? 'Aktiv' : 'Nicht aktiv');
        return { os, browser: browser + (version ? ' ' + version.split('.')[0] : ''), model, mobile: !!(uad && uad.mobile) || /Mobi|Android|iPhone/.test(navigator.userAgent) };
    }

    // ---- Hardware ------------------------------------------------------------------------------
    function gpuInfo() {
        try {
            const c = document.createElement('canvas');
            const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
            if (!gl) { set('hardware', 'Grafik (WebGL)', 'Nicht verfügbar'); feature('WebGL', false); return null; }
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
            const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
            set('hardware', 'Grafikkarte', String(renderer).replace(/^ANGLE \((.*)\)$/, '$1'));
            set('hardware', 'Grafik-Hersteller', vendor);
            set('hardware', 'WebGL-Version', gl.getParameter(gl.VERSION));
            set('hardware', 'Max. Textur-Größe', gl.getParameter(gl.MAX_TEXTURE_SIZE) + ' px');
            feature('WebGL', true);
            feature('WebGL 2', !!c.getContext('webgl2'));
            return String(renderer).replace(/^ANGLE \((.*)\)$/, '$1');
        } catch (e) {
            set('hardware', 'Grafik (WebGL)', 'Nicht auslesbar');
            return null;
        }
    }

    async function hardwareInfo() {
        const cores = navigator.hardwareConcurrency;
        set('hardware', 'CPU-Kerne (logisch)', cores || 'Unbekannt');
        const mem = navigator.deviceMemory;
        set('hardware', 'Arbeitsspeicher (grob)', mem ? (mem >= 8 ? '8 GB oder mehr' : '≈ ' + mem + ' GB') : 'Vom Browser nicht verraten');
        const gpu = gpuInfo();
        if (navigator.gpu && navigator.gpu.requestAdapter) {
            try {
                const ad = await navigator.gpu.requestAdapter();
                if (ad) {
                    const i = ad.info || (ad.requestAdapterInfo ? await ad.requestAdapterInfo() : {});
                    const txt = [i.vendor, i.architecture, i.description || i.device].filter(Boolean).join(' · ');
                    set('hardware', 'WebGPU', txt || 'Verfügbar');
                    feature('WebGPU', true);
                } else feature('WebGPU', false);
            } catch (e) { feature('WebGPU', false); }
        } else {
            feature('WebGPU', false);
        }
        return { cores, mem, gpu };
    }

    // ---- Bildschirm ---------------------------------------------------------------------------------
    function screenStatic() {
        const s = screen, dpr = window.devicePixelRatio || 1;
        set('screen', 'Bildschirmauflösung', s.width + ' × ' + s.height + ' px');
        set('screen', 'Echte Pixel (ca.)', Math.round(s.width * dpr) + ' × ' + Math.round(s.height * dpr) + ' px');
        set('screen', 'Nutzbare Fläche', s.availWidth + ' × ' + s.availHeight + ' px');
        set('screen', 'Pixeldichte / Skalierung', fmtNum(dpr, dpr % 1 ? 2 : 0) + '× (' + Math.round(dpr * 100) + ' %)');
        set('screen', 'Farbtiefe', s.colorDepth + ' Bit');
        if (s.orientation) set('screen', 'Ausrichtung', s.orientation.type.replace('-', ' '));
        const mq = q => window.matchMedia(q).matches;
        set('screen', 'Farbraum', mq('(color-gamut: rec2020)') ? 'Rec. 2020 (sehr groß)' : mq('(color-gamut: p3)') ? 'Display P3 (groß)' : mq('(color-gamut: srgb)') ? 'sRGB (Standard)' : 'Unbekannt');
        set('screen', 'HDR-Anzeige', yn(mq('(dynamic-range: high)')));
        set('screen', 'Dunkles Farbschema', yn(mq('(prefers-color-scheme: dark)')));
        set('screen', 'Weniger Animationen', yn(mq('(prefers-reduced-motion: reduce)')));
    }

    function screenLive() {
        set('screen', 'Browser-Fenster', window.innerWidth + ' × ' + window.innerHeight + ' px');
    }

    function measureRefresh() {
        set('screen', 'Bildwiederholrate', 'Wird gemessen …');
        return new Promise(resolve => {
            const deltas = [];
            let last = 0, frames = 0;
            const timer = setTimeout(() => done(), 3500);
            function tick(t) {
                if (last) deltas.push(t - last);
                last = t;
                if (++frames < 90) requestAnimationFrame(tick); else done();
            }
            function done() {
                clearTimeout(timer);
                if (deltas.length < 10) { set('screen', 'Bildwiederholrate', 'Nicht messbar (Tab im Hintergrund?)'); return resolve(null); }
                const sorted = deltas.slice(5).sort((a, b) => a - b);
                const med = sorted[Math.floor(sorted.length / 2)];
                const hz = 1000 / med;
                const common = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360];
                const near = common.reduce((a, b) => Math.abs(b - hz) < Math.abs(a - hz) ? b : a);
                const val = Math.abs(near - hz) < near * 0.06 ? near : Math.round(hz);
                set('screen', 'Bildwiederholrate', '≈ ' + val + ' Hz');
                resolve(val);
            }
            requestAnimationFrame(tick);
        });
    }

    // ---- Netzwerk ---------------------------------------------------------------------------------------
    function networkInfo() {
        const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const upd = () => {
            set('network', 'Online', yn(navigator.onLine));
            if (c) {
                if (c.type) set('network', 'Verbindungsart', { wifi: 'WLAN', ethernet: 'LAN-Kabel', cellular: 'Mobilfunk', bluetooth: 'Bluetooth', wimax: 'WiMAX', other: 'Sonstige', none: 'Keine', unknown: 'Unbekannt' }[c.type] || c.type);
                if (c.effectiveType) set('network', 'Effektive Qualität', c.effectiveType.toUpperCase());
                if (c.downlink != null) set('network', 'Geschätzte Downlink-Rate', fmtNum(c.downlink, 1) + ' Mbit/s');
                if (c.rtt != null) set('network', 'Geschätzte Latenz (RTT)', c.rtt + ' ms');
                set('network', 'Datensparmodus', yn(c.saveData));
            } else {
                set('network', 'Verbindungsdetails', 'Vom Browser nicht angeboten');
            }
        };
        upd();
        window.addEventListener('online', upd);
        window.addEventListener('offline', upd);
        if (c && c.addEventListener) c.addEventListener('change', upd);
        set('network', 'Genaue Messung', 'Siehe Speedtest');
    }

    // ---- Akku --------------------------------------------------------------------------------------------
    async function batteryInfo() {
        if (!navigator.getBattery) { set('battery', 'Akku', 'Vom Browser nicht angeboten (z. B. Firefox/Safari)'); return null; }
        try {
            const b = await navigator.getBattery();
            const upd = () => {
                set('battery', 'Ladestand', Math.round(b.level * 100) + ' %');
                set('battery', 'Lädt gerade', yn(b.charging));
                const t = b.charging ? b.chargingTime : b.dischargingTime;
                if (isFinite(t) && t > 0) set('battery', b.charging ? 'Voll in' : 'Restlaufzeit', Math.floor(t / 3600) + ' h ' + Math.round((t % 3600) / 60) + ' min');
            };
            upd();
            ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'].forEach(ev => b.addEventListener(ev, upd));
            return b;
        } catch (e) {
            set('battery', 'Akku', 'Nicht auslesbar');
            return null;
        }
    }

    // ---- Eingabe & Geraete -----------------------------------------------------------------------------------
    async function inputInfo() {
        const mq = q => window.matchMedia(q).matches;
        set('input', 'Touch-Punkte (max.)', navigator.maxTouchPoints || 0);
        set('input', 'Haupt-Zeigegerät', mq('(pointer: fine)') ? 'Maus / Trackpad (präzise)' : mq('(pointer: coarse)') ? 'Touch (grob)' : 'Keins');
        set('input', 'Hover möglich', yn(mq('(hover: hover)')));
        try {
            const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
            set('input', 'Gamepads', pads.length ? pads.map(p => p.id.split('(')[0].trim()).join(', ') : 'Keine erkannt');
        } catch (e) { /* egal */ }
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            try {
                const d = await navigator.mediaDevices.enumerateDevices();
                const n = k => d.filter(x => x.kind === k).length;
                set('input', 'Kameras', n('videoinput'));
                set('input', 'Mikrofone', n('audioinput'));
                set('input', 'Audio-Ausgänge', n('audiooutput'));
            } catch (e) { /* egal */ }
        }
    }

    async function storageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const e = await navigator.storage.estimate();
                set('storage', 'Kontingent (Quota)', fmtBytes(e.quota));
                set('storage', 'Davon belegt', fmtBytes(e.usage));
            } catch (er) { set('storage', 'Speicher', 'Nicht auslesbar'); }
        } else set('storage', 'Speicher', 'Vom Browser nicht angeboten');
        try {
            set('storage', 'Dauerhafter Speicher', navigator.storage && navigator.storage.persisted ? yn(await navigator.storage.persisted()) : 'Unbekannt');
        } catch (e) { /* egal */ }
        try { set('storage', 'Local Storage', localStorage ? 'Verfügbar' : 'Nein'); } catch (e) { set('storage', 'Local Storage', 'Gesperrt'); }
    }

    function featureInfo() {
        feature('WebAssembly', typeof WebAssembly === 'object');
        feature('Service Worker', 'serviceWorker' in navigator);
        feature('WebRTC', 'RTCPeerConnection' in window);
        feature('Web Audio', 'AudioContext' in window || 'webkitAudioContext' in window);
        feature('Zwischenablage-API', !!(navigator.clipboard && navigator.clipboard.writeText));
        feature('Benachrichtigungen', 'Notification' in window);
        feature('Standort-API', 'geolocation' in navigator);
        feature('Teilen-Dialog', !!navigator.share);
        feature('Bluetooth', 'bluetooth' in navigator);
        feature('WebUSB', 'usb' in navigator);
        feature('Vollbild', !!document.fullscreenEnabled);
        feature('PDF-Anzeige im Browser', navigator.pdfViewerEnabled === true);
        feature('SharedArrayBuffer', typeof SharedArrayBuffer !== 'undefined');
        feature('WebCodecs', 'VideoEncoder' in window);
        feature('Bild-in-Bild', !!document.pictureInPictureEnabled);
        feature('Sprachausgabe', 'speechSynthesis' in window);
        feature('Vibration', 'vibrate' in navigator);
    }

    // ---- Zusammenfassung oben ---------------------------------------------------------------------------------
    function summarize(sys, hw, hz) {
        $('#pcTitle').textContent = sys.os + ' · ' + sys.browser;
        const parts = [];
        if (hw.cores) parts.push(hw.cores + ' Kerne');
        if (hw.mem) parts.push((hw.mem >= 8 ? '≥ 8' : hw.mem) + ' GB RAM');
        if (hw.gpu) parts.push(hw.gpu.length > 44 ? hw.gpu.slice(0, 42) + '…' : hw.gpu);
        parts.push(screen.width + ' × ' + screen.height + (hz ? ' @ ' + hz + ' Hz' : ''));
        $('#pcSub').textContent = parts.join('  ·  ');
        if (sys.mobile) {
            $('#pcHeroIcon').innerHTML = '<svg class="icon" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2.5"></rect><path d="M11 18h2"></path></svg>';
        }
    }

    // ---- Export ------------------------------------------------------------------------------------------------------
    function asText() {
        let t = 'PC-Info — ubodigat.com/werkzeuge/pc-info\n' + new Date().toLocaleString('de-DE') + '\n';
        SECTIONS.forEach(([key, title]) => {
            if (key === 'features') {
                t += '\n' + title + '\n  ' + Object.entries(featureData).map(([k, v]) => (v ? '✓ ' : '✗ ') + k).join(', ') + '\n';
                return;
            }
            t += '\n' + title + '\n' + Object.entries(data[key]).map(([k, v]) => '  ' + k + ': ' + v).join('\n') + '\n';
        });
        return t;
    }

    $('#copyAll').addEventListener('click', () => copyText(asText(), 'Geräteinfos kopiert'));
    $('#saveJson').addEventListener('click', () => {
        const out = { erzeugt: new Date().toISOString(), daten: data, browserFunktionen: featureData };
        downloadBlob(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), 'pc-info.json');
    });

    // ---- Start ---------------------------------------------------------------------------------------------------------------
    screenStatic();
    screenLive();
    window.addEventListener('resize', screenLive);
    networkInfo();
    featureInfo();
    (async () => {
        const [sys, hw] = await Promise.all([systemInfo(), hardwareInfo()]);
        batteryInfo();
        inputInfo();
        storageInfo();
        summarize(sys, hw, null);
        const hz = await measureRefresh();
        summarize(sys, hw, hz);
    })();
})();
