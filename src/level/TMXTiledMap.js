/*
 * MelonJS Game Engine
 * Copyright (C) 2011 - 2015, Olivier Biot, Jason Oster, Aaron McLeod
 * http://www.melonjs.org
 *
 * Tile QT +0.7.x format
 * http://www.mapeditor.org/
 *
 */
(function () {
    /**
     * a TMX Tile Map Object
     * Tiled QT +0.7.x format
     * @class
     * @extends me.Container
     * @memberOf me
     * @constructor
     * @param {String} levelId name of TMX map
     */
    me.TMXTileMap = me.Container.extend({
        // constructor
        init: function (levelId) {
            // map id
            this.levelId = levelId;

            // map default z order
            this.z = 0;

            /**
             * name of the tilemap
             * @public
             * @type String
             * @name me.TMXTileMap#name
             */
            this.name = null;

            /**
             * width of the tilemap in tiles
             * @public
             * @type Int
             * @name me.TMXTileMap#cols
             */
            this.cols = 0;

            /**
             * height of the tilemap in tiles
             * @public
             * @type Int
             * @name me.TMXTileMap#rows
             */
            this.rows = 0;

            /**
             * Tile width
             * @public
             * @type Int
             * @name me.TMXTileMap#tilewidth
             */
            this.tilewidth = 0;

            /**
             * Tile height
             * @public
             * @type Int
             * @name me.TMXTileMap#tileheight
             */
            this.tileheight = 0;

            // corresponding tileset for this map
            this.tilesets = null;
            
            // tilemap version
            this.version = "";

            // map type (orthogonal or isometric)
            this.orientation = "";

            // loading flag
            this.initialized = false;

            this._super(me.Container, "init", [0, 0, 0, 0]);
        },

        /**
         * Center the map on the viewport
         * @name me.TMXTileMap#moveToCenter
         * @public
         * @function
         */
        moveToCenter: function () {
            // center the map if smaller than the current viewport
            var width = me.game.viewport.width,
                height = me.game.viewport.height;
            if ((this.width < width) || (this.height < height)) {
                var shiftX =  ~~((width - this.width) / 2);
                var shiftY =  ~~((height - this.height) / 2);
                // update the map default position
                this.pos.set(
                    shiftX > 0 ? shiftX : 0,
                    shiftY > 0 ? shiftY : 0
                );
            }
        },

        /**
         * clear the tile at the specified position from all layers
         * @name me.TMXTileMap#clearTile
         * @public
         * @function
         * @param {Number} x x position
         * @param {Number} y y position
         */
        clearTile : function (x, y) {
            var layers = this.getChildByType(me.TMXLayer);
            // add all layers
            for (var i = layers.length; i--;) {
                // that are visible
                layers[i].clearTile(x, y);
            }
        },

        /**
         * destroy function, clean all allocated objects
         * @ignore
         */
        destroy : function () {
            this._super(me.Container, "destroy");
            // call parent reset function
            this.tilesets = null;
            this.pos.set(0, 0);
            this.initialized = false;
        }
    });
})();
