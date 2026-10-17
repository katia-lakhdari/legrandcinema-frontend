const ID_ALERTE = "alerte-formulaire";
const ID_BOUTON = "bouton-formulaire";
const CLASSE_CHAMP_EN_ERREUR = "champ-en-erreur";
const CLASSE_MASQUE = "masque";

export function effacerErreurs() {
    document.querySelectorAll("." + CLASSE_CHAMP_EN_ERREUR).forEach(function (champ) {
        champ.classList.remove(CLASSE_CHAMP_EN_ERREUR);
    });
    document.querySelectorAll("[aria-invalid]").forEach(function (saisie) {
        saisie.removeAttribute("aria-invalid");
    });
    document.querySelectorAll(".message-champ").forEach(function (message) {
        message.textContent = "";
    });
    const alerte = document.getElementById(ID_ALERTE);
    alerte.textContent = "";
    alerte.classList.add(CLASSE_MASQUE);
}

export function afficherErreurChamp(nomChamp, message) {
    const saisie = document.getElementById(nomChamp);
    const zoneMessage = document.getElementById("message-" + nomChamp);
    if (saisie === null || zoneMessage === null) {
        return false;
    }
    saisie.closest(".champ").classList.add(CLASSE_CHAMP_EN_ERREUR);
    saisie.setAttribute("aria-invalid", "true");
    zoneMessage.textContent = message;
    return true;
}

export function afficherAlerte(message) {
    const alerte = document.getElementById(ID_ALERTE);
    alerte.textContent = message;
    alerte.classList.remove(CLASSE_MASQUE);
}

export function afficherErreurs(erreur) {
    const erreursChamps = erreur.erreurs ?? {};
    let erreurSousUnChamp = false;
    for (const [nomChamp, message] of Object.entries(erreursChamps)) {
        if (afficherErreurChamp(nomChamp, message)) {
            erreurSousUnChamp = true;
        }
    }
    if (!erreurSousUnChamp) {
        afficherAlerte(erreur.message);
    }
}

export function desactiverBouton(texteAttente) {
    const bouton = document.getElementById(ID_BOUTON);
    bouton.dataset.texteInitial = bouton.textContent;
    bouton.textContent = texteAttente;
    bouton.disabled = true;
}

export function reactiverBouton() {
    const bouton = document.getElementById(ID_BOUTON);
    bouton.textContent = bouton.dataset.texteInitial;
    bouton.disabled = false;
}
