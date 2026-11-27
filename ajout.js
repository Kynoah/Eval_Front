// Écran 'Ajout d'un Slime'
const form = document.getElementById("form-ajout");
const selectCouleur = document.getElementById("couleur");
const apercu = document.getElementById("apercu-gif");

// Remplit la liste des couleurs à partir de COULEURS (data.js)
COULEURS.forEach((couleur) => {
  const option = document.createElement("option");
  option.value = couleur;
  option.textContent = couleur.charAt(0).toUpperCase() + couleur.slice(1);
  selectCouleur.appendChild(option);
});
selectCouleur.value = "vert";

// Aperçu du gif selon la couleur choisie
function majApercu() {
  apercu.src = getGif("idle", selectCouleur.value);
}
selectCouleur.addEventListener("change", majApercu);
majApercu();

// Affiche ou efface un message d'erreur
function setErreur(id, message) {
  document.getElementById(id).textContent = message;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const slimes = getSlimes();
  const nom = form.nom.value.trim();
  const description = form.description.value.trim();
  const pv = Number(form.pv.value);
  const force = Number(form.force.value);
  const vitesse = Number(form.vitesse.value);
  let valide = true;

  // Nom obligatoire et unique (sans tenir compte des majuscules)
  if (nom === "") {
    setErreur("erreur-nom", "Le nom est obligatoire.");
    valide = false;
  } else if (slimes.some((s) => s.nom.toLowerCase() === nom.toLowerCase())) {
    setErreur("erreur-nom", `Le nom "${nom}" est déjà utilisé par un autre slime.`);
    valide = false;
  } else {
    setErreur("erreur-nom", "");
  }

  // Description obligatoire
  if (description === "") {
    setErreur("erreur-description", "La description est obligatoire.");
    valide = false;
  } else {
    setErreur("erreur-description", "");
  }

  // Stats : nombres entiers positifs
  const statsOk = [pv, force, vitesse].every((n) => Number.isInteger(n) && n > 0);
  if (!statsOk) {
    setErreur("erreur-stats", "PV, force et vitesse doivent être des nombres entiers supérieurs à 0.");
    valide = false;
  } else {
    setErreur("erreur-stats", "");
  }

  if (!valide) return;

  // Création du slime avec les valeurs par défaut demandées
  const nouveauSlime = {
    nom,
    couleur: selectCouleur.value,
    description,
    pv,
    force,
    vitesse,
    enRepos: false,
    victoires: 0,
    boost: false
  };

  slimes.push(nouveauSlime);
  saveSlimes(slimes);

  // Redirection vers la fiche du nouveau slime
  window.location.href = `detail.html?nom=${encodeURIComponent(nom)}`;
});
