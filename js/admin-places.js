import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { effacerErreurs, afficherErreurChamp, desactiverBouton, reactiverBouton } from "./formulaire.js";
import { formaterHoraireSeance, afficherContenu, afficherErreurChargement, afficherSucces, cacherSucces, brancherFermeture } from "./admin.js";

const STATUT_LIBRE = "LIBRE";
const STATUT_BLOQUEE = "BLOQUEE";
const MESSAGE_SEANCE_INTROUVABLE = "Cette séance n'existe pas.";
const MESSAGE_AIDE = "Cliquez sur les places libres à bloquer, ou sur une place bloquée pour la débloquer.";
const MESSAGE_RAISON_OBLIGATOIRE = "La raison du blocage est obligatoire";
const TEXTE_BLOCAGE = "Blocage…";
const TEXTE_DEBLOCAGE = "Déblocage…";

const alertePage = document.getElementById("alerte-page");
const sectionPlaces = document.getElementById("section-places");
const titreSeance = document.getElementById("titre-seance");
const precisionsSeance = document.getElementById("precisions-seance");
const planSalle = document.getElementById("plan-salle");
const recapitulatif = document.getElementById("recapitulatif");
const boutonBloquer = document.getElementById("bouton-bloquer");

const fenetreBlocage = document.getElementById("fenetre-blocage");
const titreFenetreBlocage = document.getElementById("titre-fenetre-blocage");
const formulaireBlocage = document.getElementById("formulaire-blocage");
const champRaison = document.getElementById("raison");

const fenetreDeblocage = document.getElementById("fenetre-deblocage");
const numeroPlaceADebloquer = document.getElementById("numero-place-a-debloquer");
const raisonPlaceADebloquer = document.getElementById("raison-place-a-debloquer");
const alerteDeblocage = document.getElementById("alerte-deblocage");
const boutonConfirmerDeblocage = document.getElementById("bouton-confirmer-deblocage");

const idSeance = new URLSearchParams(window.location.search).get("seance");
const placesChoisies = new Map();
let placeADebloquer = null;

function texteNombrePlaces(nombre) {
    return nombre === 1 ? "1 place" : nombre + " places";
}

function listeNumeros() {
    return Array.from(placesChoisies.values()).join(", ");
}

function cacherMessages() {
    cacherSucces();
    alertePage.textContent = "";
    alertePage.classList.add("masque");
}

function afficherAlertePage(message) {
    alertePage.textContent = message;
    alertePage.classList.remove("masque");
}

function afficherSeance(seance) {
    document.title = "Places · " + seance.titreFilm + " | Administration | Le Grand Cinéma";
    titreSeance.textContent = seance.titreFilm;
    precisionsSeance.textContent = formaterHoraireSeance(seance.dateHeure) + " · " + seance.nomSalle;
}

function creerPlaceLibre(place, bouton) {
    bouton.textContent = place.numero.slice(1);
    bouton.setAttribute("aria-label", "Place " + place.numero + ", libre");
    bouton.setAttribute("aria-pressed", "false");
    bouton.addEventListener("click", function () {
        choisirPlace(place, bouton);
    });
}

function creerPlaceBloquee(place, bouton) {
    bouton.classList.add("place-bloquee");
    bouton.textContent = place.numero.slice(1);
    bouton.title = "Raison : " + place.raisonBlocage;
    bouton.setAttribute("aria-label", "Place " + place.numero + ", bloquée. Raison : " + place.raisonBlocage);
    bouton.addEventListener("click", function () {
        ouvrirDeblocage(place);
    });
}

function creerPlaceIndisponible(place, bouton) {
    bouton.classList.add("place-prise");
    bouton.textContent = "✕";
    bouton.disabled = true;
    bouton.setAttribute("aria-label", "Place " + place.numero + ", indisponible");
}

function creerPlace(place) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "place";

    if (place.statut === STATUT_LIBRE) {
        creerPlaceLibre(place, bouton);
    } else if (place.statut === STATUT_BLOQUEE) {
        creerPlaceBloquee(place, bouton);
    } else {
        creerPlaceIndisponible(place, bouton);
    }

    return bouton;
}

function afficherPlan(places) {
    planSalle.replaceChildren();
    placesChoisies.clear();
    places.sort(function (placeA, placeB) {
        return placeA.id - placeB.id;
    });

    let rangee = null;
    let lettreActuelle = "";

    for (const place of places) {
        const lettre = place.numero.charAt(0);
        if (lettre !== lettreActuelle) {
            rangee = document.createElement("div");
            rangee.className = "rangee";

            const lettreRangee = document.createElement("span");
            lettreRangee.className = "lettre-rangee";
            lettreRangee.textContent = lettre;

            rangee.appendChild(lettreRangee);
            planSalle.appendChild(rangee);
            lettreActuelle = lettre;
        }
        rangee.appendChild(creerPlace(place));
    }

    mettreAJourRecapitulatif();
}

function choisirPlace(place, bouton) {
    cacherMessages();
    if (placesChoisies.has(place.id)) {
        placesChoisies.delete(place.id);
        bouton.classList.remove("place-choisie");
        bouton.textContent = place.numero.slice(1);
        bouton.setAttribute("aria-pressed", "false");
    } else {
        placesChoisies.set(place.id, place.numero);
        bouton.classList.add("place-choisie");
        bouton.textContent = "✓";
        bouton.setAttribute("aria-pressed", "true");
    }
    mettreAJourRecapitulatif();
}

