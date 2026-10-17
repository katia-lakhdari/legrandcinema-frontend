import { appelerBackend } from "./api.js";
import { enregistrerSession, redirigerSiConnecte, verifierRedirection, PAGE_ACCUEIL } from "./auth.js";
import { effacerErreurs, afficherErreurChamp, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

redirigerSiConnecte();

const LONGUEUR_MIN_MOT_DE_PASSE = 8;

const redirection = verifierRedirection();
const formulaire = document.getElementById("formulaire-inscription");
const lienConnexion = document.getElementById("lien-connexion");

if (redirection !== null) {
    lienConnexion.href += "?redirection=" + encodeURIComponent(redirection);
}

formulaire.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const prenom = document.getElementById("prenom").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const email = document.getElementById("email").value.trim();
    const motDePasse = document.getElementById("motDePasse").value;
    const confirmationMotDePasse = document.getElementById("confirmationMotDePasse").value;

    let formulaireValide = true;
    if (prenom === "") {
        afficherErreurChamp("prenom", "Le prénom est obligatoire");
        formulaireValide = false;
    }
    if (nom === "") {
        afficherErreurChamp("nom", "Le nom est obligatoire");
        formulaireValide = false;
    }
    if (email === "") {
        afficherErreurChamp("email", "L'email est obligatoire");
        formulaireValide = false;
    }
    if (motDePasse === "") {
        afficherErreurChamp("motDePasse", "Le mot de passe est obligatoire");
        formulaireValide = false;
    } else if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
        afficherErreurChamp("motDePasse", "Le mot de passe doit contenir au moins 8 caractères");
        formulaireValide = false;
    }
    if (confirmationMotDePasse !== motDePasse) {
        afficherErreurChamp("confirmationMotDePasse", "Les deux mots de passe doivent être identiques");
        formulaireValide = false;
    }
    if (!formulaireValide) {
        return;
    }

    desactiverBouton("Inscription en cours…");

    try {
        const session = await appelerBackend("/api/auth/register", "POST", { prenom, nom, email, motDePasse });
        enregistrerSession(session);
        window.location.href = redirection !== null ? redirection : PAGE_ACCUEIL;
    } catch (erreur) {
        if (erreur.statut === 409) {
            afficherErreurChamp("email", erreur.message);
        } else {
            afficherErreurs(erreur);
        }
        reactiverBouton();
    }
});