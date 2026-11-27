// Écran 'Bataille'
const DUREE_REPOS = 60 * 1000;      // le perdant se repose 1 minute
const ATTENTE_RESULTAT = 3000;      // résultat affiché après 3 secondes
const DUREE_ANIMATION_MAX = 8000;   // durée max de l'animation des tours

let selection = [];        // noms des 2 slimes sélectionnés
let combatEnCours = false;

const grille = document.getElementById("choix-slimes");
const boutonCombat = document.getElementById("btn-combat");
const message = document.getElementById("message-combat");
const journal = document.getElementById("journal");

// Évite d'injecter du HTML via le nom ou la description d'un slime
function echapper(texte) {
  const div = document.createElement("div");
  div.textContent = texte;
  return div.innerHTML;
}

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Coup critique : 10 % de chance de faire x2 dégâts
const CHANCE_CRITIQUE = 0.1;

function calculerAttaque(force) {
  const critique = Math.random() < CHANCE_CRITIQUE;
  return { degats: critique ? force * 2 : force, critique };
}

// Petit texte "CRITIQUE !" au-dessus du slime touché
function afficherCritique(combattant) {
  const slot = document.getElementById(`slot-${combattant.slot}`);
  const popup = document.createElement("span");
  popup.className = "critique-popup";
  popup.textContent = "CRITIQUE !";
  slot.appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}

// ---------- Affichage ----------

// Liste des slimes à sélectionner
function afficherChoix() {
  const slimes = getSlimes();
  grille.innerHTML = "";

  // Si un slime sélectionné a disparu ou est passé au repos, on le retire
  selection = selection.filter((nom) => slimes.some((s) => s.nom === nom && !s.enRepos));

  slimes.forEach((slime) => {
    const carte = document.createElement("button");
    carte.type = "button";
    carte.className = "choix-card";

    const estSelectionne = selection.includes(slime.nom);
    if (estSelectionne) carte.classList.add("selectionne");
    if (slime.boost) carte.classList.add("boost");

    // Seuls les slimes disponibles (enRepos à false) peuvent combattre
    carte.disabled =
      combatEnCours ||
      slime.enRepos ||
      (selection.length >= 2 && !estSelectionne);

    let statut = "Disponible";
    if (slime.enRepos) {
      statut = slime.reposJusqua
        ? `Repos : ${Math.ceil((slime.reposJusqua - Date.now()) / 1000)} s`
        : "Au repos";
    }

    carte.innerHTML = `
      <img class="choix-gif" src="${getGif("idle", slime.couleur)}" alt="">
      <span class="choix-nom">${echapper(slime.nom)}</span>
      <span class="choix-stats">❤ ${slime.pv}${slime.boost ? " ×2" : ""} · ⚔ ${slime.force} · ➤ ${slime.vitesse}</span>
      <span class="statut ${slime.enRepos ? "repos" : ""}">${statut}</span>
    `;

    carte.addEventListener("click", () => basculerSelection(slime.nom));
    grille.appendChild(carte);
  });

  boutonCombat.disabled = combatEnCours || selection.length !== 2;
}

// Arène avant le combat (place vide ou slime choisi)
function afficherArene() {
  const slimes = getSlimes();

  for (let i = 0; i < 2; i++) {
    const slot = document.getElementById(`slot-${i}`);
    const slime = slimes.find((s) => s.nom === selection[i]);

    if (!slime) {
      slot.innerHTML = `<p class="slot-vide">Choisis un slime</p>`;
      continue;
    }

    const pvMax = slime.boost ? slime.pv * 2 : slime.pv;
    slot.innerHTML = `
      <img class="arene-gif" src="${getGif("idle", slime.couleur)}" alt="">
      <p class="arene-nom">${echapper(slime.nom)}${slime.boost ? ' <span class="badge-boost">Boost</span>' : ""}</p>
      <div class="barre-pv"><div class="barre-pv-remplie" style="width: 100%"></div></div>
      <p class="pv-texte">${pvMax} / ${pvMax} PV</p>
    `;
  }
}

function basculerSelection(nom) {
  if (combatEnCours) return;

  if (selection.includes(nom)) {
    selection = selection.filter((n) => n !== nom);
  } else if (selection.length < 2) {
    selection.push(nom);
  }

  message.textContent = "";
  journal.innerHTML = "";
  afficherChoix();
  afficherArene();
}

// Met à jour un combattant dans l'arène pendant le combat
function majCombattant(combattant, action) {
  const slot = document.getElementById(`slot-${combattant.slot}`);
  slot.querySelector(".arene-gif").src = getGif(action, combattant.slime.couleur);

  const pourcentage = Math.max(0, (combattant.pv / combattant.pvMax) * 100);
  const barre = slot.querySelector(".barre-pv-remplie");
  barre.style.width = `${pourcentage}%`;
  barre.classList.toggle("faible", pourcentage <= 30);

  slot.querySelector(".pv-texte").textContent =
    `${Math.max(0, combattant.pv)} / ${combattant.pvMax} PV`;
}

