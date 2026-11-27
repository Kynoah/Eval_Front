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

    lien.append(nom, statut);
    li.appendChild(lien);
    liste.appendChild(li);
  });
}

afficherListe();
