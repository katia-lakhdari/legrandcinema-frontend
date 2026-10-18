import { appelerBackend, chargerImage } from "./api.js";
import { exigerConnexion } from "./auth.js";
import { formaterDate, formaterHeure } from "./format.js";

const chargement = document.getElementById("chargement");
const onglets = document.getElementById("onglets");
const boutonAVenir = document.getElementById("bouton-a-venir");
const boutonPasses = document.getElementById("bouton-passes");
const sectionAVenir = document.getElementById("section-a-venir");
const sectionPasses = document.getElementById("section-passes");
const billetsAVenir = document.getElementById("billets-a-venir");
const billetsPasses = document.getElementById("billets-passes");
const etatVideAVenir = document.getElementById("etat-vide-a-venir");
const etatVidePasses = document.getElementById("etat-vide-passes");
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
        carte.querySelector(".badge").classList.remove("masque");
        qrcode.alt = "QR code de votre billet, déjà utilisé";
    } else {
        qrcode.alt = "QR code de votre billet, à présenter à l'entrée de la salle";
    }

    afficherQrCode(billet, carte);
    return carte;
}

function remplirOnglet(billets, liste, etatVide) {
    if (billets.length === 0) {
        etatVide.classList.remove("masque");
        return;
    }
    billets.forEach(function (billet) {
        liste.appendChild(fabriquerCarteBillet(billet));
    });
}

function choisirOnglet(boutonActif, boutonInactif, sectionVisible, sectionCachee) {
    boutonActif.classList.remove("btn-secondaire");
    boutonActif.setAttribute("aria-pressed", "true");
    boutonInactif.classList.add("btn-secondaire");
    boutonInactif.setAttribute("aria-pressed", "false");
    sectionVisible.classList.remove("masque");
    sectionCachee.classList.add("masque");
}

async function chargerPage() {
    if (exigerConnexion() === null) {
        return;
    }

    try {
        const billets = await appelerBackend("/api/billets/mes-billets");

        const billetsFuturs = billets.filter(seanceAVenir);
        const billetsAnciens = billets.filter(function (billet) {
            return !seanceAVenir(billet);
        });

        billetsFuturs.sort(function (a, b) {
            return new Date(a.dateHeureSeance) - new Date(b.dateHeureSeance);
        });
        billetsAnciens.sort(function (a, b) {
            return new Date(b.dateHeureSeance) - new Date(a.dateHeureSeance);
        });

        remplirOnglet(billetsFuturs, billetsAVenir, etatVideAVenir);
        remplirOnglet(billetsAnciens, billetsPasses, etatVidePasses);

        chargement.classList.add("masque");
        onglets.classList.remove("masque");
        sectionAVenir.classList.remove("masque");
    } catch (erreur) {
        afficherErreur(erreur.message);
    }
}

boutonAVenir.addEventListener("click", function () {
    choisirOnglet(boutonAVenir, boutonPasses, sectionAVenir, sectionPasses);
});

boutonPasses.addEventListener("click", function () {
    choisirOnglet(boutonPasses, boutonAVenir, sectionPasses, sectionAVenir);
});

boutonRecharger.addEventListener("click", function () {
    window.location.reload();
});

chargerPage();