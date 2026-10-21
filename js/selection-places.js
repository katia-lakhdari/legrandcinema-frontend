import { appelerBackend } from "./api.js";
import { exigerConnexion } from "./auth.js";
import { formaterHoraire, formaterPrix } from "./format.js";
import { effacerErreurs, afficherAlerte, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

const PAGE_FILM = "/film-detail.html";
const PAGE_PAIEMENT = "/paiement.html";
const MESSAGE_SEANCE_INTROUVABLE = "Cette séance n'existe pas ou n'est plus disponible.";
const MESSAGE_PLACE_PRISE = "Une des places choisies vient d'être prise par quelqu'un d'autre. Le plan a été mis à jour, choisissez à nouveau.";
const MESSAGE_AUCUNE_PLACE = "Cliquez sur une place pour la choisir.";

const choixPlaces = document.getElementById("choix-places");
const lienRetourFilm = document.getElementById("lien-retour-film");
const titreSeance = document.getElementById("titre-seance");
const precisionsSeance = document.getElementById("precisions-seance");
const planSalle = document.getElementById("plan-salle");
const recapitulatif = document.getElementById("recapitulatif");
const boutonValider = document.getElementById("bouton-formulaire");

const idSeance = new URLSearchParams(window.location.search).get("seance");
const placesChoisies = new Map();
let prixPlace = 0;

function afficherSeance(seance) {
    document.title = "Choix des places · " + seance.titreFilm + " | Le Grand Cinéma";
    titreSeance.textContent = seance.titreFilm;
    precisionsSeance.textContent = formaterHoraire(seance.dateHeure) + " · " + seance.nomSalle + " · " + formaterPrix(seance.prix) + " la place";
    lienRetourFilm.href = PAGE_FILM + "?id=" + seance.filmId;
    prixPlace = seance.prix;
}

function creerPlace(place) {
    const numeroSiege = place.numero.slice(1);
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "place";

    if (place.statut !== "LIBRE") {
        bouton.classList.add("place-prise");
        bouton.textContent = "✕";
        bouton.disabled = true;
        bouton.setAttribute("aria-label", "Place " + place.numero + ", prise");
        return bouton;
    }

    bouton.textContent = numeroSiege;
    bouton.setAttribute("aria-label", "Place " + place.numero);
    bouton.setAttribute("aria-pressed", "false");
    bouton.addEventListener("click", function () {
        choisirPlace(place, bouton);
    });
    return bouton;
}

function afficherPlan(places) {
    planSalle.textContent = "";
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
        recapitulatif.textContent = MESSAGE_AUCUNE_PLACE;
        boutonValider.disabled = true;
        return;
    }

    const numeros = Array.from(placesChoisies.values()).join(", ");
    const texteNombre = nombre === 1 ? "1 place" : nombre + " places";
    recapitulatif.textContent = texteNombre + " : " + numeros + " · Total " + formaterPrix(nombre * prixPlace);
    boutonValider.disabled = false;
}

async function chargerPlan() {
    const places = await appelerBackend("/api/places/seance/" + encodeURIComponent(idSeance));
    afficherPlan(places);
}

async function libererPlaces(placesVerrouillees) {
    await Promise.allSettled(placesVerrouillees.map(function (idPlace) {
        return appelerBackend("/api/places/" + idPlace + "/liberer", "POST");
    }));
}

async function validerPlaces() {
    effacerErreurs();
    desactiverBouton("Validation en cours…");
    const idsPlaces = Array.from(placesChoisies.keys());
    let placesVerrouillees = [];

    try {
        const reponsesVerrouillage = await Promise.allSettled(idsPlaces.map(function (idPlace) {
            return appelerBackend("/api/places/" + idPlace + "/verrouiller", "POST");
        }));

        placesVerrouillees = idsPlaces.filter(function (idPlace, index) {
            return reponsesVerrouillage[index].status === "fulfilled";
        });

        const echecVerrouillage = reponsesVerrouillage.find(function (reponse) {
            return reponse.status === "rejected";
        });
        if (echecVerrouillage !== undefined) {
            throw echecVerrouillage.reason;
        }

        const reservation = await appelerBackend("/api/reservations", "POST", {
            seanceId: Number(idSeance),
            placeIds: placesVerrouillees
        });
        window.location.href = PAGE_PAIEMENT + "?reservation=" + reservation.id + "&seance=" + idSeance;
    } catch (erreur) {
        await libererPlaces(placesVerrouillees);
        reactiverBouton();
        if (erreur.statut === 409) {
            afficherAlerte(MESSAGE_PLACE_PRISE);
            await chargerPlan();
        } else {
            afficherErreurs(erreur);
            mettreAJourRecapitulatif();
        }
    }
}

async function chargerPage() {
    if (exigerConnexion() === null) {
        return;
    }
    if (idSeance === null) {
        afficherAlerte(MESSAGE_SEANCE_INTROUVABLE);
        return;
    }

    try {
        const seance = await appelerBackend("/api/seances/" + encodeURIComponent(idSeance));
        afficherSeance(seance);
        await chargerPlan();
        choixPlaces.classList.remove("masque");
    } catch (erreur) {
        if (erreur.statut === 404 || erreur.statut === 400) {
            afficherAlerte(MESSAGE_SEANCE_INTROUVABLE);
        } else {
            afficherAlerte(erreur.message);
        }
    }
}

boutonValider.addEventListener("click", validerPlaces);
chargerPage();