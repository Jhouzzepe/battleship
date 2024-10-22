/*jslint browser this */
/*global _, player */

(function (global) {
    "use strict";

    var computer = _.assign({}, player, {
        areShipsOk: function (callback) {
            var x;
            var y;
            var orientation;
            var i;

            this.fleet.forEach(function (ship) {
                var options = ["horizontal", "vertical"];
                do {
                    x = Math.floor(Math.random() * 10);
                    y = Math.floor(Math.random() * 10);
                    orientation = options[Number(Math.random() < 0.5)];

                } while (!this.isPositionValid(x, y, ship.life, orientation));

                i = 0;
                while (i < ship.life) {
                    if (orientation === "horizontal") {
                        if (x + i < 10) {
                            this.grid[y][x + i] = ship.getId();
                        }
                    } else {
                        if (y + i < 10) {
                            this.grid[y + i][x] = ship.getId();
                        }
                    }
                    i += 1;
                }
            }, this);

            setTimeout(function () {
                callback();
            }, 500);
        },
        fleet: [],
        game: null,
        grid: [],
        isPositionValid: function (x, y, length, orientation) {
            var i = 0;
            while (i < length) {
                if (orientation === "horizontal") {
                    if (x + i >= 10 || this.grid[y][x + i] !== 0) {
                        return false;
                    }
                } else {
                    if (y + i >= 10 || this.grid[y + i][x] !== 0) {
                        return false;
                    }
                }
                i += 1;
            }
            return true;
        },
        play: function () {
            var self = this;
            setTimeout(function () {
                var randomX;
                var randomY;
                do {
                    randomX = Math.floor(Math.random() * 10);
                    randomY = Math.floor(Math.random() * 10);
                } while (self.tries[randomX][randomY]);

                self.game.fire(self, randomX, randomY, function (hasSucceeded) {
                    self.tries[randomX][randomY] = hasSucceeded;
                });
            }, 2000);
        },
        setGame: function (game) {
            this.game = game;
        },
        tries: []
    });
    global.computer = computer;
}(this));
