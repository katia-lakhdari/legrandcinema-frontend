import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { formaterDuree } from "./format.js";
import { effacerErreurs, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";
import {
    afficherContenu, afficherErreurChargement, afficherSucces, cacherSucces, afficherListe,
    nommerBoutons, brancherFermeture, preparerSuppression, supprimer
} from "./admin.js";

const TITRE_AJOUT = "Nouveau film";
const TITRE_MODIFICATION = "Modifier le film";
const TEXTE_ENREGISTREMENT = "Enregistrement…";
const DELAI_APERCU = 400;

const sectionFilms = document.getElementById("section-films");
const boutonAjouter = document.getElementById("bouton-ajouter-film");
const tableauFilms = document.getElementById("tableau-films");
const corpsTableau = document.getElementById("corps-tableau-films");
const etatVide = document.getElementById("etat-vide-films");
const templateLigne = document.getElementById("template-ligne-film");

const fenetreFilm = document.getElementById("fenetre-film");
const titreFenetreFilm = document.getElementById("titre-fenetre-film");
const formulaireFilm = document.getElementById("formulaire-film");
const champTitre = document.getElementById("titre");
const champGenre = document.getElementById("genre");
const champDuree = document.getElementById("duree");
const champAffiche = document.getElementById("affiche");
const champDescription = document.getElementById("description");
const apercuAffiche = document.getElementById("apercu-affiche");
const erreurApercu = document.getElementById("erreur-apercu");

const fenetreSuppression = document.getElementById("fenetre-suppression");
const titreFilmASupprimer = document.getElementById("titre-film-a-supprimer");
const alerteSuppression = document.getElementById("alerte-suppression");
const boutonConfirmerSuppression = document.getElementById("bouton-confirmer-suppression");

let films = [];
let filmEnModification = null;
let filmASupprimer = null;
let minuteurApercu = null;

function fabriquerLigne(film) {
    const copie = templateLigne.content.cloneNode(true);
    const ligne = copie.querySelector("tr");
    const miniature = ligne.querySelector(".miniature-affiche");

    miniature.addEventListener("error", function () {
        miniature.classList.add("masque");
    });
    miniature.src = film.affiche;

    ligne.querySelector(".cellule-titre").textContent = film.titre;
    ligne.querySelector(".cellule-genre").textContent = film.genre;
    ligne.querySelector(".cellule-duree").textContent = formaterDuree(film.duree);

    nommerBoutons(ligne, film.titre);
    ligne.querySelector(".bouton-modifier").addEventListener("click", function () {
        ouvrirModification(film);
    });
    ligne.querySelector(".bouton-supprimer").addEventListener("click", function () {
        ouvrirSuppression(film);
    });

    return ligne;
}

async function chargerFilms() {
    const reponse = await appelerBackend("/api/films");
    films = reponse.sort(function (a, b) {
        return a.titre.localeCompare(b.titre, "fr");
    });
    afficherListe(films, tableauFilms, corpsTableau, etatVide, fabriquerLigne);
}

async function rafraichirApresAction(message) {
    try {
        await chargerFilms();
        afficherSucces(message);
    } catch (erreur) {
        afficherErreurChargement(sectionFilms, erreur.message);
    }
}

function cacherApercu() {
    apercuAffiche.classList.add("masque");
    apercuAffiche.removeAttribute("src");
    erreurApercu.classList.add("masque");
}

function mettreAJourApercu() {
    const adresse = champAffiche.value.trim();
    if (adresse === "") {
        cacherApercu();
        return;
    }
    apercuAffiche.src = adresse;
}

function ouvrirAjout() {
    cacherSucces();
    filmEnModification = null;
    titreFenetreFilm.textContent = TITRE_AJOUT;
    fenetreFilm.showModal();
}

function ouvrirModification(film) {
    cacherSucces();
    filmEnModification = film;
    titreFenetreFilm.textContent = TITRE_MODIFICATION;
    champTitre.value = film.titre;
    champGenre.value = film.genre;
    champDuree.value = film.duree;
    champAffiche.value = film.affiche;
    champDescription.value = film.description;
    mettreAJourApercu();
    fenetreFilm.showModal();
}

function lireFormulaire() {
    const duree = champDuree.value;
    return {
        titre: champTitre.value.trim(),
        genre: champGenre.value.trim(),
        duree: duree === "" ? null : Number(duree),
        affiche: champAffiche.value.trim(),
        description: champDescription.value.trim()
    };
}

function ouvrirSuppression(film) {
    cacherSucces();
    filmASupprimer = film;
    titreFilmASupprimer.textContent = film.titre;
    preparerSuppression(alerteSuppression, boutonConfirmerSuppression);
    fenetreSuppression.showModal();
}

formulaireFilm.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const donnees = lireFormulaire();
    const estAjout = filmEnModification === null;

    desactiverBouton(TEXTE_ENREGISTREMENT);

    try {
        let filmEnregistre;
        if (estAjout) {
            filmEnregistre = await appelerBackend("/api/films", "POST", donnees);
        } else {
            filmEnregistre = await appelerBackend("/api/films/" + filmEnModification.id, "PUT", donnees);
        }
        reactiverBouton();
        fenetreFilm.close();
        const action = estAjout ? "ajouté" : "modifié";
        await rafraichirApresAction("« " + filmEnregistre.titre + " » a été " + action + ".");
    } catch (erreur) {
        reactiverBouton();
        afficherErreurs(erreur);
    }
});

fenetreFilm.addEventListener("close", function () {
    formulaireFilm.reset();
    effacerErreurs();
    clearTimeout(minuteurApercu);
    cacherApercu();
    filmEnModification = null;
});

apercuAffiche.addEventListener("load", function () {
    apercuAffiche.classList.remove("masque");
    erreurApercu.classList.add("masque");
});

apercuAffiche.addEventListener("error", function () {
    if (!apercuAffiche.hasAttribute("src")) {
        return;
    }
    apercuAffiche.classList.add("masque");
    erreurApercu.classList.remove("masque");
});

boutonConfirmerSuppression.addEventListener("click", async function () {
    const titre = filmASupprimer.titre;
    const chemin = "/api/films/" + filmASupprimer.id;
    if (await supprimer(chemin, fenetreSuppression, alerteSuppression, boutonConfirmerSuppression)) {
        await rafraichirApresAction("« " + titre + " » a été supprimé.");
    }
});

fenetreSuppression.addEventListener("close", function () {
    filmASupprimer = null;
});

champAffiche.addEventListener("input", function () {
    clearTimeout(minuteurApercu);
    minuteurApercu = setTimeout(mettreAJourApercu, DELAI_APERCU);
});
boutonAjouter.addEventListener("click", ouvrirAjout);
brancherFermeture(fenetreFilm, document.getElementById("bouton-annuler-film"));
brancherFermeture(fenetreSuppression, document.getElementById("bouton-annuler-suppression"));

async function chargerPage() {
    if (exigerAdmin() === null) {
        return;
    }

    try {
        await chargerFilms();
        afficherContenu(sectionFilms);
    } catch (erreur) {
        afficherErreurChargement(sectionFilms, erreur.message);
    }
}

chargerPage();
