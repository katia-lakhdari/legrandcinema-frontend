import { appelerBackend } from "./api.js";
import { exigerAdmin } from "./auth.js";
import { formaterHoraireSeance, afficherContenu, afficherErreurChargement } from "./admin.js";

const STATUT_ANNULEE = "ANNULEE";
const NOMS_STATUTS = {
    EN_ATTENTE_PAIEMENT: "En attente de paiement",
    PAYEE: "Payée"
};
const CLASSES_STATUTS = {
    EN_ATTENTE_PAIEMENT: "statut-attente",
    PAYEE: "statut-payee"
};
const SEUIL_FAIBLE = 30;
const SEUIL_FORT = 80;
const PAGE_PLACES = "/admin/places.html?seance=";
const MILLISECONDES_PAR_JOUR = 86400000;

const sectionTableauDeBord = document.getElementById("section-tableau-de-bord");
const synthese = document.getElementById("synthese");
const listeSeances = document.getElementById("liste-seances");
const corpsListeSeances = document.getElementById("corps-liste-seances");
const etatVideSeances = document.getElementById("etat-vide-seances");
const etatVideFiltres = document.getElementById("etat-vide-filtres");
const filtrePeriode = document.getElementById("filtre-periode");
const filtreFilm = document.getElementById("filtre-film");
const templateSeance = document.getElementById("template-seance");
const templateLigneReservation = document.getElementById("template-ligne-reservation");

let seancesAVenir = [];
let reservationsEnCours = [];

function formaterPourcentage(taux) {
    return Math.round(taux) + " %";
}

function choisirPalier(taux) {
    if (taux < SEUIL_FAIBLE) {
        return "jauge-faible";
    }
    if (taux < SEUIL_FORT) {
        return "jauge-normale";
    }
    return "jauge-forte";
}

function accorder(nombre, singulier, pluriel) {
    return nombre <= 1 ? singulier : pluriel;
}

function ajouterChiffre(valeur) {
    const chiffre = document.createElement("strong");
    chiffre.textContent = valeur;
    synthese.appendChild(chiffre);
}

function ajouterTexte(texte) {
    synthese.appendChild(document.createTextNode(texte));
}

function afficherSynthese(seances, reservations) {
    let totalVendues = 0;
    let totalDisponibles = 0;
    seances.forEach(function (seance) {
        totalVendues += seance.placesReservees;
        totalDisponibles += seance.placesDisponibles;
    });
    const remplissageMoyen = totalDisponibles === 0 ? 0 : (totalVendues * 100) / totalDisponibles;

    synthese.replaceChildren();
    ajouterChiffre(seances.length);
    ajouterTexte(accorder(seances.length, " séance, ", " séances, "));
    ajouterChiffre(totalVendues);
    ajouterTexte(accorder(totalVendues, " place vendue, un remplissage de ", " places vendues, un remplissage de "));
    ajouterChiffre(formaterPourcentage(remplissageMoyen));
    ajouterTexte(" et ");
    ajouterChiffre(reservations.length);
    ajouterTexte(accorder(reservations.length, " réservation en cours.", " réservations en cours."));
}

function regrouperParSeance(reservations) {
    const groupes = new Map();
    reservations.forEach(function (reservation) {
        const cle = reservation.seanceId;
        if (!groupes.has(cle)) {
            groupes.set(cle, []);
        }
        groupes.get(cle).push(reservation);
    });
    return groupes;
}

function fabriquerLigneReservation(reservation) {
    const copie = templateLigneReservation.content.cloneNode(true);
    const ligne = copie.querySelector("tr");
    const statut = ligne.querySelector(".cellule-statut");

    ligne.querySelector(".cellule-client").textContent = reservation.clientNom;
    ligne.querySelector(".cellule-places").textContent = reservation.nombrePlaces;
    statut.textContent = NOMS_STATUTS[reservation.statut] ?? reservation.statut;
    statut.classList.add(CLASSES_STATUTS[reservation.statut] ?? "statut-attente");

    return ligne;
}

