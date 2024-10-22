/*jslint browser this */
/*global _, utils */

(function (global) {
    "use strict";

    var refType = {};
    var Ship;
    var shipFactory;

    var shipAI = 0;
    function getShipNewIndex() {
        shipAI = shipAI + 1;
        return shipAI;
    }

    Ship = {
        color: null,
        dom: null,

        getColor: function () {
            return this.color;
        },

        getId: function () {
            return this.id;
        },

        getLife: function () {
            return this.life;
        },

        getName: function () {
            return this.name;
        },

        id: null,
        init: function () {
            this.id = getShipNewIndex();
            this.rotation = 0;
            this.dom = document.createElement("div");
            this.dom.style.height = utils.CELL_SIZE + "px";
            this.dom.style.width = (utils.CELL_SIZE * this.life) + "px";
            this.dom.style.position = "relative";
            this.dom.style.opacity = "0.8";
            this.dom.style.backgroundColor = this.color;
        },

        life: null,
        name: null,
        position: "horizontal",

        rotate: function () {
            if (this.dom) {
                if (this.position === "horizontal") {
                    this.position = "vertical";
                    if (this.life % 2 === 0) {
                        this.dom.style.transformOrigin = "center bottom";
                    } else {
                        this.dom.style.transformOrigin = "center center";
                    }
                    this.dom.style.transform = "rotate(90deg)";
                } else {
                    this.position = "horizontal";
                    this.dom.style.transformOrigin = "center center";
                    this.dom.style.transform = "rotate(0deg)";
                }
            }
        },
        setColor: function (color) {
            this.color = color;
        },

        setLife: function (life) {
            this.life = parseInt(life, 10);
        },

        setName: function (name) {
            this.name = name;
        }
    };

    shipFactory = {
        TYPE_BATTLESHIP: "battleship",
        TYPE_DESTROYER: "destroyer",
        TYPE_SMALL_SHIP: "small-ship",
        TYPE_SUBMARINE: "submarine",

        build: function (type, name) {
            var newShip = _.assign({}, Ship, refType[type]);

            if (!refType[type]) {
                return null;
            }

            newShip.init();

            if (name !== undefined) {
                newShip.setName(name);
            }

            return newShip;
        }
    };

    refType[shipFactory.TYPE_BATTLESHIP] = {
        color: "#e60019",
        life: 5,
        name: "Battleship"
    };
    refType[shipFactory.TYPE_DESTROYER] = {
        color: "#577cc2",
        life: 5,
        name: "Destroyer"
    };
    refType[shipFactory.TYPE_SUBMARINE] = {
        color: "#56988c",
        life: 4,
        name: "Submarine"
    };
    refType[shipFactory.TYPE_SMALL_SHIP] = {
        color: "#203140",
        life: 3,
        name: "small-ship"
    };

  // Expose l'objet à l'exterieur du scope de la fonction.
  // Depuis l'extérieur, vous pouvez l'utilisé ainsi :
  // var monDestroyer = shipFactory.build(shipFactory.TYPE_DESTROYER)
    global.shipFactory = shipFactory;
}(this));
