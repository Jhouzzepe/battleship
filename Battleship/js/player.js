/*jslint browser this */
/*global _, shipFactory, player, utils */

(function (global) {
    "use strict";

    var player = {
        activateNextShip: function () {
            if (this.activeShip < this.fleet.length - 1) {
                this.activeShip += 1;
                return true;
            } else {
                return false;
            }
        },
        activeShip: 0,
        clearPreview: function () {
            this.fleet.forEach(function (ship) {
                if (ship.dom.parentNode) {
                    ship.dom.parentNode.removeChild(ship.dom);
                }
            });
        },
        fleet: [],
        game: null,
        grid: [],
        init: function () {
            // créé la flotte
            this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));

            // créé les grilles
            this.grid = utils.createGrid(10, 10);
            this.tries = utils.createGrid(10, 10);
        },

        play: function (col, line) {
            if (this.tries[line][col] !== 0) {
                utils.info("Vous avez déjà tiré ici!");
                return;
            }

      //Appelle la fonction fire du game, et lui passe
      //une callback pour récupérer le résultat du tir
            this.game.fire(
                this,
                col,
                line,
                _.bind(function (hasSucced) {
                    this.tries[line][col] = hasSucced;
                }, this)
            );
        },

    //quand il est attaqué le joueur doit dire si il a un bateaux
    //ou non à l'emplacement choisi par l'adversaire
        receiveAttack: function (col, line, callback) {
            var shipId = this.grid[line][col];
            var succeed = false;
            var shipName = null;
            var ship;

            if (this.grid[line][col] !== 0) {
                succeed = true;
                ship = this.fleet.find(function (ship) {
                    return ship.getId() === shipId;
                });
                if (ship) {
                    shipName = ship.getName();
                }
                this.grid[line][col] = 0;
            }
            callback(succeed, shipName);
        },

        renderTries: function (grid) {
            this.tries.forEach(function (row, rid) {
                row.forEach(function (val, col) {
                    var node = grid.querySelector(
                        ".row:nth-child(" +
                        (rid + 1) +
                        ") .cell:nth-child(" +
                        (col + 1) +
                        ")"
                    );

                    if (val === true) {
                        node.style.backgroundColor = "#e60019";
                    } else if (val === false) {
                        node.style.backgroundColor = "#aeaeae";
                    }
                });
            });
        },

        resetShipPlacement: function () {
            this.clearPreview();
            this.activeShip = 0;
            this.grid = utils.createGrid(10, 10);
        },

        setActiveShipPosition: function (mouseX, mouseY) {
            var ship = this.fleet[this.activeShip];
            var x;
            var y;
            var i = 0;
            var overlaps = false;

            //calculate the coordinates of the corner
            //of the ship based on the mouse click
            if (ship.position === "horizontal") {
                x = mouseX - Math.floor(ship.getLife() / 2);
                y = mouseY;
            } else if (ship.position === "vertical" && ship.getLife()
                % 2 === 0) {
                x = mouseX;
                y = mouseY - Math.floor(ship.getLife() / 2) + 1;
            } else if (ship.position === "vertical") {
                x = mouseX;
                y = mouseY - Math.floor(ship.getLife() / 2);
            }

            // check if the position is within grid limits
            if (
                x < 0 ||
                y < 0 ||
                (ship.position === "horizontal" &&
                x + ship.getLife() > this.grid[0].length) ||
                (ship.position === "vertical" && y + ship.getLife()
                > this.grid.length)
            ) {
                return false;
            }

          // Check for overlaps
            if (ship.position === "horizontal") {
                while (i < ship.getLife()) {
                    if (this.grid[y][x + i] !== 0) {
                        overlaps = true;
                        break;
                    }
                    i += 1;
                }
            } else {

                while (i < ship.getLife()) {
                    if (this.grid[y + i][x] !== 0) {
                        overlaps = true;
                        break;
                    }
                    i += 1;
                }
            }

            // Update grid if no overlaps detected
            if (!overlaps) {
                i = 0;
                if (ship.position === "horizontal") {
                    while (i < ship.getLife()) {
                        this.grid[y][x + i] = ship.getId();
                        i += 1;
                    }
                } else {
                    while (i < ship.getLife()) {
                        this.grid[y + i][x] = ship.getId();
                        i += 1;
                    }
                }
            }
            // return true only if no overlaps detected
            return !overlaps;
        },

        setGame: function (game) {
            this.game = game;
        },

        tries: []
    };

    global.player = player;

    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        player.fleet[player.activeShip].rotate();
    });
}(this));
