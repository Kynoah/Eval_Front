// Écran 'Liste Slime' : affiche uniquement "nom" et "enRepos"
function afficherListe() {
  const slimes = getSlimes();
  const liste = document.getElementById("liste-slime");
  liste.innerHTML = "";

  document.getElementById("compteur").textContent = slimes.length;

  slimes.forEach((slime) => {
    const li = document.createElement("li");

    const lien = document.createElement("a");
    // Le nom est unique, on s'en sert comme identifiant dans l'URL
    lien.href = `detail.html?nom=${encodeURIComponent(slime.nom)}`;
    lien.className = "slime-card";
    if (slime.boost) lien.classList.add("boost");

    // Animation idle du slime
    const img = document.createElement("img");
    img.className = "slime-gif";
    img.src = getGif("idle", slime.couleur);
    img.alt = `Slime ${slime.couleur}`;

    // Nom (+ badge si boosté)
    const nom = document.createElement("span");
    nom.className = "slime-nom";
    nom.textContent = slime.nom;

    if (slime.boost) {
      const badge = document.createElement("span");
      badge.className = "badge-boost";
      badge.textContent = "Boost";
      nom.appendChild(badge);
    }

    // Statut enRepos
    const statut = document.createElement("span");
    statut.className = "statut";
    if (slime.enRepos) {
      statut.classList.add("repos");
      statut.textContent = "Au repos";
    } else {
      statut.textContent = "Disponible";
    }

    const infos = document.createElement("div");
    infos.className = "slime-infos";
    infos.append(img, nom);

    lien.append(infos, statut);
    li.appendChild(lien);
    liste.appendChild(li);
  });
}

afficherListe();
