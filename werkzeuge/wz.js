// U:Bodigat.com — gemeinsame Helfer der Werkzeuge. Alles laeuft lokal im Browser.
(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    function fmtNum(n, digits) {
        const d = digits == null ? 0 : digits;
        return Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
    }

    // 1 KB = 1024 Byte — wie Windows anzeigt (und wie auf der Download-Seite).
    function fmtBytes(bytes, digits) {
        if (!isFinite(bytes)) return '–';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let v = Math.abs(bytes), i = 0;
        while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
        const d = digits == null ? (i === 0 ? 0 : v < 10 ? 2 : 1) : digits;
        return fmtNum(bytes < 0 ? -v : v, d) + ' ' + units[i];
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function debounce(fn, ms) {
        let t;
        return function () {
            const args = arguments, ctx = this;
            clearTimeout(t);
            t = setTimeout(() => fn.apply(ctx, args), ms);
        };
    }

    function downloadBlob(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }

    let toastEl, toastTimer;
    function toast(msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'wz-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
    }

    async function copyText(text, msg) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e2) { /* ignorieren */ }
            ta.remove();
        }
        toast(msg || 'In die Zwischenablage kopiert');
    }

    // Fuellstand-Variable fuer die gestylten Range-Slider setzen.
    function bindRange(input) {
        const upd = () => {
            const min = parseFloat(input.min || 0), max = parseFloat(input.max || 100);
            input.style.setProperty('--fill', ((input.value - min) / (max - min)) * 100 + '%');
        };
        input.addEventListener('input', upd);
        upd();
    }

    // Drag & Drop auf eine .wz-drop-Flaeche.
    function bindDrop(zone, onFiles) {
        const input = $('input[type=file]', zone);
        ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('is-drag'); }));
        ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('is-drag'); }));
        zone.addEventListener('drop', e => {
            const files = Array.from(e.dataTransfer.files || []);
            if (files.length) onFiles(files);
        });
        if (input) {
            input.addEventListener('change', () => {
                const files = Array.from(input.files || []);
                if (files.length) onFiles(files);
                input.value = '';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        $$('input[type=range]').forEach(bindRange);
    });

    window.WZ = { $, $$, fmtNum, fmtBytes, esc, sleep, debounce, downloadBlob, toast, copyText, bindRange, bindDrop };
})();
