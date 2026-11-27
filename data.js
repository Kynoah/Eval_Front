// Liste initiale des Slime (minimum 5 éléments)
const SLIMES_INITIAUX = [
  { nom: "Gluant", description: "Slime vert classique, collant et têtu.", pv: 120, force: 18, vitesse: 14, enRepos: false, victoires: 0, boost: false, couleur: "vert"},
  { nom: "Bulle", description: "Petit slime bleu qui rebondit partout.", pv: 90, force: 15, vitesse: 22, enRepos: false, victoires: 0, boost: true, couleur : "bleu" },
  { nom: "Magma", description: "Slime en fusion, brûlant au toucher.", pv: 100, force: 22, vitesse: 11, enRepos: true, victoires: 0, boost: false, couleur : "rouge" },
  { nom: "Gelée", description: "Slime translucide presque invisible.", pv: 110, force: 14, vitesse: 18, enRepos: false, victoires: 0, boost: false, couleur : "gris" },
  { nom: "Roi Mou", description: "Énorme slime couronné, lent mais coriace.", pv: 160, force: 16, vitesse: 8, enRepos: false, victoires: 0, boost: false, couleur : "rose" }
];

const CLE_STOCKAGE = "slimes";

// Récupère la liste (localStorage pour garder les modifs entre les pages)
function getSlimes() {
  const sauvegarde = localStorage.getItem(CLE_STOCKAGE);
  if (sauvegarde) {
    return JSON.parse(sauvegarde);
  }
  saveSlimes(SLIMES_INITIAUX);
  return SLIMES_INITIAUX;
}

// Sauvegarde la liste
function saveSlimes(slimes) {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(slimes));
}
