import { appelerBackend } from "./api.js";
import { enregistrerSession, ROLE_ADMIN, PAGE_ACCUEIL } from "./auth.js";
import { effacerErreurs, afficherErreurChamp, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

const PAGE_ADMIN = "/admin/dashboard.html";

const formulaire = document.getElementById("formulaire-connexion");

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
        window.location.href = session.role === ROLE_ADMIN ? PAGE_ADMIN : PAGE_ACCUEIL;
    } catch (erreur) {
        afficherErreurs(erreur);
        reactiverBouton();
    }
});
