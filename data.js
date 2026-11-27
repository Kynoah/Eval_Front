// Liste initiale des Slime (minimum 5 éléments)
const SLIMES_INITIAUX = [
  { nom: "Gluant", couleur: "vert", description: "Slime vert classique, collant et têtu.", pv: 120, force: 18, vitesse: 14, enRepos: false, victoires: 0, boost: false },
  { nom: "Bulle", couleur: "bleu", description: "Petit slime bleu qui rebondit partout.", pv: 90, force: 15, vitesse: 22, enRepos: false, victoires: 0, boost: true },
  { nom: "Magma", couleur: "rouge", description: "Slime en fusion, brûlant au toucher.", pv: 100, force: 22, vitesse: 11, enRepos: true, victoires: 0, boost: false },
  { nom: "Gelée", couleur: "rose", description: "Slime translucide presque invisible.", pv: 110, force: 14, vitesse: 18, enRepos: false, victoires: 0, boost: false },
  { nom: "Roi Mou", couleur: "orange", description: "Énorme slime couronné, lent mais coriace.", pv: 160, force: 16, vitesse: 8, enRepos: false, victoires: 0, boost: false }
];

const CLE_STOCKAGE = "slimes_v2"; // nouvelle clé car les slimes ont maintenant une couleur

// Animations disponibles dans le dossier Images (format : action_couleur.gif)
const COULEURS = ["beige", "bleu", "gris", "orange", "rose", "rouge", "vert"];
const ACTIONS = ["idle", "attaque", "mort", "clignement"];

// Renvoie le chemin du gif, ex : getGif("attaque", "bleu") -> "Images/attaque_bleu.gif"
function getGif(action, couleur) {
  if (!ACTIONS.includes(action)) action = "idle";
  if (!COULEURS.includes(couleur)) couleur = "vert";
  return `Images/${action}_${couleur}.gif`;
}

// Récupère la liste (localStorage pour garder les modifs entre les pages)
function getSlimes() {
  const sauvegarde = localStorage.getItem(CLE_STOCKAGE);
  if (!sauvegarde) {
    return resetSlimes();
  }

  const slimes = JSON.parse(sauvegarde);

  // Fin du repos : un slime perdant est au repos jusqu'à "reposJusqua" (timestamp)
  let modifie = false;
  slimes.forEach((s) => {
    if (s.enRepos && s.reposJusqua && Date.now() >= s.reposJusqua) {
      s.enRepos = false;
      delete s.reposJusqua;
      modifie = true;
    }
  });
  if (modifie) saveSlimes(slimes);

  return slimes;
}

// Sauvegarde la liste
function saveSlimes(slimes) {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(slimes));
}

// Remet la liste de départ (pour les tests)
function resetSlimes() {
  // Copie profonde pour ne pas modifier SLIMES_INITIAUX
  const copie = JSON.parse(JSON.stringify(SLIMES_INITIAUX));
  saveSlimes(copie);
  return copie;
}
