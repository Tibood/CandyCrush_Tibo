import Cookie from "./cookie.js";
import { create2DArray } from "./utils.js";

/* Classe principale du jeu, c'est une grille de cookies. Le jeu se joue comme
Candy Crush Saga etc... c'est un match-3 game... */
export default class Grille {
    /**
     * Constructeur de la grille
     * @param {number} l nombre de lignes
     * @param {number} c nombre de colonnes
     */
    constructor(l, c) {
        this.c = c;
        this.l = l;
        let existeAlignement = false;
        // this.tabcookies = this.remplirTableauDeCookies(6)
        do {
            this.tabcookies = this.remplirTableauDeCookies(6)
            existeAlignement = this.testAlignementDansTouteLaGrille();
            this.faireTomberEtRemplirCookies();
            existeAlignement = this.testAlignementDansTouteLaGrille();
        } while(existeAlignement)
    }


    /**
     * parcours la liste des divs de la grille et affiche les images des cookies
     * correspondant à chaque case. Au passage, à chaque image on va ajouter des
     * écouteurs de click et de drag'n'drop pour pouvoir interagir avec elles
     * et implémenter la logique du jeu.
     */
    showCookies() {
        let scoreDiv = document.getElementById("score");
        scoreDiv.textContent = "0";
        let caseDivs = document.querySelectorAll("#grille div");
        let selectedCookies = []

        caseDivs.forEach((div, index) => {
            // on calcule la ligne et la colonne de la case
            // index est le numéro de la case dans la grille
            // on sait que chaque ligne contient this.c colonnes
            // er this.l lignes
            // on peut en déduire la ligne et la colonne
            // par exemple si on a 9 cases par ligne et qu'on
            // est à l'index 4
            // on est sur la ligne 0 (car 4/9 = 0) et
            // la colonne 4 (car 4%9 = 4)
            let ligne = Math.floor(index / this.l);
            let colonne = index % this.c;

            console.log("On remplit le div index=" + index + " l=" + ligne + " col=" + colonne);

            let cookie = this.tabcookies[ligne][colonne];
            let img = cookie.htmlImage;

            img.onclick = (event) => {
                console.log("On a cliqué sur la ligne " + ligne + " et la colonne " + colonne);
                console.log("Le cookie cliqué est de type " + cookie.type);
                if (cookie.isSelected()) {
                    cookie.deselectionnee();
                    selectedCookies = selectedCookies.filter(c => c !== cookie);
                } else {
                    cookie.selectionnee();
                    if (selectedCookies.length === 0) {
                        selectedCookies.push(cookie);
                    } else {
                        if (Cookie.distance(selectedCookies[0], cookie) === 1) {
                            Cookie.swapCookies(selectedCookies[0], cookie);
                            if (this.testAlignementDansTouteLaGrille() !== true) {
                                Cookie.swapCookies(cookie, selectedCookies[0]);
                            }
                            this.faireTomberEtRemplirCookies();
                            selectedCookies = [];
                        } else {
                            selectedCookies[0].deselectionnee();
                            cookie.deselectionnee();
                            selectedCookies = [];
                        }
                    }
                }
                console.log(selectedCookies.length);
            }

            img.ondragstart = (evt) => {
                console.log("drag start");
                let imgClickee = evt.target;
                let cookie = this.getCookieFromImage(imgClickee);
                evt.dataTransfer.setData("position", JSON.stringify(imgClickee.dataset));
                console.log(evt.dataTransfer.getData("position"));
            }

            img.ondragover = (evt) => {
                evt.preventDefault();
            };

            img.ondragenter = (evt) => {
                evt.target.classList.add("grilleDragOver");
            };

            img.ondragleave = (evt) => {
                evt.target.classList.remove("grilleDragOver");
            };

            img.ondrop = (evt) => {
                evt.target.classList.remove("grilleDragOver");
                let position = JSON.parse(evt.dataTransfer.getData("position"));
                let cookie1 = this.getCookieFromLC(
                    position.ligne,
                    position.colonne
                );
                let img = evt.target;
                let cookie2 = this.getCookieFromImage(img);
                if (Cookie.distance(cookie1, cookie2) === 1) {
                    Cookie.swapCookies(cookie1, cookie2);
                    selectedCookies = [];
                } else {
                    cookie1.deselectionnee();
                    cookie.deselectionnee();
                    selectedCookies = [];
                }
            };

            div.appendChild(img);
        });
    }

    testAlignementDansTouteLaGrille() {
        let alignementExisteLignes = false;
        let alignementExisteColonnes = false;
        alignementExisteLignes = this.testAlignementToutesLesLignes();
        alignementExisteColonnes = this.testAlignementToutesLesColonnes();
        return (alignementExisteLignes || alignementExisteColonnes);
    }

    testAlignementToutesLesLignes() {
        for (let i = 0; i < this.l; i++) {
            if (this.testAlignementLigne(i)) {
                return true;
            }
        }
    }

    testAlignementLigne(ligne) {
        let alignement = false;
        let tabLigne = this.tabcookies[ligne];
        let tabCookiesSameType = [];
        for (let i = 0; i < tabLigne.length; i++) {
            if (tabCookiesSameType.length !== 0 && tabLigne[i].type === tabCookiesSameType[0].type) {
                tabCookiesSameType.push(tabLigne[i]);
                if (tabCookiesSameType.length >= 3) {
                    if (i === tabLigne.length - 1 || tabLigne[i + 1].type !== tabCookiesSameType[0].type) {
                        tabCookiesSameType.forEach(c => {
                            // c.htmlImage.classList.add("clignote");
                            // setTimeout(() => {
                            //     c.htmlImage.classList.remove("clignote");
                            //     c.cache();
                            // }, 1500);
                            c.cache();
                        });
                        let score = tabCookiesSameType.length-2;
                        this.setScore(score);
                        alignement = true;
                    }
                }
            } else {
                tabCookiesSameType = [];
                tabCookiesSameType.push(tabLigne[i]);
            }
        }
        return alignement;
    }

