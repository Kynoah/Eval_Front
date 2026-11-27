// Mode Tournoi
const NB_MIN = 3;
const DUREE_ANIMATION_MAX = 4000;   // durée max de l'animation d'un match
const ATTENTE_ENTRE_MATCHS = 1500;  // pause entre 2 matchs

let selection = [];   // noms des slimes choisis
let tournoi = null;   // { tours, petiteFinale, avecPetiteFinale }

// Éléments de la page
const etapeSelection = document.getElementById("etape-selection");
const etapeTournoi = document.getElementById("etape-tournoi");
const inputNb = document.getElementById("nb-slimes");
const grille = document.getElementById("choix-slimes");
const compteur = document.getElementById("compteur-selection");
const messageSelection = document.getElementById("message-selection");
const btnTirage = document.getElementById("btn-tirage");
const btnCreer = document.getElementById("btn-creer");
const btnLancer = document.getElementById("btn-lancer");
const btnAnnuler = document.getElementById("btn-annuler");
const btnNouveau = document.getElementById("btn-nouveau");
const message = document.getElementById("message-tournoi");
const arene = document.getElementById("arene");
const titreMatch = document.getElementById("titre-match");
const journal = document.getElementById("journal");
const arbre = document.getElementById("arbre");
const podium = document.getElementById("podium");

// ---------- Outils ----------

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function echapper(texte) {
  const div = document.createElement("div");
  div.textContent = texte;
  return div.innerHTML;
}

