import { appelerBackend } from "./api.js";
import { formaterDuree, formaterHoraire, formaterPrix } from "./format.js";

const SEUIL_DERNIERES_PLACES = 10;
const PAGE_SELECTION_PLACES = "/selection-places.html";
const MESSAGE_FILM_INTROUVABLE = "Ce film n'existe pas ou n'est plus à l'affiche.";
const MESSAGE_AUCUNE_SEANCE = "Ce film n'est pas encore réservable.";

const alerteFilms = document.getElementById("alerte-films");
const ficheFilm = document.getElementById("fiche-film");
const imageDetail = document.getElementById("image-detail");
const titreDetail = document.getElementById("titre-detail");
const precisionsDetail = document.getElementById("precisions-detail");
const descriptionDetail = document.getElementById("description-detail");
const seancesFilm = document.getElementById("seances-film");
const listeSeances = document.getElementById("liste-seances");
const etatVide = document.getElementById("etat-vide");

const idFilm = new URLSearchParams(window.location.search).get("id");

function afficherErreur(message) {
    alerteFilms.textContent = message;
    alerteFilms.classList.remove("masque");
}

function afficherFilm(film) {
    document.title = film.titre + " | Le Grand Cinéma";
    imageDetail.src = film.affiche;
    titreDetail.textContent = film.titre;
    precisionsDetail.textContent = film.genre + " · " + formaterDuree(film.duree);
    descriptionDetail.textContent = film.description;
    ficheFilm.classList.remove("masque");
}

function creerCarteSeance(seance) {
    const horaire = formaterHoraire(seance.dateHeure);

    const carte = document.createElement("li");
    carte.className = "carte carte-seance";

    const infos = document.createElement("div");
    infos.className = "infos-seance";

    const texteHoraire = document.createElement("p");
    texteHoraire.className = "horaire-seance";
    texteHoraire.textContent = horaire;

    const precisions = document.createElement("p");
    precisions.className = "precisions-seance";
    precisions.textContent = seance.nomSalle + " · " + formaterPrix(seance.prix);

    infos.appendChild(texteHoraire);
    infos.appendChild(precisions);

    const actions = document.createElement("div");
    actions.className = "actions-seance";

    let texteBadge = null;
    if (seance.complete) {
        texteBadge = "Complet";
    } else if (seance.placesLibres === 1) {
        texteBadge = "Dernière place !";
    } else if (seance.placesLibres <= SEUIL_DERNIERES_PLACES) {
        texteBadge = "Plus que " + seance.placesLibres + " places";
    }

    if (texteBadge !== null) {
        const badge = document.createElement("span");
        badge.className = "badge-places";
        badge.textContent = texteBadge;
        if (seance.complete) {
            badge.classList.add("badge-complet");
        }
        actions.appendChild(badge);
    }

    if (seance.complete) {
        carte.classList.add("seance-complete");
    } else {
        const boutonReserver = document.createElement("a");
        boutonReserver.className = "btn";
        boutonReserver.href = PAGE_SELECTION_PLACES + "?seance=" + seance.id;
        boutonReserver.textContent = "Réserver";
        boutonReserver.setAttribute("aria-label", "Réserver la séance du " + horaire.replace(" · ", " à "));
        actions.appendChild(boutonReserver);
    }

    carte.appendChild(infos);
    carte.appendChild(actions);
    return carte;
}

function afficherSeances(seances) {
    if (seances.length === 0) {
        etatVide.textContent = MESSAGE_AUCUNE_SEANCE;
        etatVide.classList.remove("masque");
    }
    for (const seance of seances) {
        listeSeances.appendChild(creerCarteSeance(seance));
    }
    seancesFilm.classList.remove("masque");
}

async function chargerPage() {
    if (idFilm === null) {
        afficherErreur(MESSAGE_FILM_INTROUVABLE);
        return;
    }

    try {
        const film = await appelerBackend("/api/films/" + encodeURIComponent(idFilm));
        afficherFilm(film);
        const seances = await appelerBackend("/api/films/" + encodeURIComponent(idFilm) + "/seances");
        afficherSeances(seances);
    } catch (erreur) {
        if (erreur.statut === 404 || erreur.statut === 400) {
            afficherErreur(MESSAGE_FILM_INTROUVABLE);
        } else {
            afficherErreur(erreur.message);
        }
    }
}

chargerPage();