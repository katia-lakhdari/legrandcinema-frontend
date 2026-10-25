import { appelerBackend } from "./api.js";
import { enregistrerSession, redirigerSiConnecte, verifierRedirection, ROLE_ADMIN, PAGE_ACCUEIL } from "./auth.js";
import { effacerErreurs, afficherErreurChamp, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

redirigerSiConnecte();

const PAGE_ADMIN = "/admin/dashboard.html";

const redirection = verifierRedirection();
const formulaire = document.getElementById("formulaire-connexion");
const lienInscription = document.getElementById("lien-inscription");

if (redirection !== null) {
    lienInscription.href += "?redirection=" + encodeURIComponent(redirection);
}

formulaire.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const email = document.getElementById("email").value.trim();
    const motDePasse = document.getElementById("motDePasse").value;

    let formulaireValide = true;
    if (email === "") {
        afficherErreurChamp("email", "L'email est obligatoire");
        formulaireValide = false;
    }
    if (motDePasse === "") {
        afficherErreurChamp("motDePasse", "Le mot de passe est obligatoire");
        formulaireValide = false;
    }
    if (!formulaireValide) {
        return;
    }

    desactiverBouton("Connexion en cours…");

    try {
        const session = await appelerBackend("/api/auth/login", "POST", { email, motDePasse });
        enregistrerSession(session);
        if (redirection !== null) {
            window.location.href = redirection;
        } else if (session.role === ROLE_ADMIN) {
            window.location.href = PAGE_ADMIN;
        } else {
            window.location.href = PAGE_ACCUEIL;
        }
    } catch (erreur) {
        afficherErreurs(erreur);
        reactiverBouton();
    }
});