// Mélange un tableau (algorithme de Fisher-Yates)
function melanger(tableau) {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

function slimesDisponibles() {
  return getSlimes().filter((s) => !s.enRepos);
}

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

// ---------- Étape 1 : sélection ----------

function afficherSelection() {
  const slimes = getSlimes();
  const dispos = slimes.filter((s) => !s.enRepos);

  // On retire de la sélection les slimes qui ne sont plus disponibles
  selection = selection.filter((nom) => dispos.some((s) => s.nom === nom));

  inputNb.max = dispos.length;
  grille.innerHTML = "";

  slimes.forEach((slime) => {
    const carte = document.createElement("button");
    carte.type = "button";
    carte.className = "choix-card";
    if (selection.includes(slime.nom)) carte.classList.add("selectionne");
    if (slime.boost) carte.classList.add("boost");
    carte.disabled = slime.enRepos;

    carte.innerHTML = `
      <img class="choix-gif" src="${getGif("idle", slime.couleur)}" alt="">
      <span class="choix-nom">${echapper(slime.nom)}</span>
      <span class="choix-stats">❤ ${slime.pv}${slime.boost ? " ×2" : ""} · ⚔ ${slime.force} · ➤ ${slime.vitesse}</span>
      <span class="statut ${slime.enRepos ? "repos" : ""}">${slime.enRepos ? "Au repos" : "Disponible"}</span>
    `;

    carte.addEventListener("click", () => {
      if (selection.includes(slime.nom)) {
        selection = selection.filter((n) => n !== slime.nom);
      } else {
        selection.push(slime.nom);
      }
      afficherSelection();
    });

    grille.appendChild(carte);
  });

  compteur.textContent = selection.length;
  btnCreer.disabled = selection.length < NB_MIN;

  messageSelection.textContent =
    dispos.length < NB_MIN
      ? `Il faut au moins ${NB_MIN} slimes disponibles pour un tournoi.`
      : "";
}

// Tirage au sort du nombre de slimes demandé
btnTirage.addEventListener("click", () => {
  const dispos = slimesDisponibles();
  let nb = Number(inputNb.value);
  nb = Math.max(NB_MIN, Math.min(nb, dispos.length));
  inputNb.value = nb;

  selection = melanger(dispos).slice(0, nb).map((s) => s.nom);
  afficherSelection();
});

// ---------- Création de l'arbre ----------

function creerMatch(a = null, b = null) {
  return { a, b, gagnant: null, perdant: null, exempt: false };
}

function nomTour(nbMatchs) {
  if (nbMatchs === 1) return "Finale";
  if (nbMatchs === 2) return "Demi-finales";
  if (nbMatchs === 4) return "Quarts de finale";
  if (nbMatchs === 8) return "Huitièmes de finale";
  return `Tour à ${nbMatchs * 2}`;
}

// Place le gagnant du match i du tour t dans le tour suivant
function qualifier(t, i) {
  const suivant = tournoi.tours[t + 1];
  if (!suivant) return;
  const match = tournoi.tours[t][i];
  const place = i % 2 === 0 ? "a" : "b";
  suivant[Math.floor(i / 2)][place] = match.gagnant;
}

function creerTournoi(noms) {
  const participants = melanger(noms);

  // Taille de l'arbre = puissance de 2 supérieure (4, 8, 16…)
  const taille = 2 ** Math.ceil(Math.log2(participants.length));
  const nbMatchs = taille / 2;
  const nbExempts = taille - participants.length; // slimes qualifiés d'office

  // Répartit les exemptés dans l'arbre (matchs 0, 2, 4… puis 1, 3, 5…)
  const ordre = [];
  for (let i = 0; i < nbMatchs; i += 2) ordre.push(i);
  for (let i = 1; i < nbMatchs; i += 2) ordre.push(i);
  const matchsExempts = ordre.slice(0, nbExempts);

  // 1er tour
  const premierTour = [];
  let p = 0;
  for (let i = 0; i < nbMatchs; i++) {
    if (matchsExempts.includes(i)) {
      const match = creerMatch(participants[p++], null);
      match.exempt = true;
      match.gagnant = match.a;
      premierTour.push(match);
    } else {
      premierTour.push(creerMatch(participants[p++], participants[p++]));
    }
  }

  // Tours suivants (vides pour l'instant)
  const tours = [premierTour];
  for (let n = nbMatchs / 2; n >= 1; n /= 2) {
    tours.push(Array.from({ length: n }, () => creerMatch()));
  }

  // Petite finale seulement si les 2 demi-finales sont de vrais matchs
  const demis = tours[tours.length - 2];
  tournoi = {
    tours,
    petiteFinale: creerMatch(),
    avecPetiteFinale: demis.every((m) => !m.exempt)
  };

  // Les exemptés passent directement au tour suivant
  premierTour.forEach((m, i) => {
    if (m.exempt) qualifier(0, i);
  });
}

// ---------- Affichage de l'arbre ----------

function ligneMatch(match, cote) {
  const nom = match[cote];
  const div = document.createElement("div");
  div.className = "match-ligne";

  if (nom) {
    div.textContent = nom;
    if (match.gagnant === nom && !match.exempt) div.classList.add("gagnant");
    if (match.perdant === nom) div.classList.add("perdant");
  } else {
    div.textContent = match.exempt ? "Exempt" : "À venir";
    div.classList.add("vide");
  }
  return div;
}

function carteMatch(match, actif) {
  const carte = document.createElement("div");
  carte.className = "match";
  if (actif) carte.classList.add("actif");
  if (match.exempt) carte.classList.add("exempt");
  carte.append(ligneMatch(match, "a"), ligneMatch(match, "b"));
  return carte;
}

function afficherArbre(matchActif = null) {
  arbre.innerHTML = "";

  tournoi.tours.forEach((tour, t) => {
    const colonne = document.createElement("div");
    colonne.className = "arbre-tour";

    const titre = document.createElement("h3");
    titre.textContent = nomTour(tour.length);

    const matchs = document.createElement("div");
    matchs.className = "arbre-matchs";
    tour.forEach((m) => matchs.appendChild(carteMatch(m, m === matchActif)));

    colonne.append(titre, matchs);

    // La petite finale est affichée sous la finale
    if (t === tournoi.tours.length - 1 && tournoi.avecPetiteFinale) {
      const titrePF = document.createElement("h3");
      titrePF.className = "titre-petite-finale";
      titrePF.textContent = "Petite finale";
      const pf = tournoi.petiteFinale;
      colonne.append(titrePF, carteMatch(pf, pf === matchActif));
    }

    arbre.appendChild(colonne);
  });
}

// ---------- Combat d'un match ----------

function ajouterJournal(texte) {
  const li = document.createElement("li");
  li.textContent = texte;
  journal.appendChild(li);
  journal.scrollTop = journal.scrollHeight;
}

function afficherCombattant(c) {
  const slot = document.getElementById(`slot-${c.slot}`);
  slot.innerHTML = `
    <img class="arene-gif" src="${getGif("idle", c.slime.couleur)}" alt="">
    <p class="arene-nom">${echapper(c.slime.nom)}${c.slime.boost ? ' <span class="badge-boost">Boost</span>' : ""}</p>
    <div class="barre-pv"><div class="barre-pv-remplie" style="width: 100%"></div></div>
    <p class="pv-texte">${c.pvMax} / ${c.pvMax} PV</p>
  `;
}

function majCombattant(c, action) {
  const slot = document.getElementById(`slot-${c.slot}`);
  slot.querySelector(".arene-gif").src = getGif(action, c.slime.couleur);

  const pourcentage = Math.max(0, (c.pv / c.pvMax) * 100);
  const barre = slot.querySelector(".barre-pv-remplie");
  barre.style.width = `${pourcentage}%`;
  barre.classList.toggle("faible", pourcentage <= 30);

  slot.querySelector(".pv-texte").textContent = `${Math.max(0, c.pv)} / ${c.pvMax} PV`;
}

// Joue un match et remplit match.gagnant / match.perdant
async function jouerMatch(match, titre) {
  const slimes = getSlimes();

  // Les slimes sont soignés : chaque match repart de leurs PV de base (×2 si boost)
  const [a, b] = [match.a, match.b].map((nom, i) => {
    const slime = slimes.find((s) => s.nom === nom);
    const pvMax = slime.boost ? slime.pv * 2 : slime.pv;
    return { slime, slot: i, pvMax, pv: pvMax };
  });

  titreMatch.textContent = titre;
  journal.innerHTML = "";
  afficherCombattant(a);
  afficherCombattant(b);
  message.textContent = `⚔ ${titre} : ${a.slime.nom} contre ${b.slime.nom}`;

  const memeVitesse = a.slime.vitesse === b.slime.vitesse;
  const plusRapide = a.slime.vitesse >= b.slime.vitesse ? a : b;

  const attaquesEstimees =
    Math.ceil(a.pvMax / b.slime.force) + Math.ceil(b.pvMax / a.slime.force);
  const dureeAttaque = Math.min(700, Math.max(120, DUREE_ANIMATION_MAX / attaquesEstimees));

  let tour = 0;
  let gagnant = null;
  let perdant = null;

  while (!gagnant) {
    tour++;
    const premier = memeVitesse ? (Math.random() < 0.5 ? a : b) : plusRapide;
    const ordre = [premier, premier === a ? b : a];

    for (const attaquant of ordre) {
      const defenseur = attaquant === a ? b : a;
      const { degats, critique } = calculerAttaque(attaquant.slime.force);
      defenseur.pv -= degats;

      majCombattant(attaquant, "attaque");
      majCombattant(defenseur, "clignement");
      if (critique) afficherCritique(defenseur);
      ajouterJournal(
        `Tour ${tour} : ${critique ? "💥 Coup critique ! " : ""}${attaquant.slime.nom} inflige ${degats} dégâts à ${defenseur.slime.nom} (${Math.max(0, defenseur.pv)} PV restants)`
      );

      await attendre(dureeAttaque);

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
  ajouterJournal(`${gagnant.slime.nom} remporte le match !`);
  message.textContent = `🏅 ${gagnant.slime.nom} remporte : ${titre}`;

  match.gagnant = gagnant.slime.nom;
  match.perdant = perdant.slime.nom;
}

// ---------- Déroulement du tournoi ----------

async function lancerTournoi() {
  btnLancer.disabled = true;
  btnAnnuler.hidden = true;
  arene.hidden = false;

  const { tours, petiteFinale, avecPetiteFinale } = tournoi;
  const indexFinale = tours.length - 1;
  const victoires = {}; // matchs gagnés pendant le tournoi

  const jouer = async (match, titre) => {
    afficherArbre(match);
    await jouerMatch(match, titre);
    victoires[match.gagnant] = (victoires[match.gagnant] || 0) + 1;
    afficherArbre();
    await attendre(ATTENTE_ENTRE_MATCHS);
  };

  for (let t = 0; t < tours.length; t++) {
    // La petite finale se joue juste avant la finale
    if (t === indexFinale && avecPetiteFinale) {
      await jouer(petiteFinale, "Petite finale");
    }

    const tour = tours[t];
    for (let i = 0; i < tour.length; i++) {
      const match = tour[i];

      if (!match.exempt) {
        const titre = tour.length > 1 ? `${nomTour(tour.length)} (match ${i + 1})` : nomTour(1);
        await jouer(match, titre);
      }

      qualifier(t, i);

      // Les perdants des demi-finales vont en petite finale
      if (t === indexFinale - 1 && avecPetiteFinale) {
        petiteFinale[i === 0 ? "a" : "b"] = match.perdant;
      }
    }
  }

  // Classement
  const finale = tours[indexFinale][0];
  const premier = finale.gagnant;
  const deuxieme = finale.perdant;
  const troisieme = avecPetiteFinale
    ? petiteFinale.gagnant
    : tours[indexFinale - 1].find((m) => !m.exempt).perdant; // cas à 3 slimes

  // Enregistrement : victoires gagnées et boosts consommés
  const slimes = getSlimes();
  const participants = tours[0].flatMap((m) => [m.a, m.b]).filter(Boolean);
  slimes.forEach((s) => {
    if (!participants.includes(s.nom)) return;
    s.victoires += victoires[s.nom] || 0;
    s.boost = false;
  });
  saveSlimes(slimes);

  arene.hidden = true;
  journal.innerHTML = "";
  afficherPodium([premier, deuxieme, troisieme]);
  message.textContent = `🏆 ${premier} remporte le tournoi !`;
  btnLancer.hidden = true;
  btnNouveau.hidden = false;
}

function afficherPodium([premier, deuxieme, troisieme]) {
  const slimes = getSlimes();
  const places = [
    { nom: deuxieme, rang: 2, medaille: "🥈" },
    { nom: premier, rang: 1, medaille: "🥇" },
    { nom: troisieme, rang: 3, medaille: "🥉" }
  ];

  podium.innerHTML = places
    .map(({ nom, rang, medaille }) => {
      const slime = slimes.find((s) => s.nom === nom);
      const couleur = slime ? slime.couleur : "vert";
      return `
        <div class="podium-place place-${rang}">
          <img class="podium-gif" src="${getGif("idle", couleur)}" alt="">
          <span class="podium-nom">${medaille} ${echapper(nom)}</span>
          <div class="podium-socle">${rang}</div>
        </div>
      `;
    })
    .join("");

  podium.hidden = false;
}

// ---------- Navigation entre les étapes ----------

btnCreer.addEventListener("click", () => {
  if (selection.length < NB_MIN) return;
  creerTournoi(selection);

  etapeSelection.hidden = true;
  etapeTournoi.hidden = false;
  btnLancer.hidden = false;
  btnLancer.disabled = false;
  btnAnnuler.hidden = false;
  btnNouveau.hidden = true;
  podium.hidden = true;
  arene.hidden = true;
  journal.innerHTML = "";
  message.textContent = `${selection.length} participants : l'arbre est prêt !`;
  afficherArbre();
});

btnLancer.addEventListener("click", lancerTournoi);

function retourSelection() {
  tournoi = null;
  etapeTournoi.hidden = true;
  etapeSelection.hidden = false;
  afficherSelection();
}

btnAnnuler.addEventListener("click", retourSelection);
btnNouveau.addEventListener("click", () => {
  selection = [];
  retourSelection();
});

afficherSelection();
