import { appelerBackend } from "./api.js";
import { formaterDate, formaterHeure } from "./format.js";

const CLASSE_MASQUE = "masque";
const TEXTE_SUPPRESSION = "Suppression…";

export function formaterHoraireSeance(dateHeure) {
    return formaterDate(dateHeure) + " à " + formaterHeure(dateHeure);
}

export function afficherContenu(section) {
    document.getElementById("chargement").classList.add(CLASSE_MASQUE);
    section.classList.remove(CLASSE_MASQUE);
}

export function afficherErreurChargement(section, message) {
    document.getElementById("message-erreur").textContent = message;
    document.getElementById("chargement").classList.add(CLASSE_MASQUE);
    section.classList.add(CLASSE_MASQUE);
    document.getElementById("zone-erreur").classList.remove(CLASSE_MASQUE);
}

export function afficherSucces(message) {
    const messageSucces = document.getElementById("message-succes");
    messageSucces.textContent = message;
    messageSucces.classList.remove(CLASSE_MASQUE);
}

export function cacherSucces() {
    const messageSucces = document.getElementById("message-succes");
    messageSucces.textContent = "";
    messageSucces.classList.add(CLASSE_MASQUE);
}

export function afficherListe(elements, conteneur, corps, etatVide, fabriquer) {
    corps.replaceChildren();

    if (elements.length === 0) {
        conteneur.classList.add(CLASSE_MASQUE);
        etatVide.classList.remove(CLASSE_MASQUE);
        return;
    }

    etatVide.classList.add(CLASSE_MASQUE);
    conteneur.classList.remove(CLASSE_MASQUE);
    elements.forEach(function (element) {
        corps.appendChild(fabriquer(element));
    });
}

export function nommerBoutons(ligne, description) {
    ligne.querySelectorAll("button").forEach(function (bouton) {
        bouton.setAttribute("aria-label", bouton.textContent.trim() + " " + description);
    });
}

export function brancherFermeture(fenetre, boutonAnnuler) {
    boutonAnnuler.addEventListener("click", function () {
        fenetre.close();
    });
}

export function preparerSuppression(alerte, bouton) {
    alerte.textContent = "";
    alerte.classList.add(CLASSE_MASQUE);
    bouton.disabled = false;
}

export async function supprimer(chemin, fenetre, alerte, bouton) {
    const texteInitial = bouton.textContent;
    bouton.textContent = TEXTE_SUPPRESSION;
    bouton.disabled = true;

    try {
        await appelerBackend(chemin, "DELETE");
        bouton.textContent = texteInitial;
        fenetre.close();
        return true;
    } catch (erreur) {
        bouton.textContent = texteInitial;
        bouton.disabled = erreur.statut === 409;
        alerte.textContent = erreur.message;
        alerte.classList.remove(CLASSE_MASQUE);
        return false;
    }
}

const boutonRecharger = document.getElementById("bouton-recharger");
if (boutonRecharger !== null) {
    boutonRecharger.addEventListener("click", function () {
        window.location.reload();
    });
}