    testAlignementToutesLesColonnes() {
        for (let i = 0; i < this.c; i++) {
            if (this.testAlignementColonne(i)) {
                return true;
            }
        }
    }

    testAlignementColonne(colonne) {
        let alignement = false;
        let tabCookiesSameType = [];
        for (let l = 0; l < this.c; l++) {
            if (tabCookiesSameType.length > 0 && this.tabcookies[l][colonne].type === tabCookiesSameType[0].type) {
                tabCookiesSameType.push(this.tabcookies[l][colonne]);
                if ((l === this.c - 1 || this.tabcookies[l+1][colonne].type !== tabCookiesSameType[0].type) && tabCookiesSameType.length >= 3) {
                    tabCookiesSameType.forEach(c => c.htmlImage.classList.add("cookieCachee"));
                    let score = tabCookiesSameType.length - 2;
                    this.setScore(score);
                    alignement = true;
                    tabCookiesSameType = [];
                }
            } else {
                tabCookiesSameType = [this.tabcookies[l][colonne]];
            }
        }
        return alignement;
    }

    setScore(score) {
        let scoreDiv = document.getElementById("score");
        let scoreActuel = scoreDiv.textContent;
        scoreDiv.innerHTML = parseInt(scoreActuel,10) + score;
    }

    faireTomberEtRemplirCookies() {
        for (let c = 0; c < this.c; c++) {
            console.log("Colonne " + c);
            for (let l = 0; l < this.l; l++) {
                console.log("Ligne " + l);
                if (this.tabcookies[l][c].isCache()) {
                    console.log("Cookie caché trouvé à la ligne " + l + " et la colonne " + c + ". On va le faire tomber.");
                    let k = l + 1;
                    while (k < this.l && this.tabcookies[k][c].isCache()) {
                        k++;
                    }
                    if (k < this.l) {
                        // Avant de déplacer le cookie, on log son déplacement
                        console.log(`Le cookie à la position ( ${k}, à la colonne ${c}) descend à la position (ligne ${l}, colonne ${c}).`);
                        this.tabcookies[l][c] = this.tabcookies[k][c];
                        this.tabcookies[k][c] = new Cookie(Math.floor(Math.random() * 6), k, c);
                        this.tabcookies[l][c].ligne = l;
                    }
                }
            }
            for (let l = 0; l < this.l; l++) {
                if (this.tabcookies[l][c].isCache()) {
                    const type = Math.floor(Math.random() * 6); // Supposons 6 types de cookies
                    this.tabcookies[l][c] = new Cookie(type, l, c);
                    // On pourrait également ajouter un log ici si on veut indiquer le remplissage de cookies
                    console.log(`Un nouveau cookie de type ${type} est créé à la position (${l}, ${c}).`);
                }
            }
        }
    }

    getCookieFromImage(img) {
        // On récupère la ligne et la colonne dans l'image,
        // utilisation de l'affectation par décomposition (destructuring assigment),
        // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Op%C3%A9rateurs/Affecter_par_d%C3%A9composition
        let [l, c] = Cookie.getLigneColonneFromImg(img);
        //console.log("ligne col image = " + l + " " + c);

        //à partir de la ligne et de la colonne on retrouve l'objet cookie associé à l'image
        // cliquée
        return this.getCookieFromLC(l, c);
    }

    getCookieFromLC(ligne, colonne) {
        return this.tabcookies[ligne][colonne];
    }

    /**
     * Initialisation du niveau de départ. Le paramètre est le nombre de cookies différents
     * dans la grille. 4 types (4 couleurs) = facile de trouver des possibilités de faire
     * des groupes de 3. 5 = niveau moyen, 6 = niveau difficile
     *
     * Améliorations : 1) s'assurer que dans la grille générée il n'y a pas déjà de groupes
     * de trois. 2) S'assurer qu'il y a au moins 1 possibilité de faire un groupe de 3 sinon
     * on a perdu d'entrée. 3) réfléchir à des stratégies pour générer des niveaux plus ou moins
     * difficiles.
     *
     * On verra plus tard pour les améliorations...
     */
    remplirTableauDeCookies(nbDeCookiesDifferents) {
        // créer un tableau vide de 9 cases pour une ligne
        // en JavaScript on ne sait pas créer de matrices
        // d'un coup. Pas de new tab[3][4] par exemple.
        // Il faut créer un tableau vide et ensuite remplir
        // chaque case avec un autre tableau vide
        // Faites ctrl-click sur la fonction create2DArray
        // pour voir comment elle fonctionne
        let tab = create2DArray(9);

        // remplir
        for (let l = 0; l < this.l; l++) {
            for (let c = 0; c < this.c; c++) {

                // on génère un nombre aléatoire entre 0 et nbDeCookiesDifferents-1
                const type = Math.floor(Math.random() * nbDeCookiesDifferents);
                //console.log(type)
                tab[l][c] = new Cookie(type, l, c);
            }
        }

        return tab;
    }
}
