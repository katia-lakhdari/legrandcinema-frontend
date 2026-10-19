import { appelerBackend } from "./api.js";
import { redirigerSiConnecte } from "./auth.js";
import { effacerErreurs, afficherErreurChamp, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

redirigerSiConnecte();

const formulaire = document.getElementById("formulaire-mot-de-passe-oublie");
const alerteReussite = document.getElementById("alerte-reussite");

formulaire.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();
    alerteReussite.classList.add("masque");

    const email = document.getElementById("email").value.trim();

    if (email === "") {
        afficherErreurChamp("email", "L'email est obligatoire");
        return;
    }

    desactiverBouton("Envoi en cours…");

    try {
        const reponse = await appelerBackend("/api/auth/mot-de-passe-oublie", "POST", { email });
        alerteReussite.textContent = reponse.message;
        alerteReussite.classList.remove("masque");
        formulaire.reset();
    } catch (erreur) {
        afficherErreurs(erreur);
    }

    reactiverBouton();
});
