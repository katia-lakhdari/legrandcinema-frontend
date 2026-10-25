import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { formaterHeure } from "./format.js";
import { effacerErreurs, afficherAlerte, afficherErreurChamp, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";
import { formaterHoraireSeance } from "./admin.js";

const MESSAGE_CODE_OBLIGATOIRE = "Le QR code est obligatoire";
const MESSAGE_CAMERA_INDISPONIBLE = "La caméra n'est pas accessible. Autorisez-la dans le navigateur, ou saisissez le code du billet.";
const TEXTE_VERIFICATION = "Vérification…";
const TEXTE_VALIDE = "Accès autorisé";
const TEXTE_REFUSE = "Accès refusé";
const REGLAGES_CAMERA = { fps: 10 };
const DELAI_REDEMARRAGE = 3000;
const TAILLE_HISTORIQUE = 10;

const boutonCamera = document.getElementById("bouton-camera");
const boutonArreterCamera = document.getElementById("bouton-arreter-camera");
const inviteCamera = document.getElementById("invite-camera");
const lecteurCamera = document.getElementById("lecteur-camera");
const formulaireScan = document.getElementById("formulaire-scan");
const champQrCode = document.getElementById("qrCode");
const resultatAttente = document.getElementById("resultat-attente");
const resultatValide = document.getElementById("resultat-valide");
const resultatRefuse = document.getElementById("resultat-refuse");
const scanFilm = document.getElementById("scan-film");
const scanSeance = document.getElementById("scan-seance");
const scanClient = document.getElementById("scan-client");
const scanRaisonRefus = document.getElementById("scan-raison-refus");
const historiqueVide = document.getElementById("historique-vide");
const listeHistorique = document.getElementById("liste-historique");
const templateEntree = document.getElementById("template-entree-historique");

let camera = null;
let cameraActive = false;
let verificationEnCours = false;
let minuteurRedemarrage = null;

function cacherResultats() {
    resultatValide.classList.add("masque");
    resultatRefuse.classList.add("masque");
    resultatAttente.classList.remove("masque");
}

function ajouterAuHistorique(valide, detail) {
    const copie = templateEntree.content.cloneNode(true);
    const entree = copie.querySelector("li");

    entree.classList.add(valide ? "historique-valide" : "historique-refuse");
    entree.querySelector(".heure-scan").textContent = formaterHeure(new Date());
    entree.querySelector(".statut-scan").textContent = valide ? "✓" : "✕";
    entree.querySelector(".detail-scan").textContent = detail;
    entree.setAttribute("aria-label", (valide ? TEXTE_VALIDE : TEXTE_REFUSE) + " : " + detail);

    listeHistorique.prepend(entree);
    while (listeHistorique.children.length > TAILLE_HISTORIQUE) {
        listeHistorique.lastElementChild.remove();
    }
    historiqueVide.classList.add("masque");
}

function afficherBilletValide(reponse) {
    scanFilm.textContent = reponse.filmTitre;
    scanSeance.textContent = formaterHoraireSeance(reponse.dateHeureSeance);
    scanClient.textContent = reponse.clientNom;
    resultatAttente.classList.add("masque");
    resultatValide.classList.remove("masque");
    ajouterAuHistorique(true, reponse.clientNom + " · " + reponse.filmTitre);
}

function afficherBilletRefuse(message) {
    scanRaisonRefus.textContent = message;
    resultatAttente.classList.add("masque");
    resultatRefuse.classList.remove("masque");
    ajouterAuHistorique(false, message);
}

async function verifierBillet(qrCode) {
    effacerErreurs();
    cacherResultats();
    verificationEnCours = true;
    desactiverBouton(TEXTE_VERIFICATION);

    try {
        const reponse = await appelerBackend("/api/billets/scan", "POST", { qrCode });
        afficherBilletValide(reponse);
    } catch (erreur) {
        if (erreur.statut === 404 || erreur.statut === 409) {
            afficherBilletRefuse(erreur.message);
        } else {
            afficherErreurs(erreur);
        }
    }

    reactiverBouton();
    verificationEnCours = false;
}

async function arreterCamera() {
    if (!cameraActive) {
        return;
    }
    cameraActive = false;
    await camera.stop();
    afficherInvite();
}

function annulerRedemarrage() {
    clearTimeout(minuteurRedemarrage);
    minuteurRedemarrage = null;
}

async function quandCodeLu(qrCode) {
    if (verificationEnCours) {
        return;
    }
    await arreterCamera();
    await verifierBillet(qrCode);
    minuteurRedemarrage = setTimeout(function () {
        demarrerCamera(true);
    }, DELAI_REDEMARRAGE);
}

function afficherInvite() {
    lecteurCamera.classList.add("masque");
    boutonArreterCamera.classList.add("masque");
    inviteCamera.classList.remove("masque");
}

async function demarrerCamera(garderResultat) {
    annulerRedemarrage();
    effacerErreurs();
    if (!garderResultat) {
        cacherResultats();
    }
    inviteCamera.classList.add("masque");
    lecteurCamera.classList.remove("masque");

    try {
        if (camera === null) {
            camera = new window.Html5Qrcode(lecteurCamera.id);
        }
        await camera.start({ facingMode: "environment" }, REGLAGES_CAMERA, quandCodeLu);
        cameraActive = true;
        boutonArreterCamera.classList.remove("masque");
    } catch {
        afficherInvite();
        afficherAlerte(MESSAGE_CAMERA_INDISPONIBLE);
    }
}

boutonCamera.addEventListener("click", function () {
    demarrerCamera(false);
});

boutonArreterCamera.addEventListener("click", function () {
    annulerRedemarrage();
    arreterCamera();
});

formulaireScan.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    annulerRedemarrage();
    effacerErreurs();

    const qrCode = champQrCode.value.trim();
    if (qrCode === "") {
        cacherResultats();
        afficherErreurChamp("qrCode", MESSAGE_CODE_OBLIGATOIRE);
        champQrCode.focus();
        return;
    }

    await verifierBillet(qrCode);
    champQrCode.value = "";
});

window.addEventListener("pagehide", function () {
    annulerRedemarrage();
    arreterCamera();
});

exigerAdmin();
