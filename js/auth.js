import { CLE_SESSION, allerVersConnexion } from "./api.js";

export const ROLE_ADMIN = "ADMIN";
export const PAGE_ACCUEIL = "/index.html";

export function enregistrerSession(session) {
    sessionStorage.setItem(CLE_SESSION, JSON.stringify(session));
}

export function lireSession() {
    const texte = sessionStorage.getItem(CLE_SESSION);
    if (texte === null) {
        return null;
    }
    return JSON.parse(texte);
}

export function deconnecter() {
    sessionStorage.removeItem(CLE_SESSION);
    window.location.href = PAGE_ACCUEIL;
}

export function exigerConnexion() {
    const session = lireSession();
    if (session === null) {
        allerVersConnexion();
        return null;
    }
    return session;
}

export function exigerAdmin() {
    const session = exigerConnexion();
    if (session === null) {
        return null;
    }
    if (session.role !== ROLE_ADMIN) {
        window.location.href = PAGE_ACCUEIL;
        return null;
    }
    return session;
}

export function redirigerSiConnecte() {
    if (lireSession() !== null) {
        window.location.href = PAGE_ACCUEIL;
    }
    window.addEventListener("pageshow", function (evenement) {
        if (evenement.persisted && lireSession() !== null) {
            window.location.href = PAGE_ACCUEIL;
        }
    });
}

export function verifierRedirection() {
    const redirection = new URLSearchParams(window.location.search).get("redirection");
    if (redirection === null) {
        return null;
    }
    if (!redirection.startsWith("/") || redirection.startsWith("//") || redirection.startsWith("/\\")) {
        return null;
    }
    return redirection;
}