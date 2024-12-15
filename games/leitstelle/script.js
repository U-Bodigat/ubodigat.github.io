let aktuelleEinsatzMarker;

document.addEventListener('DOMContentLoaded', () => {
    const einsatzErstellenButton = document.getElementById('einsatzErstellen');
    const einsatzDetails = document.getElementById('einsatzDetails');
    const wachenListe = document.getElementById('wachenListe');

    const map = L.map('mapContainer').setView([52.520008, 13.404954], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const wachen = [
        { name: 'Feuerwache 1', coords: [52.520008, 13.404954], fahrzeuge: ['Löschfahrzeug 1', 'Drehleiter 1'] },
        { name: 'Rettungswache 2', coords: [52.530008, 13.414954], fahrzeuge: ['Rettungswagen 1', 'Notarztwagen 1'] },
        { name: 'Polizeiwache 3', coords: [52.540008, 13.424954], fahrzeuge: ['Streifenwagen 1', 'Transporter 1'] }
    ];

    wachen.forEach(wache => {
        const marker = L.marker(wache.coords).addTo(map);
        marker.bindPopup(`
            <div style="color: white;">
                <strong>${wache.name}</strong><br>
                ${wache.fahrzeuge.join('<br>')}
            </div>
        `);

        const li = document.createElement('li');
        li.innerHTML = `<div style="color: white;"><strong>${wache.name}</strong></div>`;
        const fahrzeugeUl = document.createElement('ul');
        wache.fahrzeuge.forEach(fahrzeug => {
            const fahrzeugLi = document.createElement('li');
            fahrzeugLi.textContent = fahrzeug;
            fahrzeugLi.classList.add('fahrzeug');
            fahrzeugLi.style.cursor = 'pointer';
            fahrzeugLi.addEventListener('click', () => alert(`Fahrzeug ${fahrzeug} zugewiesen!`));
            fahrzeugeUl.appendChild(fahrzeugLi);
        });
        li.appendChild(fahrzeugeUl);
        wachenListe.appendChild(li);
    });

    einsatzErstellenButton.addEventListener('click', () => {
        const einsaetze = ['Wohnungsbrand', 'Verkehrsunfall', 'Herzinfarkt', 'Einbruchdiebstahl', 'Baum auf Straße'];
        const randomEinsatz = einsaetze[Math.floor(Math.random() * einsaetze.length)];
        einsatzDetails.innerHTML = `Ein neuer Einsatz wurde generiert: <strong>${randomEinsatz}</strong>`;

        const coords = [52.530008 + Math.random() * 0.01, 13.414954 + Math.random() * 0.01];
        if (aktuelleEinsatzMarker) aktuelleEinsatzMarker.remove();
        aktuelleEinsatzMarker = L.marker(coords).addTo(map);

        aktuelleEinsatzMarker.bindPopup(`
            <div style="color: white;">
                <strong>${randomEinsatz}</strong><br>
                <button onclick="alert('Fahrzeug zuweisen!')">Fahrzeug zuweisen</button>
            </div>
        `).openPopup();
    });
});