function ajouterJournal(texte) {
  const li = document.createElement("li");
  li.textContent = texte;
  journal.appendChild(li);
  journal.scrollTop = journal.scrollHeight;
}

// ---------- Combat ----------

async function lancerCombat() {
  if (selection.length !== 2 || combatEnCours) return;

  combatEnCours = true;
  journal.innerHTML = "";
  message.textContent = "⚔ Combat en cours…";
  afficherChoix(); // désactive le bouton "Combat !" et la sélection

  const slimes = getSlimes();
  const combattants = selection.map((nom, i) => {
    const slime = slimes.find((s) => s.nom === nom);
    // Si le slime est boosté, ses PV sont doublés
    const pvMax = slime.boost ? slime.pv * 2 : slime.pv;
    return { slime, slot: i, pvMax, pv: pvMax };
  });

  const [a, b] = combattants;

  // À chaque tour, les 2 slimes attaquent : le plus rapide en 1er.
  // En cas d'égalité, l'ordre est tiré au sort à chaque tour.
  const memeVitesse = a.slime.vitesse === b.slime.vitesse;
  const plusRapide = a.slime.vitesse >= b.slime.vitesse ? a : b;

  if (memeVitesse) {
    ajouterJournal("Même vitesse : l'ordre d'attaque est tiré au sort à chaque tour !");
  } else {
    ajouterJournal(`${plusRapide.slime.nom} est le plus rapide, il attaque en premier à chaque tour !`);
  }

  // Vitesse d'animation adaptée au nombre d'attaques estimé
  const attaquesEstimees =
    Math.ceil(a.pvMax / b.slime.force) + Math.ceil(b.pvMax / a.slime.force);
  const dureeAttaque = Math.min(900, Math.max(200, DUREE_ANIMATION_MAX / attaquesEstimees));

  let tour = 0;
  let gagnant = null;
  let perdant = null;

  // Le combat continue tant que les 2 slimes ont des PV
  while (!gagnant) {
    tour++;

    const premier = memeVitesse ? (Math.random() < 0.5 ? a : b) : plusRapide;
    const ordre = [premier, premier === a ? b : a];

    for (const attaquant of ordre) {
      const defenseur = attaquant === a ? b : a;

      // L'attaquant retire sa force aux PV de l'adversaire
      const { degats, critique } = calculerAttaque(attaquant.slime.force);
      defenseur.pv -= degats;

      majCombattant(attaquant, "attaque");
      majCombattant(defenseur, "clignement");
      if (critique) afficherCritique(defenseur);
      ajouterJournal(
        `Tour ${tour} : ${critique ? "💥 Coup critique ! " : ""}${attaquant.slime.nom} inflige ${degats} dégâts à ${defenseur.slime.nom} (${Math.max(0, defenseur.pv)} PV restants)`
      );

      await attendre(dureeAttaque);

      // Plus de PV : fin du combat (le 2e slime n'attaque pas)
      if (defenseur.pv <= 0) {
        gagnant = attaquant;
        perdant = defenseur;
        break;
      }

      majCombattant(attaquant, "idle");
      majCombattant(defenseur, "idle");
    }
  }

  majCombattant(gagnant, "idle");
  majCombattant(perdant, "mort");
  message.textContent = "Le combat est terminé… résultat dans 3 secondes";

  await attendre(ATTENTE_RESULTAT);
  terminerCombat(gagnant.slime.nom, perdant.slime.nom, tour);
}

function terminerCombat(nomGagnant, nomPerdant, nbTours) {
  // On relit les données au cas où elles auraient changé
  const slimes = getSlimes();
  const gagnant = slimes.find((s) => s.nom === nomGagnant);
  const perdant = slimes.find((s) => s.nom === nomPerdant);

  // Les PV enregistrés n'ont jamais été modifiés : ils restent à leur valeur initiale
  gagnant.victoires++;

  // Le perdant passe au repos pendant 1 minute
  perdant.enRepos = true;
  perdant.reposJusqua = Date.now() + DUREE_REPOS;

  // Les slimes boostés perdent leur boost
  gagnant.boost = false;
  perdant.boost = false;

  saveSlimes(slimes);

  // Résultat
  message.innerHTML = `🏆 <strong>${echapper(gagnant.nom)}</strong> gagne contre ${echapper(perdant.nom)} en ${nbTours} tours ! ${echapper(perdant.nom)} part se reposer 1 minute.`;
  ajouterJournal(`${gagnant.nom} remporte le combat (${gagnant.victoires} victoire(s))`);

  // Dé-sélection des 2 participants
  combatEnCours = false;
  selection = [];
  afficherChoix();
  afficherArene();
}

// ---------- Initialisation ----------

boutonCombat.addEventListener("click", lancerCombat);

afficherChoix();
afficherArene();

// Rafraîchit le compte à rebours des slimes au repos chaque seconde
// (on continue un tour de plus après la fin du repos pour réactiver la carte)
let reposEnCours = false;
setInterval(() => {
  if (combatEnCours) return;
  const repos = getSlimes().some((s) => s.enRepos && s.reposJusqua);
  if (repos || reposEnCours) afficherChoix();
  reposEnCours = repos;
}, 1000);
