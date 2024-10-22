/*jslint browser this */
/*global _, player, computer, utils, Audio */

(function () {
  "use strict";

  var game = {

    PHASE_GAME_OVER: "PHASE_GAME_OVER",
    PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
    PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
    PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
    PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
    PHASE_WAITING: "waiting",

    addListeners: function () {
      // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
      this.grid.addEventListener(
        "mousemove",
        _.bind(this.handleMouseMove, this)
      );
      this.grid.addEventListener("click", _.bind(this.handleClick, this));
    },

    checkHealth: function (shipInstance) {
      var miniGrid = this.miniGrid;
      var boatlife = shipInstance.getLife();
      var rows = miniGrid.querySelectorAll(".row");
      var boatClass = document.querySelector(
        "." + shipInstance.name
      );

      if (boatlife === 0) {

        rows.forEach(function (row) {
          var cells = row.querySelectorAll(".cell." + shipInstance.name);
          cells.forEach(function (cell) {
            cell.classList.add("sunk");
          });
        });
        boatClass.classList.add("sunk");
      }
    },

    createModal: function (winner) {
      var modal = document.createElement("div");
      var modalContent = document.createElement("div");
      var modalTitle = document.createElement("h2");
      var modalText = document.createElement("p");
      var winnerImg = document.createElement("img");
      var modalButton = document.createElement("button");
      var audio = document.createElement("audio");


      modal.classList.add("modal");
      modalContent.classList.add("modal-content");
      modalTitle.textContent = "Fin de partie !";
      modalText.textContent = "Le joueur " + winner + " a gagné !";

      winnerImg.src = "../img/winner-gif.gif";
      winnerImg.classList.add("modal-img");

      modalButton.textContent = "Rejouer";
      modalButton.addEventListener("click", function () {
        window.location.reload();
      });

      audio.src = "../sounds/Winner.mp3";
      audio.setAttribute("autoplay", "true");
      audio.setAttribute("loop", true);
      modalContent.appendChild(modalTitle);
      modalContent.appendChild(modalText);
      modalContent.appendChild(winnerImg);
      modalContent.appendChild(modalButton);
      modal.appendChild(modalContent);
      modal.appendChild(audio);
      document.body.appendChild(modal);
      modal.style.display = "block";
    },

    currentPhase: "",

    //fonction utlisée par les objets représentant les joueurs
    //(ordinateur ou non) pour placer un tir et obtenir de l'adversaire
    //l'information de réusssite ou non du tir
    fire: function (from, col, line, callback) {
      var self = this;
      var miniGrid = this.miniGrid;
      var mainGrid = this.grid;
      var msg = "";
      // Déterminez qui est l'attaquant et qui est attaqué
      var target = (
        this.players.indexOf(from) === 0
        ? this.players[1]
        : this.players[0]
    );
      this.wait();


      if (this.currentPhase === this.PHASE_PLAY_OPPONENT) {
        msg += "Votre adversaire vous a... ";
      }

      //Demandez à l'attaqué s'il a un bateau à la position visée
      //Le résultat devra être passé en paramètre à la
      //fonction de rappel (3e paramètre)
      target.receiveAttack(col, line, function (hasSucceeded, shipName) {
        // Declare variables at the top
        var cell;
        var shipInstance;
        if (hasSucceeded) {
            msg += "Touché !";
            if (self.players.indexOf(from) === 0) {
                cell = self.grid.querySelector(
                    ".row:nth-child(" +
                    (line + 1) +
                    ") .cell:nth-child(" +
                    (col + 1) +
                    ")"
                );
                cell.style.backgroundColor = "red";
                self.showGifOnCell(col, line, mainGrid);
            }
            if (self.currentPhase === self.PHASE_PLAY_OPPONENT) {
                self.touchedAt(col, line, miniGrid, shipName);
            } else {
                //mise à jour de la vie du bateau touché
                shipInstance = target.fleet.find(function (ship) {
                    return ship.getName() === shipName;
                });
                if (shipInstance) {
                    shipInstance.setLife(shipInstance.getLife() - 1);
                }
            }
        } else {
            msg += "Manqué...";
            // Change the color of the cell to gray if missed
            if (self.players.indexOf(from) === 0) {
                cell = self.grid.querySelector(
                    ".row:nth-child(" +
                    (line + 1) +
                    ") .cell:nth-child(" +
                    (col + 1) +
                    ")"
                );
                cell.style.backgroundColor = "gray";
                self.missShoot(col, line, mainGrid);
            }
        }

        utils.info(msg);

        // Invoquez la fonction de rappel (4e paramètre passé à la méthode fire)
        // Pour transmettre à l'attaquant le résultat de l'attaque
        callback(hasSucceeded, shipName);

        // Faites une petite pause avant de continuer...
        // Histoire de laisser le temps au joueur de lire les messages affichés
        setTimeout(function () {
          self.stopWaiting();

          self.goNextPhase();
        }, 1000);
      });
    },


    gameIsOver: function () {
      var i;
      var j;
      var player;
      var totalLife;
      var ship;
      var winner;
      for (i = 0; i < this.players.length; i += 1) {
        player = this.players[i];
        totalLife = 0;
        // parcours de la flotte de bateaux du joueur
        for (j = 0; j < player.fleet.length; j += 1) {
          ship = player.fleet[j];
          // ajout du nombre de points de vie du navire au total
          totalLife += ship.getLife();
        }
        if (totalLife === 0) {
          winner = (
            i === 1
              ? "Joueur 1"
              : "Computer"
          );
          this.currentPhase = this.PHASE_GAME_OVER;
          this.createModal(winner);
          return true;
        }
      }
      return false;
    },

    getPhase: function () {
      if (this.waiting) {
        return this.PHASE_WAITING;
      }
      return this.currentPhase;
    },

    goNextPhase: function () {
      var ci = this.phaseOrder.indexOf(this.currentPhase);
      var self = this;

      if (this.gameIsOver()) {
        this.currentPhase = this.PHASE_GAME_OVER;
      } else if (ci !== this.phaseOrder.length - 1) {
        this.currentPhase = this.phaseOrder[ci + 1];
      } else {
        this.currentPhase = this.PHASE_PLAY_PLAYER;
      }

      switch (this.currentPhase) {
        case this.PHASE_GAME_OVER:
          if (!this.gameIsOver()) {
            this.currentPhase = this.PHASE_PLAY_PLAYER;
            utils.info("A vous de jouer ...");
          } else {
            utils.info("Fin de partie !");
            return;
          }
          break;

        case this.PHASE_INIT_PLAYER:
          utils.info("Placez vos bateaux");
          break;

        case this.PHASE_INIT_OPPONENT:
          this.wait();
          utils.info("En attente de votre adversaire");
          this.players[1].areShipsOk(function () {
            self.stopWaiting();
            self.goNextPhase();
          });
          break;

        case this.PHASE_PLAY_PLAYER:
          utils.info("A vous de jouer, choisissez une case !");
          if (this.gameIsOver()) {
            this.currentPhase = this.PHASE_GAME_OVER;
          }
          break;

        case this.PHASE_PLAY_OPPONENT:
          utils.info("A votre adversaire de jouer...");
          this.players[1].play();
          if (this.gameIsOver()) {
            this.currentPhase = this.PHASE_GAME_OVER;
          }
          break;
      }
    },

    grid: null,

    handleClick: function (e) {
      // self garde une référence vers "this" en cas de changement de scope
      var self = this;

      // si on a cliqué sur une cellule (délégation d'événement)
      if (e.target.classList.contains("cell")) {
        // si on est dans la phase de placement des bateau
        if (this.getPhase() === this.PHASE_INIT_PLAYER) {
          //on enregistre la position du bateau, si cela se
          //passe bien (la fonction renvoie true) on continue
          if (
            this.players[0].setActiveShipPosition(
              utils.eq(e.target),
              utils.eq(e.target.parentNode)
            )
          ) {
            //et on passe au bateau suivant
            //(si il n'y en plus la fonction retournera false)
            if (!this.players[0].activateNextShip()) {
              this.wait();
              utils.confirm(
                "Confirmez le placement ?",
                function () {
                  // si le placement est confirmé
                  self.stopWaiting();
                  self.renderMiniMap();
                  self.players[0].clearPreview();
                  self.goNextPhase();
                },
                function () {
                  self.stopWaiting();
                  //sinon, on efface les bateaux (les positions enregistrées),
                  //et on recommence
                  self.players[0].resetShipPlacement();
                }
              );
            }
          }
          // si on est dans la phase de jeu (du joueur humain)
        } else if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
          this.players[0].play(
            utils.eq(e.target),
            utils.eq(e.target.parentNode)
          );
        }
      }
    },

    handleMouseMove: function (e) {
      var ship = this.players[0].fleet[this.players[0].activeShip];

      // on est dans la phase de placement des bateau
      if (
        this.getPhase() === this.PHASE_INIT_PLAYER &&
        e.target.classList.contains("cell")
      ) {

        // si on a pas encore affiché (ajouté aux DOM) ce bateau
        if (!ship.dom.parentNode) {
          this.grid.appendChild(ship.dom);
          //passage en arrière plan pour ne pas empêcher
          //la capture des événements sur les cellules de la grille
          ship.dom.style.zIndex = -1;
        }

        //décalage visuelle, le point d'ancrage
        //du curseur est au milieu du bateau
        ship.dom.style.top = String(utils.eq(e.target.parentNode) *
        utils.CELL_SIZE - (600 + this.players[0].activeShip * 60)) + "px";
        ship.dom.style.left = String(utils.eq(e.target) * utils.CELL_SIZE
        - Math.floor(ship.getLife() / 2) * utils.CELL_SIZE) + "px";
      }
    },


    // lancement du jeu
    init: function () {
              // initialisation
          this.grid = document.querySelector(".board .main-grid");
          this.miniGrid = document.querySelector(".mini-grid");
          // défini l'ordre des phase de jeu
          this.phaseOrder = [
              this.PHASE_INIT_PLAYER,
              this.PHASE_INIT_OPPONENT,
              this.PHASE_PLAY_PLAYER,
              this.PHASE_PLAY_OPPONENT,
              this.PHASE_GAME_OVER
          ];
              this.playerTurnPhaseIndex = 0;
              // initialise les joueurs
              this.setupPlayers();
              // ajoute les écouteur d'événement sur la grille
              this.addListeners();
              // c'est parti !
              this.goNextPhase();
      },

    // garde une référence vers les noeuds correspondant du dom
    miniGrid: null,

    missShoot: function (col, line, grid) {
      var gifUrl = "../img/plouf-gif.gif";
      var soundUrl = "../sounds/plouf.mp3";
      var rowSelector = ".row:nth-child(" + (line + 1) + ")";
      var cellSelector = rowSelector + " .cell:nth-child(" + (col + 1) + ")";
      var cell = grid.querySelector(cellSelector);
      var img = document.createElement("img");
      var cellRect = cell.getBoundingClientRect();
      var gridRect = grid.getBoundingClientRect();
      var audio = new Audio(soundUrl);


      if (cell) {
          img.classList.add("miss-gif");
          img.src = gifUrl;
          img.style.position = "absolute";
          img.style.width = "55px";
          img.style.height = "55px";
          img.style.top = cellRect.top - gridRect.top + "px";
          img.style.left = cellRect.left - gridRect.left + "px";
          grid.appendChild(img);
          audio.play();
          setTimeout(function () {
              grid.removeChild(img);
          }, 1000);
      }
    },

    // liste des joueurs
    phaseOrder: [],

    //garde une référence vers l'indice du tableau phaseOrder qui
    //correspond à la phase de jeu pour le joueur humain
    playerTurnPhaseIndex: 2,

    players: [],

    renderMap: function () {
      this.players[0].renderTries(this.grid);
    },

    renderMiniMap: function () {
      this.miniGrid = document.querySelector(".mini-grid");
      const cellColorMap = {
        "0": "#fff",
        "1": "#e60019",
        "2": "#577cc2",
        "3": "#56988c",
        "default": "#203140"
      };

      const colorClasses = {};
      Object.keys(cellColorMap).forEach(function(key) {
        const color = cellColorMap[key];
        if (!colorClasses[color]) {
            colorClasses[color] = "color-" + key;
        }
      });

      this.players[0].grid.forEach((line, y) => {
        line.forEach((cell, x) => {
          var cellNode = this.miniGrid.querySelector(
            ".row:nth-child(" + (y + 1) + ") .cell:nth-child(" + (x + 1) + ")"
          );
          if (cellNode) {
            const color = cellColorMap[cell] || cellColorMap.default;
            cellNode.style.backgroundColor = color;
            const shipInstance = this.players[0].fleet.find(
              (ship) => ship.getId() === cell
            );
            if (shipInstance) {
              const shipName = shipInstance.getName();
              cellNode.classList.add(shipName);
            }
          }
        });
      });
    },

    setupPlayers: function () {
      // donne aux objets player et computer une réference vers l'objet game
      player.setGame(this);
      computer.setGame(this);

      this.players = [player, computer];

      this.players[0].init();
      this.players[1].init();
    },

    showGifOnCell: function (col, line, grid) {
      var gifUrl = "../img/succeed.gif";
      var soundUrl = "../sounds/piou.mp3";
      var rowSelector = ".row:nth-child(" + (line + 1) + ")";
      var cellSelector = rowSelector + " .cell:nth-child(" + (col + 1) + ")";
      var cell = grid.querySelector(cellSelector);
      var img = document.createElement("img");
      var audio = new Audio(soundUrl);
      var cellRect = cell.getBoundingClientRect();
      var gridRect = grid.getBoundingClientRect();


      if (cell) {
        img.classList.add("succeed-gif");
        img.src = gifUrl;
        img.style.position = "absolute";
        img.style.width = "55px";
        img.style.height = "55px";


        img.style.top = cellRect.top - gridRect.top + "px";
        img.style.left = cellRect.left - gridRect.left + "px";

        grid.appendChild(img);

        audio.play();

        setTimeout(function () {
          grid.removeChild(img);
        }, 1000);
      }
    },

    // met fin au mode mode "attente"
    stopWaiting: function () {
      this.waiting = false;
    },

    touchedAt: function (col, line, miniGrid, shipName) {
      var cell = miniGrid
      .querySelectorAll(".row")
      [line].querySelectorAll(".cell")[col];
      var shipInstance = this.players[0].fleet.find(function (ship) {
        return ship.getName() === shipName;
      });

      if (shipInstance) {
        if (shipInstance.getLife() > 0) {
          shipInstance.setLife(shipInstance.getLife() - 1);
          this.checkHealth(shipInstance);
        }
      }

      cell.style.backgroundImage = "url('img/croix.png')";
      cell.style.backgroundSize = "60px 60px";
      cell.style.backgroundPosition = "center";
      cell.style.backgroundRepeat = "no-repeat";
    },


    // met le jeu en mode "attente" (les actions joueurs ne doivent
    //pas être pris en compte si le jeu est dans ce mode)
    wait: function () {
      this.waiting = true;
    },

    // l'interface utilisateur doit-elle être bloquée ?
    waiting: false
  };
  var audio;
  var imgElement = document.querySelector("#mainSound img");
  imgElement.addEventListener("click", toggleMainSound);

  document.addEventListener("DOMContentLoaded", function () {
    game.init();
  });


  function toggleMainSound() {
    var mainSoundDiv = document.getElementById("mainSound");
    if (!audio) {
      audio = document.createElement("audio");
      audio.setAttribute("src", "sounds/main_sound.mp3");
      audio.setAttribute("loop", true);
      audio.play();
      mainSoundDiv.appendChild(audio);
    } else {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  }
}());