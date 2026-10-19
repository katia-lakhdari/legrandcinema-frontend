import { appelerBackend } from "./api.js";
import { redirigerSiConnecte } from "./auth.js";
import { effacerErreurs, afficherErreurChamp, afficherAlerte, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

redirigerSiConnecte();

const LONGUEUR_MIN_MOT_DE_PASSE = 8;

const jeton = new URLSearchParams(window.location.search).get("jeton");
const formulaire = document.getElementById("formulaire-reinitialisation");
const alerteReussite = document.getElementById("alerte-reussite");

if (jeton === null || jeton === "") {
    afficherAlerte("Ce lien n'est pas valide. Faites une nouvelle demande de réinitialisation.");
    document.getElementById("bouton-formulaire").disabled = true;
}

formulaire.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const nouveauMotDePasse = document.getElementById("nouveauMotDePasse").value;
    const confirmationMotDePasse = document.getElementById("confirmationMotDePasse").value;

    let formulaireValide = true;
    if (nouveauMotDePasse === "") {
        afficherErreurChamp("nouveauMotDePasse", "Le mot de passe est obligatoire");
        formulaireValide = false;
    } else if (nouveauMotDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
        afficherErreurChamp("nouveauMotDePasse", "Le mot de passe doit contenir au moins 8 caractères");
        formulaireValide = false;
    }
    if (confirmationMotDePasse !== nouveauMotDePasse) {
        afficherErreurChamp("confirmationMotDePasse", "Les deux mots de passe doivent être identiques");
        formulaireValide = false;
    }
    if (!formulaireValide) {
        return;
    }

    desactiverBouton("Enregistrement en cours…");

    try {
        await appelerBackend("/api/auth/reinitialiser-mot-de-passe", "POST", { jeton, nouveauMotDePasse });
        formulaire.classList.add("masque");
        alerteReussite.classList.remove("masque");
    } catch (erreur) {
        afficherErreurs(erreur);
        reactiverBouton();
    }
});
