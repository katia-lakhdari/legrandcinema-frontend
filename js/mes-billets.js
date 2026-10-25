import { appelerBackend, chargerImage } from "./api.js";
import { exigerConnexion } from "./auth.js";
import { formaterDate, formaterHeure } from "./format.js";

const chargement = document.getElementById("chargement");
const sectionAVenir = document.getElementById("section-a-venir");
const billetsAVenir = document.getElementById("billets-a-venir");
const etatVideAVenir = document.getElementById("etat-vide-a-venir");
const zoneErreur = document.getElementById("zone-erreur");
const messageErreur = document.getElementById("message-erreur");
const boutonRecharger = document.getElementById("bouton-recharger");
const templateBillet = document.getElementById("template-billet");

const dateDuJour = new Date();

function afficherErreur(message) {
    messageErreur.textContent = message;
    chargement.classList.add("masque");
    zoneErreur.classList.remove("masque");
}

function seanceAVenir(billet) {
    return new Date(billet.dateHeureSeance) > dateDuJour;
}

async function afficherQrCode(billet, carte) {
    const qrcode = carte.querySelector(".qrcode");
    try {
        qrcode.src = await chargerImage("/api/billets/" + billet.id + "/qrcode");
        qrcode.classList.remove("masque");
    } catch {
        carte.querySelector(".erreur-qrcode").classList.remove("masque");
    }
}

function fabriquerCarteBillet(billet) {
    const copie = templateBillet.content.cloneNode(true);
    const carte = copie.querySelector(".billet");
    const qrcode = carte.querySelector(".qrcode");

    carte.querySelector(".titre-film").textContent = billet.titreFilm;
    carte.querySelector(".date-seance").textContent = formaterDate(billet.dateHeureSeance);
    carte.querySelector(".heure-seance").textContent = formaterHeure(billet.dateHeureSeance);
    carte.querySelector(".nom-salle").textContent = billet.nomSalle;
    carte.querySelector(".numeros-places").textContent = billet.numerosPlaces.join(", ");

    if (billet.scanne) {
        carte.classList.add("billet-scanne");
        qrcode.alt = "QR code de votre billet, déjà utilisé";
    } else {
        qrcode.alt = "QR code de votre billet, à présenter à l'entrée de la salle";
    }

    afficherQrCode(billet, carte);
    return carte;
}

function afficherBillets(billets) {
    if (billets.length === 0) {
        etatVideAVenir.classList.remove("masque");
        return;
    }
    billets.forEach(function (billet) {
        billetsAVenir.appendChild(fabriquerCarteBillet(billet));
    });
}

async function chargerPage() {
    if (exigerConnexion() === null) {
        return;
    }

    try {
        const billets = await appelerBackend("/api/billets/mes-billets");

        const billetsFuturs = billets.filter(seanceAVenir);

        billetsFuturs.sort(function (a, b) {
            return new Date(a.dateHeureSeance) - new Date(b.dateHeureSeance);
        });

        afficherBillets(billetsFuturs);

        chargement.classList.add("masque");
        sectionAVenir.classList.remove("masque");
    } catch (erreur) {
        afficherErreur(erreur.message);
    }
}

boutonRecharger.addEventListener("click", function () {
    window.location.reload();
});

chargerPage();