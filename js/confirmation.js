import { appelerBackend, chargerImage } from "./api.js";
import { exigerConnexion } from "./auth.js";
import { formaterDate, formaterHeure } from "./format.js";

const chargement = document.getElementById("chargement");
const zoneConfirmation = document.getElementById("zone-confirmation");
const zoneIntrouvable = document.getElementById("zone-introuvable");
const zoneErreur = document.getElementById("zone-erreur");
const messageErreur = document.getElementById("message-erreur");
const boutonRecharger = document.getElementById("bouton-recharger");
const titreFilm = document.getElementById("titre-film");
const qrcode = document.getElementById("qrcode");
const erreurQrcode = document.getElementById("erreur-qrcode");
const dateSeance = document.getElementById("date-seance");
const heureSeance = document.getElementById("heure-seance");
const nomSalle = document.getElementById("nom-salle");
const numerosPlaces = document.getElementById("numeros-places");

const numeroReservation = new URLSearchParams(window.location.search).get("reservation");

function afficherIntrouvable() {
    chargement.classList.add("masque");
    zoneIntrouvable.classList.remove("masque");
}

function afficherErreur(message) {
    messageErreur.textContent = message;
    chargement.classList.add("masque");
    zoneErreur.classList.remove("masque");
}

function afficherBillet(billet) {
    document.title = "Confirmation · " + billet.titreFilm + " | Le Grand Cinéma";
    titreFilm.textContent = billet.titreFilm;
    dateSeance.textContent = formaterDate(billet.dateHeureSeance);
    heureSeance.textContent = formaterHeure(billet.dateHeureSeance);
    nomSalle.textContent = billet.nomSalle;
    numerosPlaces.textContent = billet.numerosPlaces.join(", ");
    chargement.classList.add("masque");
    zoneConfirmation.classList.remove("masque");
}

async function afficherQrCode(billet) {
    try {
        qrcode.src = await chargerImage("/api/billets/" + billet.id + "/qrcode");
        qrcode.classList.remove("masque");
    } catch {
        erreurQrcode.classList.remove("masque");
    }
}

async function chargerPage() {
    if (exigerConnexion() === null) {
        return;
    }
    if (numeroReservation === null) {
        afficherIntrouvable();
        return;
    }

    try {
        const billets = await appelerBackend("/api/billets/mes-billets");
        const billetTrouve = billets.find(function (billet) {
            return billet.reservationId === Number(numeroReservation);
        });
        if (billetTrouve === undefined) {
            afficherIntrouvable();
            return;
        }
        afficherBillet(billetTrouve);
        afficherQrCode(billetTrouve);
    } catch (erreur) {
        afficherErreur(erreur.message);
    }
}

boutonRecharger.addEventListener("click", function () {
    window.location.reload();
});

chargerPage();