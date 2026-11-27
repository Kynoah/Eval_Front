// Gestion des thèmes
// Pour ajouter un thème : ajoute une entrée ici + un bloc [data-theme="..."] dans style.css
const THEMES = {
  classique: "Classique",
  sombre: "Sombre"
};

const CLE_THEME = "theme";

function getTheme() {
  const theme = localStorage.getItem(CLE_THEME);
  return THEMES[theme] ? theme : "classique";
}

function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(CLE_THEME, theme);
}

// Appliqué tout de suite (script dans le <head>) pour éviter un flash de l'ancien thème
appliquerTheme(getTheme());

// Une fois la page chargée, on ajoute le sélecteur dans la barre de navigation
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const select = document.createElement("select");
  select.className = "theme-select";
  select.setAttribute("aria-label", "Changer de thème");

  for (const [valeur, libelle] of Object.entries(THEMES)) {
    const option = document.createElement("option");
    option.value = valeur;
    option.textContent = libelle;
    select.appendChild(option);
  }

  select.value = getTheme();
  select.addEventListener("change", () => appliquerTheme(select.value));

  navbar.appendChild(select);
});
