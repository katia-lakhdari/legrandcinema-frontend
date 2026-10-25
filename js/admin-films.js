import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { formaterDuree } from "./format.js";
import { effacerErreurs, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";

const TITRE_AJOUT = "Nouveau film";
const TITRE_MODIFICATION = "Modifier le film";
const TEXTE_ENREGISTREMENT = "Enregistrement…";
const TEXTE_SUPPRESSION = "Suppression…";

const chargement = document.getElementById("chargement");
const sectionFilms = document.getElementById("section-films");
const messageSucces = document.getElementById("message-succes");
const boutonAjouter = document.getElementById("bouton-ajouter-film");
const tableauFilms = document.getElementById("tableau-films");
const corpsTableau = document.getElementById("corps-tableau-films");
const etatVide = document.getElementById("etat-vide-films");
const zoneErreur = document.getElementById("zone-erreur");
const messageErreur = document.getElementById("message-erreur");
const boutonRecharger = document.getElementById("bouton-recharger");
const templateLigne = document.getElementById("template-ligne-film");

const fenetreFilm = document.getElementById("fenetre-film");
const titreFenetreFilm = document.getElementById("titre-fenetre-film");
const formulaireFilm = document.getElementById("formulaire-film");
const champTitre = document.getElementById("titre");
const champGenre = document.getElementById("genre");
const champDuree = document.getElementById("duree");
const champAffiche = document.getElementById("affiche");
const champDescription = document.getElementById("description");
const boutonAnnulerFilm = document.getElementById("bouton-annuler-film");

const fenetreSuppression = document.getElementById("fenetre-suppression");
const titreFilmASupprimer = document.getElementById("titre-film-a-supprimer");
const alerteSuppression = document.getElementById("alerte-suppression");
const boutonConfirmerSuppression = document.getElementById("bouton-confirmer-suppression");
const boutonAnnulerSuppression = document.getElementById("bouton-annuler-suppression");

let films = [];
let filmEnModification = null;
let filmASupprimer = null;

function afficherErreurChargement(message) {
    messageErreur.textContent = message;
    chargement.classList.add("masque");
    sectionFilms.classList.add("masque");
    zoneErreur.classList.remove("masque");
}

function afficherSucces(message) {
    messageSucces.textContent = message;
    messageSucces.classList.remove("masque");
}

function cacherSucces() {
    messageSucces.textContent = "";
    messageSucces.classList.add("masque");
}

function fabriquerLigne(film) {
    const copie = templateLigne.content.cloneNode(true);
    const ligne = copie.querySelector("tr");
    const boutonModifier = ligne.querySelector(".bouton-modifier");
    const boutonSupprimer = ligne.querySelector(".bouton-supprimer");

    ligne.querySelector(".cellule-titre").textContent = film.titre;
    ligne.querySelector(".cellule-genre").textContent = film.genre;
    ligne.querySelector(".cellule-duree").textContent = formaterDuree(film.duree);

    boutonModifier.setAttribute("aria-label", boutonModifier.textContent.trim() + " " + film.titre);
    boutonSupprimer.setAttribute("aria-label", boutonSupprimer.textContent.trim() + " " + film.titre);

    boutonModifier.addEventListener("click", function () {
        ouvrirModification(film);
    });
    boutonSupprimer.addEventListener("click", function () {
        ouvrirSuppression(film);
    });

    return ligne;
}

function afficherFilms() {
    corpsTableau.replaceChildren();

    if (films.length === 0) {
        tableauFilms.classList.add("masque");
        etatVide.classList.remove("masque");
        return;
    }

    etatVide.classList.add("masque");
    tableauFilms.classList.remove("masque");
    films.forEach(function (film) {
        corpsTableau.appendChild(fabriquerLigne(film));
    });
}

async function chargerFilms() {
    const reponse = await appelerBackend("/api/films");
    films = reponse.sort(function (a, b) {
        return a.titre.localeCompare(b.titre, "fr");
    });
    afficherFilms();
}

async function rafraichirApresAction(message) {
    try {
        await chargerFilms();
        afficherSucces(message);
    } catch (erreur) {
        afficherErreurChargement(erreur.message);
    }
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
    alerteSuppression.textContent = "";
    alerteSuppression.classList.add("masque");
    boutonConfirmerSuppression.disabled = false;
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
    filmEnModification = null;
});

boutonConfirmerSuppression.addEventListener("click", async function () {
    const texteInitial = boutonConfirmerSuppression.textContent;
    const titre = filmASupprimer.titre;

    boutonConfirmerSuppression.textContent = TEXTE_SUPPRESSION;
    boutonConfirmerSuppression.disabled = true;

    try {
        await appelerBackend("/api/films/" + filmASupprimer.id, "DELETE");
        boutonConfirmerSuppression.textContent = texteInitial;
        fenetreSuppression.close();
        await rafraichirApresAction("« " + titre + " » a été supprimé.");
    } catch (erreur) {
        boutonConfirmerSuppression.textContent = texteInitial;
        boutonConfirmerSuppression.disabled = erreur.statut === 409;
        alerteSuppression.textContent = erreur.message;
        alerteSuppression.classList.remove("masque");
    }
});

fenetreSuppression.addEventListener("close", function () {
    filmASupprimer = null;
});

boutonAjouter.addEventListener("click", ouvrirAjout);

boutonAnnulerFilm.addEventListener("click", function () {
    fenetreFilm.close();
});

boutonAnnulerSuppression.addEventListener("click", function () {
    fenetreSuppression.close();
});

boutonRecharger.addEventListener("click", function () {
    window.location.reload();
});

async function chargerPage() {
    if (exigerAdmin() === null) {
        return;
    }

    try {
        await chargerFilms();
        chargement.classList.add("masque");
        sectionFilms.classList.remove("masque");
    } catch (erreur) {
        afficherErreurChargement(erreur.message);
    }
}

chargerPage();
