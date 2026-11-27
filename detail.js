// Écran 'Détail Slime'
const CHANCE_BOOST = 0.25; // 25 % de chance
const ESSAIS_MAX = 3;      // désactivé après 3 échecs d'affilée

// Récupère le nom du slime dans l'URL (detail.html?nom=Gluant)
const nomRecherche = new URLSearchParams(window.location.search).get("nom");

const slimes = getSlimes();
const slime = slimes.find((s) => s.nom === nomRecherche);

// Si le slime n'existe pas -> écran 'Slime introuvable'
if (!slime) {
  window.location.replace("introuvable.html");
} else {
  afficherSlime();
  initBoost();
}

function afficherSlime() {
  document.title = `${slime.nom} - Slimes Battle`;

  const gif = document.getElementById("slime-gif");
  gif.src = getGif("idle", slime.couleur);
  gif.alt = `Slime ${slime.couleur}`;

  document.getElementById("slime-nom").textContent = slime.nom;
  document.getElementById("slime-description").textContent = slime.description;
  document.getElementById("slime-pv").textContent = slime.pv;
  document.getElementById("slime-force").textContent = slime.force;
  document.getElementById("slime-vitesse").textContent = slime.vitesse;
  document.getElementById("slime-victoires").textContent = slime.victoires;
  document.getElementById("slime-couleur").textContent = slime.couleur;
  document.getElementById("slime-repos").textContent = slime.enRepos ? "Au repos" : "Disponible";
  document.getElementById("slime-boost").textContent = slime.boost ? "Oui" : "Non";

  document.getElementById("fiche").classList.toggle("boost", slime.boost);
}

function initBoost() {
  const bouton = document.getElementById("btn-boost");
  const message = document.getElementById("boost-message");
  let echecs = 0;

  // Désactivé si le slime est déjà boosté au chargement de la page
  if (slime.boost) {
    bouton.disabled = true;
    message.textContent = "Ce slime est déjà boosté !";
    return;
  }

  bouton.addEventListener("click", () => {
    if (Math.random() < CHANCE_BOOST) {
      // Réussite : on enregistre le boost
      slime.boost = true;
      saveSlimes(slimes);
      afficherSlime();
      bouton.disabled = true;
      message.textContent = "Boost réussi ! Les PV seront doublés au prochain combat.";
    } else {
      echecs++;
      if (echecs >= ESSAIS_MAX) {
        bouton.disabled = true;
        message.textContent = "Raté 3 fois d'affilée… le bouton est désactivé.";
      } else {
        message.textContent = `Raté ! Encore ${ESSAIS_MAX - echecs} essai(s).`;
      }
    }
  });
}
