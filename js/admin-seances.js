import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { formaterHeure, formaterPrix } from "./format.js";
import { effacerErreurs, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";
import {
    formaterHoraireSeance, afficherContenu, afficherErreurChargement, afficherSucces, cacherSucces,
    nommerBoutons, brancherFermeture, preparerSuppression, supprimer
} from "./admin.js";

const TITRE_AJOUT = "Nouvelle séance";
const TITRE_MODIFICATION = "Modifier la séance";
const TEXTE_ENREGISTREMENT = "Enregistrement…";
const TEXTE_COMPLET = "Complet";
const TEXTE_FIN_PREVUE = "Fin prévue : ";
const LONGUEUR_DATE_HEURE = 16;
const FORMAT_DATE_COURTE = { weekday: "short", day: "numeric", month: "short" };
const MILLISECONDES_PAR_MINUTE = 60000;

const sectionSeances = document.getElementById("section-seances");
const caseAfficherPassees = document.getElementById("afficher-passees");
const boutonAjouter = document.getElementById("bouton-ajouter-seance");
const tableauSeances = document.getElementById("tableau-seances");
const corpsTableau = document.getElementById("corps-tableau-seances");
const etatVide = document.getElementById("etat-vide-seances");
const etatVidePassees = document.getElementById("etat-vide-passees");
const templateLigne = document.getElementById("template-ligne-seance");

const fenetreSeance = document.getElementById("fenetre-seance");
const titreFenetreSeance = document.getElementById("titre-fenetre-seance");
const formulaireSeance = document.getElementById("formulaire-seance");
const listeFilms = document.getElementById("filmId");
const listeSalles = document.getElementById("salleId");
const noteSalle = document.getElementById("note-salle");
const champDateHeure = document.getElementById("dateHeure");
const finPrevue = document.getElementById("fin-prevue");
const champPrix = document.getElementById("prix");

const fenetreSuppression = document.getElementById("fenetre-suppression");
const filmSeanceASupprimer = document.getElementById("film-seance-a-supprimer");
const horaireSeanceASupprimer = document.getElementById("horaire-seance-a-supprimer");
const alerteSuppression = document.getElementById("alerte-suppression");
const boutonConfirmerSuppression = document.getElementById("bouton-confirmer-suppression");

const dureesFilms = new Map();
let seances = [];
let seanceEnModification = null;
let seanceASupprimer = null;

function estPassee(seance) {
    return new Date(seance.dateHeure) < new Date();
}

function remplirListe(liste, elements, texte) {
    elements.forEach(function (element) {
        const option = document.createElement("option");
        option.value = element.id;
        option.textContent = texte(element);
        liste.appendChild(option);
    });
}

function formaterDateCourte(dateHeure) {
    return new Date(dateHeure).toLocaleDateString("fr-FR", FORMAT_DATE_COURTE);
}

function fabriquerLigne(seance, premiereDuJour) {
    const copie = templateLigne.content.cloneNode(true);
    const ligne = copie.querySelector("tr");

    if (premiereDuJour) {
        ligne.classList.add("premiere-du-jour");
        ligne.querySelector(".cellule-date").textContent = formaterDateCourte(seance.dateHeure);
    }
    ligne.querySelector(".cellule-horaire").textContent = formaterHeure(seance.dateHeure);
    ligne.querySelector(".cellule-titre").textContent = seance.titreFilm;
    ligne.querySelector(".cellule-salle").textContent = seance.nomSalle;
    ligne.querySelector(".cellule-prix").textContent = formaterPrix(seance.prix);
    ligne.querySelector(".cellule-places").textContent = seance.complete ? TEXTE_COMPLET : seance.placesLibres;

    if (estPassee(seance)) {
        ligne.classList.add("ligne-passee");
        ligne.querySelector(".colonne-actions").replaceChildren();
        return ligne;
    }

    nommerBoutons(ligne, seance.titreFilm + ", " + formaterHoraireSeance(seance.dateHeure));
    ligne.querySelector(".bouton-modifier").addEventListener("click", function () {
        ouvrirModification(seance);
    });
    ligne.querySelector(".bouton-supprimer").addEventListener("click", function () {
        ouvrirSuppression(seance);
    });

    return ligne;
}

function choisirSeancesAAfficher() {
    if (caseAfficherPassees.checked) {
        const passees = seances.filter(estPassee);
        passees.sort(function (a, b) {
            return new Date(b.dateHeure) - new Date(a.dateHeure);
        });
        return passees;
    }

    const aVenir = seances.filter(function (seance) {
        return !estPassee(seance);
    });
    aVenir.sort(function (a, b) {
        return new Date(a.dateHeure) - new Date(b.dateHeure);
    });
    return aVenir;
}

function afficherSeances() {
    const seancesAAfficher = choisirSeancesAAfficher();
    const etatVideActuel = caseAfficherPassees.checked ? etatVidePassees : etatVide;

    corpsTableau.replaceChildren();
    etatVide.classList.add("masque");
    etatVidePassees.classList.add("masque");

    if (seancesAAfficher.length === 0) {
        tableauSeances.classList.add("masque");
        etatVideActuel.classList.remove("masque");
        return;
    }

    tableauSeances.classList.remove("masque");
    let jourActuel = "";

    seancesAAfficher.forEach(function (seance) {
        const jour = new Date(seance.dateHeure).toDateString();
        corpsTableau.appendChild(fabriquerLigne(seance, jour !== jourActuel));
        jourActuel = jour;
    });
}

async function chargerSeances() {
    seances = await appelerBackend("/api/seances");
    afficherSeances();
}

async function chargerListes() {
    const [films, salles] = await Promise.all([
        appelerBackend("/api/films"),
        appelerBackend("/api/salles")
    ]);

    films.sort(function (a, b) {
        return a.titre.localeCompare(b.titre, "fr");
    });
    salles.sort(function (a, b) {
        return a.nom.localeCompare(b.nom, "fr", { numeric: true });
    });

    films.forEach(function (film) {
        dureesFilms.set(film.id, film.duree);
    });

    remplirListe(listeFilms, films, function (film) {
        return film.titre;
    });
    remplirListe(listeSalles, salles, function (salle) {
        return salle.nom + " (" + salle.capacite + " places)";
    });
}

async function rafraichirApresAction(message) {
    try {
        await chargerSeances();
        afficherSucces(message);
    } catch (erreur) {
        afficherErreurChargement(sectionSeances, erreur.message);
    }
}

function mettreAJourFinPrevue() {
    const duree = dureesFilms.get(Number(listeFilms.value));
    const valeur = champDateHeure.value;

    if (duree === undefined || valeur === "") {
        finPrevue.textContent = "";
        finPrevue.classList.add("masque");
        return;
    }

    const debut = new Date(valeur);
    const fin = new Date(debut.getTime() + duree * MILLISECONDES_PAR_MINUTE);
    const memeJour = fin.toDateString() === debut.toDateString();

    finPrevue.textContent = TEXTE_FIN_PREVUE + (memeJour ? formaterHeure(fin) : formaterHoraireSeance(fin));
    finPrevue.classList.remove("masque");
}

function ouvrirAjout() {
    cacherSucces();
    seanceEnModification = null;
    titreFenetreSeance.textContent = TITRE_AJOUT;
    fenetreSeance.showModal();
}

function ouvrirModification(seance) {
    cacherSucces();
    seanceEnModification = seance;
    titreFenetreSeance.textContent = TITRE_MODIFICATION;
    listeFilms.value = seance.filmId;
    listeSalles.value = seance.salleId;
    listeSalles.disabled = true;
    noteSalle.classList.remove("masque");
    champDateHeure.value = seance.dateHeure.slice(0, LONGUEUR_DATE_HEURE);
    champPrix.value = seance.prix;
    mettreAJourFinPrevue();
    fenetreSeance.showModal();
}

function lireFormulaire() {
    const prix = champPrix.value;
    return {
        filmId: listeFilms.value === "" ? null : Number(listeFilms.value),
        salleId: listeSalles.value === "" ? null : Number(listeSalles.value),
        dateHeure: champDateHeure.value === "" ? null : champDateHeure.value,
        prix: prix === "" ? null : Number(prix)
    };
}

function ouvrirSuppression(seance) {
    cacherSucces();
    seanceASupprimer = seance;
    filmSeanceASupprimer.textContent = seance.titreFilm;
    horaireSeanceASupprimer.textContent = formaterHoraireSeance(seance.dateHeure);
    preparerSuppression(alerteSuppression, boutonConfirmerSuppression);
    fenetreSuppression.showModal();
}

formulaireSeance.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const donnees = lireFormulaire();
    const estAjout = seanceEnModification === null;

    desactiverBouton(TEXTE_ENREGISTREMENT);

    try {
        let seanceEnregistree;
        if (estAjout) {
            seanceEnregistree = await appelerBackend("/api/seances", "POST", donnees);
        } else {
            seanceEnregistree = await appelerBackend("/api/seances/" + seanceEnModification.id, "PUT", donnees);
        }
        reactiverBouton();
        fenetreSeance.close();
        caseAfficherPassees.checked = false;
        const action = estAjout ? "ajoutée" : "modifiée";
        await rafraichirApresAction("La séance de « " + seanceEnregistree.titreFilm + " » a été " + action + ".");
    } catch (erreur) {
        reactiverBouton();
        afficherErreurs(erreur);
    }
});

