// Einheiten-Umrechner — datengetrieben: jede Einheit hat einen Faktor zur Basiseinheit
// (Temperatur nutzt Umrechnungsfunktionen ueber Kelvin).
(function () {
    'use strict';
    const { $, $$, esc, copyText } = WZ;

    const f = (id, name, sym, factor) => ({ id, name, sym, f: factor });

    const CATS = [
        { id: 'length', name: 'Länge', units: [
            f('mm', 'Millimeter', 'mm', 0.001), f('cm', 'Zentimeter', 'cm', 0.01), f('m', 'Meter', 'm', 1), f('km', 'Kilometer', 'km', 1000),
            f('in', 'Zoll (Inch)', 'in', 0.0254), f('ft', 'Fuß (Foot)', 'ft', 0.3048), f('yd', 'Yard', 'yd', 0.9144), f('mi', 'Meile (Mile)', 'mi', 1609.344),
            f('nmi', 'Seemeile', 'sm', 1852), f('um', 'Mikrometer', 'µm', 1e-6),
        ] },
        { id: 'mass', name: 'Gewicht', units: [
            f('mg', 'Milligramm', 'mg', 1e-6), f('g', 'Gramm', 'g', 0.001), f('kg', 'Kilogramm', 'kg', 1), f('t', 'Tonne', 't', 1000),
            f('oz', 'Unze (Ounce)', 'oz', 0.028349523125), f('lb', 'Pfund (Pound)', 'lb', 0.45359237), f('st', 'Stone', 'st', 6.35029318), f('pfd', 'Pfund (metrisch)', 'Pfd.', 0.5),
        ] },
        { id: 'temp', name: 'Temperatur', units: [
            { id: 'c', name: 'Grad Celsius', sym: '°C', to: v => v + 273.15, from: k => k - 273.15 },
            { id: 'fh', name: 'Grad Fahrenheit', sym: '°F', to: v => (v - 32) * 5 / 9 + 273.15, from: k => (k - 273.15) * 9 / 5 + 32 },
            { id: 'k', name: 'Kelvin', sym: 'K', to: v => v, from: k => k },
            { id: 'r', name: 'Grad Rankine', sym: '°R', to: v => v * 5 / 9, from: k => k * 9 / 5 },
        ] },
        { id: 'volume', name: 'Volumen', units: [
            f('ml', 'Milliliter', 'ml', 0.001), f('cl', 'Zentiliter', 'cl', 0.01), f('dl', 'Deziliter', 'dl', 0.1), f('l', 'Liter', 'l', 1), f('m3', 'Kubikmeter', 'm³', 1000),
            f('tl', 'Teelöffel (TL)', 'TL', 0.005), f('el', 'Esslöffel (EL)', 'EL', 0.015),
            f('floz', 'Fluid Ounce (US)', 'fl oz', 0.0295735295625), f('cup', 'Cup (US)', 'cup', 0.2365882365), f('pt', 'Pint (US)', 'pt', 0.473176473), f('gal', 'Gallone (US)', 'gal', 3.785411784),
        ] },
        { id: 'area', name: 'Fläche', units: [
            f('cm2', 'Quadratzentimeter', 'cm²', 1e-4), f('m2', 'Quadratmeter', 'm²', 1), f('a', 'Ar', 'a', 100), f('ha', 'Hektar', 'ha', 10000), f('km2', 'Quadratkilometer', 'km²', 1e6),
            f('in2', 'Quadratzoll', 'in²', 0.00064516), f('ft2', 'Quadratfuß', 'ft²', 0.09290304), f('ac', 'Acre', 'ac', 4046.8564224), f('mi2', 'Quadratmeile', 'mi²', 2589988.110336),
        ] },
        { id: 'speed', name: 'Geschwindigkeit', units: [
            f('ms', 'Meter pro Sekunde', 'm/s', 1), f('kmh', 'Kilometer pro Stunde', 'km/h', 1 / 3.6), f('mph', 'Meilen pro Stunde', 'mph', 0.44704), f('kn', 'Knoten', 'kn', 1852 / 3600),
            f('fts', 'Fuß pro Sekunde', 'ft/s', 0.3048), f('mach', 'Mach (Schallgeschw.)', 'Ma', 340.29), f('c', 'Lichtgeschwindigkeit', 'c', 299792458),
        ] },
        { id: 'time', name: 'Zeit', units: [
            f('ms', 'Millisekunde', 'ms', 0.001), f('s', 'Sekunde', 's', 1), f('min', 'Minute', 'min', 60), f('h', 'Stunde', 'h', 3600), f('d', 'Tag', 'd', 86400),
            f('wk', 'Woche', 'Wo.', 604800), f('mo', 'Monat (Ø 30,44 Tage)', 'Mon.', 2629800), f('yr', 'Jahr (365,25 Tage)', 'a', 31557600),
        ] },
        { id: 'data', name: 'Daten', units: [
            f('bit', 'Bit', 'bit', 0.125), f('b', 'Byte', 'B', 1),
            f('kb', 'Kilobyte (1000)', 'KB', 1e3), f('mb', 'Megabyte (1000²)', 'MB', 1e6), f('gb', 'Gigabyte (1000³)', 'GB', 1e9), f('tb', 'Terabyte (1000⁴)', 'TB', 1e12),
            f('kib', 'Kibibyte (1024)', 'KiB', 1024), f('mib', 'Mebibyte (1024²)', 'MiB', 1048576), f('gib', 'Gibibyte (1024³)', 'GiB', 1073741824), f('tib', 'Tebibyte (1024⁴)', 'TiB', 1099511627776),
        ] },
        { id: 'energy', name: 'Energie', units: [
            f('j', 'Joule', 'J', 1), f('kj', 'Kilojoule', 'kJ', 1000), f('cal', 'Kalorie', 'cal', 4.184), f('kcal', 'Kilokalorie', 'kcal', 4184),
            f('wh', 'Wattstunde', 'Wh', 3600), f('kwh', 'Kilowattstunde', 'kWh', 3.6e6), f('btu', 'BTU', 'BTU', 1055.05585262),
        ] },
        { id: 'power', name: 'Leistung', units: [
            f('w', 'Watt', 'W', 1), f('kw', 'Kilowatt', 'kW', 1000), f('mw', 'Megawatt', 'MW', 1e6), f('ps', 'Pferdestärke (PS)', 'PS', 735.49875), f('hp', 'Horsepower (hp)', 'hp', 745.69987158227),
        ] },
        { id: 'pressure', name: 'Druck', units: [
            f('pa', 'Pascal', 'Pa', 1), f('hpa', 'Hektopascal', 'hPa', 100), f('kpa', 'Kilopascal', 'kPa', 1000), f('bar', 'Bar', 'bar', 1e5),
            f('atm', 'Atmosphäre', 'atm', 101325), f('psi', 'PSI', 'psi', 6894.757293168), f('mmhg', 'mmHg (Torr)', 'mmHg', 133.322387415),
        ] },
        { id: 'angle', name: 'Winkel', units: [
            f('deg', 'Grad', '°', Math.PI / 180), f('rad', 'Radiant', 'rad', 1), f('gon', 'Gon (Neugrad)', 'gon', Math.PI / 200), f('turn', 'Umdrehung', 'U', 2 * Math.PI),
        ] },
    ];

    const DEFAULTS = { length: ['km', 'mi'], mass: ['kg', 'lb'], temp: ['c', 'fh'], volume: ['l', 'gal'], area: ['m2', 'ft2'], speed: ['kmh', 'mph'], time: ['h', 'min'], data: ['gb', 'mb'], energy: ['kcal', 'kj'], power: ['kw', 'ps'], pressure: ['bar', 'psi'], angle: ['deg', 'rad'] };

    const S = { cat: CATS[0], from: null, to: null };

    const toBase = (u, v) => (u.to ? u.to(v) : v * u.f);
    const fromBase = (u, b) => (u.from ? u.from(b) : b / u.f);
    const convert = (v, a, b) => fromBase(b, toBase(a, v));

    function fmt(n) {
        if (!isFinite(n)) return '–';
        if (n === 0) return '0';
        const abs = Math.abs(n);
        if (abs >= 1e15 || abs < 1e-6) {
            const parts = n.toExponential(6).split('e');
            return parts[0].replace(/\.?0+$/, '').replace('.', ',') + ' × 10^' + parseInt(parts[1], 10);
        }
        return Number(n.toPrecision(11)).toLocaleString('de-DE', { maximumFractionDigits: 10 });
    }

    function parseVal() {
        const s = $('#val').value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
        if (s === '' || s === '-' || s === '.') return NaN;
        return Number(s);
    }

    const opt = u => '<option value="' + u.id + '">' + esc(u.name) + ' (' + esc(u.sym) + ')</option>';

    function setCategory(cat, keepValue) {
        S.cat = cat;
        const def = DEFAULTS[cat.id] || [];
        const byId = id => cat.units.find(u => u.id === id);
        S.from = byId(S.fromId) || byId(def[0]) || cat.units[0];
        S.to = byId(S.toId) || byId(def[1]) || cat.units[1];
        if (S.from === S.to) S.to = cat.units.find(u => u !== S.from);
        $('#fromU').innerHTML = cat.units.map(opt).join('');
        $('#toU').innerHTML = cat.units.map(opt).join('');
        $('#fromU').value = S.from.id;
        $('#toU').value = S.to.id;
        $('#allTitle').textContent = 'In alle Einheiten (' + cat.name + ')';
        if (!keepValue) $('#val').value = '1';
        update();
    }

    function update() {
        const v = parseVal(), a = S.cat.units.find(u => u.id === $('#fromU').value), b = S.cat.units.find(u => u.id === $('#toU').value);
        S.from = a; S.to = b; S.fromId = a.id; S.toId = b.id;
        const bad = !isFinite(v);
        const r = bad ? NaN : convert(v, a, b);
        $('#resVal').textContent = bad ? '–' : fmt(r) + ' ' + b.sym;
        $('#resLabel').textContent = bad ? 'Bitte eine Zahl eingeben' : fmt(v) + ' ' + a.sym + ' =';
        $('#resNote').textContent = bad ? '' : 'Klick auf das Ergebnis kopiert es.';
        $('#all').innerHTML = S.cat.units.map(u => {
            const x = bad ? NaN : convert(v, a, u);
            return '<button type="button" class="un-row' + (u === b ? ' is-active' : '') + '" data-id="' + u.id + '" data-copy="' + esc(fmt(x)) + '"><span>' + esc(u.name) + '</span><b>' + (bad ? '–' : fmt(x)) + ' <em>' + esc(u.sym) + '</em></b></button>';
        }).join('');
    }

    // ---- Verdrahten -------------------------------------------------------------------------------
    $('#cats').innerHTML = CATS.map(c => '<input type="radio" name="cat" id="cat-' + c.id + '" value="' + c.id + '"' + (c === CATS[0] ? ' checked' : '') + '><label for="cat-' + c.id + '">' + c.name + '</label>').join('');
    $('#cats').addEventListener('change', () => { S.fromId = S.toId = null; setCategory(CATS.find(c => c.id === $('input[name=cat]:checked').value)); });
    $('#val').addEventListener('input', update);
    $('#fromU').addEventListener('change', update);
    $('#toU').addEventListener('change', update);
    $('#swap').addEventListener('click', () => {
        const a = $('#fromU').value;
        $('#fromU').value = $('#toU').value;
        $('#toU').value = a;
        update();
    });
    $('#result').addEventListener('click', () => copyText($('#resVal').textContent, 'Ergebnis kopiert'));
    $('#all').addEventListener('click', e => {
        const b = e.target.closest('.un-row');
        if (!b) return;
        $('#toU').value = b.dataset.id;
        update();
        copyText(b.dataset.copy, 'Wert kopiert');
    });

    setCategory(CATS[0]);
    window.UBUnits = { CATS, convert, fmt };
})();
