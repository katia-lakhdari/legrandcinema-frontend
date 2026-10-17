import { appelerBackend } from "./api.js";
import { formaterDuree } from "./format.js";

const PAGE_DETAIL_FILM = "/film-detail.html";
const MESSAGE_AUCUN_FILM = "Aucun film à l'affiche pour le moment. Revenez bientôt !";

const filtresFilms = document.getElementById("filtres-films");
const filtreGenre = document.getElementById("filtre-genre");
const grilleFilms = document.getElementById("grille-films");
const etatVide = document.getElementById("etat-vide");
const alerteFilms = document.getElementById("alerte-films");

let filmsAffiche = [];

function creerCarteFilm(film) {
    const carte = document.createElement("li");
    carte.className = "carte-film";

    const lien = document.createElement("a");
    lien.className = "lien-film";
    lien.href = PAGE_DETAIL_FILM + "?id=" + film.id;

    const cadreAffiche = document.createElement("div");
    cadreAffiche.className = "affiche-film";

    const image = document.createElement("img");
    image.src = film.affiche;
    image.alt = "";
    image.loading = "lazy";
    cadreAffiche.appendChild(image);

    const infos = document.createElement("div");
    infos.className = "infos-film";

    const titre = document.createElement("h2");
    titre.className = "titre-film";
    titre.textContent = film.titre;

    const precisions = document.createElement("p");
    precisions.className = "precisions-film";
    precisions.textContent = film.genre + " · " + formaterDuree(film.duree);

    infos.appendChild(titre);
    infos.appendChild(precisions);
    lien.appendChild(cadreAffiche);
    lien.appendChild(infos);
    carte.appendChild(lien);
    return carte;
}

function afficherFilms(films) {
    grilleFilms.replaceChildren();
    for (const film of films) {
        grilleFilms.appendChild(creerCarteFilm(film));
    }
}

function remplirGenres() {
    const genres = new Set();
    for (const film of filmsAffiche) {
        genres.add(film.genre);
    }
    const genresTries = Array.from(genres).sort(function (genreA, genreB) {
        return genreA.localeCompare(genreB, "fr");
    });
    for (const genre of genresTries) {
        const option = document.createElement("option");
        option.value = genre;
        option.textContent = genre;
        filtreGenre.appendChild(option);
    }
}

function filtrerParGenre() {
    const genreChoisi = filtreGenre.value;
    if (genreChoisi === "") {
        afficherFilms(filmsAffiche);
        return;
    }
    const filmsDuGenre = filmsAffiche.filter(function (film) {
        return film.genre === genreChoisi;
    });
    afficherFilms(filmsDuGenre);
}

async function chargerFilms() {
    try {
        filmsAffiche = await appelerBackend("/api/films/a-l-affiche");
    } catch (erreur) {
        filtresFilms.classList.add("masque");
        alerteFilms.textContent = erreur.message;
        alerteFilms.classList.remove("masque");
        return;
    }

    if (filmsAffiche.length === 0) {
        filtresFilms.classList.add("masque");
        etatVide.textContent = MESSAGE_AUCUN_FILM;
        etatVide.classList.remove("masque");
        return;
    }

    remplirGenres();
    afficherFilms(filmsAffiche);
}

filtreGenre.addEventListener("change", filtrerParGenre);
chargerFilms();