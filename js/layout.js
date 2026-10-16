import { lireSession, deconnecter, ROLE_ADMIN, PAGE_ACCUEIL } from "./auth.js";

const CLE_PALETTE = "palette";
const THEME_CANARD = "canard";

const liensVisiteur = [
    { texte: "Films à l'affiche", adresse: "/index.html" },
    { texte: "Le cinéma", adresse: "/le-cinema.html" },
    { texte: "Contact", adresse: "/contact.html" },
    { texte: "Connexion", adresse: "/login.html" },
    { texte: "Inscription", adresse: "/register.html" }
];

const liensClient = [
    { texte: "Films à l'affiche", adresse: "/index.html" },
    { texte: "Le cinéma", adresse: "/le-cinema.html" },
    { texte: "Contact", adresse: "/contact.html" },
    { texte: "Mes billets", adresse: "/mes-billets.html" }
];

const liensAdmin = [
    { texte: "Films à l'affiche", adresse: "/index.html" },
    { texte: "Administration", adresse: "/admin/dashboard.html" }
];

const liensEspaceAdmin = [
    { texte: "Tableau de bord", adresse: "/admin/dashboard.html" },
    { texte: "Films", adresse: "/admin/films.html" },
    { texte: "Séances", adresse: "/admin/seances.html" },
    { texte: "Salles", adresse: "/admin/salles.html" },
    { texte: "Scan", adresse: "/admin/scan.html" }
];

const estPageAdmin = window.location.pathname.startsWith("/admin/");

function choisirLiensMenu(session) {
    if (session === null) {
        return liensVisiteur;
    }
    if (session.role !== ROLE_ADMIN) {
        return liensClient;
    }
    if (estPageAdmin) {
        return liensEspaceAdmin;
    }
    return liensAdmin;
}

function afficherHeader(session) {
    const header = document.getElementById("header-site");
    const liens = choisirLiensMenu(session);

    const logo = document.createElement("a");
    logo.className = "logo";
    logo.href = PAGE_ACCUEIL;
    logo.textContent = "Le Grand Cinéma";
    header.appendChild(logo);

    if (estPageAdmin) {
        const badge = document.createElement("span");
        badge.className = "badge-admin";
        badge.textContent = "Espace admin";
        header.appendChild(badge);
    }

    const boutonMenu = document.createElement("button");
    boutonMenu.id = "bouton-menu";
    boutonMenu.type = "button";
    boutonMenu.textContent = "☰";
    boutonMenu.setAttribute("aria-label", "Menu");
    boutonMenu.setAttribute("aria-expanded", "false");
    boutonMenu.addEventListener("click", ouvrirFermerMenu);
    header.appendChild(boutonMenu);

    const menu = document.createElement("nav");
    menu.className = "menu-principal";
    menu.setAttribute("aria-label", "Menu principal");

    for (const lien of liens) {
        const elementLien = document.createElement("a");
        elementLien.href = lien.adresse;
        elementLien.textContent = lien.texte;
        menu.appendChild(elementLien);
    }

    if (session !== null) {
        const boutonDeconnexion = document.createElement("button");
        boutonDeconnexion.id = "bouton-deconnexion";
        boutonDeconnexion.type = "button";
        boutonDeconnexion.className = "btn btn-secondaire";
        boutonDeconnexion.textContent = "Déconnexion";
        boutonDeconnexion.addEventListener("click", deconnecter);
        menu.appendChild(boutonDeconnexion);
    }

    const boutonPalette = document.createElement("button");
    boutonPalette.id = "bouton-palette";
    boutonPalette.type = "button";
    boutonPalette.className = "btn btn-secondaire";
    boutonPalette.addEventListener("click", changerPalette);
    menu.appendChild(boutonPalette);

    header.appendChild(menu);
}

function afficherFooter() {
    const footer = document.getElementById("footer-site");
    footer.innerHTML = `
        <p>Le Grand Cinéma</p>
        <address>13 rue du Plaisir<br>54000 Nancy<br>03 83 00 00 00</address>
        <nav aria-label="Informations">
            <a href="/le-cinema.html">Le cinéma</a>
            <a href="/contact.html">Contact</a>
        </nav>
        <p>© 2026 Le Grand Cinéma — projet de formation STUDI</p>
    `;
}

function appliquerPalette(palette) {
    const boutonPalette = document.getElementById("bouton-palette");
    if (palette === THEME_CANARD) {
        document.documentElement.setAttribute("data-theme", THEME_CANARD);
        boutonPalette.textContent = "Canard";
    } else {
        document.documentElement.removeAttribute("data-theme");
        boutonPalette.textContent = "Soleil";
    }
    boutonPalette.setAttribute("aria-label", "Couleurs du site : " + boutonPalette.textContent);
}

function changerPalette() {
    if (localStorage.getItem(CLE_PALETTE) === THEME_CANARD) {
        localStorage.removeItem(CLE_PALETTE);
    } else {
        localStorage.setItem(CLE_PALETTE, THEME_CANARD);
    }
    appliquerPalette(localStorage.getItem(CLE_PALETTE));
}

function ouvrirFermerMenu() {
    const menu = document.querySelector(".menu-principal");
    const boutonMenu = document.getElementById("bouton-menu");
    menu.classList.toggle("menu-ouvert");
    boutonMenu.setAttribute("aria-expanded", menu.classList.contains("menu-ouvert"));
}

const session = lireSession();
afficherHeader(session);
afficherFooter();
appliquerPalette(localStorage.getItem(CLE_PALETTE));