# Le Grand Cinéma (frontend)

C'est le frontend de mon projet de fin de Bachelor Développeur Java chez STUDI (Bloc 3).
Le Grand Cinéma est un cinéma qui veut que ses spectateurs puissent réserver leurs places en ligne au lieu de faire la queue. J'ai fait le projet seule.

Le backend est dans un autre dépôt : [legrandcinema-backend](https://github.com/katia-lakhdari/legrandcinema-backend).

## Ce que fait le site

Sans compte, on peut voir les films à l'affiche, les filtrer par genre, ouvrir la fiche d'un film avec ses séances, et lire la page Contact et les mentions légales.

Pour réserver il faut un compte client. Le client choisit ses places sur le plan de la salle, puis il paie. Ses places sont gardées pendant 5 minutes, avec un compte à rebours sur la page de paiement. Une fois le paiement fait, il voit son billet avec le QR code, il le reçoit aussi par e-mail, et il peut le retrouver dans "Mes billets". Il y a aussi le mot de passe oublié.

L'admin a son propre espace : un tableau de bord avec le remplissage des séances, la gestion des films, des salles et des séances, le blocage de places, et le scan des billets à l'entrée.

Le site marche sur téléphone et sur ordinateur. Il y a deux palettes de couleurs au choix, Soleil et Canard.

## Stack

- HTML, CSS et JavaScript natifs, sans framework
- Modules JavaScript (`import` / `export`)
- Stripe.js (mode test) pour le champ carte bancaire
- Google Fonts pour les polices (Limelight, Monoton, Work Sans, Josefin Sans)
- Les affiches des films viennent de TMDB
- SonarQube Cloud
- Render (site statique) pour la mise en ligne

## Architecture

Les pages client sont à la racine du dépôt, les pages admin dans `admin`.

Chaque page a son fichier JavaScript dans `js` (par exemple `paiement.html` et `js/paiement.js`). Je ne mets jamais de JavaScript dans le HTML.

Quelques fichiers sont partagés par toutes les pages :
- `js/api.js` : c'est le seul endroit qui parle au backend. Il ajoute le token, et quand il y a une erreur il renvoie le message en français reçu du backend, pour l'afficher à l'utilisateur.
- `js/auth.js` : la session de l'utilisateur. Le token est gardé dans le `sessionStorage`, donc il faut se reconnecter à chaque nouvelle visite.
- `js/layout.js` : le header et le footer communs, avec un menu différent pour le visiteur, le client et l'admin.
- `js/format.js` et `js/formulaire.js` : l'affichage des dates et des prix, et les erreurs sous chaque champ des formulaires.

Pour le CSS, il y a un `style.css` commun (couleurs, polices, boutons, cartes, formulaires) et un CSS en plus seulement pour les écrans qui en ont besoin (films, choix des places, paiement, contact, mentions légales, admin).

## Lancer le projet en local

Il faut que le backend tourne en local sur http://localhost:8080 (voir le README du backend).

1. Ouvrir le dossier du dépôt dans VS Code.
2. Lancer l'extension Live Server sur `index.html`. Le site s'ouvre sur http://127.0.0.1:5500.

Il faut passer par un serveur comme Live Server : en ouvrant le fichier directement, les modules JavaScript ne se chargent pas.

Le site choisit tout seul l'adresse du backend : `localhost:8080` en local, et l'API en ligne sur Render sinon.

La clé Stripe qu'on voit dans `js/api.js` est la clé publique de test. Elle est faite pour être visible dans le navigateur, la clé secrète reste dans le backend.

Pour payer en mode test, on utilise la carte Stripe `4242 4242 4242 4242`, avec une date dans le futur et n'importe quel code à 3 chiffres.

## Tests

Le frontend n'a pas de tests automatisés. J'ai testé chaque page à la main contre le vrai backend au moment de la faire, puis le parcours complet (inscription, réservation, paiement, billet, scan par l'admin) sur le site en ligne.

## Les pages

**Visiteur**
- `index.html` : les films à l'affiche, avec le filtre par genre
- `film-detail.html` : la fiche d'un film et ses séances
- `connexion.html` et `inscription.html`
- `mot-de-passe-oublie.html` et `reinitialiser-mot-de-passe.html`
- `contact.html` et `mentions-legales.html`
- `404.html` : la page "Fin de la bobine"

**Client connecté**
- `selection-places.html` : le plan de la salle et le choix des places
- `paiement.html` : le paiement Stripe, avec le compte à rebours des 5 minutes
- `confirmation.html` : le billet avec son QR code
- `mes-billets.html` : les billets à venir

**Admin**
- `admin/dashboard.html` : le tableau de bord
- `admin/films.html`, `admin/salles.html`, `admin/seances.html` : ajouter, modifier et supprimer
- `admin/places.html` : bloquer ou débloquer des places d'une séance
- `admin/scan.html` : contrôler les billets à l'entrée

## En ligne

- Site : https://legrandcinema-frontend.onrender.com
- API : https://legrandcinema-backend.onrender.com
- Identifiants de démonstration (admin et client) : dans le tableau des liens de mon dossier.

Le backend est hébergé sur l'offre gratuite de Render : après un moment sans visite, la première page peut mettre jusqu'à une minute à s'afficher.

## Organisation du travail avec Git

Branches :
- `main` : la version stable, publiée.
- `develop` : la branche d'intégration. Tout passe par elle avant d'arriver sur `main`.
- `feature/xxx` : une nouvelle page ou fonctionnalité (ex : `feature/selection-places`).
- `fix/xxx` : une correction (ex : `fix/redirection-apres-connexion`).
- `refactor/xxx` : une réorganisation du code ou du design sans changer le comportement (ex : `refactor/design`).
- `docs/xxx` : la documentation (ex : `docs/readme`).
- `chore/xxx` : la configuration, la mise en ligne (ex : `chore/mise-en-ligne`).

Chaque branche part de `develop` et y revient par une Pull Request.

Messages de commit : `type: description en français`, par exemple `feat: page de choix des places`.
Les types utilisés sont `feat`, `fix`, `refactor`, `docs`, `config` et `chore`.

## Auteure

Katia Lakhdari
