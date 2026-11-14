const TAILLE_AFFICHE_REDUITE = "w342";

export function formaterDuree(minutes) {
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    if (heures === 0) {
        return reste + " min";
    }
    if (reste === 0) {
        return heures + " h";
    }
    return heures + " h " + String(reste).padStart(2, "0");
}

export function formaterDate(dateHeure) {
    return new Date(dateHeure).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}

export function formaterHeure(dateHeure) {
    const date = new Date(dateHeure);
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return date.getHours() + " h " + minutes;
}

export function formaterHoraire(dateHeure) {
    return formaterDate(dateHeure) + " · " + formaterHeure(dateHeure);
}

export function formaterPrix(prix) {
    return prix.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function verifierAdresseAffiche(adresse) {
    if (typeof adresse === "string" && adresse.startsWith("https://image.tmdb.org/")) {
        return adresse;
    }
    return "";
}

export function reduireAffiche(adresse) {
    return verifierAdresseAffiche(adresse).replace(/\/t\/p\/[^/]+\//, "/t/p/" + TAILLE_AFFICHE_REDUITE + "/");
}
