import { appelerBackend, CLE_PUBLIQUE_STRIPE } from "./api.js";
import { exigerConnexion } from "./auth.js";
import { formaterHoraire, formaterPrix } from "./format.js";
import { effacerErreurs, afficherAlerte, afficherErreurChamp, desactiverBouton, reactiverBouton } from "./formulaire.js";

const PAGE_CONFIRMATION = "/confirmation.html";
const PAGE_CHOIX_PLACES = "/selection-places.html";
const MESSAGE_RESERVATION_INVALIDE = "Cette réservation n'existe pas ou n'est plus disponible.";
const MESSAGE_DELAI_DEPASSE = "Le temps est écoulé : vos places ont été libérées.";

const sectionPaiement = document.getElementById("paiement");
const compteARebours = document.getElementById("compte-a-rebours");
const lienChoixPlaces = document.getElementById("lien-choix-places");
const miniatureAffiche = document.getElementById("miniature-affiche");
const titreReservation = document.getElementById("titre-reservation");
const precisionsReservation = document.getElementById("precisions-reservation");
const montantTotal = document.getElementById("montant-total");
const formulaireCarte = document.getElementById("formulaire-carte");
const titulaireCarte = document.getElementById("titulaire-carte");
const erreurPaiement = document.getElementById("erreur-paiement");
const boutonPayer = document.getElementById("bouton-formulaire");

const parametres = new URLSearchParams(window.location.search);
const numeroReservation = parametres.get("reservation");
const numeroSeance = parametres.get("seance");
const stripe = Stripe(CLE_PUBLIQUE_STRIPE);
let intentionPaiement = null;
let champNumero = null;
let finDelai = 0;
let minuterie = null;

async function recupererIntention() {
    intentionPaiement = await appelerBackend("/api/paiements/intention", "POST", {
        reservationId: Number(numeroReservation)
    });
}

function afficherTempsRestant() {
    const secondes = Math.max(Math.round((finDelai - Date.now()) / 1000), 0);
    if (secondes === 0) {
        terminerDelai();
        return;
    }
    const minutes = Math.floor(secondes / 60);
    const reste = String(secondes % 60).padStart(2, "0");
    compteARebours.textContent = "Vos places sont gardées encore " + minutes + ":" + reste;
}

function demarrerCompteARebours() {
    clearInterval(minuterie);
    finDelai = Date.now() + intentionPaiement.secondesRestantes * 1000;
    afficherTempsRestant();
    minuterie = setInterval(afficherTempsRestant, 1000);
}

function terminerDelai() {
    clearInterval(minuterie);
    compteARebours.textContent = MESSAGE_DELAI_DEPASSE;
    formulaireCarte.classList.add("masque");
    if (numeroSeance !== null) {
        lienChoixPlaces.href = PAGE_CHOIX_PLACES + "?seance=" + encodeURIComponent(numeroSeance);
    }
    lienChoixPlaces.classList.remove("masque");
}

function afficherRecapitulatif() {
    const nombre = intentionPaiement.numerosPlaces.length;
    const texteNombre = nombre === 1 ? "1 place" : nombre + " places";
    const montant = formaterPrix(intentionPaiement.montant);

    document.title = "Paiement · " + intentionPaiement.titreFilm + " | Le Grand Cinéma";

    if (intentionPaiement.affiche) {
        miniatureAffiche.src = intentionPaiement.affiche;
        miniatureAffiche.alt = "Affiche du film " + intentionPaiement.titreFilm;
    } else {
        miniatureAffiche.classList.add("masque");
    }

    titreReservation.textContent = intentionPaiement.titreFilm;
    precisionsReservation.textContent = formaterHoraire(intentionPaiement.dateHeureSeance) + " · " + texteNombre + " : " + intentionPaiement.numerosPlaces.join(", ");
    montantTotal.textContent = "Total " + montant;
    boutonPayer.textContent = "Payer " + montant;
}

function creerChampStripe(elements, type, idChamp, options) {
    const champ = elements.create(type, options);
    champ.mount("#" + idChamp);
    champ.on("change", function (evenement) {
        const zoneMessage = document.getElementById("message-" + idChamp);
        zoneMessage.textContent = evenement.error ? evenement.error.message : "";
    });
    return champ;
}

function afficherFormulaireCarte() {
    const couleurs = getComputedStyle(document.documentElement);
    const couleurErreur = couleurs.getPropertyValue("--couleur-message-erreur").trim();

    const styleChamps = {
        base: {
            color: couleurs.getPropertyValue("--couleur-texte").trim(),
            iconColor: couleurs.getPropertyValue("--couleur-or").trim(),
            fontFamily: "\"Work Sans\", Arial, sans-serif",
            fontSize: "16px",
            lineHeight: "26px",
            "::placeholder": {
                color: couleurs.getPropertyValue("--couleur-texte-discret").trim()
            }
        },
        invalid: {
            color: couleurErreur,
            iconColor: couleurErreur
        }
    };

    const elements = stripe.elements({
        locale: "fr",
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500&display=swap" }]
    });

    champNumero = creerChampStripe(elements, "cardNumber", "numero-carte", {
        style: styleChamps,
        showIcon: true,
        disableLink: true
    });
    creerChampStripe(elements, "cardExpiry", "expiration-carte", { style: styleChamps });
    creerChampStripe(elements, "cardCvc", "code-carte", { style: styleChamps });

    champNumero.on("ready", function () {
        boutonPayer.disabled = false;
    });
}

async function confirmerPaiement() {
    return appelerBackend("/api/paiements/confirmation", "POST", {
        reservationId: intentionPaiement.reservationId,
        paymentIntentId: intentionPaiement.paymentIntentId
    });
}

async function payer() {
    effacerErreurs();

    const titulaire = titulaireCarte.value.trim();
    if (titulaire === "") {
        afficherErreurChamp("titulaire-carte", "Indiquez le nom inscrit sur la carte");
        return;
    }

    desactiverBouton("Paiement en cours…");

    const resultat = await stripe.confirmCardPayment(intentionPaiement.clientSecret, {
        payment_method: {
            card: champNumero,
            billing_details: { name: titulaire }
        }
    });

    if (resultat.error && resultat.error.type !== "card_error") {
        erreurPaiement.textContent = resultat.error.message;
        reactiverBouton();
        return;
    }

    try {
        await confirmerPaiement();
        clearInterval(minuterie);
        window.location.href = PAGE_CONFIRMATION + "?reservation=" + intentionPaiement.reservationId;
    } catch (erreur) {
        erreurPaiement.textContent = erreur.message;
        reactiverBouton();
        if (resultat.error) {
            await recupererIntention();
            demarrerCompteARebours();
        }
    }
}

async function chargerPage() {
    if (exigerConnexion() === null) {
        return;
    }
    if (numeroReservation === null) {
        afficherAlerte(MESSAGE_RESERVATION_INVALIDE);
        return;
    }

    try {
        await recupererIntention();
        afficherRecapitulatif();
        sectionPaiement.classList.remove("masque");
        afficherFormulaireCarte();
        demarrerCompteARebours();
    } catch (erreur) {
        if (erreur.statut === 404 || erreur.statut === 400) {
            afficherAlerte(MESSAGE_RESERVATION_INVALIDE);
        } else {
            afficherAlerte(erreur.message);
        }
    }
}

boutonPayer.addEventListener("click", payer);
chargerPage();