function fabriquerSeance(seance, reservations) {
    const copie = templateSeance.content.cloneNode(true);
    const bloc = copie.querySelector(".seance-depliable");
    const niveau = bloc.querySelector(".jauge-niveau");
    const tableau = bloc.querySelector(".tableau-reservations");
    const corpsTableau = tableau.querySelector("tbody");

    bloc.querySelector(".cellule-horaire").textContent = formaterHoraireSeance(seance.dateHeure);
    bloc.querySelector(".cellule-titre").textContent = seance.filmTitre;
    bloc.querySelector(".cellule-places").textContent = seance.placesReservees + " / " + seance.placesDisponibles;
    bloc.querySelector(".pourcentage").textContent = formaterPourcentage(seance.tauxRemplissage);

    niveau.style.width = Math.min(seance.tauxRemplissage, 100) + "%";
    niveau.classList.add(choisirPalier(seance.tauxRemplissage));
    bloc.querySelector(".lien-places").href = PAGE_PLACES + seance.seanceId;

    if (reservations.length === 0) {
        tableau.classList.add("masque");
        bloc.querySelector(".aucune-reservation").classList.remove("masque");
        return bloc;
    }

    reservations.forEach(function (reservation) {
        corpsTableau.appendChild(fabriquerLigneReservation(reservation));
    });
    return bloc;
}

function afficherSeances(seances, reservations) {
    const groupes = regrouperParSeance(reservations);
    corpsListeSeances.replaceChildren();
    etatVideSeances.classList.add("masque");
    etatVideFiltres.classList.add("masque");

    if (seances.length === 0) {
        listeSeances.classList.add("masque");
        const etatVide = seancesAVenir.length === 0 ? etatVideSeances : etatVideFiltres;
        etatVide.classList.remove("masque");
        return;
    }

    listeSeances.classList.remove("masque");

    seances.forEach(function (seance) {
        const reservationsDeLaSeance = groupes.get(seance.seanceId) ?? [];
        corpsListeSeances.appendChild(fabriquerSeance(seance, reservationsDeLaSeance));
    });
}

function remplirFiltreFilm() {
    const titres = Array.from(new Set(seancesAVenir.map(function (seance) {
        return seance.filmTitre;
    })));
    titres.sort(function (a, b) {
        return a.localeCompare(b, "fr");
    });
    titres.forEach(function (titre) {
        const option = document.createElement("option");
        option.value = titre;
        option.textContent = titre;
        filtreFilm.appendChild(option);
    });
}

function appliquerFiltres() {
    const nombreJours = filtrePeriode.value === "" ? null : Number(filtrePeriode.value);
    const limite = nombreJours === null ? null : Date.now() + nombreJours * MILLISECONDES_PAR_JOUR;
    const film = filtreFilm.value;

    const seancesFiltrees = seancesAVenir.filter(function (seance) {
        const dansLaPeriode = limite === null || new Date(seance.dateHeure).getTime() <= limite;
        const bonFilm = film === "" || seance.filmTitre === film;
        return dansLaPeriode && bonFilm;
    });

    const idsSeancesAffichees = new Set(seancesFiltrees.map(function (seance) {
        return seance.seanceId;
    }));
    const reservationsFiltrees = reservationsEnCours.filter(function (reservation) {
        return idsSeancesAffichees.has(reservation.seanceId);
    });

    afficherSynthese(seancesFiltrees, reservationsFiltrees);
    afficherSeances(seancesFiltrees, reservationsFiltrees);
}

filtrePeriode.addEventListener("change", appliquerFiltres);
filtreFilm.addEventListener("change", appliquerFiltres);

async function chargerPage() {
    if (exigerAdmin() === null) {
        return;
    }

    try {
        const [statistiques, toutesLesReservations] = await Promise.all([
            appelerBackend("/api/admin/statistiques"),
            appelerBackend("/api/admin/reservations")
        ]);

        const maintenant = new Date();
        seancesAVenir = statistiques.filter(function (seance) {
            return new Date(seance.dateHeure) > maintenant;
        });
        seancesAVenir.sort(function (a, b) {
            return new Date(a.dateHeure) - new Date(b.dateHeure);
        });
        reservationsEnCours = toutesLesReservations.filter(function (reservation) {
            return reservation.statut !== STATUT_ANNULEE;
        });

        remplirFiltreFilm();
        appliquerFiltres();

        afficherContenu(sectionTableauDeBord);
    } catch (erreur) {
        afficherErreurChargement(sectionTableauDeBord, erreur.message);
    }
}

chargerPage();
