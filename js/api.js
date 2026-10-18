export const URL_BACKEND = "http://localhost:8080";
export const CLE_PUBLIQUE_STRIPE = "pk_test_51UCJe0BPS7qXX3GRJoxh66t9qSxHfMgh9MUdEOGg4fcZ9Nygbz72z8FFIUNUTGmXhaRTg2kbzaIqaBWwCQU025vb00jMLCszgJ";
export const CLE_SESSION = "session";
export const PAGE_CONNEXION = "/connexion.html";

export class ErreurBackend extends Error {
    constructor(message, statut, erreurs = {}) {
        super(message);
        this.name = "ErreurBackend";
        this.statut = statut;
        this.erreurs = erreurs;
    }
}

export async function appelerBackend(chemin, methode = "GET", donnees = null) {
    const session = JSON.parse(sessionStorage.getItem(CLE_SESSION));
    const tokenEtJson = {};

    if (donnees !== null) {
        tokenEtJson["Content-Type"] = "application/json";
    }

    if (session !== null) {
        tokenEtJson["Authorization"] = `Bearer ${session.token}`;
    }

    let reponse;
    try {
        reponse = await fetch(URL_BACKEND + chemin, {
            method: methode,
            headers: tokenEtJson,
            body: donnees !== null ? JSON.stringify(donnees) : null
        });
    } catch {
        throw new ErreurBackend("Le serveur ne répond pas. Réessayez dans un instant.", 0);
    }

    if (reponse.status === 401 && session !== null && !chemin.startsWith("/api/auth/")) {
        sessionStorage.removeItem(CLE_SESSION);
        allerVersConnexion();
        throw new ErreurBackend("Votre session a expiré. Veuillez vous reconnecter.", 401);
    }

    const texte = await reponse.text();
    const contenu = texte ? JSON.parse(texte) : null;

    if (!reponse.ok) {
        throw new ErreurBackend(
            contenu?.message ?? "Une erreur est survenue.",
            reponse.status,
            contenu?.erreurs ?? {}
        );
    }

    return contenu;
}

export async function chargerImage(chemin) {
    const session = JSON.parse(sessionStorage.getItem(CLE_SESSION));
    const token = {};

    if (session !== null) {
        token["Authorization"] = `Bearer ${session.token}`;
    }

    let reponse;
    try {
        reponse = await fetch(URL_BACKEND + chemin, { headers: token });
    } catch {
        throw new ErreurBackend("Le serveur ne répond pas. Réessayez dans un instant.", 0);
    }

    if (reponse.status === 401 && session !== null) {
        sessionStorage.removeItem(CLE_SESSION);
        allerVersConnexion();
        throw new ErreurBackend("Votre session a expiré. Veuillez vous reconnecter.", 401);
    }

    if (!reponse.ok) {
        throw new ErreurBackend("L'image n'a pas pu être chargée.", reponse.status);
    }

    const image = await reponse.blob();
    return URL.createObjectURL(image);
}

export function allerVersConnexion() {
    const pageDeDepart = window.location.pathname + window.location.search;
    window.location.href = PAGE_CONNEXION + "?redirection=" + encodeURIComponent(pageDeDepart);
}