fenetreSeance.addEventListener("close", function () {
    formulaireSeance.reset();
    effacerErreurs();
    listeSalles.disabled = false;
    noteSalle.classList.add("masque");
    mettreAJourFinPrevue();
    seanceEnModification = null;
});

boutonConfirmerSuppression.addEventListener("click", async function () {
    const titreFilm = seanceASupprimer.titreFilm;
    const chemin = "/api/seances/" + seanceASupprimer.id;
    if (await supprimer(chemin, fenetreSuppression, alerteSuppression, boutonConfirmerSuppression)) {
        await rafraichirApresAction("La séance de « " + titreFilm + " » a été supprimée.");
    }
});

fenetreSuppression.addEventListener("close", function () {
    seanceASupprimer = null;
});

caseAfficherPassees.addEventListener("change", function () {
    cacherSucces();
    afficherSeances();
});

listeFilms.addEventListener("change", mettreAJourFinPrevue);
champDateHeure.addEventListener("input", mettreAJourFinPrevue);
boutonAjouter.addEventListener("click", ouvrirAjout);
brancherFermeture(fenetreSeance, document.getElementById("bouton-annuler-seance"));
brancherFermeture(fenetreSuppression, document.getElementById("bouton-annuler-suppression"));

async function chargerPage() {
    if (exigerAdmin() === null) {
        return;
    }

    try {
        await Promise.all([chargerSeances(), chargerListes()]);
        afficherContenu(sectionSeances);
    } catch (erreur) {
        afficherErreurChargement(sectionSeances, erreur.message);
    }
}

chargerPage();
