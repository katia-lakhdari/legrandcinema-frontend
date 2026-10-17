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

export function formaterHoraire(dateHeure) {
    const date = new Date(dateHeure);
    const jour = date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
    const heures = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return jour + " · " + heures + " h " + minutes;
}

export function formaterPrix(prix) {
    return prix.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}