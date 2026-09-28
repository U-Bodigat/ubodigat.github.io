// Leitstellenspiel ILS Allgäu — die Integrierte Leitstelle fuer Stadt Kempten,
// Kaufbeuren, Memmingen sowie die Landkreise Oberallgaeu, Ostallgaeu,
// Unterallgaeu und Lindau. Wachen, Kliniken, Strassen und Orte stammen aus
// OpenStreetMap-Daten (ils-data.js), Alarmierungen folgen vereinfacht der
// bayerischen AAO-Praxis (Feuerwehr), dem BayRDG samt Notarztindikationskatalog
// (Rettungsdienst) und MANV-Regeln (LNA/OrgL). Dazu: Funkverkehr mit
// Sprachausgabe, Patiententransport ins Krankenhaus, Fremdeinsaetze und
// Zivilverkehr als Leben auf der Karte und eine lokale Bestenliste.
(function() {
    'use strict';

    const D = window.ILS_DATA;
    if (!D) {
        document.addEventListener('DOMContentLoaded', () => {
            const h = document.getElementById('mapHint');
            if (h) h.textContent = 'Die Leitstellendaten (ils-data.js) konnten nicht geladen werden.';
        });
        return;
    }

    // ---- Stammdaten -------------------------------------------------------------------

    const SERVICES = {
        feuer: {
            name: 'Feuerwehr',
            color: '#e5483c'
        },
        rd: {
            name: 'Rettungsdienst',
            color: '#17b3a3'
        },
        pol: {
            name: 'Polizei',
            color: '#3b6fe0'
        },
        thw: {
            name: 'THW',
            color: '#1f9ee0'
        },
    };

    const VEHICLE_TYPES = {
        LF: {
            name: 'Löschfahrzeug (HLF/LF)',
            short: 'LF 20',
            service: 'feuer',
            crew: '1/8/9',
            fills: ['LF', 'TSF']
        },
        TSF: {
            name: 'Tragkraftspritzenfahrzeug',
            short: 'TSF-W',
            service: 'feuer',
            crew: '0/6/6',
            fills: ['TSF']
        },
        DLK: {
            name: 'Drehleiter',
            short: 'DLK 23',
            service: 'feuer',
            crew: '1/2/3'
        },
        TLF: {
            name: 'Tanklöschfahrzeug',
            short: 'TLF',
            service: 'feuer',
            crew: '0/3/3'
        },
        RW: {
            name: 'Rüstwagen',
            short: 'RW',
            service: 'feuer',
            crew: '0/3/3'
        },
        ELW: {
            name: 'Einsatzleitwagen',
            short: 'ELW 1',
            service: 'feuer',
            crew: '0/1/1'
        },
        HRT: {
            name: 'Bergwacht-Einsatzgruppe',
            short: 'Bergwacht',
            service: 'rd',
            crew: '1/3/4'
        },
        WR: {
            name: 'Wasserwacht / DLRG',
            short: 'Wasserrettung',
            service: 'rd',
            crew: '1/3/4'
        },
        HVO: {
            name: 'Helfer vor Ort (First Responder)',
            short: 'HvO',
            service: 'rd',
            crew: '0/1/1'
        },
        RTW: {
            name: 'Rettungswagen',
            short: 'RTW',
            service: 'rd',
            crew: '0/2/2'
        },
        NEF: {
            name: 'Notarzteinsatzfahrzeug',
            short: 'NEF',
            service: 'rd',
            crew: '0/1/1'
        },
        KTW: {
            name: 'Krankentransportwagen',
            short: 'KTW',
            service: 'rd',
            crew: '0/2/2'
        },
        GWSAN: {
            name: 'Großraum-Rettungswagen',
            short: 'GW-San',
            service: 'rd',
            crew: '0/3/3',
            fills: ['GWSAN', 'RTW']
        },
        RTH: {
            name: 'Rettungshubschrauber',
            short: 'RTH',
            service: 'rd',
            fast: true,
            crew: '0/3/3',
            fills: ['RTH', 'NEF']
        },
        LNA: {
            name: 'Leitender Notarzt',
            short: 'LNA',
            service: 'rd',
            crew: '0/1/1'
        },
        ORGL: {
            name: 'Organisatorischer Leiter Rettungsdienst',
            short: 'OrgL',
            service: 'rd',
            crew: '0/1/1'
        },
        FUSTW: {
            name: 'Streifenwagen',
            short: 'FuStW',
            service: 'pol',
            crew: '0/2/2'
        },
        GEFKW: {
            name: 'Gefangenentransporter',
            short: 'GefKw',
            service: 'pol',
            crew: '0/2/2'
        },
        SEK: {
            name: 'Spezialeinsatzkommando',
            short: 'SEK',
            service: 'pol',
            fast: true,
            crew: '1/5/6'
        },
        THWB: {
            name: 'THW Bergungsgruppe',
            short: 'THW Bergung',
            service: 'thw',
            crew: '1/9/10'
        },
        THWW: {
            name: 'THW Wassergefahrengruppe',
            short: 'THW Wasser',
            service: 'thw',
            crew: '1/5/6'
        },
    };
    Object.keys(VEHICLE_TYPES).forEach(k => {
        if (!VEHICLE_TYPES[k].fills) VEHICLE_TYPES[k].fills = [k];
    });

    const ROLE_LABEL = {
        LF: 'Löschgruppenfahrzeug (HLF/LF)',
        TSF: 'Löschfahrzeug (Staffel oder größer)',
        DLK: 'Drehleiter',
        TLF: 'Tanklöschfahrzeug',
        RW: 'Rüstwagen',
        ELW: 'Einsatzleiter (ELW)',
        HRT: 'Bergwacht',
        WR: 'Wasserwacht / DLRG',
        HVO: 'Helfer vor Ort (First Responder)',
        RTW: 'Rettungswagen',
        NEF: 'Notarzt (NEF oder RTH)',
        KTW: 'Krankentransportwagen',
        RTH: 'Rettungshubschrauber',
        LNA: 'Leitender Notarzt',
        ORGL: 'Organisatorischer Leiter RD',
        FUSTW: 'Streifenwagen',
        GEFKW: 'Gefangenentransporter',
        SEK: 'Spezialeinsatzkommando',
        THWB: 'THW Bergungsgruppe',
        THWW: 'THW Wassergefahren',
        GWSAN: 'Großraum-Rettungswagen',
    };
    const ROLE_SHORT = {
        TSF: 'LF/TSF',
        NEF: 'NEF/RTH'
    };
    const roleShort = k => ROLE_SHORT[k] || VEHICLE_TYPES[k].short;

    const STATION_GROUPS = [{
            key: 'feuer',
            label: 'Feuerwehr'
        },
        {
            key: 'rd',
            label: 'Rettungsdienst'
        },
        {
            key: 'pol',
            label: 'Polizei'
        },
        {
            key: 'thw',
            label: 'THW'
        },
    ];
    const GROUP_ORDER = {
        feuer: 0,
        rd: 1,
        pol: 2,
        thw: 3
    };

    const STATIONS = D.stations.slice().sort((a, b) => GROUP_ORDER[a.service] - GROUP_ORDER[b.service] || (a.town || '').localeCompare(b.town || '', 'de') || a.name.localeCompare(b.name, 'de'));
    const STATION_BY_ID = {};
    STATIONS.forEach(st => {
        STATION_BY_ID[st.id] = st;
        st.vehicles = [];
    });
    const HOSPITALS = D.hospitals;

    const HOSP_CAPS = {
        'Klinikum Kempten-Oberallgäu': ['stroke', 'pci', 'trauma', 'kinder', 'geburt'],
        'Klinikum Kaufbeuren-Ostallgäu': ['stroke', 'pci', 'trauma', 'kinder', 'geburt'],
        'Klinikum Memmingen': ['stroke', 'pci', 'trauma', 'kinder', 'geburt'],
        'Asklepios Klinik Lindau': ['pci', 'geburt'],
        'Kliniken Sonthofen': ['geburt'],
        'Kreisklinik Mindelheim': ['geburt'],
    };
    const CAP_LABEL = {
        stroke: 'Stroke Unit',
        pci: 'Herzkatheterlabor',
        trauma: 'Traumazentrum',
        kinder: 'Kinderklinik',
        geburt: 'Geburtshilfe'
    };
    const INCIDENT_CAP = {
        schlaganfall: 'stroke',
        herzinfarkt: 'pci',
        reanimation: 'pci',
        geburt: 'geburt',
        kindernotfall: 'kinder',
        'unfall-motorrad': 'trauma',
        'unfall-fussgaenger': 'trauma',
        'unfall-kind': 'trauma',
        'unfall-mehrere': 'trauma',
        'vu-klemmt': 'trauma',
        'vu-lkw-klemmt': 'trauma',
        gleitschirm: 'trauma',
        klettersturz: 'trauma',
        'arbeitsunfall-landw': 'trauma',
        verbrennung: 'trauma',
        'gross-karambolage': 'trauma',
        'gross-busunglueck': 'trauma',
        'gross-zugunglueck': 'trauma',
    };

    function nearestHospital(pos, cap) {
        let pool = HOSPITALS.filter(h => !h.abgemeldet);
        if (cap) {
            const capable = pool.filter(h => (HOSP_CAPS[h.name] || []).includes(cap));
            if (capable.length) pool = capable;
        }
        if (!pool.length) pool = HOSPITALS;
        let best = null,
            bestDist = Infinity;
        pool.forEach(h => {
            const d = haversineKm(pos, h.coords);
            if (d < bestDist) {
                bestDist = d;
                best = h;
            }
        });
        return best;
    }

    function hospTipHtml(h) {
        const caps = (HOSP_CAPS[h.name] || []).map(k => CAP_LABEL[k]);
        return '<b>' + escapeHtml(h.name) + '</b><br>Krankenhaus' + (caps.length ? ' · ' + caps.join(', ') : '') + '<br>' + (h.abgemeldet ? 'Notaufnahme abgemeldet' : 'aufnahmebereit');
    }

    function tickHospitals(dt) {
        S.hospAt -= dt;
        if (S.hospAt > 0) return;
        S.hospAt = 45 + Math.random() * 60;
        const h = rand(HOSPITALS);
        if (h.abgemeldet) {
            h.abgemeldet = false;
            log('Leitstelle: ' + h.name + ' ist wieder aufnahmebereit.', 'info');
        } else if (HOSPITALS.filter(x => x.abgemeldet).length < 3 && Math.random() < 0.5) {
            h.abgemeldet = true;
            log('Leitstelle: ' + h.name + ' meldet die Notaufnahme ab — Patienten werden in andere Kliniken gefahren.', 'alert');
        }
    }

    const RULES = {
        'B 1': 'AAO Bayern (vereinfacht): Kleinbrand — ein Löschfahrzeug (Staffel oder Gruppe) genügt.',
        'B 2': 'AAO Bayern (vereinfacht): Gebäude-/Mittelbrand — Löschzug mit Drehleiter (Art. 31 BayBO: zweiter Rettungsweg über Feuerwehrgeräte) und Einsatzleiter; bei Gefahr für Personen Rettungsdienst und Polizei.',
        'B 3': 'Großbrand mit Menschenleben in Gefahr: mehrere Löschgruppen, Drehleitern, Wasserversorgung (TLF), Einsatzleiter, Rettungsdienst und Polizei.',
        'B 4': 'Großschadenslage Brand: mehrere Löschzüge, Führungsdienst, Wasserförderung, Rettungsdienst, Polizei und THW.',
        'THL 1': 'Technische Hilfeleistung klein — ein Löschfahrzeug genügt.',
        'THL 2': 'Technische Hilfeleistung mittel — zusätzliche Geräte oder Kräfte (Drehleiter, THW, Polizei) nachgefordert.',
        'THL 3': 'Technische Hilfeleistung groß — Zug-/Verbandsstärke mit Führungsdienst.',
        'THL VU': 'Verkehrsunfall mit eingeklemmter Person: Feuerwehr mit hydraulischem Rettungssatz, Rettungswagen und Notarzt (Notarztindikationskatalog), Polizei zur Absicherung.',
        'THL W': 'Wasserrettung: Wasserwacht/DLRG, THW-Wassergefahren, Rettungsdienst.',
        'ABC 1': 'Gefahrstoff/Gasaustritt: Löschgruppen mit Messtechnik, Einsatzleiter, bei Verletzten Rettungsdienst.',
        'ABC 2': 'Gefahrstoffeinsatz mit Personenschaden: Löschgruppen, Einsatzleiter, Rettungsdienst, Polizei.',
        'ABC 3': 'Großer Gefahrguteinsatz: mehrere Löschgruppen, Führungsdienst, Rettungsdienst, Polizei, THW.',
        'RD 1': 'Rettungsdienst (BayRDG): ein Rettungswagen innerhalb der Hilfsfrist.',
        'RD 2': 'Notarztindikation (Notarztindikationskatalog, BayRDG): Rettungswagen und Notarzt (NEF oder Rettungshubschrauber).',
        'RD 3': 'Vitale Bedrohung: Rettungswagen und Notarzt parallel, wo vorhanden zusätzlich Helfer vor Ort (First Responder).',
        'KTP': 'Krankentransport: ein Krankentransportwagen — kein Notfall, deshalb lange Frist.',
        'MANV': 'Massenanfall von Verletzten (BayRDG): Leitender Notarzt und Organisatorischer Leiter, mehrere RTW/Notärzte, Feuerwehr und Polizei.',
        'BW 1': 'Bergrettung: Bergwacht (BRK) plus Rettungswagen für den Transport im Tal.',
        'BW 2': 'Bergrettung mit Notarzt: Bergwacht, Notarzt (auch per Hubschrauber) und Rettungswagen.',
        'BW 3': 'Großeinsatz Bergrettung: mehrere Bergwacht-Gruppen, Luftrettung, Rettungsdienst, Polizei.',
        'P': 'Polizeieinsatz — Streifen der zuständigen Polizeiinspektion; Spezialkräfte kommen von außerhalb.',
    };
    const I = (key, code, name, service, need, patience, work, points, o) => Object.assign({
        key,
        code,
        name,
        service,
        need,
        patience,
        work,
        points
    }, o);
    const INCIDENT_TYPES = [
        // ---- Feuerwehr: Brand ----
        I('brand-klein', 'B 1', 'Mülltonnenbrand', 'feuer', {
            TSF: 1
        }, 130, 10, 40, {
            esc: ['brand-gebaeude-esk', 'Das Feuer greift auf das Gebäude über!']
        }),
        I('brand-wiese', 'B 1', 'Wiesenbrand', 'feuer', {
            TSF: 1
        }, 150, 12, 40),
        I('brand-container', 'B 1', 'Containerbrand', 'feuer', {
            TSF: 1
        }, 140, 10, 40),
        I('brand-kamin', 'B 1', 'Kaminbrand', 'feuer', {
            LF: 1,
            DLK: 1
        }, 130, 14, 60),
        I('brand-pkw', 'B 1', 'Fahrzeugbrand PKW', 'feuer', {
            LF: 1,
            FUSTW: 1
        }, 120, 14, 60, {
            at: 'road'
        }),
        I('brand-lkw', 'B 2', 'Fahrzeugbrand LKW / Bus', 'feuer', {
            LF: 2,
            TLF: 1,
            FUSTW: 1
        }, 110, 18, 100, {
            at: 'road'
        }),
        I('brand-strom', 'B 1', 'Brand an Elektroverteilung', 'feuer', {
            LF: 1
        }, 120, 14, 50),
        I('brand-solar', 'B 2', 'Brand einer Photovoltaikanlage', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1
        }, 110, 18, 100),
        I('brand-garage', 'B 2', 'Garagenbrand', 'feuer', {
            LF: 2,
            FUSTW: 1
        }, 110, 16, 90),
        I('brand-keller', 'B 2', 'Kellerbrand', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1
        }, 105, 18, 110, {
            esc: ['brand-gebaeude-esk', 'Das Feuer greift vom Keller auf das Treppenhaus über!']
        }),
        I('brand-wohnung', 'B 2', 'Wohnungsbrand', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1,
            RTW: 1,
            FUSTW: 1
        }, 95, 22, 160, {
            patient: true
        }),
        I('brand-wohnung-menschen', 'B 3', 'Wohnungsbrand, Personen vermisst', 'feuer', {
            LF: 3,
            DLK: 1,
            ELW: 1,
            RTW: 1,
            NEF: 1,
            FUSTW: 1
        }, 85, 26, 230, {
            patient: true
        }),
        I('brand-dachstuhl', 'B 3', 'Dachstuhlbrand', 'feuer', {
            LF: 3,
            DLK: 2,
            TLF: 1,
            ELW: 1,
            RTW: 1,
            FUSTW: 1
        }, 90, 28, 250),
        I('brand-scheune', 'B 3', 'Scheunenbrand', 'feuer', {
            LF: 3,
            TLF: 1,
            DLK: 1,
            ELW: 1,
            FUSTW: 1
        }, 95, 30, 240, {
            esc: ['brand-scheune-esk', 'Der Wind trägt Funkenflug auf die Nachbargebäude!']
        }),
        I('brand-stall', 'B 3', 'Stallbrand mit Tieren', 'feuer', {
            LF: 3,
            TLF: 1,
            ELW: 1,
            FUSTW: 1
        }, 90, 28, 230),
        I('brand-heu', 'B 3', 'Heustockbrand', 'feuer', {
            LF: 3,
            TLF: 1,
            DLK: 1,
            ELW: 1
        }, 110, 32, 230),
        I('brand-fett', 'B 2', 'Fettbrand in Gaststättenküche', 'feuer', {
            LF: 2,
            DLK: 1
        }, 110, 14, 100),
        I('brand-rauch', 'B 2', 'Rauchentwicklung aus Gebäude', 'feuer', {
            LF: 2,
            ELW: 1
        }, 110, 14, 90),
        I('brand-wald-klein', 'B 2', 'Waldbrand (klein)', 'feuer', {
            LF: 2,
            TLF: 1
        }, 130, 20, 110, {
            esc: ['gross-waldbrand', 'Der Waldbrand breitet sich schneller aus als erwartet!']
        }),
        I('bma-gewerbe', 'B 2', 'Brandmeldeanlage ausgelöst, Gewerbebetrieb', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1
        }, 120, 12, 90),
        I('bma-schule', 'B 2', 'Brandmeldeanlage ausgelöst, Schule', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1
        }, 120, 12, 90),
        I('bma-pflegeheim', 'B 3', 'Brandmeldeanlage ausgelöst, Pflegeheim', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1,
            RTW: 1
        }, 110, 14, 120),
        I('bma-hotel', 'B 2', 'Brandmeldeanlage ausgelöst, Hotel', 'feuer', {
            LF: 2,
            DLK: 1,
            ELW: 1
        }, 120, 12, 90),
        // ---- Feuerwehr: Technische Hilfe / Gefahrstoffe ----
        I('oelspur', 'THL 1', 'Ölspur nach Unfall', 'feuer', {
            LF: 1,
            FUSTW: 1
        }, 150, 16, 60, {
            at: 'road',
            esc: ['oelspur-esk', 'Weitere Fahrzeuge rutschen aus — akute Unfallgefahr!']
        }),
        I('gasgeruch', 'ABC 1', 'Gasgeruch in Gebäude', 'feuer', {
            LF: 2,
            ELW: 1
        }, 100, 14, 90),
        I('gasleck-strasse', 'ABC 1', 'Gasleitung bei Bauarbeiten beschädigt', 'feuer', {
            LF: 2,
            FUSTW: 1
        }, 110, 16, 100),
        I('co-warner', 'ABC 1', 'Kohlenmonoxid-Warner ausgelöst', 'feuer', {
            LF: 2,
            RTW: 1,
            ELW: 1
        }, 100, 14, 110, {
            patient: true
        }),
        I('gefahrstoff-gewerbe', 'ABC 2', 'Gefahrstoff ausgetreten (Gewerbebetrieb)', 'feuer', {
            LF: 2,
            ELW: 1,
            RTW: 1,
            FUSTW: 1
        }, 120, 24, 160),
        I('oel-gewaesser', 'ABC 1', 'Ölaustritt in Gewässer', 'feuer', {
            LF: 2,
            THWW: 1
        }, 140, 22, 120, {
            at: 'see'
        }),
        I('wasserschaden', 'THL 1', 'Wasserschaden nach Rohrbruch', 'feuer', {
            TSF: 1
        }, 160, 12, 35),
        I('keller-unwetter', 'THL 1', 'Keller überflutet nach Starkregen', 'feuer', {
            LF: 1,
            THWW: 1
        }, 150, 16, 70),
        I('strasse-ueberflutet', 'THL 2', 'Straße überflutet, Unwetter', 'feuer', {
            LF: 1,
            THWB: 1
        }, 150, 16, 70, {
            at: 'road'
        }),
        I('sturm-baum', 'THL 1', 'Sturmschaden, Baum auf Straße', 'feuer', {
            TSF: 1
        }, 140, 14, 40, {
            at: 'road'
        }),
        I('sturm-dach', 'THL 2', 'Sturmschaden, Dach abgedeckt', 'feuer', {
            LF: 1,
            DLK: 1
        }, 150, 20, 80),
        I('sturm-mehrere', 'THL 2', 'Sturmschäden, mehrere Einsatzstellen', 'feuer', {
            LF: 2,
            DLK: 1,
            THWB: 1
        }, 170, 24, 120),
        I('baum-droht', 'THL 1', 'Baum droht auf Haus zu stürzen', 'feuer', {
            LF: 1,
            DLK: 1
        }, 150, 16, 70),
        I('tuer-notfall', 'THL 1', 'Notfalltüröffnung, Person hilflos', 'feuer', {
            LF: 1,
            RTW: 1,
            FUSTW: 1
        }, 110, 12, 90, {
            patient: true
        }),
        I('tuer-rauchmelder', 'THL 1', 'Rauchmelder in Wohnung ausgelöst', 'feuer', {
            LF: 1,
            FUSTW: 1
        }, 130, 10, 50),
        I('fahrstuhl', 'THL 1', 'Person im Aufzug eingeschlossen', 'feuer', {
            LF: 1
        }, 120, 12, 40),
        I('hoehenrettung-geruest', 'THL 2', 'Person auf Baugerüst in Notlage', 'feuer', {
            LF: 1,
            DLK: 1,
            RTW: 1
        }, 110, 18, 110, {
            patient: true
        }),
        I('insektennest', 'THL 1', 'Wespennest an Wohnhaus', 'feuer', {
            TSF: 1
        }, 170, 14, 30),
        I('tierrettung-baum', 'THL 1', 'Katze auf Baum, kann nicht runter', 'feuer', {
            TSF: 1
        }, 180, 10, 20),
        I('tierrettung-rind', 'THL 2', 'Rind in Notlage (Bach, Jauchegrube)', 'feuer', {
            LF: 2,
            THWB: 1
        }, 160, 20, 80),
        I('vu-klemmt', 'THL VU', 'Verkehrsunfall, Person eingeklemmt', 'feuer', {
            LF: 2,
            RTW: 1,
            NEF: 1,
            FUSTW: 1
        }, 80, 22, 190, {
            at: 'road',
            patient: true
        }),
        I('vu-lkw-klemmt', 'THL VU', 'Verkehrsunfall mit LKW, Person eingeklemmt', 'feuer', {
            LF: 2,
            RW: 1,
            ELW: 1,
            RTW: 1,
            NEF: 1,
            FUSTW: 2
        }, 110, 28, 270, {
            at: 'road',
            patient: true
        }),
        I('vu-graben', 'THL 1', 'Fahrzeug im Graben, Person unverletzt', 'feuer', {
            LF: 1,
            FUSTW: 1
        }, 140, 14, 50, {
            at: 'road'
        }),
        I('ladung-verloren', 'THL 1', 'LKW verliert Ladung auf der Fahrbahn', 'feuer', {
            LF: 1,
            FUSTW: 1
        }, 130, 16, 60, {
            at: 'road'
        }),
        I('weidetiere-strasse', 'THL 1', 'Weidetiere auf der Straße ausgebrochen', 'feuer', {
            TSF: 1,
            FUSTW: 1
        }, 140, 14, 45, {
            at: 'road'
        }),

        // ---- Rettungsdienst ----
        I('sturz', 'RD 1', 'Sturz mit Verletzung', 'rd', {
            RTW: 1
        }, 110, 12, 55, {
            esc: ['sturz-esk', 'Der Zustand des Patienten verschlechtert sich!']
        }),
        I('sturz-treppe', 'RD 1', 'Sturz auf der Treppe', 'rd', {
            RTW: 1
        }, 115, 12, 55),
        I('sturz-senior', 'RD 1', 'Sturz eines Senioren zuhause', 'rd', {
            RTW: 1
        }, 120, 12, 50),
        I('kollaps', 'RD 1', 'Kreislaufkollaps', 'rd', {
            RTW: 1
        }, 120, 12, 55),
        I('diabetes', 'RD 1', 'Diabetischer Notfall', 'rd', {
            RTW: 1
        }, 100, 11, 55),
        I('allergie', 'RD 1', 'Allergische Reaktion', 'rd', {
            RTW: 1
        }, 100, 12, 60),
        I('brustschmerz', 'RD 1', 'Brustschmerzen', 'rd', {
            RTW: 1
        }, 90, 12, 70),
        I('bauchschmerz', 'RD 1', 'Starke Bauchschmerzen', 'rd', {
            RTW: 1
        }, 120, 12, 50),
        I('asthma', 'RD 1', 'Asthmaanfall', 'rd', {
            RTW: 1
        }, 95, 12, 65),
        I('hitzschlag', 'RD 1', 'Hitzschlag', 'rd', {
            RTW: 1
        }, 120, 12, 55),
        I('psych-notfall', 'RD 1', 'Psychiatrischer Notfall', 'rd', {
            RTW: 1,
            FUSTW: 1
        }, 90, 16, 90),
        I('reitunfall', 'RD 1', 'Reitunfall, vom Pferd gestürzt', 'rd', {
            RTW: 1
        }, 100, 14, 70),
        I('kollaps-schule', 'RD 1', 'Kollaps eines Schülers im Sportunterricht', 'rd', {
            RTW: 1
        }, 110, 12, 55),
        I('sportunfall', 'RD 1', 'Sportunfall mit Verletzung', 'rd', {
            RTW: 1
        }, 120, 12, 50),
        I('verbrennung', 'RD 2', 'Verbrennung durch Grillunfall', 'rd', {
            RTW: 1,
            NEF: 1
        }, 100, 14, 100),
        I('anaphylaxie', 'RD 2', 'Anaphylaktischer Schock nach Insektenstich', 'rd', {
            RTW: 1,
            NEF: 1
        }, 65, 14, 115),
        I('herzinfarkt', 'RD 2', 'Verdacht auf Herzinfarkt', 'rd', {
            RTW: 1,
            NEF: 1
        }, 65, 14, 120),
        I('schlaganfall', 'RD 2', 'Verdacht auf Schlaganfall', 'rd', {
            RTW: 1,
            NEF: 1
        }, 60, 14, 120),
        I('atemnot', 'RD 2', 'Akute Atemnot', 'rd', {
            RTW: 1,
            NEF: 1
        }, 70, 13, 110),
        I('krampfanfall', 'RD 2', 'Krampfanfall / Epilepsie', 'rd', {
            RTW: 1,
            NEF: 1
        }, 75, 14, 100),
        I('vergiftung', 'RD 2', 'Vergiftung', 'rd', {
            RTW: 1,
            NEF: 1
        }, 70, 14, 105),
        I('geburt', 'RD 2', 'Vorzeitige Wehen / Geburt', 'rd', {
            RTW: 1,
            NEF: 1
        }, 60, 16, 125),
        I('kindernotfall', 'RD 2', 'Kindernotfall (Fieberkrampf)', 'rd', {
            RTW: 1,
            NEF: 1
        }, 60, 14, 125),
        I('kettensaege', 'RD 2', 'Verletzung durch Kettensäge', 'rd', {
            RTW: 1,
            NEF: 1
        }, 75, 16, 115),
        I('stromunfall', 'RD 2', 'Stromunfall', 'rd', {
            RTW: 1,
            NEF: 1,
            LF: 1
        }, 75, 16, 130),
        I('arbeitsunfall-landw', 'RD 2', 'Arbeitsunfall Landwirtschaft, Person eingeklemmt', 'rd', {
            RTW: 1,
            NEF: 1,
            LF: 1
        }, 80, 20, 150),
        I('bewusstlos', 'RD 3', 'Bewusstlosigkeit unklarer Ursache', 'rd', {
            RTW: 1,
            NEF: 1,
            HVO: 1
        }, 65, 14, 125),
        I('reanimation', 'RD 3', 'Reanimation, Person leblos', 'rd', {
            RTW: 1,
            NEF: 1,
            HVO: 1
        }, 45, 18, 170),
        I('unterkuehlung', 'RD 2', 'Unterkühlung im Schnee', 'rd', {
            RTW: 1,
            NEF: 1
        }, 130, 14, 90, {
            at: 'berg'
        }),
        I('krankentransport', 'KTP', 'Krankentransport angefordert', 'rd', {
            KTW: 1
        }, 170, 10, 30),
        I('krankentransport-dringend', 'KTP', 'Krankentransport, dringende Verlegung', 'rd', {
            KTW: 1
        }, 130, 12, 45),
        I('ertrinken', 'RD 3', 'Ertrinkungsunfall', 'rd', {
            RTW: 1,
            NEF: 1,
            WR: 1
        }, 55, 18, 160, {
            at: 'see'
        }),
        I('badeunfall', 'RD 2', 'Badeunfall am See', 'rd', {
            RTW: 1,
            WR: 1
        }, 80, 14, 100, {
            at: 'see'
        }),
        I('skiunfall', 'BW 1', 'Skiunfall auf der Piste', 'rd', {
            HRT: 1,
            RTW: 1
        }, 105, 14, 80, {
            at: 'berg'
        }),
        I('snowboard', 'BW 1', 'Snowboard-Sturz mit Verletzung', 'rd', {
            HRT: 1,
            RTW: 1
        }, 110, 13, 80, {
            at: 'berg'
        }),
        I('mountainbike', 'BW 1', 'Mountainbike-Sturz im Gelände', 'rd', {
            HRT: 1,
            RTW: 1
        }, 110, 15, 85, {
            at: 'berg'
        }),
        I('klettersturz', 'BW 2', 'Sturz beim Klettern', 'rd', {
            HRT: 1,
            NEF: 1,
            RTW: 1
        }, 130, 22, 170, {
            at: 'berg'
        }),
        I('bergnot', 'BW 1', 'Wanderer in Bergnot', 'rd', {
            HRT: 1,
            RTW: 1
        }, 160, 25, 140, {
            at: 'berg'
        }),
        I('gleitschirm', 'BW 2', 'Gleitschirm-Absturz', 'rd', {
            HRT: 1,
            NEF: 1,
            RTW: 1
        }, 95, 22, 190, {
            at: 'berg'
        }),
        I('unfall-verletzt', 'RD 2', 'Verkehrsunfall mit Verletzten', 'rd', {
            RTW: 1,
            FUSTW: 1,
            LF: 1
        }, 80, 18, 110, {
            at: 'road'
        }),
        I('unfall-fussgaenger', 'RD 3', 'Verkehrsunfall, Fußgänger erfasst', 'rd', {
            RTW: 1,
            NEF: 1,
            FUSTW: 1
        }, 65, 20, 150, {
            at: 'road'
        }),
        I('unfall-radfahrer', 'RD 2', 'Verkehrsunfall mit Radfahrer', 'rd', {
            RTW: 1,
            FUSTW: 1
        }, 85, 16, 95, {
            at: 'road'
        }),
        I('unfall-motorrad', 'RD 3', 'Motorradunfall', 'rd', {
            RTW: 1,
            NEF: 1,
            FUSTW: 1,
            LF: 1
        }, 65, 20, 160, {
            at: 'road'
        }),
        I('unfall-kind', 'RD 3', 'Verkehrsunfall mit Kind', 'rd', {
            RTW: 1,
            NEF: 1,
            FUSTW: 1
        }, 60, 20, 165, {
            at: 'road'
        }),
        I('unfall-mehrere', 'RD 3', 'Verkehrsunfall, mehrere Verletzte', 'rd', {
            RTW: 2,
            NEF: 1,
            FUSTW: 2,
            LF: 1
        }, 80, 22, 200, {
            at: 'road'
        }),

        // ---- Polizei ----
        I('unfall-blech', 'P', 'Verkehrsunfall, Blechschaden', 'pol', {
            FUSTW: 1
        }, 150, 12, 30, {
            at: 'road',
            esc: ['unfall-verletzt', 'Doch Verletzte gemeldet!']
        }),
        I('ruhestoerung', 'P', 'Ruhestörung', 'pol', {
            FUSTW: 1
        }, 140, 9, 35, {
            esc: ['ruhestoerung-esk', 'Es kommt zu Handgreiflichkeiten, die Lage eskaliert!']
        }),
        I('haeusliche-gewalt', 'P', 'Häusliche Gewalt gemeldet', 'pol', {
            FUSTW: 2
        }, 90, 16, 95),
        I('einbruch-alarm', 'P', 'Einbruchsalarm ausgelöst', 'pol', {
            FUSTW: 2
        }, 100, 14, 60),
        I('einbruch-wohnhaus', 'P', 'Einbruch in Wohnhaus', 'pol', {
            FUSTW: 2
        }, 95, 16, 85),
        I('einbruch-geschaeft', 'P', 'Einbruch in Geschäft', 'pol', {
            FUSTW: 2
        }, 100, 15, 80),
        I('ladendiebstahl', 'P', 'Ladendiebstahl', 'pol', {
            FUSTW: 1
        }, 130, 10, 35),
        I('trunkenheit', 'P', 'Trunkenheit im Straßenverkehr', 'pol', {
            FUSTW: 1
        }, 120, 12, 45, {
            at: 'road'
        }),
        I('fahrerflucht', 'P', 'Unfallflucht gemeldet', 'pol', {
            FUSTW: 1
        }, 140, 12, 40, {
            at: 'road'
        }),
        I('sachbeschaedigung', 'P', 'Sachbeschädigung', 'pol', {
            FUSTW: 1
        }, 150, 10, 30),
        I('falschparker', 'P', 'Falschparker blockiert Feuerwehrzufahrt', 'pol', {
            FUSTW: 1
        }, 160, 8, 25),
        I('vermisst-person', 'P', 'Vermisste Person gemeldet', 'pol', {
            FUSTW: 2
        }, 130, 18, 90),
        I('vermisst-demenz', 'P', 'Vermisste demenzkranke Person', 'pol', {
            FUSTW: 2
        }, 110, 20, 110),
        I('vermisst-kind', 'P', 'Vermisstes Kind', 'pol', {
            FUSTW: 2
        }, 90, 18, 120, {
            esc: ['gross-suche-kind', 'Das Kind wird seit über einer Stunde vermisst — Großfahndung nötig!']
        }),
        I('verdaechtige-person', 'P', 'Verdächtige Person gemeldet', 'pol', {
            FUSTW: 1
        }, 140, 10, 35),
        I('schlaegerei', 'P', 'Schlägerei vor Gaststätte', 'pol', {
            FUSTW: 2
        }, 100, 14, 85),
        I('bedrohung-waffe', 'P', 'Bedrohung mit Waffe gemeldet', 'pol', {
            FUSTW: 3,
            SEK: 1
        }, 220, 24, 220),
        I('autorennen', 'P', 'Illegales Autorennen gemeldet', 'pol', {
            FUSTW: 2
        }, 110, 14, 70, {
            at: 'road'
        }),
        I('festnahme', 'P', 'Festnahme, Gefangenentransport nötig', 'pol', {
            FUSTW: 1,
            GEFKW: 1
        }, 130, 15, 50),
        I('stalking', 'P', 'Stalking-Meldung', 'pol', {
            FUSTW: 1
        }, 150, 12, 40),
        I('fahrraddiebstahl', 'P', 'Fahrraddiebstahl beobachtet', 'pol', {
            FUSTW: 1
        }, 150, 9, 30),
        I('nachbarschaftsstreit', 'P', 'Nachbarschaftsstreit eskaliert', 'pol', {
            FUSTW: 1
        }, 140, 12, 35),
        I('wildunfall', 'P', 'Wildunfall mit Reh', 'pol', {
            FUSTW: 1
        }, 150, 10, 30, {
            at: 'road'
        }),
        I('hilflos-alkohol', 'P', 'Hilflose alkoholisierte Person', 'pol', {
            FUSTW: 1,
            RTW: 1
        }, 120, 12, 60, {
            patient: true
        }),
        I('volksfest', 'P', 'Volksfest: Sicherung und Sanitätsdienst', 'pol', {
            FUSTW: 3,
            RTW: 1
        }, 160, 20, 100),
        I('randalierer', 'P', 'Randalierer in Gaststätte', 'pol', {
            FUSTW: 2
        }, 100, 14, 80),
        I('betrug-telefon', 'P', 'Betrugsanzeige (falscher Polizeibeamter)', 'pol', {
            FUSTW: 1
        }, 170, 10, 35),

        // ---- THW / Wasser ----
        I('wasserrettung-fluss', 'THL W', 'Person in der Iller treibend', 'thw', {
            WR: 1,
            THWW: 1,
            RTW: 1,
            LF: 1
        }, 90, 22, 170, {
            at: 'see',
            patient: true
        }),
        I('thw-beleuchtung', 'THL 1', 'Ausleuchtung einer nächtlichen Einsatzstelle', 'thw', {
            THWB: 1
        }, 160, 14, 35),
        I('baum-strasse-gross', 'THL 2', 'Umgestürzter Baum blockiert Hauptstraße', 'thw', {
            LF: 1,
            THWB: 1
        }, 120, 16, 70, {
            at: 'road'
        }),
        I('wasser-keller-thw', 'THL 1', 'Wasser im Keller nach Starkregen', 'thw', {
            THWW: 1,
            LF: 1
        }, 150, 16, 60),
        I('hangrutsch', 'THL 2', 'Hangrutsch bedroht Wohnhaus', 'thw', {
            THWB: 1,
            LF: 1,
            FUSTW: 1
        }, 140, 22, 110),

        // ---- Nur ueber Eskalation erreichbar — spawnen nie von selbst ----
        I('brand-gebaeude-esk', 'B 3', 'Gebäudebrand (eskaliert)', 'feuer', {
            LF: 3,
            DLK: 1,
            ELW: 1,
            RTW: 1,
            FUSTW: 1
        }, 70, 26, 200, {
            hidden: true
        }),
        I('brand-scheune-esk', 'B 4', 'Großbrand landwirtschaftliches Gebäude', 'feuer', {
            LF: 4,
            TLF: 2,
            DLK: 1,
            ELW: 1,
            RW: 1,
            FUSTW: 1
        }, 70, 32, 300, {
            hidden: true
        }),
        I('oelspur-esk', 'THL 2', 'Ölspur mit Folgeunfall', 'feuer', {
            LF: 1,
            FUSTW: 1,
            RTW: 1
        }, 60, 18, 90, {
            hidden: true,
            patient: true
        }),
        I('sturz-esk', 'RD 2', 'Bewusstloser Patient', 'rd', {
            RTW: 1,
            NEF: 1
        }, 50, 16, 100, {
            hidden: true
        }),
        I('ruhestoerung-esk', 'P', 'Schlägerei mit Verletzten', 'pol', {
            FUSTW: 2,
            RTW: 1
        }, 60, 16, 100, {
            hidden: true,
            patient: true
        }),

        // ---- Grosseinsaetze: Spezialkraefte, Fuehrungsdienste, oft von ausserhalb ----
        I('gross-gewerbebrand', 'B 4', 'Großbrand Gewerbehalle', 'feuer', {
            LF: 5,
            DLK: 2,
            TLF: 2,
            ELW: 2,
            RW: 1,
            RTW: 2,
            NEF: 1,
            FUSTW: 2,
            THWB: 1
        }, 200, 42, 420, {
            tier: 'gross'
        }),
        I('gross-hotelbrand', 'B 4', 'Hotelbrand mit Evakuierung', 'feuer', {
            LF: 4,
            DLK: 2,
            TLF: 1,
            ELW: 2,
            RTW: 3,
            NEF: 1,
            FUSTW: 2
        }, 190, 40, 400, {
            tier: 'gross'
        }),
        I('gross-krankenhausbrand', 'B 4', 'Brand im Klinikum, Evakuierung nötig', 'feuer', {
            LF: 4,
            DLK: 2,
            ELW: 2,
            RTW: 4,
            NEF: 1,
            ORGL: 1,
            FUSTW: 2
        }, 210, 40, 450, {
            tier: 'gross'
        }),
        I('gross-explosion', 'B 4', 'Explosion in Wohngebäude', 'feuer', {
            LF: 3,
            DLK: 1,
            ELW: 1,
            RTW: 3,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            FUSTW: 2
        }, 170, 36, 420, {
            tier: 'gross',
            patient: true
        }),
        I('gross-flugunfall', 'B 4', 'Flugunfall am Allgäu Airport', 'feuer', {
            LF: 3,
            TLF: 2,
            ELW: 1,
            RTW: 3,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            FUSTW: 2
        }, 190, 36, 460, {
            tier: 'gross',
            patient: true,
            fixed: {
                name: 'Allgäu Airport Memmingen',
                coords: [47.9888, 10.2395]
            }
        }),
        I('gross-waldbrand', 'B 4', 'Großflächiger Waldbrand', 'feuer', {
            LF: 5,
            TLF: 3,
            ELW: 2,
            FUSTW: 1,
            THWB: 1
        }, 230, 48, 400, {
            tier: 'gross'
        }),
        I('gross-gefahrgut', 'ABC 3', 'Gefahrguttransport verunglückt', 'feuer', {
            LF: 4,
            TLF: 1,
            ELW: 2,
            RTW: 2,
            NEF: 1,
            FUSTW: 2,
            THWB: 1
        }, 190, 38, 400, {
            tier: 'gross',
            at: 'road',
            patient: true
        }),
        I('gross-karambolage', 'MANV', 'Massenkarambolage auf der A7', 'rd', {
            RTW: 5,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            FUSTW: 3,
            LF: 3,
            RW: 1,
            ELW: 1
        }, 190, 34, 480, {
            tier: 'gross',
            at: 'road'
        }),
        I('gross-busunglueck', 'MANV', 'Busunglück auf der Passstraße', 'rd', {
            RTW: 5,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            LF: 2,
            RW: 1,
            FUSTW: 2
        }, 200, 36, 470, {
            tier: 'gross',
            at: 'road'
        }),
        I('gross-zugunglueck', 'MANV', 'Zugunglück mit mehreren Verletzten', 'rd', {
            RTW: 5,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            FUSTW: 3,
            LF: 3,
            RW: 1,
            ELW: 1,
            THWB: 1
        }, 210, 38, 500, {
            tier: 'gross'
        }),
        I('gross-festzelt', 'MANV', 'Festzelt eingestürzt bei Unwetter', 'rd', {
            RTW: 4,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            FUSTW: 3,
            LF: 2,
            THWB: 1
        }, 200, 34, 440, {
            tier: 'gross'
        }),
        I('gross-skimassen', 'MANV', 'Massensturz auf der Skipiste', 'rd', {
            HRT: 2,
            RTW: 3,
            NEF: 1,
            ORGL: 1
        }, 170, 30, 320, {
            tier: 'gross',
            at: 'berg'
        }),
        I('gross-einsturz', 'MANV', 'Gebäudeeinsturz', 'thw', {
            THWB: 2,
            RW: 1,
            LF: 2,
            RTW: 3,
            NEF: 2,
            LNA: 1,
            ORGL: 1,
            ELW: 1,
            FUSTW: 2
        }, 210, 45, 480, {
            tier: 'gross',
            patient: true
        }),
        I('gross-hochwasser', 'THL W', 'Hochwassereinsatz an der Iller', 'thw', {
            THWW: 2,
            THWB: 2,
            LF: 4,
            RTW: 1,
            ELW: 1
        }, 220, 38, 380, {
            tier: 'gross'
        }),
        I('gross-erdrutsch', 'THL 3', 'Erdrutsch verschüttet Straße', 'thw', {
            THWB: 2,
            LF: 2,
            RW: 1,
            FUSTW: 1
        }, 200, 35, 320, {
            tier: 'gross',
            at: 'berg'
        }),
        I('gross-mure', 'THL 3', 'Murenabgang im Bergtal', 'thw', {
            THWB: 2,
            LF: 2,
            RW: 1,
            HRT: 1,
            FUSTW: 1
        }, 210, 36, 340, {
            tier: 'gross',
            at: 'berg'
        }),
        I('gross-schneechaos', 'THL 3', 'Schneechaos, mehrere Fahrzeuge feststeckend', 'pol', {
            FUSTW: 3,
            THWB: 2,
            LF: 2
        }, 200, 28, 300, {
            tier: 'gross',
            at: 'road'
        }),
        I('gross-stromausfall', 'THL 3', 'Großflächiger Stromausfall', 'feuer', {
            ELW: 1,
            FUSTW: 3,
            THWB: 2,
            LF: 2
        }, 220, 30, 280, {
            tier: 'gross'
        }),
        I('gross-geiselnahme', 'P', 'Geiselnahme in der Innenstadt', 'pol', {
            FUSTW: 6,
            SEK: 1,
            RTW: 1,
            NEF: 1
        }, 260, 36, 450, {
            tier: 'gross'
        }),
        I('gross-suche-kind', 'P', 'Großfahndung nach vermisstem Kind', 'pol', {
            FUSTW: 4,
            HRT: 1,
            THWB: 1
        }, 210, 30, 340, {
            tier: 'gross'
        }),
        I('gross-bergnot', 'BW 3', 'Vermisster Wanderer im Hochgebirge', 'rd', {
            HRT: 3,
            RTW: 1,
            RTH: 1,
            FUSTW: 1
        }, 220, 30, 330, {
            tier: 'gross',
            at: 'berg'
        }),
        I('gross-seilbahn', 'BW 3', 'Seilbahn-Zwischenfall, Personen in Gondeln', 'rd', {
            HRT: 3,
            RTH: 1,
            RTW: 2,
            ELW: 1
        }, 240, 36, 400, {
            tier: 'gross',
            at: 'berg'
        }),
        I('gross-lawine', 'BW 3', 'Lawinenabgang mit Verschütteten', 'rd', {
            HRT: 3,
            RTH: 2,
            RTW: 2,
            NEF: 1,
            LNA: 1,
            ORGL: 1,
            FUSTW: 1
        }, 230, 40, 520, {
            tier: 'gross',
            at: 'berg'
        }),
    ];
    const INCIDENT_BY_KEY = {};
    INCIDENT_TYPES.forEach(t => {
        INCIDENT_BY_KEY[t.key] = t;
        if (t.esc) t.escalation = {
            to: t.esc[0],
            message: t.esc[1]
        };
    });

    function findType(key) {
        return INCIDENT_BY_KEY[key];
    }

    const PATIENCE_MULT = 2.2;

    const TIMESCALE = 7;
    const HILFSFRIST = {
        feuer: 600 / TIMESCALE,
        rd: 720 / TIMESCALE
    }; // 10 bzw. 12 Minuten
    function simHour() {
        return Math.floor(S.clockMin / 60) % 24;
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function simTime() {
        const m = Math.floor(S.clockMin);
        return pad2(Math.floor(m / 60) % 24) + ':' + pad2(m % 60);
    }

    function isWeekday() {
        const d = new Date().getDay();
        return d >= 1 && d <= 5;
    }

    function seasonNow() {
        const m = new Date().getMonth();
        return (m >= 10 || m <= 2) ? 'winter' : (m >= 4 && m <= 8) ? 'summer' : 'mid';
    }

    function isDaytimeWeekday() {
        const h = simHour();
        return isWeekday() && h >= 7 && h < 17;
    }

    function clockText() {
        return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date().getDay()] + ' ' + simTime();
    }

    const WHEN = {
        skiunfall: {
            season: 'winter'
        },
        snowboard: {
            season: 'winter'
        },
        unterkuehlung: {
            season: 'winter'
        },
        'gross-skimassen': {
            season: 'winter'
        },
        'gross-lawine': {
            season: 'winter'
        },
        'gross-schneechaos': {
            season: 'winter'
        },
        'brand-kamin': {
            season: 'winter'
        },
        'co-warner': {
            season: 'winter'
        },
        gasgeruch: {
            season: 'winter'
        },
        badeunfall: {
            season: 'summer'
        },
        ertrinken: {
            season: 'summer'
        },
        hitzschlag: {
            season: 'summer'
        },
        insektennest: {
            season: 'summer'
        },
        anaphylaxie: {
            season: 'summer'
        },
        'brand-wiese': {
            season: 'summer'
        },
        'brand-wald-klein': {
            season: 'summer'
        },
        'gross-waldbrand': {
            season: 'summer'
        },
        'brand-heu': {
            season: 'summer'
        },
        'brand-solar': {
            season: 'summer'
        },
        mountainbike: {
            season: 'summer'
        },
        gleitschirm: {
            season: 'summer'
        },
        bergnot: {
            season: 'summer'
        },
        klettersturz: {
            season: 'summer'
        },
        'gross-bergnot': {
            season: 'summer'
        },
        verbrennung: {
            season: 'summer'
        },
        volksfest: {
            season: 'summer',
            time: 'evening'
        },
        'gross-festzelt': {
            season: 'summer',
            time: 'evening'
        },
        'bma-schule': {
            time: 'day'
        },
        'kollaps-schule': {
            time: 'day'
        },
        ladendiebstahl: {
            time: 'day'
        },
        'einbruch-wohnhaus': {
            time: 'day'
        },
        'arbeitsunfall-landw': {
            time: 'day'
        },
        kettensaege: {
            time: 'day'
        },
        krankentransport: {
            time: 'day'
        },
        'krankentransport-dringend': {
            time: 'day'
        },
        sportunfall: {
            time: 'day'
        },
        reitunfall: {
            time: 'day'
        },
        'betrug-telefon': {
            time: 'day'
        },
        'einbruch-geschaeft': {
            time: 'night'
        },
        'einbruch-alarm': {
            time: 'night'
        },
        ruhestoerung: {
            time: 'night'
        },
        schlaegerei: {
            time: 'night'
        },
        randalierer: {
            time: 'night'
        },
        'hilflos-alkohol': {
            time: 'night'
        },
        trunkenheit: {
            time: 'night'
        },
        autorennen: {
            time: 'night'
        },
        'thw-beleuchtung': {
            time: 'night'
        },
        'brand-fett': {
            time: 'evening'
        },
    };

    function whenWeight(t) {
        const w = WHEN[t.key];
        if (!w) return 1;
        const h = simHour(),
            season = seasonNow();
        let f = 1;
        if (w.season) f *= w.season === season ? 2.5 : season === 'mid' ? 0.35 : 0.05;
        if (w.time) {
            const ok = w.time === 'day' ? (h >= 7 && h < 18) : w.time === 'night' ? (h >= 21 || h < 6) : h >= 17;
            f *= ok ? 2.5 : 0.12;
        }
        return f;
    }

    function baseDelay(v) {
        const st = STATION_BY_ID[v.stationId];
        switch (v.typeKey) {
            case 'RTW':
                return 8;
            case 'KTW':
                return 10;
            case 'GWSAN':
                return 12;
            case 'NEF':
                return 12;
            case 'HVO':
                return 15;
            case 'LNA':
                return 25;
            case 'ORGL':
                return 20;
            case 'RTH':
                return 12;
            case 'FUSTW':
                return 5;
            case 'GEFKW':
                return 15;
            case 'SEK':
                return 40;
            case 'THWB':
            case 'THWW':
                return 40;
            case 'HRT':
            case 'WR':
                return 35;
            default:
                break;
        }
        const hauptamtlich = st && st.note === '2 Löschzüge';
        const stuetz = st && st.note === 'Stützpunktfeuerwehr';
        let d = hauptamtlich ? 10 : stuetz ? 20 : 30;
        if (!hauptamtlich && isDaytimeWeekday()) d *= stuetz ? 1.3 : 1.8;
        else if (!hauptamtlich && (simHour() >= 22 || simHour() < 6)) d *= 1.15;
        return d;
    }

    function alertDelay(v) {
        return baseDelay(v) * (0.8 + Math.random() * 0.4);
    }

    function estimateTravel(type, coords) {
        let worst = 0;
        Object.keys(type.need).forEach(role => {
            const times = S.vehicles.filter(v => v.status === 'bereit' && v.fills.includes(role))
                .map(v => travelSeconds(haversineKm(v.pos, coords), v) + baseDelay(v)).sort((a, b) => a - b);
            const t = times[Math.min(type.need[role], times.length) - 1];
            if (t !== undefined) worst = Math.max(worst, t);
        });
        return worst;
    }
    const SERVICE_WEIGHT = {
        rd: 6,
        feuer: 5,
        pol: 9,
        thw: 3
    };

    function pickIncidentType(allowGross) {
        const pool = INCIDENT_TYPES.filter(t => !t.hidden && (allowGross || t.tier !== 'gross'));
        const weights = pool.map(t => (t.tier === 'gross' ? 1 : SERVICE_WEIGHT[t.service]) * whenWeight(t));
        let r = Math.random() * weights.reduce((a, b) => a + b, 0);
        for (let i = 0; i < pool.length; i++) {
            r -= weights[i];
            if (r <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    }

    function rand(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function pickLocation(type) {
        if (type.fixed) return {
            name: type.fixed.name,
            coords: type.fixed.coords.slice()
        };
        if (type.at === 'road' && D.roads.length) {
            const r = rand(D.roads);
            return {
                name: r[0] + ' bei ' + r[1],
                coords: [r[2], r[3]]
            };
        }
        if (type.at === 'berg' && D.berg.length) {
            const b = rand(D.berg);
            return {
                name: b[0],
                coords: [b[1], b[2]]
            };
        }
        if (type.at === 'see' && D.see.length) {
            const b = rand(D.see);
            return {
                name: b[0],
                coords: [b[1], b[2]]
            };
        }
        const s = rand(D.streets);
        return {
            name: s[0] + ', ' + s[1],
            coords: [s[2], s[3]]
        };
    }

    const ICONS = {
        flame: '<path d="M12 2s5 5.5 5 10a5 5 0 0 1-10 0c0-1.2.5-2 1-3 .3 1 1 1.5 1.5 1.2C10 9 9 7.5 9 6c1.5 1 2 .5 1.5-1C11 7 12 6 12 2z"></path>',
        rescue: '<path stroke-width="3.8" d="M12 3.5v17M4.6 7.75l14.8 8.5M4.6 16.25l14.8-8.5"></path>',
        cross: '<path d="M12 4v16M4 12h16"></path>',
        shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"></path>',
        wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
        clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path>',
        close: '<path d="M6 6l12 12M18 6L6 18"></path>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
        radio: '<path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9"></path><path d="M4 10l8-6 8 6"></path><circle cx="12" cy="15" r="2.4"></circle>',
        siren: '<path d="M12 3l10 18H2z"></path><path d="M12 10v5M12 18v.01"></path>',
        mountain: '<path d="M3 19l6.5-11 4 6.5 2.5-3.5L21 19z"></path>',
        wave: '<path d="M3 10c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"></path><path d="M3 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2"></path>',
        heli: '<path d="M4 6h16M12 6v3"></path><path d="M5 15a5 5 0 0 1 5-6h4a4 4 0 0 1 4 4v3H7a2 2 0 0 1-2-1z"></path><path d="M9 19h9"></path>',
        trophy: '<path d="M8 21h8M12 17v4"></path><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"></path><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"></path>',
    };
    const svg = (name, cls) => '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24">' + ICONS[name] + '</svg>';

    function glyphFor(typeKey, service) {
        if (typeKey === 'RTH') return 'heli';
        if (typeKey === 'HRT') return 'mountain';
        if (typeKey === 'WR') return 'wave';
        return svcIcon(service);
    }

    function stationGlyph(st) {
        if (st.fleet.length === 1) return glyphFor(st.fleet[0], st.service);
        return svcIcon(st.service);
    }
    const svcIcon = svc => svc === 'feuer' ? 'flame' : svc === 'rd' ? 'rescue' : svc === 'thw' ? 'wrench' : 'shield';

    function callsignFor(typeKey, st, n) {
        if (st.callsign) return st.callsign;
        const t = st.town || st.name,
            org = st.org || 'Rotkreuz';
        switch (typeKey) {
            case 'ELW':
                return 'Florian ' + t + ' 11/' + n;
            case 'DLK':
                return 'Florian ' + t + ' 30/' + n;
            case 'LF':
                return 'Florian ' + t + ' 40/' + n;
            case 'TSF':
                return 'Florian ' + t + ' 42/' + n;
            case 'TLF':
                return 'Florian ' + t + ' 44/' + n;
            case 'RW':
                return 'Florian ' + t + ' 51/' + n;
            case 'HVO':
                return 'First Responder ' + t;
            case 'RTW':
                return org + ' ' + t + ' 71/' + n;
            case 'NEF':
                return org + ' ' + t + ' 76/' + n;
            case 'KTW':
                return org + ' ' + t + ' 85/' + n;
            case 'GWSAN':
                return org + ' ' + t + ' 78/' + n;
            case 'LNA':
                return 'LNA ' + t;
            case 'ORGL':
                return 'OrgL ' + t;
            case 'HRT':
                return 'Bergwacht ' + t + ' ' + n;
            case 'WR':
                return (/DLRG/.test(st.name) ? 'DLRG ' : 'Wasserwacht ') + t + ' ' + n;
            case 'FUSTW':
                return t + ' 12/' + n;
            case 'GEFKW':
                return t + ' 15/' + n;
            case 'THWB':
                return 'Heros ' + t + ' 26/' + n;
            case 'THWW':
                return 'Heros ' + t + ' 33/' + n;
            default:
                return typeKey + ' ' + t;
        }
    }

    const MUTE_KEY = 'ubodigat-leitstelle-muted';
    const Sound = (function() {
        let ctx = null;
        let muted = false;
        try {
            muted = localStorage.getItem(MUTE_KEY) === '1';
        } catch (e) {
            /* egal */ }

        function ensure() {
            if (muted) return null;
            if (!ctx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return null;
                ctx = new Ctx();
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        }

        function tone(ac, freq, start, dur, type, peak) {
            const osc = ac.createOscillator(),
                gain = ac.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, ac.currentTime + start);
            gain.gain.setValueAtTime(0, ac.currentTime + start);
            gain.gain.linearRampToValueAtTime(peak || 0.14, ac.currentTime + start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
            osc.connect(gain).connect(ac.destination);
            osc.start(ac.currentTime + start);
            osc.stop(ac.currentTime + start + dur + 0.03);
        }

        return {
            isMuted() {
                return muted;
            },
            setMuted(v) {
                muted = v;
                try {
                    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
                } catch (e) {
                    /* egal */ }
            },
            unlock() {
                ensure();
            },
            alarm() {
                const ac = ensure();
                if (!ac) return;
                [0, 0.18, 0.36].forEach(t => tone(ac, 880, t, 0.16, 'square', 0.09));
                [0.09, 0.27].forEach(t => tone(ac, 660, t, 0.16, 'square', 0.09));
            },
            grossAlarm() {
                const ac = ensure();
                if (!ac) return;
                [0, 0.22, 0.44, 0.66].forEach(t => tone(ac, 780, t, 0.2, 'square', 0.1));
                [0.11, 0.33, 0.55].forEach(t => tone(ac, 520, t, 0.2, 'square', 0.1));
            },
            dispatch() {
                const ac = ensure();
                if (!ac) return;
                tone(ac, 520, 0, 0.09, 'sine', 0.12);
                tone(ac, 780, 0.06, 0.1, 'sine', 0.1);
            },
            success() {
                const ac = ensure();
                if (!ac) return;
                [523, 659, 784].forEach((f, i) => tone(ac, f, i * 0.09, 0.22, 'sine', 0.12));
            },
            miss() {
                const ac = ensure();
                if (!ac) return;
                [330, 247].forEach((f, i) => tone(ac, f, i * 0.12, 0.3, 'sawtooth', 0.08));
            },
            escalate() {
                const ac = ensure();
                if (!ac) return;
                [440, 392, 440, 392].forEach((f, i) => tone(ac, f, i * 0.14, 0.13, 'square', 0.09));
            },
        };
    })();

    const Speech = (function() {
        let voice = null;
        let pending = 0;

        function scoreVoice(v) {
            const n = (v.name || '').toLowerCase();
            let score = 0;
            if (n.includes('google')) score += 5;
            if (n.includes('natural')) score += 5;
            if (n.includes('online')) score += 4;
            if (n.includes('neural')) score += 4;
            if (n.includes('premium') || n.includes('enhanced')) score += 3;
            if (v.localService === false) score += 1;
            return score;
        }

        function pickVoice() {
            if (!window.speechSynthesis) return;
            const voices = window.speechSynthesis.getVoices();
            const de = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('de'));
            const pool = de.length ? de : voices;
            if (!pool.length) {
                voice = null;
                return;
            }
            voice = pool.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
        }
        if (window.speechSynthesis) {
            pickVoice();
            window.speechSynthesis.onvoiceschanged = pickVoice;
        }

        function speak(text, priority) {
            if (Sound.isMuted() || !window.speechSynthesis) return;
            if (!priority && pending >= 3) return;
            const u = new SpeechSynthesisUtterance(text);
            if (voice) u.voice = voice;
            u.lang = voice ? voice.lang : 'de-DE';
            u.rate = 1.2;
            u.pitch = 1.0;
            u.volume = 0.85;
            pending++;
            u.onend = u.onerror = () => {
                pending = Math.max(0, pending - 1);
            };
            window.speechSynthesis.speak(u);
        }
        return {
            speak
        };
    })();

    // ---- Zustand ----------------------------------------------------------------------

    const HIGH_KEY = 'ubodigat-leitstelle-highscore';
    const BOARD_KEY = 'ubodigat-leitstelle-bestenliste';
    const S = {
        running: false,
        speed: 1,
        elapsed: 0,
        clockMin: 12 * 60,
        hfTotal: 0,
        hfOk: 0,
        hospAt: 60,
        points: 0,
        done: 0,
        missed: 0,
        reputation: 100,
        incidents: [],
        vehicles: [],
        selectedId: null,
        spawnAt: 0,
        bgAt: 0,
        nextVehicleUid: 1,
        nextIncidentUid: 1,
    };

    let drawerVehicleTab = 'empfohlen';
    let drawerQuery = '';
    let drawerLimits = {};
    let armedRedirectUid = null;
    let armedRedirectTimer = null;

    function resetRedirectArm() {
        armedRedirectUid = null;
        if (armedRedirectTimer) {
            clearTimeout(armedRedirectTimer);
            armedRedirectTimer = null;
        }
    }

    let openSprechwunsch = 0;
    const MAX_OPEN_SPRECHWUNSCH = 2;
    const SPRECHWUNSCH_OPTIONS = [{
            label: 'Kommen',
            reply: 'Kommen, ich höre.'
        },
        {
            label: 'Bitte warten',
            reply: 'Bitte etwas gedulden, wir sind noch mit anderen Einsätzen beschäftigt.'
        },
        {
            label: 'Wiederholen',
            reply: 'Bitte wiederholen Sie Ihre letzte Meldung.'
        },
    ];

    const stationUI = {
        q: '',
        svc: 'alle',
        busy: true,
        limit: 40
    };
    let stationsDirty = true;
    let stationsFlushAt = 0;

    function loadHighscore() {
        try {
            return parseInt(localStorage.getItem(HIGH_KEY), 10) || 0;
        } catch (e) {
            return 0;
        }
    }

    function saveHighscore(v) {
        try {
            localStorage.setItem(HIGH_KEY, String(v));
        } catch (e) {
            /* egal */ }
    }

    function loadBoard() {
        try {
            return JSON.parse(localStorage.getItem(BOARD_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveBoardEntry(entry) {
        const board = loadBoard();
        board.push(entry);
        board.sort((a, b) => b.points - a.points);
        const trimmed = board.slice(0, 10);
        try {
            localStorage.setItem(BOARD_KEY, JSON.stringify(trimmed));
        } catch (e) {
            /* egal */ }
        return trimmed;
    }

    function renderBoard(container, highlightTs) {
        if (!container) return;
        const board = loadBoard();
        if (!board.length) {
            container.innerHTML = '<p class="ls-empty">Noch keine Einträge — spiele eine Schicht, um dich einzutragen.</p>';
            return;
        }
        container.innerHTML = '<table class="ls-board-table"><thead><tr><th>#</th><th>Punkte</th><th>Erledigt</th><th>Verpasst</th><th>Datum</th></tr></thead><tbody>' +
            board.map((e, i) => '<tr class="' + (e.ts === highlightTs ? 'is-you' : '') + '"><td>' + (i + 1) + '</td><td>' + e.points + '</td><td>' + e.done + '</td><td>' + e.missed + '</td><td>' + new Date(e.ts).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit'
            }) + '</td></tr>').join('') +
            '</tbody></table>';
    }

    // ---- Geo-Hilfsfunktionen -----------------------------------------------------------

    function haversineKm(a, b) {
        const R = 6371,
            toRad = d => d * Math.PI / 180;
        const dLat = toRad(b[0] - a[0]),
            dLon = toRad(b[1] - a[1]);
        const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    }

    function lerpCoords(a, b, t) {
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }

    const SEC_PER_KM = 6,
        DETOUR = 1.28;
    const SPEED_FACTOR = {
        FUSTW: 0.85,
        NEF: 0.85,
        RTW: 0.95,
        KTW: 1.05,
        GWSAN: 1.05,
        LF: 1.15,
        TSF: 1.1,
        DLK: 1.3,
        RW: 1.25,
        TLF: 1.2,
        ELW: 1.0,
        THWB: 1.3,
        THWW: 1.3,
        HRT: 1.15,
        WR: 1.15,
        HVO: 0.9,
        LNA: 0.9,
        ORGL: 0.9,
        GEFKW: 1.0
    };

    function travelSeconds(km, vehicle, returning) {
        const vt = vehicle && VEHICLE_TYPES[vehicle.typeKey];
        if (vt && vt.fast) return Math.max(5, km * 2.5);
        const f = (vt && SPEED_FACTOR[vehicle.typeKey]) || 1;
        return Math.max(5, km * DETOUR * SEC_PER_KM * f * (returning ? 1.2 : 1));
    }

    let MAP = null;
    const AMBIENT = [];

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const els = collectEls();
        const map = buildMap();
        MAP = map;
        buildStations(map);
        buildHospitals(map);

        S.vehicles = buildVehicleFleet();
        buildAmbient(map);
        document.getElementById('statBest').textContent = loadHighscore();
        renderBoard(document.getElementById('startBoard'), null);

        const legend = document.querySelector('.ls-map-legend');
        if (legend) legend.innerHTML = [
                ['flame', 'feuer', 'Feuerwehr'],
                ['rescue', 'rd', 'Rettungsdienst'],
                ['shield', 'pol', 'Polizei'],
                ['wrench', 'thw', 'THW'],
                ['mountain', 'rd', 'Bergwacht'],
                ['wave', 'rd', 'Wasserwacht'],
                ['heli', 'rd', 'Luftrettung']
            ]
            .map(([g, s, n]) => '<span class="ls-legend-chip"><span class="ls-mk is-legend" style="background:' + SERVICES[s].color + '">' + svg(g, 'ls-mk-icon') + '</span>' + n + '</span>').join('') +
            '<span class="ls-legend-chip"><span class="ls-marker-hosp is-legend">H</span>Klinik</span><span class="ls-legend-chip ls-legend-note">Kleine Wachen ab Zoomstufe ' + MINOR_ZOOM + '</span>';
        wireControls(els, map);
        wireTooltips();
        renderStationsNow();
        renderIncidentList(els);

        let last = performance.now();

        function frame(now) {
            const dtReal = Math.min(0.25, (now - last) / 1000);
            last = now;
            const dt = dtReal * S.speed;
            if (S.running) tick(dt, els, map);
            tickAmbient(dtReal * (S.running ? S.speed : 1));
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function collectEls() {
        return {
            statPoints: document.getElementById('statPoints'),
            statDone: document.getElementById('statDone'),
            statMissed: document.getElementById('statMissed'),
            statRep: document.getElementById('statRep'),
            statBest: document.getElementById('statBest'),
            incidentCount: document.getElementById('incidentCount'),
            incidentsEmpty: document.getElementById('incidentsEmpty'),
            incidentList: document.getElementById('incidentList'),
            stationList: document.getElementById('stationList'),
            logEmpty: document.getElementById('logEmpty'),
            logList: document.getElementById('logList'),
            drawerOverlay: document.getElementById('drawerOverlay'),
            drawer: document.getElementById('drawer'),
            mapHint: document.getElementById('mapHint'),
            liveDot: document.getElementById('liveDot'),
            startCard: document.getElementById('startCard'),
            endCard: document.getElementById('endCard'),
        };
    }

    // ---- Karte --------------------------------------------------------------------------

    function buildMap() {
        const map = L.map('lsMap', {
            zoomControl: false,
            attributionControl: true,
            scrollWheelZoom: true,
            preferCanvas: true,
            zoomSnap: 0.25,
            minZoom: 8
        });
        map.fitBounds([
            [47.27, 9.6],
            [48.2, 10.98]
        ]);
        map.setMaxBounds([
            [47.0, 9.2],
            [48.5, 11.4]
        ]);
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
        const tileUrl = kind => 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_' + (isLight() ? 'Light' : 'Dark') + '_Gray_' + kind + '/MapServer/tile/{z}/{y}/{x}';
        const baseLayer = L.tileLayer(tileUrl('Base'), {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, Esri, HERE, Garmin',
            maxZoom: 16,
        }).addTo(map);
        const refLayer = L.tileLayer(tileUrl('Reference'), {
            maxZoom: 16
        }).addTo(map);
        new MutationObserver(() => {
                baseLayer.setUrl(tileUrl('Base'));
                refLayer.setUrl(tileUrl('Reference'));
            })
            .observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });
        return map;
    }

    function isMajorStation(st) {
        return st.external || st.service === 'pol' || st.service === 'thw' ||
            st.fleet.some(t => t === 'ELW' || t === 'DLK' || t === 'RTW' || t === 'NEF' || t === 'LNA' || t === 'RTH');
    }

    const MINOR_ZOOM = 10;
    const AMBIENT_ZOOM = 11.5;
    let minorLayer = null,
        ambientLayer = null;

    function updateLod(map) {
        const z = map.getZoom();
        if (minorLayer) {
            if (z >= MINOR_ZOOM) {
                if (!map.hasLayer(minorLayer)) map.addLayer(minorLayer);
            } else if (map.hasLayer(minorLayer)) map.removeLayer(minorLayer);
        }
        if (ambientLayer) {
            if (z >= AMBIENT_ZOOM) {
                if (!map.hasLayer(ambientLayer)) map.addLayer(ambientLayer);
            } else if (map.hasLayer(ambientLayer)) map.removeLayer(ambientLayer);
        }
    }

    function buildStations(map) {
        minorLayer = L.layerGroup();
        ambientLayer = L.layerGroup();
        STATIONS.forEach(st => {
            const color = SERVICES[st.service].color;
            const major = isMajorStation(st);
            const size = major ? 24 : 16;
            const marker = L.marker(st.coords, {
                icon: L.divIcon({
                    className: '',
                    html: '<div class="ls-mk ' + (major ? 'is-major' : 'is-minor') + (st.external ? ' is-external' : '') + '" style="background:' + color + '">' + svg(stationGlyph(st), 'ls-mk-icon') + '</div>',
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                }),
                zIndexOffset: major ? 100 : 0,
            });
            marker.bindTooltip(() => stationTipHtml(st), {
                direction: 'top',
                offset: [0, -size / 2],
                className: 'ls-map-tip'
            });
            if (major) marker.addTo(map);
            else marker.addTo(minorLayer);
        });
        map.on('zoomend', () => updateLod(map));
        updateLod(map);
    }

    function buildHospitals(map) {
        HOSPITALS.forEach(h => {
            const m = L.marker(h.coords, {
                icon: L.divIcon({
                    className: '',
                    html: '<div class="ls-marker-hosp">H</div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }),
                zIndexOffset: -100,
            }).addTo(map);
            m.bindTooltip(() => hospTipHtml(h), {
                direction: 'top',
                offset: [0, -10],
                className: 'ls-map-tip'
            });
        });
    }

    function buildVehicleFleet() {
        const list = [];
        STATIONS.forEach(st => {
            const typeCounts = {};
            st.fleet.forEach(typeKey => {
                typeCounts[typeKey] = (typeCounts[typeKey] || 0) + 1;
                const v = {
                    uid: S.nextVehicleUid++,
                    typeKey,
                    fills: VEHICLE_TYPES[typeKey].fills,
                    stationId: st.id,
                    home: st.coords,
                    callsign: callsignFor(typeKey, st, typeCounts[typeKey]),
                    status: 'bereit', // bereit | anfahrt | vorort | transport | rueckfahrt
                    pos: st.coords.slice(),
                    marker: null,
                    incidentId: null,
                    hospitalName: null,
                    bg: null,
                    delay: 0,
                    sprechwunschPending: false,
                    tripFrom: null,
                    tripTo: null,
                    tripT: 0,
                    tripDur: 0,
                };
                st.vehicles.push(v);
                list.push(v);
            });
        });
        return list;
    }

    // ---- Leben auf der Karte: Zivilverkehr ------------------------------------------------

    function buildAmbient(map) {
        const towns = D.places;
        if (!towns.length) return;
        for (let i = 0; i < 40; i++) {
            const a = rand(towns);
            let b = null;
            for (let k = 0; k < 40 && !b; k++) {
                const c = rand(towns);
                const d = haversineKm([a[1], a[2]], [c[1], c[2]]);
                if (d > 4 && d < 22) b = c;
            }
            if (!b) continue;
            const marker = L.circleMarker([a[1], a[2]], {
                radius: 2.2,
                weight: 0,
                fillColor: '#8b98ab',
                fillOpacity: 0.5,
                interactive: false
            }).addTo(ambientLayer);
            AMBIENT.push({
                from: [a[1], a[2]],
                to: [b[1], b[2]],
                t: Math.random(),
                dur: haversineKm([a[1], a[2]], [b[1], b[2]]) * 9,
                marker
            });
        }
    }

    function tickAmbient(dt) {
        AMBIENT.forEach(c => {
            c.t += dt / c.dur;
            if (c.t >= 1) {
                const towns = D.places;
                c.from = c.to;
                let b = null;
                for (let k = 0; k < 40 && !b; k++) {
                    const p = rand(towns);
                    const d = haversineKm(c.from, [p[1], p[2]]);
                    if (d > 4 && d < 22) b = p;
                }
                c.to = b ? [b[1], b[2]] : c.from;
                c.dur = Math.max(20, haversineKm(c.from, c.to) * 9);
                c.t = 0;
            }
            c.marker.setLatLng(lerpCoords(c.from, c.to, c.t));
        });
    }

    // ---- Spielsteuerung ----------------------------------------------------------------

    function wireControls(els, map) {
        document.getElementById('startBtn').addEventListener('click', () => startShift(els));
        const startClose = document.getElementById('startCardClose');
        if (startClose) startClose.addEventListener('click', () => els.startCard.classList.add('ls-hidden'));
        const endClose = document.getElementById('endCardClose');
        if (endClose) endClose.addEventListener('click', () => els.endCard.classList.add('ls-hidden'));
        document.getElementById('restartBtn').addEventListener('click', () => {
            location.reload();
        });
        document.getElementById('shiftBtn').addEventListener('click', () => {
            if (!S.running) {
                startShift(els);
                return;
            }
            endShift(els, 'Schicht manuell beendet.');
        });
        document.getElementById('speedGroup').addEventListener('click', e => {
            const b = e.target.closest('button[data-speed]');
            if (!b) return;
            S.speed = parseFloat(b.dataset.speed);
            document.querySelectorAll('#speedGroup button').forEach(x => x.classList.toggle('is-active', x === b));
        });
        els.drawerOverlay.addEventListener('click', e => {
            if (e.target === els.drawerOverlay) closeDrawer(els);
        });

        const muteBtn = document.getElementById('muteBtn');
        muteBtn.setAttribute('aria-pressed', String(Sound.isMuted()));
        muteBtn.title = Sound.isMuted() ? 'Ton an' : 'Ton aus';
        muteBtn.addEventListener('click', () => {
            const next = !Sound.isMuted();
            Sound.setMuted(next);
            muteBtn.setAttribute('aria-pressed', String(next));
            muteBtn.title = next ? 'Ton an' : 'Ton aus';
            if (next && window.speechSynthesis) window.speechSynthesis.cancel();
            if (!next) Sound.unlock();
        });

        const sideTabs = document.getElementById('sideTabs');
        if (sideTabs) {
            sideTabs.addEventListener('click', e => {
                const b = e.target.closest('button[data-tab]');
                if (!b) return;
                sideTabs.querySelectorAll('button').forEach(x => x.classList.toggle('is-active', x === b));
                document.querySelectorAll('.ls-tabpanel').forEach(p => {
                    p.hidden = p.dataset.panel !== b.dataset.tab;
                });
                if (b.dataset.tab === 'wachen') renderStationsNow();
            });
        }

        const search = document.getElementById('stationSearch');
        if (search) search.addEventListener('input', () => {
            stationUI.q = search.value.trim().toLowerCase();
            stationUI.limit = 40;
            renderStationsNow();
        });
        const filters = document.getElementById('stationFilters');
        if (filters) filters.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b) return;
            if (b.dataset.busy) stationUI.busy = !stationUI.busy;
            if (b.dataset.svc) stationUI.svc = b.dataset.svc;
            stationUI.limit = 40;
            filters.querySelectorAll('button[data-svc]').forEach(x => x.classList.toggle('is-active', x.dataset.svc === stationUI.svc));
            filters.querySelector('button[data-busy]').classList.toggle('is-active', stationUI.busy);
            renderStationsNow();
        });
        els.stationList.addEventListener('click', e => {
            if (e.target.closest('[data-more]')) {
                stationUI.limit += 40;
                renderStationsNow();
                return;
            }
            const head = e.target.closest('[data-st]');
            if (head) {
                const st = STATION_BY_ID[head.dataset.st];
                if (st) MAP.flyTo(st.coords, Math.max(MAP.getZoom(), 12), {
                    duration: 0.6
                });
            }
        });
    }

    function startShift(els) {
        S.running = true;
        S.elapsed = 0;
        const now = new Date();
        S.clockMin = now.getHours() * 60 + now.getMinutes();
        S.hfTotal = 0;
        S.hfOk = 0;
        S.hospAt = 60;
        HOSPITALS.forEach(h => {
            h.abgemeldet = false;
        });
        Sound.unlock();
        els.startCard.classList.add('ls-hidden');
        els.endCard.classList.add('ls-hidden');
        els.liveDot.classList.add('is-live');
        els.mapHint.innerHTML = '<strong>Schicht läuft.</strong><br>Neue Einsätze laufen ein — klicke einen Eintrag in der Liste oder auf der Karte.';
        document.getElementById('shiftBtn').innerHTML = svg('close') + ' Schicht beenden';
        document.getElementById('shiftBtn').classList.add('is-stop');
        S.spawnAt = 6;
        S.bgAt = 3;
        log('ILS Allgäu: Schicht begonnen, Funkverkehr aktiv. Viel Erfolg!', 'info');
        Speech.speak('Funk ist bereit.', true);
    }

    function endShift(els, reason) {
        S.running = false;
        els.liveDot.classList.remove('is-live');
        const oldBest = loadHighscore();
        saveHighscore(Math.max(S.points, oldBest));
        let entryTs = null;
        if (S.points > 0) {
            entryTs = Date.now();
            saveBoardEntry({
                points: S.points,
                done: S.done,
                missed: S.missed,
                ts: entryTs
            });
        }
        document.getElementById('endTitle').textContent = reason || 'Schicht beendet';
        document.getElementById('endText').textContent = S.points > 0 && S.points > oldBest ?
            'Neuer Bestwert! Das Allgäu ist stolz auf deine Leitstelle.' :
            'Hier ist deine Auswertung für diese Schicht.';
        if (S.hfTotal) document.getElementById('endText').textContent += ' Hilfsfrist eingehalten: ' + S.hfOk + ' von ' + S.hfTotal + ' (' + Math.round(100 * S.hfOk / S.hfTotal) + ' %).';
        document.getElementById('endPoints').textContent = S.points;
        document.getElementById('endDone').textContent = S.done;
        document.getElementById('endMissed').textContent = S.missed;
        renderBoard(document.getElementById('endBoard'), entryTs);
        els.endCard.classList.remove('ls-hidden');
    }

    // ---- Haupt-Takt ----------------------------------------------------------------------

    function spawnGap() {
        return Math.max(22, 62 - S.elapsed / 14) * (0.75 + Math.random() * 0.7);
    }

    function openCap() {
        return Math.min(9, 3 + Math.floor(S.elapsed / 150));
    }

    function tick(dt, els, map) {
        S.elapsed += dt;
        S.clockMin = (S.clockMin + dt * TIMESCALE / 60) % 1440;
        S.spawnAt -= dt;
        tickHospitals(dt);
        updateClockStats();
        const open = S.incidents.filter(i => i.status !== 'erledigt' && i.status !== 'verpasst');
        if (S.spawnAt <= 0 && open.length < openCap()) {
            const allowGross = S.elapsed > 200 && !open.some(i => i.type.tier === 'gross');
            spawnIncident(map, els, allowGross);
            S.spawnAt = spawnGap();
        }
        tickBackground(dt, els, map);

        let listDirty = false;
        S.incidents.forEach(inc => {
            if (inc.status === 'wartend') {
                inc.timeLeft -= dt;
                if (inc.type.escalation && !inc.escalated && inc.timeLeft > 0 && inc.timeLeft / inc.patience <= 0.45 && !isFullyAssigned(inc)) {
                    escalateIncident(inc, els);
                    listDirty = true;
                }
                if (inc.timeLeft <= 0) {
                    missIncident(inc, els, map);
                    listDirty = true;
                }
            } else if (inc.status === 'bearbeitung') {
                inc.workLeft -= dt;
                if (inc.workLeft <= 0) {
                    completeIncident(inc, els, map);
                    listDirty = true;
                }
            }
            updateIncidentMarker(inc);
        });

        S.vehicles.forEach(v => {
            const st = v.status;
            if (st === 'anfahrt' || st === 'rueckfahrt' || st === 'transport') {
                if (v.delay > 0) v.delay -= dt;
                else v.tripT += dt / v.tripDur;
                if (v.tripT >= 1) {
                    v.tripT = 1;
                    v.pos = v.tripTo.slice();
                    if (st === 'anfahrt') {
                        if (v.bg) arriveBg(v);
                        else arriveAtScene(v, els, map);
                    } else if (st === 'transport') arriveAtHospital(v, els);
                    else finishReturn(v, els);
                } else {
                    v.pos = lerpCoords(v.tripFrom, v.tripTo, v.tripT);
                }
                if (v.marker) v.marker.setLatLng(v.pos);
            } else if (st === 'vorort' && v.bg) {
                v.bg.work -= dt;
                if (v.bg.work <= 0) endBg(v, els);
            }
            if (st === 'anfahrt' || st === 'vorort') maybeTriggerSprechwunsch(v, dt);
        });

        if (listDirty) renderIncidentList(els);
        else updateIncidentTimersInPlace(els);
        if (S.selectedId) refreshDrawerIfOpen(els);

        stationsFlushAt -= dt;
        if (stationsDirty && stationsFlushAt <= 0) {
            renderStationsNow();
            stationsFlushAt = 0.5;
        }
    }

    function maybeTriggerSprechwunsch(v, dt) {
        if (v.bg || v.sprechwunschPending || openSprechwunsch >= MAX_OPEN_SPRECHWUNSCH) return;
        if (Math.random() >= dt * 0.0035) return;
        v.sprechwunschPending = true;
        openSprechwunsch++;
        const vorrang = Math.random() < 0.25;
        logInteractive(v.callsign, vorrang ? 'Status 8 — Sprechwunsch mit Vorrang!' : 'Status 5 — Sprechwunsch.', SPRECHWUNSCH_OPTIONS, opt => {
            radio(v.callsign, opt.reply, 'info');
            Speech.speak(v.callsign + '. ' + opt.reply, false);
            v.sprechwunschPending = false;
            openSprechwunsch = Math.max(0, openSprechwunsch - 1);
        });
        Sound.dispatch();
    }

    const BG_WEIGHTS = [
        ['RTW', 24],
        ['KTW', 14],
        ['FUSTW', 24],
        ['NEF', 7],
        ['LF', 8],
        ['TSF', 7],
        ['HVO', 5],
        ['ELW', 2],
        ['DLK', 2],
        ['HRT', 2],
        ['WR', 1],
        ['GEFKW', 1],
        ['THWB', 1]
    ];
    const BG_TOTAL = BG_WEIGHTS.reduce((a, b) => a + b[1], 0);

    function tickBackground(dt, els, map) {
        S.bgAt -= dt;
        if (S.bgAt > 0) return;
        S.bgAt = 2 + Math.random() * 3;
        const target = Math.min(34, 12 + S.elapsed / 40);
        let active = 0;
        S.vehicles.forEach(v => {
            if (v.bg) active++;
        });
        if (active >= target) return;

        let r = Math.random() * BG_TOTAL,
            type = 'RTW';
        for (const [k, w] of BG_WEIGHTS) {
            r -= w;
            if (r <= 0) {
                type = k;
                break;
            }
        }
        const ofType = S.vehicles.filter(v => v.typeKey === type);
        const free = ofType.filter(v => v.status === 'bereit');
        if (!free.length || (ofType.length - free.length) / ofType.length > 0.25) return;
        const v = rand(free);

        const maxKm = v.typeKey === 'LF' || v.typeKey === 'TSF' || v.typeKey === 'HVO' ? 6 : 14;
        let best = null,
            bestD = Infinity;
        for (let k = 0; k < 60; k++) {
            const s = rand(D.streets),
                d = haversineKm(v.pos, [s[2], s[3]]);
            if (d >= 0.8 && d <= maxKm) {
                best = s;
                break;
            }
            if (d < bestD && d > 0.3) {
                bestD = d;
                best = s;
            }
        }
        if (!best) return;
        v.bg = {
            place: best[1],
            work: 14 + Math.random() * 26,
            transport: (v.typeKey === 'RTW' || v.typeKey === 'KTW') && Math.random() < 0.55
        };
        v.status = 'anfahrt';
        v.incidentId = null;
        v.tripFrom = v.pos.slice();
        v.tripTo = [best[2], best[3]];
        v.tripT = 0;
        v.tripDur = travelSeconds(haversineKm(v.tripFrom, v.tripTo), v);
        ensureVehicleMarker(v, map);
        v.marker.bindPopup('<b>' + escapeHtml(v.callsign) + '</b><br>Fremdeinsatz in ' + escapeHtml(best[1]));
        if (Math.random() < 0.22) radio(v.callsign, 'Status 3 — anderer Disponent, Einsatz in ' + best[1] + '.', 'info');
        stationsDirty = true;
    }

    function arriveBg(v) {
        v.status = 'vorort';
        stationsDirty = true;
    }

    function endBg(v, els) {
        if (v.bg && v.bg.transport) {
            const hosp = nearestHospital(v.pos);
            v.status = 'transport';
            v.hospitalName = hosp.name;
            v.tripFrom = v.pos.slice();
            v.tripTo = hosp.coords.slice();
            v.tripT = 0;
            v.tripDur = travelSeconds(haversineKm(v.tripFrom, v.tripTo), v);
        } else {
            startReturn(v);
        }
        stationsDirty = true;
    }

    function ensureVehicleMarker(v, map) {
        if (v.marker) return;
        const svcColor = SERVICES[VEHICLE_TYPES[v.typeKey].service].color;
        const size = v.bg ? 16 : 22;
        v.marker = L.marker(v.pos, {
            icon: L.divIcon({
                className: '',
                html: '<div class="ls-marker-vehicle' + (v.bg ? ' is-bg' : '') + '" style="background:' + svcColor + '">' + svg(glyphFor(v.typeKey, VEHICLE_TYPES[v.typeKey].service), 'ls-mk-icon') + '</div>',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            }),
            zIndexOffset: v.bg ? 300 : 600,
        }).addTo(map);
        v.marker.bindTooltip(() => vehicleTipHtml(v), {
            direction: 'top',
            offset: [0, -size / 2],
            className: 'ls-map-tip'
        });
    }

    function startReturn(v) {
        v.status = 'rueckfahrt';
        v.incidentId = null;
        v.delay = 0;
        v.tripFrom = v.pos.slice();
        v.tripTo = v.home.slice();
        v.tripT = 0;
        v.tripDur = travelSeconds(haversineKm(v.tripFrom, v.tripTo), v, true);
        if (v.marker) v.marker.bindPopup('<b>' + escapeHtml(v.callsign) + '</b><br>Rückfahrt zur Wache');
    }

    // ---- Einsaetze ------------------------------------------------------------------------

    function spawnIncident(map, els, allowGross) {
        const type = pickIncidentType(allowGross);
        const loc = pickLocation(type);
        const patience = type.patience * PATIENCE_MULT + estimateTravel(type, loc.coords) * 1.3 + 20;
        const inc = {
            uid: S.nextIncidentUid++,
            type,
            address: loc.name,
            coords: loc.coords,
            need: Object.assign({}, type.need),
            spawnT: S.elapsed,
            reported: false,
            nach: false,
            hfOk: false,
            status: 'wartend', // wartend | bearbeitung | erledigt | verpasst
            timeLeft: patience,
            patience,
            workLeft: type.work,
            escalated: false,
            assigned: {}, // Rolle -> [vehicleUid,...]
            marker: null,
        };
        Object.keys(type.need).forEach(k => {
            inc.assigned[k] = [];
        });
        S.incidents.push(inc);

        const gross = type.tier === 'gross';
        const icon = L.divIcon({
            className: '',
            html: '<div class="ls-marker-incident' + (gross ? ' is-gross' : '') + '" style="--svc:' + SERVICES[type.service].color + '"><i>' + svg(svcIcon(type.service), 'ls-mk-icon') + '</i><span class="ls-inc-label">' + escapeHtml(type.code) + '</span></div>',
            iconSize: gross ? [54, 54] : [40, 40],
            iconAnchor: gross ? [27, 27] : [20, 20],
        });
        inc.marker = L.marker(inc.coords, {
            icon,
            zIndexOffset: gross ? 850 : 800
        }).addTo(map);
        inc.marker.bindTooltip(() => incidentTipHtml(inc), {
            direction: 'top',
            offset: [0, gross ? -14 : -10],
            className: 'ls-map-tip'
        });
        inc.marker.on('click', () => openDrawer(inc, els, map));

        renderIncidentList(els);
        if (gross) {
            log('Leitstelle an alle: GROSSEINSATZ ' + type.code + ' — ' + type.name + ' · ' + loc.name + '. Bitte umgehend disponieren!', 'alert');
            Sound.grossAlarm();
            Speech.speak('Großalarm. ' + type.name + '. ' + loc.name + '.', true);
        } else {
            log('Leitstelle an alle: Neuer Einsatz ' + type.code + ' — ' + type.name + ' · ' + loc.name + '.', 'info');
            Sound.alarm();
            Speech.speak('Alarm. ' + type.name + '. ' + loc.name + '.', true);
        }
    }

    function escalateIncident(inc, els) {
        const target = findType(inc.type.escalation.to);
        if (!target) return;
        const message = inc.type.escalation.message;
        inc.type = target;
        inc.need = Object.assign({}, target.need);
        inc.escalated = true;
        inc.patience = inc.timeLeft + target.patience * PATIENCE_MULT * 0.6;
        inc.timeLeft = inc.patience;
        inc.workLeft = target.work;
        Object.keys(target.need).forEach(k => {
            if (!inc.assigned[k]) inc.assigned[k] = [];
        });
        if (inc.marker) {
            const el = inc.marker.getElement();
            if (el) el.querySelector('.ls-marker-incident')?.classList.add('is-escalated');
        }
        log('Leitstelle an alle Einsatzkräfte: Lage verschärft sich — ' + message, 'alert');
        Sound.escalate();
        Speech.speak('Achtung, Lageänderung. ' + message, true);
    }

    function updateIncidentMarker(inc) {
        if (!inc.marker) return;
        const el = inc.marker.getElement();
        if (el) {
            const m = el.querySelector('.ls-marker-incident');
            if (m) {
                m.classList.toggle('is-working', inc.status === 'bearbeitung');
                m.classList.toggle('is-selected', S.selectedId === inc.uid);
                m.classList.toggle('is-urgent', inc.status === 'wartend' && inc.timeLeft / inc.patience < 0.3);
            }
        }
    }

    function assignedTotal(inc) {
        return Object.values(inc.assigned).reduce((a, arr) => a + arr.length, 0);
    }

    function isFullyAssigned(inc) {
        return Object.keys(inc.need).every(k => (inc.assigned[k] || []).length >= inc.need[k]);
    }

    function isFullyOnScene(inc) {
        return Object.keys(inc.need).every(k => {
            const onScene = (inc.assigned[k] || []).filter(uid => {
                const v = S.vehicles.find(x => x.uid === uid);
                return v && v.status === 'vorort';
            }).length;
            return onScene >= inc.need[k];
        });
    }

    function needsVehicle(inc, v) {
        return v.fills.some(r => inc.need[r]);
    }

    function roleFor(inc, v) {
        const need = inc.need;
        for (const r of v.fills)
            if (need[r] && (inc.assigned[r] || []).length < need[r]) return r;
        for (const r of v.fills)
            if (need[r]) return r;
        return v.typeKey;
    }

    function unassignVehicle(vehicle, els) {
        if (!vehicle.incidentId) return;
        const oldInc = S.incidents.find(i => i.uid === vehicle.incidentId);
        vehicle.incidentId = null;
        if (!oldInc) return;
        Object.keys(oldInc.assigned).forEach(k => {
            oldInc.assigned[k] = oldInc.assigned[k].filter(uid => uid !== vehicle.uid);
        });
        if (oldInc.status === 'bearbeitung' && !isFullyOnScene(oldInc)) {
            oldInc.status = 'wartend';
            log('Leitstelle: ' + oldInc.type.name + ' (' + oldInc.address + ') wartet wieder auf ausreichend Kräfte — ein Fahrzeug wurde umdisponiert.', 'alert');
        }
        if (S.selectedId === oldInc.uid) renderDrawer(oldInc, els);
    }

    function dispatchVehicle(inc, vehicle, els, map, forcedRole) {
        if (vehicle.status === 'transport') return;
        const wasBusy = vehicle.status !== 'bereit';
        if (wasBusy && vehicle.incidentId && vehicle.incidentId !== inc.uid) unassignVehicle(vehicle, els);
        if (vehicle.bg) {
            vehicle.bg = null;
            if (vehicle.marker) {
                map.removeLayer(vehicle.marker);
                vehicle.marker = null;
            }
        }

        const role = forcedRole || roleFor(inc, vehicle);
        vehicle.status = 'anfahrt';
        vehicle.incidentId = inc.uid;
        vehicle.tripFrom = vehicle.pos.slice();
        vehicle.tripTo = inc.coords.slice();
        vehicle.tripT = 0;
        vehicle.tripDur = travelSeconds(haversineKm(vehicle.tripFrom, vehicle.tripTo), vehicle);
        vehicle.delay = wasBusy ? 0 : alertDelay(vehicle);
        inc.assigned[role] = inc.assigned[role] || [];
        inc.assigned[role].push(vehicle.uid);

        ensureVehicleMarker(vehicle, map);
        vehicle.marker.setLatLng(vehicle.pos);
        vehicle.marker.bindPopup('<b>' + escapeHtml(vehicle.callsign) + '</b><br>Anfahrt zu ' + escapeHtml(inc.address));
        if (wasBusy) radio(vehicle.callsign, 'Status 3 — werden umdisponiert, sind jetzt unterwegs zu ' + inc.address + '.', 'info');
        else radio(vehicle.callsign, 'Status 3 — Einsatz übernommen, ' + (vehicle.delay > 4 ? 'rücken aus' : 'sind unterwegs') + ' zu ' + inc.address + '.', 'info');
        Sound.dispatch();
        Speech.speak(vehicle.callsign + '. Status 3.', false);

        stationsDirty = true;
        renderIncidentList(els);
    }

    function missingRoles(inc) {
        return Object.keys(inc.need).map(k => [k, inc.need[k] - (inc.assigned[k] || []).length]).filter(x => x[1] > 0);
    }

    function autoDispatch(inc, els) {
        const used = new Set();
        let n = 0;
        missingRoles(inc).forEach(([role, miss]) => {
            const cands = S.vehicles
                .filter(v => v.status === 'bereit' && !used.has(v.uid) && v.fills.includes(role))
                .map(v => ({
                    v,
                    score: haversineKm(v.pos, inc.coords) + (v.typeKey === role ? 0 : v.typeKey === 'RTH' ? 25 : 2)
                }))
                .sort((a, b) => a.score - b.score);
            for (let i = 0; i < miss && i < cands.length; i++) {
                used.add(cands[i].v.uid);
                dispatchVehicle(inc, cands[i].v, els, MAP, role);
                n++;
            }
        });
        if (n) log('Leitstelle: ' + n + ' Fahrzeuge nach AAO alarmiert (' + inc.type.name + ').', 'info');
        return n;
    }

    const FALSE_ALARM = {
        'bma-gewerbe': 0.6,
        'bma-schule': 0.6,
        'bma-hotel': 0.55,
        'bma-pflegeheim': 0.4,
        'tuer-rauchmelder': 0.45,
        'einbruch-alarm': 0.6,
        'brand-rauch': 0.25,
        gasgeruch: 0.2,
        'co-warner': 0.3,
        'verdaechtige-person': 0.3,
        'brand-strom': 0.1
    };
    const NACHFORDERUNG = {
        feuer: [
            ['LF', 'Löschgruppenfahrzeug'],
            ['DLK', 'Drehleiter'],
            ['RTW', 'Rettungswagen']
        ],
        rd: [
            ['NEF', 'Notarzt']
        ],
        pol: [
            ['FUSTW', 'Streifenwagen']
        ]
    };

    function reportText(inc) {
        const code = inc.type.code;
        if (code === 'RD 3') return rand(['Patient reanimationspflichtig, Reanimation läuft.', 'Patient bewusstlos, Atemwege werden gesichert.']);
        if (code.startsWith('RD') || code === 'BW 1' || code === 'BW 2') return rand(['Patient wird untersucht, Behandlung beginnt.', 'Patient ansprechbar, Erstversorgung läuft.']);
        if (code.startsWith('B ')) return rand(['Feuer bestätigt, Angriffstrupp geht vor.', 'Rauchentwicklung sichtbar, Lage wird erkundet.', 'Brandbekämpfung eingeleitet.']);
        if (code.startsWith('THL')) return rand(['Einsatzstelle gesichert, Hilfeleistung läuft.', 'Lage wie gemeldet, wir beginnen mit der Arbeit.']);
        if (code.startsWith('ABC')) return rand(['Messungen laufen, Bereich abgesperrt.', 'Gefahrenbereich wird erkundet.']);
        if (code === 'MANV') return 'Mehrere Verletzte, Sichtung beginnt.';
        return rand(['Lage wie gemeldet, Maßnahmen laufen.', 'Vor Ort, Lage wird aufgenommen.']);
    }

    function situationReport(inc, vehicle, els) {
        inc.reported = true;
        const hf = HILFSFRIST[inc.type.service];
        if (hf && inc.type.code !== 'KTP') {
            const took = S.elapsed - inc.spawnT;
            S.hfTotal++;
            if (took <= hf) {
                S.hfOk++;
                inc.hfOk = true;
                log('Leitstelle: Hilfsfrist eingehalten — erstes Fahrzeug nach ' + fmtTime(took) + ' vor Ort (Vorgabe ' + fmtTime(hf) + ').', 'success');
            } else log('Leitstelle: Hilfsfrist überschritten — erstes Fahrzeug nach ' + fmtTime(took) + ' vor Ort (Vorgabe ' + fmtTime(hf) + ').', 'alert');
        }
        const p = FALSE_ALARM[inc.type.key];
        if (p && !inc.escalated && Math.random() < p) {
            radio(vehicle.callsign, 'Lagemeldung: Fehlalarm, nichts festgestellt. Einsatz kann abgebrochen werden.', 'info');
            completeIncident(inc, els, MAP, {
                falseAlarm: true
            });
            return true;
        }
        const opts = NACHFORDERUNG[inc.type.service];
        if (opts && inc.type.tier !== 'gross' && inc.type.points >= 60 && !inc.escalated && Math.random() < 0.22) {
            const [role, label] = rand(opts);
            inc.need[role] = (inc.need[role] || 0) + 1;
            inc.assigned[role] = inc.assigned[role] || [];
            inc.nach = true;
            inc.patience += 60;
            inc.timeLeft += 60;
            radio(vehicle.callsign, 'Lagemeldung: Lage bestätigt. Nachforderung: 1× ' + label + '.', 'alert');
            Sound.escalate();
        } else {
            radio(vehicle.callsign, 'Lagemeldung: ' + reportText(inc), 'info');
        }
        return false;
    }

    function arriveAtScene(vehicle, els, map) {
        vehicle.status = 'vorort';
        const inc = S.incidents.find(i => i.uid === vehicle.incidentId);
        if (inc && vehicle.marker) vehicle.marker.bindPopup('<b>' + escapeHtml(vehicle.callsign) + '</b><br>Vor Ort: ' + escapeHtml(inc.address));
        if (inc) radio(vehicle.callsign, 'Status 4 — Ankunft am Einsatzort.', 'info');
        if (inc) Speech.speak(vehicle.callsign + '. Status 4.', false);
        if (inc && !inc.reported && situationReport(inc, vehicle, els)) return;
        if (inc && inc.status === 'wartend' && isFullyAssigned(inc) && isFullyOnScene(inc)) {
            inc.status = 'bearbeitung';
            inc.workLeft = inc.type.work;
            log('Leitstelle: Alle Kräfte vor Ort — ' + inc.type.name + ' wird bearbeitet.', 'info');
        }
        stationsDirty = true;
        renderIncidentList(els);
        if (inc && S.selectedId === inc.uid) renderDrawer(inc, els);
    }

    function completeIncident(inc, els, map, opts) {
        const falseAlarm = !!(opts && opts.falseAlarm);
        inc.status = 'erledigt';
        const pts = falseAlarm ? Math.round(inc.type.points * 0.25) : inc.type.points + (inc.hfOk ? Math.round(inc.type.points * 0.1) : 0);
        S.points += pts;
        S.done += 1;
        S.reputation = Math.min(100, S.reputation + 1);
        log('Leitstelle: ' + inc.type.name + (falseAlarm ? ' — Fehlalarm, abgebrochen' : ' abgeschlossen') + ' (' + inc.address + ') — +' + pts + ' Punkte' + (inc.hfOk && !falseAlarm ? ' (inkl. Hilfsfrist-Bonus)' : '') + '.', 'success');
        Sound.success();

        const cap = INCIDENT_CAP[inc.type.key];
        const hasPatient = !falseAlarm && (inc.type.patient !== undefined ? inc.type.patient : inc.type.service === 'rd');
        Object.values(inc.assigned).flat().forEach(uid => {
            const v = S.vehicles.find(x => x.uid === uid);
            if (!v || v.incidentId !== inc.uid) return;
            const transportsPatient = hasPatient && (v.typeKey === 'RTW' || v.typeKey === 'KTW' || v.typeKey === 'GWSAN');
            v.incidentId = null;
            if (transportsPatient) {
                const hosp = nearestHospital(v.pos, cap);
                v.status = 'transport';
                v.delay = 0;
                v.hospitalName = hosp.name;
                v.tripFrom = v.pos.slice();
                v.tripTo = hosp.coords.slice();
                v.tripT = 0;
                v.tripDur = travelSeconds(haversineKm(v.tripFrom, v.tripTo), v);
                if (v.marker) v.marker.bindPopup('<b>' + escapeHtml(v.callsign) + '</b><br>Patiententransport: ' + escapeHtml(hosp.name));
                radio(v.callsign, 'Status 3 — übernehmen Patiententransport ins ' + hosp.name + (cap && (HOSP_CAPS[hosp.name] || []).includes(cap) ? ' (' + CAP_LABEL[cap] + ')' : '') + '.', 'info');
                Speech.speak(v.callsign + '. Status 3, Patiententransport.', false);
            } else {
                startReturn(v);
                radio(v.callsign, 'Status 1 — Einsatz beendet, einsatzbereit über Funk.', 'success');
            }
        });

        if (inc.marker) {
            map.removeLayer(inc.marker);
            inc.marker = null;
        }
        if (S.selectedId === inc.uid) closeDrawer(els);
        updateStats(els);
        stationsDirty = true;
    }

    function missIncident(inc, els, map) {
        inc.status = 'verpasst';
        if (HILFSFRIST[inc.type.service] && inc.type.code !== 'KTP' && !inc.reported) S.hfTotal++;
        S.missed += 1;
        S.reputation = Math.max(0, S.reputation - (inc.type.tier === 'gross' ? 12 : 7));
        log('Leitstelle an alle: ' + inc.type.name + ' konnte nicht rechtzeitig bedient werden (' + inc.address + ') — Vertrauen sinkt.', 'missed');
        Sound.miss();

        Object.values(inc.assigned).flat().forEach(uid => {
            const v = S.vehicles.find(x => x.uid === uid);
            if (!v || v.incidentId !== inc.uid) return;
            startReturn(v);
            radio(v.callsign, 'Status 1 — Einsatz nicht mehr aktuell, einsatzbereit über Funk.', 'info');
        });

        if (inc.marker) {
            map.removeLayer(inc.marker);
            inc.marker = null;
        }
        if (S.selectedId === inc.uid) closeDrawer(els);
        updateStats(els);
        stationsDirty = true;

        if (S.reputation <= 0) endShift(els, 'Der Landkreis hat dir die Leitstelle entzogen');
    }

    function arriveAtHospital(vehicle, els) {
        const quiet = !!vehicle.bg;
        if (!quiet) {
            radio(vehicle.callsign, 'Status 7 — Ankunft am Krankenhaus, Patient wird übergeben.', 'info');
            Speech.speak(vehicle.callsign + '. Status 7.', false);
        }
        startReturn(vehicle);
        if (!quiet) radio(vehicle.callsign, 'Status 1 — Patient übergeben, einsatzbereit über Funk, fahren zur Wache zurück.', 'success');
        stationsDirty = true;
    }

    function finishReturn(vehicle, els) {
        const quiet = !!vehicle.bg;
        vehicle.status = 'bereit';
        vehicle.hospitalName = null;
        vehicle.bg = null;
        if (vehicle.marker) {
            MAP.removeLayer(vehicle.marker);
            vehicle.marker = null;
        }
        if (!quiet) radio(vehicle.callsign, 'Status 2 — wieder einsatzbereit auf der Wache.', 'info');
        stationsDirty = true;
    }

    // ---- Rendering: Seitenleiste ---------------------------------------------------------

    function updateStats(els) {
        els.statPoints.textContent = S.points;
        els.statDone.textContent = S.done;
        els.statMissed.textContent = S.missed;
        els.statRep.textContent = S.reputation + '%';
        els.statRep.classList.toggle('is-down', S.reputation < 60);
        els.statBest.textContent = Math.max(loadHighscore(), S.points);
    }

    function updateClockStats() {
        const ck = document.getElementById('statClock'),
            hf = document.getElementById('statHf');
        const t = clockText();
        if (ck && ck.textContent !== t) ck.textContent = t;
        const h = S.hfTotal ? Math.round(100 * S.hfOk / S.hfTotal) + '%' : '—';
        if (hf && hf.textContent !== h) hf.textContent = h;
    }

    function fmtTime(sec) {
        sec = Math.max(0, Math.ceil(sec));
        return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    }

    function renderIncidentList(els) {
        const active = S.incidents.filter(i => i.status === 'wartend' || i.status === 'bearbeitung');
        els.incidentCount.textContent = active.length;
        els.incidentCount.classList.toggle('is-live', active.length > 0);
        els.incidentsEmpty.style.display = active.length ? 'none' : 'block';

        els.incidentList.innerHTML = active.map(inc => {
            const svcColor = SERVICES[inc.type.service].color;
            const ratio = inc.status === 'bearbeitung' ? (inc.workLeft / inc.type.work) : (inc.timeLeft / inc.patience);
            const barClass = inc.status === 'bearbeitung' ? 'is-work' : ratio < 0.3 ? 'is-danger' : ratio < 0.6 ? 'is-warn' : '';
            const chips = Object.keys(inc.need).map(k => {
                const got = (inc.assigned[k] || []).length,
                    need = inc.need[k];
                return '<span class="ls-vreq-chip' + (got >= need ? ' is-filled' : '') + '" data-tipk="r:' + inc.uid + ':' + k + '">' + roleShort(k) + ' ' + got + '/' + need + '</span>';
            }).join('');
            const badges = (inc.type.tier === 'gross' ? '<span class="ls-badge-gross">Großeinsatz</span>' : '') + (inc.escalated ? '<span class="ls-badge-esk">Eskaliert</span>' : '') + (inc.nach ? '<span class="ls-badge-esk">Nachforderung</span>' : '');
            return '<button type="button" style="--svc:' + svcColor + '" class="ls-incident-row' + (inc.type.tier === 'gross' ? ' is-gross' : '') + (ratio < 0.3 && inc.status === 'wartend' ? ' is-urgent' : '') + (inc.status === 'bearbeitung' ? ' is-working' : '') + (S.selectedId === inc.uid ? ' is-selected' : '') + '" data-uid="' + inc.uid + '">' +
                '<div class="ls-incident-top"><span class="ls-svc-dot" style="background:' + svcColor + '"></span><span class="ls-code">' + escapeHtml(inc.type.code) + '</span><span class="ls-incident-type">' + escapeHtml(inc.type.name) + '</span>' +
                '<span class="ls-incident-timer">' + (inc.status === 'bearbeitung' ? 'vor Ort' : fmtTime(inc.timeLeft)) + '</span></div>' +
                (badges ? '<div class="ls-badge-row">' + badges + '</div>' : '') +
                '<div class="ls-incident-addr">' + escapeHtml(inc.address) + '</div>' +
                '<div class="ls-bar"><i class="' + barClass + '" style="width:' + Math.max(4, ratio * 100).toFixed(0) + '%"></i></div>' +
                '<div class="ls-vehreq">' + chips + '</div>' +
                '</button>';
        }).join('');

        els.incidentList.querySelectorAll('.ls-incident-row').forEach(row => {
            row.addEventListener('click', () => {
                const inc = S.incidents.find(i => i.uid === +row.dataset.uid);
                if (inc) openDrawer(inc, els, MAP);
            });
        });
    }

    function updateIncidentTimersInPlace(els) {
        S.incidents.forEach(inc => {
            if (inc.status !== 'wartend' && inc.status !== 'bearbeitung') return;
            const row = els.incidentList.querySelector('.ls-incident-row[data-uid="' + inc.uid + '"]');
            if (!row) return;
            const timerEl = row.querySelector('.ls-incident-timer');
            const barEl = row.querySelector('.ls-bar i');
            if (inc.status === 'bearbeitung') {
                timerEl.textContent = 'vor Ort';
                barEl.style.width = Math.max(4, (inc.workLeft / inc.type.work) * 100).toFixed(0) + '%';
            } else {
                timerEl.textContent = fmtTime(inc.timeLeft);
                const ratio = inc.timeLeft / inc.patience;
                barEl.style.width = Math.max(4, ratio * 100).toFixed(0) + '%';
                barEl.className = ratio < 0.3 ? 'is-danger' : ratio < 0.6 ? 'is-warn' : '';
                row.classList.toggle('is-urgent', ratio < 0.3);
            }
        });
    }

    function renderStationsNow() {
        stationsDirty = false;
        const listEl = document.getElementById('stationList');
        if (!listEl) return;
        const total = S.vehicles.length;
        const busy = S.vehicles.filter(v => v.status !== 'bereit').length;
        const sum = document.getElementById('fleetSummary');
        if (sum) sum.textContent = STATIONS.length + ' Wachen · ' + total + ' Fahrzeuge · ' + (total - busy) + ' bereit · ' + busy + ' im Einsatz';

        let list = STATIONS;
        if (stationUI.svc !== 'alle') list = list.filter(st => st.service === stationUI.svc);
        if (stationUI.q) list = list.filter(st => (st.name + ' ' + st.town).toLowerCase().includes(stationUI.q));
        if (stationUI.busy) list = list.filter(st => st.vehicles.some(v => v.status !== 'bereit'));
        const shown = list.slice(0, stationUI.limit);

        if (!shown.length) {
            listEl.innerHTML = '<p class="ls-empty">' + (stationUI.busy ? 'Aktuell ist kein Fahrzeug im Einsatz. Schalte „Im Einsatz“ aus oder suche eine Wache.' : 'Keine Wache gefunden.') + '</p>';
            return;
        }
        let html = '';
        STATION_GROUPS.forEach(g => {
            const sts = shown.filter(st => st.service === g.key);
            if (!sts.length) return;
            html += '<div class="ls-station-group"><div class="ls-station-group-head"><span class="ls-svc-dot" style="background:' + SERVICES[g.key].color + '"></span>' + g.label + '</div>' + sts.map(stationHtml).join('') + '</div>';
        });
        if (list.length > shown.length) html += '<button type="button" class="ls-more-btn" data-more="1">Weitere ' + Math.min(40, list.length - shown.length) + ' anzeigen (' + (list.length - shown.length) + ' übrig)</button>';
        listEl.innerHTML = html;
    }

    function stationHtml(st) {
        const color = SERVICES[st.service].color;
        const vehicles = st.vehicles;
        const ready = vehicles.filter(v => v.status === 'bereit').length;
        const chips = vehicles.map(v => {
            const busy = v.status !== 'bereit';
            const vColor = SERVICES[VEHICLE_TYPES[v.typeKey].service].color;
            const busyInc = busy && v.incidentId ? S.incidents.find(i => i.uid === v.incidentId) : null;
            const crew = VEHICLE_TYPES[v.typeKey].crew;
            const extra = v.status === 'transport' && v.hospitalName ? ' (' + v.hospitalName + ')' : (busyInc ? ' (' + busyInc.address + ')' : '');
            return '<span class="ls-vehicle-chip' + (busy ? ' is-busy is-' + v.status : '') + (v.bg ? ' is-bg' : '') + '" data-tipk="v:' + v.uid + '"><i style="background:' + vColor + '"></i><b>' + VEHICLE_TYPES[v.typeKey].short + '</b>' + (busy ? '<small>' + statusLabel(v) + '</small>' : '') + '</span>';
        }).join('');
        return '<div class="ls-station' + (st.external ? ' is-external' : '') + '">' +
            '<div class="ls-station-head" data-st="' + escapeHtml(st.id) + '" title="Auf der Karte anzeigen"><span class="ls-svc-dot" style="background:' + color + '"></span><span class="ls-station-name">' + escapeHtml(st.name) + '</span>' + (st.note ? '<span class="ls-station-tag ls-station-tag-note">' + escapeHtml(st.note) + '</span>' : '') + (st.external ? '<span class="ls-station-tag">von außerhalb</span>' : '') + '<span class="ls-station-sub">' + ready + '/' + vehicles.length + ' frei</span></div>' +
            '<div class="ls-fleet">' + chips + '</div>' +
            '</div>';
    }

    function statusLabel(v) {
        switch (v.status) {
            case 'bereit':
                return 'einsatzbereit';
            case 'anfahrt':
                return v.bg ? 'Fremdeinsatz' : v.delay > 0 ? 'Ausrücken' : 'auf Anfahrt';
            case 'vorort':
                return v.bg ? 'Fremdeinsatz' : 'vor Ort';
            case 'transport':
                return 'Patiententransport';
            default:
                return 'Rückfahrt';
        }
    }

    // ---- Funkverkehr / Protokoll ----------------------------------------------------------

    function log(text, kind) {
        const els = {
            logList: document.getElementById('logList'),
            logEmpty: document.getElementById('logEmpty')
        };
        els.logEmpty.style.display = 'none';
        const row = document.createElement('div');
        row.className = 'ls-log-row' + (kind === 'success' ? ' is-success' : kind === 'missed' ? ' is-missed' : kind === 'alert' ? ' is-alert' : '');
        const t = new Date();
        row.innerHTML = '<time>' + simTime() + '</time>' + escapeHtml(text);
        els.logList.insertBefore(row, els.logList.firstChild);
        while (els.logList.children.length > 60) els.logList.removeChild(els.logList.lastChild);
        els.logList.scrollTop = 0;
        updateStats(collectEls());
    }

    function radio(callsign, text, kind) {
        log(callsign + ' an Leitstelle: ' + text, kind);
    }

    function logInteractive(callsign, promptText, options, onChoose) {
        const logList = document.getElementById('logList');
        const logEmpty = document.getElementById('logEmpty');
        logEmpty.style.display = 'none';
        const row = document.createElement('div');
        row.className = 'ls-log-row is-interactive';
        const t = new Date();
        const timeStr = simTime();
        row.innerHTML = '<time>' + timeStr + '</time>' + escapeHtml(callsign + ' an Leitstelle: ' + promptText) +
            '<div class="ls-log-opts">' + options.map((o, i) => '<button type="button" class="ls-log-opt" data-i="' + i + '">' + escapeHtml(o.label) + '</button>').join('') + '</div>';
        logList.insertBefore(row, logList.firstChild);
        while (logList.children.length > 60) logList.removeChild(logList.lastChild);
        logList.scrollTop = 0;
        row.querySelectorAll('.ls-log-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                const opt = options[+btn.dataset.i];
                const optsEl = row.querySelector('.ls-log-opts');
                if (optsEl) optsEl.remove();
                row.insertAdjacentHTML('beforeend', ' <i class="ls-log-chosen">→ ' + escapeHtml(opt.label) + '</i>');
                onChoose(opt);
            });
        });
    }

    // ---- Hover-Infos (Status, Ziel, Ankunft) ---------------------------------------------

    function vehicleTarget(v) {
        const inc = v.incidentId ? S.incidents.find(i => i.uid === v.incidentId) : null;
        switch (v.status) {
            case 'bereit':
                return 'auf Wache';
            case 'anfahrt':
                return v.bg ? 'Fremdeinsatz in ' + v.bg.place : (inc ? inc.address : '—');
            case 'vorort':
                return v.bg ? 'Fremdeinsatz in ' + v.bg.place : (inc ? inc.address : '—');
            case 'transport':
                return v.hospitalName || 'Krankenhaus';
            default:
                return (STATION_BY_ID[v.stationId] || {}).name || 'Wache';
        }
    }

    function vehicleEta(v) {
        if (v.status === 'anfahrt' || v.status === 'rueckfahrt' || v.status === 'transport') return fmtTime(v.tripDur * (1 - v.tripT) + Math.max(0, v.delay || 0));
        if (v.status === 'vorort') {
            if (v.bg) return fmtTime(v.bg.work);
            const inc = v.incidentId ? S.incidents.find(i => i.uid === v.incidentId) : null;
            return inc && inc.status === 'bearbeitung' ? fmtTime(inc.workLeft) : null;
        }
        return null;
    }
    const FMS = {
        bereit: '2',
        anfahrt: '3',
        vorort: '4',
        transport: '3',
        rueckfahrt: '1'
    };

    function vehicleTipHtml(v) {
        const st = STATION_BY_ID[v.stationId];
        const eta = vehicleEta(v);
        const etaLabel = v.status === 'vorort' ? 'Einsatzende in' : 'Ankunft in';
        return '<b>' + escapeHtml(v.callsign) + '</b><br>' + escapeHtml(VEHICLE_TYPES[v.typeKey].name) + (st ? ' · ' + escapeHtml(st.name) : '') +
            '<br>Status ' + FMS[v.status] + ' — ' + statusLabel(v) +
            '<br>Ziel: ' + escapeHtml(vehicleTarget(v)) +
            (eta ? '<br>' + etaLabel + ': ' + eta : '');
    }

    function roleTipHtml(inc, role) {
        const ids = inc.assigned[role] || [];
        const need = inc.need[role] || 0;
        let html = '<b>' + ROLE_LABEL[role] + '</b> — ' + ids.length + ' / ' + need + ' alarmiert';
        if (!ids.length) return html + '<br>Noch kein Fahrzeug alarmiert.';
        ids.forEach(uid => {
            const v = S.vehicles.find(x => x.uid === uid);
            if (!v) return;
            const eta = vehicleEta(v);
            html += '<br>• ' + escapeHtml(v.callsign) + ' — ' + statusLabel(v) + (eta ? ' (' + eta + ')' : '');
        });
        return html;
    }

    function stationTipHtml(st) {
        const busy = st.vehicles.filter(v => v.status !== 'bereit');
        let html = '<b>' + escapeHtml(st.name) + '</b>' + (st.external ? ' <i>(von außerhalb)</i>' : '') + '<br>' + (st.vehicles.length - busy.length) + ' / ' + st.vehicles.length + ' Fahrzeuge bereit';
        busy.slice(0, 6).forEach(v => {
            const eta = vehicleEta(v);
            html += '<br>• ' + escapeHtml(v.callsign) + ' — ' + statusLabel(v) + ' → ' + escapeHtml(vehicleTarget(v)) + (eta ? ' (' + eta + ')' : '');
        });
        if (busy.length > 6) html += '<br>… und ' + (busy.length - 6) + ' weitere';
        return html;
    }

    function incidentTipHtml(inc) {
        let html = '<b>' + escapeHtml(inc.type.code + ' — ' + inc.type.name) + '</b><br>' + escapeHtml(inc.address) +
            '<br>' + (inc.status === 'bearbeitung' ? 'Wird bearbeitet, noch ' + fmtTime(inc.workLeft) : 'Reaktionszeit: ' + fmtTime(inc.timeLeft)) +
            (HILFSFRIST[inc.type.service] && inc.type.code !== 'KTP' && !inc.reported ? '<br>Hilfsfrist: ' + (S.elapsed - inc.spawnT <= HILFSFRIST[inc.type.service] ? 'noch ' + fmtTime(HILFSFRIST[inc.type.service] - (S.elapsed - inc.spawnT)) : 'überschritten') : '');
        Object.keys(inc.need).forEach(k => {
            html += '<br>' + roleShort(k) + ' ' + (inc.assigned[k] || []).length + '/' + inc.need[k];
        });
        return html;
    }

    function tipContent(key) {
        const p = key.split(':');
        if (p[0] === 'v') {
            const v = S.vehicles.find(x => x.uid === +p[1]);
            return v ? vehicleTipHtml(v) : null;
        }
        if (p[0] === 'r') {
            const inc = S.incidents.find(i => i.uid === +p[1]);
            return inc ? roleTipHtml(inc, p[2]) : null;
        }
        return null;
    }

    function wireTooltips() {
        const tip = document.createElement('div');
        tip.className = 'ls-tip';
        tip.hidden = true;
        document.body.appendChild(tip);
        let cur = null,
            timer = null;

        function place(x, y) {
            const r = tip.getBoundingClientRect();
            tip.style.left = Math.max(8, Math.min(x + 14, window.innerWidth - r.width - 8)) + 'px';
            tip.style.top = Math.max(8, Math.min(y + 16, window.innerHeight - r.height - 8)) + 'px';
        }

        function hide() {
            tip.hidden = true;
            cur = null;
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
        document.addEventListener('mouseover', e => {
            const el = e.target.closest && e.target.closest('[data-tipk]');
            if (!el) {
                if (cur) hide();
                return;
            }
            const html = tipContent(el.dataset.tipk);
            if (!html) {
                hide();
                return;
            }
            cur = el;
            tip.innerHTML = html;
            tip.hidden = false;
            place(e.clientX, e.clientY);
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                if (!cur || !document.contains(cur)) {
                    hide();
                    return;
                }
                const h = tipContent(cur.dataset.tipk);
                if (h) tip.innerHTML = h;
                else hide();
            }, 500);
        });
        document.addEventListener('mousemove', e => {
            if (cur && !tip.hidden) place(e.clientX, e.clientY);
        });
        document.addEventListener('scroll', hide, true);
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        } [c]));
    }

    // ---- Dispositions-Schublade ----------------------------------------------------------

    function openDrawer(inc, els, map) {
        if (inc.status === 'erledigt' || inc.status === 'verpasst') return;
        S.selectedId = inc.uid;
        drawerVehicleTab = 'empfohlen';
        drawerLimits = {};
        drawerQuery = '';
        resetRedirectArm();
        renderDrawer(inc, els);
        els.drawerOverlay.classList.remove('ls-hidden');
        renderIncidentList(els);
        if (map) map.panTo(inc.coords, {
            animate: true
        });
    }

    function closeDrawer(els) {
        S.selectedId = null;
        els.drawerOverlay.classList.add('ls-hidden');
        renderIncidentList(els);
    }

    let assignedRefreshAt = 0;

    function refreshDrawerIfOpen(els) {
        const inc = S.incidents.find(i => i.uid === S.selectedId);
        if (!inc || inc.status === 'erledigt' || inc.status === 'verpasst') {
            closeDrawer(els);
            return;
        }
        updateDrawerTimerInPlace(inc, els);
        const now = performance.now();
        if (now - assignedRefreshAt > 500) {
            assignedRefreshAt = now;
            const box = document.getElementById('assignedList');
            if (box) box.innerHTML = assignedHtml(inc);
        }
    }

    function assignedHtml(inc) {
        const vs = [];
        Object.keys(inc.assigned).forEach(role => inc.assigned[role].forEach(uid => {
            const v = S.vehicles.find(x => x.uid === uid);
            if (v && v.incidentId === inc.uid) vs.push({
                v,
                role
            });
        }));
        if (!vs.length) return '<p class="ls-empty">Noch keine Fahrzeuge alarmiert.</p>';
        return vs.map(({
            v,
            role
        }) => {
            const eta = vehicleEta(v);
            const extra = !inc.need[role] ? ' · zusätzlich' : '';
            return '<div class="ls-assigned-row is-' + v.status + '" data-tipk="v:' + v.uid + '"><i style="background:' + SERVICES[VEHICLE_TYPES[v.typeKey].service].color + '"></i>' +
                '<b>' + escapeHtml(v.callsign) + '</b><span>' + statusLabel(v) + extra + '</span><em>' + (eta || '') + '</em></div>';
        }).join('');
    }

    function updateDrawerTimerInPlace(inc, els) {
        const bar = els.drawer.querySelector('.ls-drawer-timer .ls-bar i');
        const val = els.drawer.querySelector('.ls-drawer-timer-val');
        if (!bar || !val) return;
        if (inc.status === 'bearbeitung') {
            bar.className = 'is-work';
            bar.style.width = Math.max(4, (inc.workLeft / inc.type.work) * 100).toFixed(0) + '%';
            val.textContent = fmtTime(inc.workLeft);
            const statusEl = els.drawer.querySelector('.ls-drawer-status');
            if (statusEl) statusEl.textContent = 'Kräfte vor Ort — Einsatz wird bearbeitet (' + fmtTime(inc.workLeft) + ' verbleibend).';
        } else {
            bar.className = '';
            bar.style.width = Math.max(4, (inc.timeLeft / inc.patience) * 100).toFixed(0) + '%';
            val.textContent = fmtTime(inc.timeLeft);
        }
    }

    function dispatchSmallText(v, inc, st, role) {
        const stLabel = st.name + (st.external ? ' (außerhalb)' : '');
        if (v.incidentId === inc.uid) return stLabel + ' · ' + statusLabel(v);
        const distText = haversineKm(v.pos, inc.coords).toFixed(1) + ' km';
        if (v.status === 'bereit') {
            const needed = role ? inc.need[role] : (needsVehicle(inc, v) ? 1 : 0);
            if (!needed) return stLabel + ' · ' + distText + ' entfernt · nicht angefordert';
            const got = role ? (inc.assigned[role] || []).length : 0;
            return stLabel + ' · ' + distText + ' entfernt' + (role && got >= needed ? ' · zusätzlich' : '');
        }
        const busyInc = v.incidentId ? S.incidents.find(i => i.uid === v.incidentId) : null;
        return stLabel + ' · ' + distText + ' · ' + statusLabel(v) + (busyInc ? ' (' + busyInc.address + ')' : (v.bg ? ' in ' + v.bg.place : '')) + ' · umdisponieren';
    }

    function vehicleDispatchButtonHtml(v, inc, role) {
        const st = STATION_BY_ID[v.stationId];
        const needed = role ? true : needsVehicle(inc, v);
        const sameIncident = v.incidentId === inc.uid;
        const isRedirect = !sameIncident && v.status !== 'bereit';
        const armed = isRedirect && armedRedirectUid === v.uid;
        const cls = 'ls-dispatch-btn' + (!needed ? ' is-unlisted' : '') + (isRedirect ? ' is-redirect' : '') + (armed ? ' is-armed' : '');
        const label = armed ? 'Sicher? Nochmal klicken zum Bestätigen!' : dispatchSmallText(v, inc, st, role);
        return '<button type="button" class="' + cls + '" data-uid="' + v.uid + '" data-tipk="v:' + v.uid + '"' + (role ? ' data-role="' + role + '"' : '') + (sameIncident ? ' disabled' : '') + '>' +
            '<i style="background:' + SERVICES[VEHICLE_TYPES[v.typeKey].service].color + '"></i><span>' + VEHICLE_TYPES[v.typeKey].short + '</span>' +
            '<small>' + escapeHtml(label) + '</small>' +
            '</button>';
    }

    const FIRE_ROLES = ['TSF', 'LF', 'DLK', 'TLF', 'RW', 'ELW'];

    function groupDispatchCandidates(inc) {
        if (!Object.keys(inc.need).some(r => FIRE_ROLES.includes(r))) return [];
        const result = [];
        STATIONS.forEach(st => {
            if (!st.groups) return;
            st.groups.forEach(g => {
                const used = new Set();
                const vehicles = [];
                let ok = true;
                g.types.forEach(t => {
                    const v = st.vehicles.find(x => x.typeKey === t && x.status === 'bereit' && !used.has(x.uid));
                    if (!v) {
                        ok = false;
                        return;
                    }
                    used.add(v.uid);
                    vehicles.push(v);
                });
                if (ok && vehicles.length > 1) result.push({
                    station: st,
                    group: g,
                    vehicles,
                    dist: haversineKm(st.coords, inc.coords)
                });
            });
        });
        return result.sort((a, b) => a.dist - b.dist).slice(0, 3);
    }

    function limitedList(key, items, render) {
        const lim = drawerLimits[key] || 8;
        const shown = items.slice(0, lim);
        let html = shown.map(render).join('');
        if (items.length > shown.length) html += '<button type="button" class="ls-more-btn" data-more="' + key + '">Weitere anzeigen (' + (items.length - shown.length) + ')</button>';
        return html;
    }

    function renderDrawer(inc, els) {
        const color = SERVICES[inc.type.service].color;
        const needRows = Object.keys(inc.need).map(k => {
            const got = (inc.assigned[k] || []).length,
                need = inc.need[k];
            return '<div class="ls-need-row" data-tipk="r:' + inc.uid + ':' + k + '"><span class="ls-need-name">' + roleShort(k) + ' — ' + ROLE_LABEL[k] + '</span><span class="ls-need-count' + (got >= need ? ' is-ok' : '') + '">' + got + ' / ' + need + '</span></div>';
        }).join('');
        const rule = RULES[inc.type.code] ? '<p class="ls-rule">' + escapeHtml(RULES[inc.type.code]) + '</p>' : '';

        const pool = S.vehicles.filter(v => v.status !== 'transport');
        let listsHtml = '';
        if (drawerQuery) {
            // Suche ueber alle Fahrzeuge: Rufname, Wache, Ort oder Typ.
            const terms = drawerQuery.split(/\s+/).filter(Boolean);
            const matches = v => {
                const st = STATION_BY_ID[v.stationId];
                const hay = (v.callsign + ' ' + (st ? st.name + ' ' + st.town : '') + ' ' + VEHICLE_TYPES[v.typeKey].short + ' ' + VEHICLE_TYPES[v.typeKey].name + ' ' + v.typeKey).toLowerCase();
                return terms.every(t => hay.includes(t));
            };
            STATION_GROUPS.forEach(g => {
                const items = pool.filter(v => VEHICLE_TYPES[v.typeKey].service === g.key && matches(v))
                    .map(v => ({
                        v,
                        key: (v.incidentId === inc.uid ? -1 : 0) + haversineKm(v.pos, inc.coords)
                    }))
                    .sort((a, b) => a.key - b.key).map(x => x.v);
                if (!items.length) return;
                listsHtml += '<div class="ls-dispatch-group"><div class="ls-dispatch-group-head"><span class="ls-svc-dot" style="background:' + SERVICES[g.key].color + '"></span>' + g.label + ' (' + items.length + ')</div>' +
                    limitedList('s-' + g.key, items, v => vehicleDispatchButtonHtml(v, inc, null)) + '</div>';
            });
            if (!listsHtml) listsHtml = '<p class="ls-empty">Keine Fahrzeuge gefunden.</p>';
        } else if (drawerVehicleTab === 'empfohlen') {
            Object.keys(inc.need).forEach(role => {
                const items = pool.filter(v => v.fills.includes(role) && (v.incidentId !== inc.uid || (inc.assigned[role] || []).includes(v.uid)))
                    .map(v => ({
                        v,
                        key: (v.incidentId === inc.uid ? -1 : v.status === 'bereit' ? 0 : 1000) + haversineKm(v.pos, inc.coords)
                    }))
                    .sort((a, b) => a.key - b.key).map(x => x.v);
                if (!items.length) return;
                listsHtml += '<div class="ls-dispatch-group"><div class="ls-dispatch-group-head"><span class="ls-svc-dot" style="background:' + SERVICES[VEHICLE_TYPES[role].service].color + '"></span>' + ROLE_LABEL[role] + '</div>' +
                    limitedList('r-' + role, items, v => vehicleDispatchButtonHtml(v, inc, role)) + '</div>';
            });
        } else {
            STATION_GROUPS.forEach(g => {
                const items = pool.filter(v => VEHICLE_TYPES[v.typeKey].service === g.key)
                    .map(v => ({
                        v,
                        key: (v.incidentId === inc.uid ? -1 : v.status === 'bereit' ? 0 : 1000) + haversineKm(v.pos, inc.coords)
                    }))
                    .sort((a, b) => a.key - b.key).map(x => x.v);
                if (!items.length) return;
                listsHtml += '<div class="ls-dispatch-group"><div class="ls-dispatch-group-head"><span class="ls-svc-dot" style="background:' + SERVICES[g.key].color + '"></span>' + g.label + '</div>' +
                    limitedList('s-' + g.key, items, v => vehicleDispatchButtonHtml(v, inc, null)) + '</div>';
            });
        }

        const missing = missingRoles(inc);
        const availableForAuto = missing.length && missing.some(([role]) => S.vehicles.some(v => v.status === 'bereit' && v.fills.includes(role)));
        const autoHtml = '<button type="button" class="ls-auto-btn" data-auto="1"' + (availableForAuto ? '' : ' disabled') + '><b>Nach AAO alarmieren</b><span>' +
            (missing.length ? 'Nächste freie Fahrzeuge: ' + missing.map(([r, n]) => n + '× ' + roleShort(r)).join(', ') : 'Alle angeforderten Kräfte sind alarmiert.') + '</span></button>';
        const quickCandidates = groupDispatchCandidates(inc);
        const quickHtml = '<div class="ls-drawer-section"><div class="ls-drawer-label">Schnell alarmieren</div><div class="ls-quickgroup">' + autoHtml +
            quickCandidates.map((c, i) => '<button type="button" class="ls-quick-btn" data-qi="' + i + '"><b>' + escapeHtml(c.group.name) + ' · ' + c.dist.toFixed(1) + ' km</b><span>' + escapeHtml(c.station.name) + ' · ' + c.vehicles.map(v => VEHICLE_TYPES[v.typeKey].short).join(' + ') + '</span></button>').join('') +
            '</div></div>';

        const allOnScene = isFullyAssigned(inc) && isFullyOnScene(inc);
        const statusText = inc.status === 'bearbeitung' ?
            'Kräfte vor Ort — Einsatz wird bearbeitet (' + fmtTime(inc.workLeft) + ' verbleibend).' :
            allOnScene ? 'Alle Kräfte eingetroffen — Bearbeitung startet gleich.' :
            assignedTotal(inc) > 0 ? 'Kräfte auf Anfahrt …' : 'Noch keine Fahrzeuge alarmiert.';

        const badges = (inc.type.tier === 'gross' ? '<span class="ls-badge-gross">Großeinsatz</span>' : '') + (inc.escalated ? '<span class="ls-badge-esk">Eskaliert</span>' : '') + (inc.nach ? '<span class="ls-badge-esk">Nachforderung</span>' : '');

        const searchBox = '<input type="search" id="drawerSearch" class="ls-search ls-drawer-search" placeholder="Fahrzeug, Wache oder Ort suchen …" autocomplete="off" value="' + escapeHtml(drawerQuery) + '" aria-label="Fahrzeuge suchen">';
        const vehTabs = '<div class="ls-seg-mini" id="drawerVehTabs">' +
            '<button type="button" data-vtab="empfohlen" class="' + (drawerVehicleTab === 'empfohlen' ? 'is-active' : '') + '">Empfohlen</button>' +
            '<button type="button" data-vtab="alle" class="' + (drawerVehicleTab === 'alle' ? 'is-active' : '') + '">Alle Fahrzeuge</button>' +
            '</div>';

        const prev = document.activeElement;
        const hadFocus = !!(prev && prev.id === 'drawerSearch');
        const caret = hadFocus ? prev.selectionStart : 0;
        els.drawer.innerHTML = '' +
            '<div class="ls-drawer-head">' +
            '<div class="ls-drawer-head-icon" style="background:' + color + '">' + svg(svcIcon(inc.type.service)) + '</div>' +
            '<div><h3><span class="ls-code">' + escapeHtml(inc.type.code) + '</span> ' + escapeHtml(inc.type.name) + '</h3><div class="ls-drawer-addr">' + escapeHtml(inc.address) + '</div>' + (badges ? '<div class="ls-badge-row">' + badges + '</div>' : '') + '</div>' +
            '<button type="button" class="ls-drawer-close" id="drawerClose">' + svg('close') + '</button>' +
            '</div>' +
            '<div class="ls-drawer-timer"><div class="ls-bar" style="margin:0;flex:1;"><i class="' + (inc.status === 'bearbeitung' ? 'is-work' : '') + '" style="width:' + Math.max(4, (inc.status === 'bearbeitung' ? inc.workLeft / inc.type.work : inc.timeLeft / inc.patience) * 100).toFixed(0) + '%"></i></div>' +
            '<span class="ls-drawer-timer-val">' + (inc.status === 'bearbeitung' ? fmtTime(inc.workLeft) : fmtTime(inc.timeLeft)) + '</span></div>' +
            '<div class="ls-drawer-status' + (allOnScene ? ' is-ready' : '') + '">' + statusText + '</div>' +
            '<div class="ls-drawer-section"><div class="ls-drawer-label">Benötigte Fahrzeuge</div>' + needRows + rule + '</div>' +
            '<div class="ls-drawer-section"><div class="ls-drawer-label">Alarmierte Fahrzeuge (' + assignedTotal(inc) + ')</div><div id="assignedList">' + assignedHtml(inc) + '</div></div>' +
            quickHtml +
            '<div class="ls-drawer-section"><div class="ls-drawer-label">Fahrzeuge alarmieren</div>' + vehTabs + searchBox + (listsHtml || '<p class="ls-empty">Keine Fahrzeuge verfügbar.</p>') + '</div>';
        if (hadFocus) {
            const s = document.getElementById('drawerSearch');
            if (s) {
                s.focus();
                try {
                    s.setSelectionRange(caret, caret);
                } catch (e) {
                    /* egal */ }
            }
        }

        els.drawer.oninput = e => {
            if (e.target.id !== 'drawerSearch') return;
            drawerQuery = e.target.value.trim().toLowerCase();
            drawerLimits = {};
            renderDrawer(inc, els);
        };

        // Ein einziger Klick-Handler (Delegation) statt hunderter Einzel-Listener.
        els.drawer.onclick = e => {
            if (e.target.closest('#drawerClose')) {
                closeDrawer(els);
                return;
            }
            const tab = e.target.closest('button[data-vtab]');
            if (tab) {
                drawerVehicleTab = tab.dataset.vtab;
                drawerQuery = '';
                drawerLimits = {};
                resetRedirectArm();
                renderDrawer(inc, els);
                return;
            }
            const more = e.target.closest('button[data-more]');
            if (more) {
                drawerLimits[more.dataset.more] = (drawerLimits[more.dataset.more] || 8) + 12;
                renderDrawer(inc, els);
                return;
            }
            if (e.target.closest('.ls-auto-btn:not([disabled])')) {
                autoDispatch(inc, els);
                renderDrawer(inc, els);
                return;
            }
            const quick = e.target.closest('.ls-quick-btn');
            if (quick) {
                const c = quickCandidates[+quick.dataset.qi];
                if (c) {
                    c.vehicles.forEach(v => {
                        if (v.status === 'bereit') dispatchVehicle(inc, v, els, MAP);
                    });
                    renderDrawer(inc, els);
                }
                return;
            }
            const btn = e.target.closest('.ls-dispatch-btn:not([disabled])');
            if (!btn) return;
            const v = S.vehicles.find(x => x.uid === +btn.dataset.uid);
            if (!v) return;
            const isRedirect = v.incidentId !== inc.uid && v.status !== 'bereit';
            // Umdisponieren ist ein zweistufiger Klick: erst 'scharfschalten', dann bestaetigen.
            if (isRedirect && armedRedirectUid !== v.uid) {
                armedRedirectUid = v.uid;
                if (armedRedirectTimer) clearTimeout(armedRedirectTimer);
                armedRedirectTimer = setTimeout(() => {
                    armedRedirectUid = null;
                    renderDrawer(inc, els);
                }, 4000);
                renderDrawer(inc, els);
                return;
            }
            resetRedirectArm();
            dispatchVehicle(inc, v, els, MAP, btn.dataset.role || undefined);
            renderDrawer(inc, els);
        };
    }
})();