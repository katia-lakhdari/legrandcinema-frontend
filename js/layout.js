import { lireSession, deconnecter, ROLE_ADMIN, PAGE_ACCUEIL } from "./auth.js";

const CLE_PALETTE = "palette";
const THEME_CANARD = "canard";

const liensVisiteur = [
    { texte: "Films à l'affiche", adresse: "/index.html" },
    { texte: "Le cinéma", adresse: "/le-cinema.html" },
    { texte: "Contact", adresse: "/contact.html" },
    { texte: "Connexion", adresse: "/connexion.html" },
    { texte: "Inscription", adresse: "/inscription.html" }
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

function creerArche(id) {
    return `
        <svg class="arche" viewBox="0 0 176 56" aria-hidden="true">
            <path class="arc arc-or" pathLength="1" d="M4,52 A84,46 0 0 1 172,52"></path>
            <path class="arc arc-principal" pathLength="1" d="M12,52 A76,40 0 0 1 164,52"></path>
            <path class="arc arc-secondaire" pathLength="1" d="M20,52 A68,34 0 0 1 156,52"></path>
            <path id="${id}" d="M32,54 A56,13 0 0 1 144,54" fill="none"></path>
            <text class="texte-arche">
                <textPath href="#${id}" startOffset="50%" text-anchor="middle" textLength="108" lengthAdjust="spacingAndGlyphs">LE GRAND CINÉMA</textPath>
            </text>
        </svg>
    `;
}

function creerVague() {
    return `
        <svg class="vague" viewBox="0 0 1200 72" preserveAspectRatio="none" aria-hidden="true">
            <path class="fond-vague" d="M0,48 C150,22 300,70 450,48 S750,22 900,48 S1050,70 1200,48 L1200,72 L0,72 Z"></path>
            <path class="bande-vague" stroke="var(--couleur-secondaire)" d="M0,40 C150,14 300,62 450,40 S750,14 900,40 S1050,62 1200,40"></path>
            <path class="bande-vague" stroke="var(--couleur-principale)" d="M0,32 C150,6 300,54 450,32 S750,6 900,32 S1050,54 1200,32"></path>
            <path class="bande-vague" stroke="var(--couleur-or)" d="M0,24 C150,-2 300,46 450,24 S750,-2 900,24 S1050,46 1200,24"></path>
        </svg>
    `;
}

function afficherHeader(session) {
    const header = document.getElementById("header-site");
    const liens = choisirLiensMenu(session);

    const logo = document.createElement("a");
    logo.className = "logo";
    logo.href = PAGE_ACCUEIL;
    logo.setAttribute("aria-label", "Le Grand Cinéma, retour à l'accueil");
    logo.innerHTML = creerArche("chemin-arche-header");
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

    let ordre = 0;
    for (const lien of liens) {
        const elementLien = document.createElement("a");
        elementLien.href = lien.adresse;
        elementLien.textContent = lien.texte;
        elementLien.style.setProperty("--ordre", ordre);
        if (lien.adresse === window.location.pathname) {
            elementLien.setAttribute("aria-current", "page");
        }
        elementLien.addEventListener("click", fermerMenu);
        menu.appendChild(elementLien);
        ordre++;
    }

    const actionsMenu = document.createElement("div");
    actionsMenu.className = "actions-menu";
    actionsMenu.style.setProperty("--ordre", ordre);

    if (session !== null) {
        const boutonDeconnexion = document.createElement("button");
        boutonDeconnexion.id = "bouton-deconnexion";
        boutonDeconnexion.type = "button";
        boutonDeconnexion.className = "btn btn-secondaire";
        boutonDeconnexion.textContent = "Déconnexion";
        boutonDeconnexion.addEventListener("click", deconnecter);
        actionsMenu.appendChild(boutonDeconnexion);
    }

    const boutonPalette = document.createElement("button");
    boutonPalette.id = "bouton-palette";
    boutonPalette.type = "button";
    boutonPalette.className = "btn btn-secondaire";
    boutonPalette.addEventListener("click", changerPalette);
    actionsMenu.appendChild(boutonPalette);

    menu.appendChild(actionsMenu);
    header.appendChild(menu);
}

function afficherFooter() {
    const footer = document.getElementById("footer-site");
    footer.innerHTML = `
        ${creerVague()}
        <div class="contenu-footer">
            <div class="logo-footer" role="img" aria-label="Le Grand Cinéma">${creerArche("chemin-arche-footer")}</div>
            <address>13 rue du Plaisir<br>54000 Nancy<br>03 83 00 00 00</address>
            <nav aria-label="Informations">
                <a href="/le-cinema.html">Le cinéma</a>
                <a href="/contact.html">Contact</a>
            </nav>
            <p class="mention">© 2026 Le Grand Cinéma — projet de formation STUDI</p>
        </div>
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
    const estOuvert = menu.classList.contains("menu-ouvert");
    boutonMenu.setAttribute("aria-expanded", estOuvert);
    boutonMenu.textContent = estOuvert ? "✕" : "☰";
}

function fermerMenu() {
    const menu = document.querySelector(".menu-principal");
    if (menu.classList.contains("menu-ouvert")) {
        ouvrirFermerMenu();
    }
}

function allumerArcs() {
    const logo = document.querySelector(".logo");
    logo.classList.add("allume");
}

document.addEventListener("keydown", function (evenement) {
    if (evenement.key === "Escape") {
        fermerMenu();
    }
});

const session = lireSession();
afficherHeader(session);
afficherFooter();
appliquerPalette(localStorage.getItem(CLE_PALETTE));
allumerArcs();