function mettreAJourRecapitulatif() {
    const nombre = placesChoisies.size;

    if (nombre === 0) {
        recapitulatif.textContent = MESSAGE_AIDE;
        boutonBloquer.disabled = true;
        return;
    }

    const choisies = nombre === 1 ? " choisie : " : " choisies : ";
    recapitulatif.textContent = texteNombrePlaces(nombre) + choisies + listeNumeros();
    boutonBloquer.disabled = false;
}

async function chargerPlan() {
    const places = await appelerBackend("/api/places/seance/" + encodeURIComponent(idSeance));
    afficherPlan(places);
}

async function rechargerPlanApresAction() {
    try {
        await chargerPlan();
        return true;
    } catch (erreur) {
        afficherErreurChargement(sectionPlaces, erreur.message);
        return false;
    }
}

function ouvrirBlocage() {
    cacherMessages();
    titreFenetreBlocage.textContent = "Bloquer " + texteNombrePlaces(placesChoisies.size) + " : " + listeNumeros();
    fenetreBlocage.showModal();
}

function ouvrirDeblocage(place) {
    cacherMessages();
    placeADebloquer = place;
    numeroPlaceADebloquer.textContent = place.numero;
    raisonPlaceADebloquer.textContent = place.raisonBlocage;
    alerteDeblocage.textContent = "";
    alerteDeblocage.classList.add("masque");
    boutonConfirmerDeblocage.disabled = false;
    fenetreDeblocage.showModal();
}

function decrireEchecs(echecs) {
    const details = echecs.map(function (echec) {
        const message = echec.message.charAt(0).toLowerCase() + echec.message.slice(1);
        return echec.numero + " (" + message + ")";
    }).join(", ");
    const debut = echecs.length === 1
        ? "Cette place n'a pas pu être bloquée : "
        : "Ces places n'ont pas pu être bloquées : ";
    return debut + details + ".";
}

formulaireBlocage.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const raison = champRaison.value.trim();
    if (raison === "") {
        afficherErreurChamp("raison", MESSAGE_RAISON_OBLIGATOIRE);
        return;
    }

    const places = Array.from(placesChoisies.entries());
    desactiverBouton(TEXTE_BLOCAGE);

    const reponses = await Promise.allSettled(places.map(function ([idPlace]) {
        return appelerBackend("/api/places/" + idPlace + "/bloquer", "POST", { raison });
    }));

    reactiverBouton();
    fenetreBlocage.close();

    const echecs = [];
    let nombreBloquees = 0;
    reponses.forEach(function (reponse, index) {
        if (reponse.status === "fulfilled") {
            nombreBloquees++;
        } else {
            echecs.push({ numero: places[index][1], message: reponse.reason.message });
        }
    });

    if (!(await rechargerPlanApresAction())) {
        return;
    }

    if (nombreBloquees > 0) {
        const verbe = nombreBloquees === 1 ? " a été bloquée." : " ont été bloquées.";
        afficherSucces(texteNombrePlaces(nombreBloquees) + verbe);
    }
    if (echecs.length > 0) {
        afficherAlertePage(decrireEchecs(echecs));
    }
});

fenetreBlocage.addEventListener("close", function () {
    formulaireBlocage.reset();
    effacerErreurs();
});

boutonConfirmerDeblocage.addEventListener("click", async function () {
    const texteInitial = boutonConfirmerDeblocage.textContent;
    const numero = placeADebloquer.numero;

    boutonConfirmerDeblocage.textContent = TEXTE_DEBLOCAGE;
    boutonConfirmerDeblocage.disabled = true;

    try {
        await appelerBackend("/api/places/" + placeADebloquer.id + "/debloquer", "POST");
        boutonConfirmerDeblocage.textContent = texteInitial;
        fenetreDeblocage.close();
        if (await rechargerPlanApresAction()) {
            afficherSucces("La place " + numero + " a été débloquée.");
        }
    } catch (erreur) {
        boutonConfirmerDeblocage.textContent = texteInitial;
        boutonConfirmerDeblocage.disabled = erreur.statut === 409;
        alerteDeblocage.textContent = erreur.message;
        alerteDeblocage.classList.remove("masque");
    }
});

fenetreDeblocage.addEventListener("close", function () {
    placeADebloquer = null;
});

boutonBloquer.addEventListener("click", ouvrirBlocage);

brancherFermeture(fenetreBlocage, document.getElementById("bouton-annuler-blocage"));
brancherFermeture(fenetreDeblocage, document.getElementById("bouton-annuler-deblocage"));

async function chargerPage() {
    if (exigerAdmin() === null) {
        return;
    }

    if (idSeance === null) {
        afficherErreurChargement(sectionPlaces, MESSAGE_SEANCE_INTROUVABLE);
        return;
    }

    try {
        const [seance] = await Promise.all([
            appelerBackend("/api/seances/" + encodeURIComponent(idSeance)),
            chargerPlan()
        ]);
        afficherSeance(seance);
        afficherContenu(sectionPlaces);
    } catch (erreur) {
        const introuvable = erreur.statut === 404 || erreur.statut === 400;
        afficherErreurChargement(sectionPlaces, introuvable ? MESSAGE_SEANCE_INTROUVABLE : erreur.message);
    }
}

chargerPage();
