import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { effacerErreurs, afficherErreurs, desactiverBouton, reactiverBouton } from "./formulaire.js";
import {
    afficherContenu, afficherErreurChargement, afficherSucces, cacherSucces, afficherListe,
    nommerBoutons, brancherFermeture, preparerSuppression, supprimer
} from "./admin.js";

const TITRE_AJOUT = "Nouvelle salle";
const TITRE_MODIFICATION = "Modifier la salle";
const TEXTE_ENREGISTREMENT = "Enregistrement…";
const TEXTE_PLACES = " places";

const sectionSalles = document.getElementById("section-salles");
const boutonAjouter = document.getElementById("bouton-ajouter-salle");
const tableauSalles = document.getElementById("tableau-salles");
const corpsTableau = document.getElementById("corps-tableau-salles");
const etatVide = document.getElementById("etat-vide-salles");
const templateLigne = document.getElementById("template-ligne-salle");

const fenetreSalle = document.getElementById("fenetre-salle");
const titreFenetreSalle = document.getElementById("titre-fenetre-salle");
const formulaireSalle = document.getElementById("formulaire-salle");
const champNom = document.getElementById("nom");
const listeTypes = document.getElementById("type");
const champCapacite = document.getElementById("capacite");
const noteCapacite = document.getElementById("note-capacite");

const fenetreSuppression = document.getElementById("fenetre-suppression");
const nomSalleASupprimer = document.getElementById("nom-salle-a-supprimer");
const alerteSuppression = document.getElementById("alerte-suppression");
const boutonConfirmerSuppression = document.getElementById("bouton-confirmer-suppression");

let salles = [];
let salleEnModification = null;
let salleASupprimer = null;

function traduireType(type) {
    const option = listeTypes.querySelector('option[value="' + type + '"]');
    return option !== null ? option.textContent : type;
}

function fabriquerLigne(salle) {
    const copie = templateLigne.content.cloneNode(true);
    const ligne = copie.querySelector("tr");

    ligne.querySelector(".cellule-titre").textContent = salle.nom;
    ligne.querySelector(".cellule-type").textContent = traduireType(salle.type);
    ligne.querySelector(".cellule-capacite").textContent = salle.capacite + TEXTE_PLACES;

    nommerBoutons(ligne, salle.nom);
    ligne.querySelector(".bouton-modifier").addEventListener("click", function () {
        ouvrirModification(salle);
    });
    ligne.querySelector(".bouton-supprimer").addEventListener("click", function () {
        ouvrirSuppression(salle);
    });

    return ligne;
}

async function chargerSalles() {
    const reponse = await appelerBackend("/api/salles");
    salles = reponse.sort(function (a, b) {
        return a.nom.localeCompare(b.nom, "fr", { numeric: true });
    });
    afficherListe(salles, tableauSalles, corpsTableau, etatVide, fabriquerLigne);
}

async function rafraichirApresAction(message) {
    try {
        await chargerSalles();
        afficherSucces(message);
    } catch (erreur) {
        afficherErreurChargement(sectionSalles, erreur.message);
    }
}

function ouvrirAjout() {
    cacherSucces();
    salleEnModification = null;
    titreFenetreSalle.textContent = TITRE_AJOUT;
    fenetreSalle.showModal();
}

function ouvrirModification(salle) {
    cacherSucces();
    salleEnModification = salle;
    titreFenetreSalle.textContent = TITRE_MODIFICATION;
    champNom.value = salle.nom;
    listeTypes.value = salle.type;
    champCapacite.value = salle.capacite;
    noteCapacite.classList.remove("masque");
    fenetreSalle.showModal();
}

function lireFormulaire() {
    const capacite = champCapacite.value;
    return {
        nom: champNom.value.trim(),
        type: listeTypes.value,
        capacite: capacite === "" ? null : Number(capacite)
    };
}

function ouvrirSuppression(salle) {
    cacherSucces();
    salleASupprimer = salle;
    nomSalleASupprimer.textContent = salle.nom;
    preparerSuppression(alerteSuppression, boutonConfirmerSuppression);
    fenetreSuppression.showModal();
}

formulaireSalle.addEventListener("submit", async function (evenement) {
    evenement.preventDefault();
    effacerErreurs();

    const donnees = lireFormulaire();
    const estAjout = salleEnModification === null;

    desactiverBouton(TEXTE_ENREGISTREMENT);

    try {
        let salleEnregistree;
        if (estAjout) {
            salleEnregistree = await appelerBackend("/api/salles", "POST", donnees);
        } else {
            salleEnregistree = await appelerBackend("/api/salles/" + salleEnModification.id, "PUT", donnees);
        }
        reactiverBouton();
        fenetreSalle.close();
        const action = estAjout ? "ajoutée" : "modifiée";
        await rafraichirApresAction("« " + salleEnregistree.nom + " » a été " + action + ".");
    } catch (erreur) {
        reactiverBouton();
        afficherErreurs(erreur);
    }
});

fenetreSalle.addEventListener("close", function () {
    formulaireSalle.reset();
    effacerErreurs();
    noteCapacite.classList.add("masque");
    salleEnModification = null;
});

boutonConfirmerSuppression.addEventListener("click", async function () {
    const nom = salleASupprimer.nom;
    const chemin = "/api/salles/" + salleASupprimer.id;
    if (await supprimer(chemin, fenetreSuppression, alerteSuppression, boutonConfirmerSuppression)) {
        await rafraichirApresAction("« " + nom + " » a été supprimée.");
    }
});

fenetreSuppression.addEventListener("close", function () {
    salleASupprimer = null;
});

boutonAjouter.addEventListener("click", ouvrirAjout);
brancherFermeture(fenetreSalle, document.getElementById("bouton-annuler-salle"));
brancherFermeture(fenetreSuppression, document.getElementById("bouton-annuler-suppression"));

async function chargerPage() {
    if (exigerAdmin() === null) {
        return;
    }

    try {
        await chargerSalles();
        afficherContenu(sectionSalles);
    } catch (erreur) {
        afficherErreurChargement(sectionSalles, erreur.message);
    }
}

chargerPage();
