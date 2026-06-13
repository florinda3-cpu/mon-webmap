// Initialiser la carte centrée sur les Hauts-de-France
const carte = L.map('carte').setView([50.2, 2.8], 8);

// Fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap | Ministère de la Culture'
}).addTo(carte);

// Couleurs selon le statut legende
function couleur(legende) {
  if (!legende) return '#7F8C8D';
  const l = legende.toLowerCase();
  const aClass = l.includes('class');
  const aInscrit = l.includes('inscrit');
  if (aClass && aInscrit) return '#E67E22';  // orange = mixte
  if (aClass) return '#C0392B';              // rouge = classé
  if (aInscrit) return '#2980B9';            // bleu = inscrit
  return '#7F8C8D';                          // gris = autre
}

let coucheMonuments;
let tousLesData;

// Charger le GeoJSON
fetch('monuments.geojson')
  .then(res => res.text())
  .then(text => {
    const clean = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    const data = JSON.parse(clean);
    tousLesData = data;
    afficher(data);
  });

function afficher(data) {
  if (coucheMonuments) carte.removeLayer(coucheMonuments);

  coucheMonuments = L.geoJSON(data, {
    style: function(feature) {
      return {
        color: couleur(feature.properties.legende),
        fillColor: couleur(feature.properties.legende),
        fillOpacity: 0.5,
        weight: 1.5
      };
    },
    onEachFeature: function(feature, layer) {
      const p = feature.properties;
      const lienFiche = p.ressource
        ? `<br><a href="${p.ressource}" target="_blank">📎 Voir la fiche officielle</a>`
        : '';
      layer.bindPopup(`
        <b>${p.appelation || 'Monument'}</b><br>
        📍 ${p.commune || ''} (${p.departemen || ''})<br>
        🏛 <b>${p.legende || 'Statut inconnu'}</b><br>
        📅 ${p.evenement || ''}<br>
        🏢 ${p.categorie || ''}
        ${lienFiche}
      `);
    }
  }).addTo(carte);
}

// Filtre par statut
function filtrer() {
  const classeCheck = document.querySelector('#filtre input[value="classement"]').checked;
  const inscritCheck = document.querySelector('#filtre input[value="inscrit"]').checked;
  const mixteCheck = document.querySelector('#filtre input[value="mixte"]').checked;

  const filtre = {
    ...tousLesData,
    features: tousLesData.features.filter(f => {
      const legende = (f.properties.legende || '').toLowerCase();
      const aClass = legende.includes('class');
      const aInscrit = legende.includes('inscrit');

      if (aClass && aInscrit) return mixteCheck;
      if (aClass) return classeCheck;
      if (aInscrit) return inscritCheck;
      return false;
    })
  };
  afficher(filtre);
}
function rechercher() {
  const terme = document.getElementById('searchInput').value.toLowerCase();

  // Récupère l'état des cases à cocher
  const classeCheck = document.querySelector('#filtre input[value="classement"]').checked;
  const inscritCheck = document.querySelector('#filtre input[value="inscrit"]').checked;
  const mixteCheck = document.querySelector('#filtre input[value="mixte"]').checked;

  const filtre = {
    ...tousLesData,
    features: tousLesData.features.filter(f => {
      const legende = (f.properties.legende || '').toLowerCase();
      const aClass = legende.includes('class');
      const aInscrit = legende.includes('inscrit');

      // Filtre par catégorie
      let visible = false;
      if (aClass && aInscrit) visible = mixteCheck;
      else if (aClass) visible = classeCheck;
      else if (aInscrit) visible = inscritCheck;

      if (!visible) return false;

      // Filtre par recherche texte
      if (terme === '') return true;
      const nom = (f.properties.appelation || '').toLowerCase();
      const commune = (f.properties.commune || '').toLowerCase();
      const categorie = (f.properties.categorie || '').toLowerCase();
      const departement = (f.properties.departemen || '').toLowerCase();

      return nom.includes(terme) ||
             commune.includes(terme) ||
             categorie.includes(terme) ||
             departement.includes(terme);
    })
  };
  afficher(filtre);
}
