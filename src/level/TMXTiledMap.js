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
         * return all the existing object group definition
         * @name me.TMXTileMap#getObjectGroups
         * @public
         * @function
         * @return {me.TMXObjectGroup[]} Array of Groups
         */
        getObjectGroups : function () {
            return this.getChildByType(me.TMXObjectGroup);
        },

        /**
         * return an Array of instantiated objects, based on the object group definition
         * @name me.TMXTileMap#getObjects
         * @public
         * @function
         * @param {boolean} flatten if true, flatten all objects into the returned array, <br>
         * ignoring all defined groups (no sub containers will be created)
         * @return {me.Renderable[]} Array of Objects
         */
        getObjects : function (flatten) {
            var objects = [];
            var objectGroups = this.getObjectGroups();
            var isCollisionGroup = false;
            var targetContainer;
            
            for (var g = 0; g < objectGroups.length; g++) {
                var group = objectGroups[g];

                // check if this is the collision shape group
                isCollisionGroup = group.name.toLowerCase().contains(me.TMXConstants.COLLISION_GROUP);
               
                if (flatten === false) {
                    // create a new container with Infinite size (?)
                    // note: initial position and size seems to be meaningless in Tiled
                    // https://github.com/bjorn/tiled/wiki/TMX-Map-Format :
                    // x: Defaults to 0 and can no longer be changed in Tiled Qt.
                    // y: Defaults to 0 and can no longer be changed in Tiled Qt.
                    // width: The width of the object group in tiles. Meaningless.
                    // height: The height of the object group in tiles. Meaningless.
                    targetContainer = new me.Container();

                    // set additional properties
                    targetContainer.name = group.name;
                    targetContainer.z = group.z;
                    targetContainer.setOpacity(group.opacity);

                    // disable auto-sort
                    targetContainer.autoSort = false;
                }
                
                // iterate through the group and add all object into their
                // corresponding target Container
                for (var o = 0; o < group.objects.length; o++) {
                    // TMX object settings
                    var settings = group.objects[o];

                    var obj = me.pool.pull(
                        settings.name || "me.Entity",
                        settings.x, settings.y,
                        settings
                    );

                    // check if a me.Tile object is embedded
                    if (typeof (settings.tile) === "object" && !obj.renderable) {
                        obj.renderable = settings.tile.getRenderable(settings);
                    }

                    if (isCollisionGroup && !settings.name) {
                        // configure the body accordingly
                        obj.body.collisionType = me.collision.types.WORLD_SHAPE;
                    }

                    // skip if the pull function does not return a corresponding object
                    if (typeof obj !== "object") {
                        continue;
                    }
                    
                    // set the obj z order correspondingly to its parent container/group
                    obj.z = group.z;

                    //apply group opacity value to the child objects if group are merged
                    if (flatten === true) {
                        if (obj.isRenderable === true) {
                            obj.setOpacity(obj.getOpacity() * group.opacity);
                            // and to child renderables if any
                            if (obj.renderable instanceof me.Renderable) {
                                obj.renderable.setOpacity(obj.renderable.getOpacity() * group.opacity);
                            }
                        }
                        // directly add the obj into the objects array
                        objects.push(obj);
                    } else /* false*/ {
                        // add it to the new container
                        targetContainer.addChild(obj);
                    }

                }
                
                // if we created a new container
                if ((flatten === false) && (targetContainer.children.length > 0)) {

                    // re-enable auto-sort
                    targetContainer.autoSort = true;
                    
                    // add our container to the world
                    objects.push(targetContainer);
                }
            }
            return objects;
        },
        
        /**
         * return all the existing layers
         * @name me.TMXTileMap#getLayers
         * @public
         * @function
         * @return {me.TMXLayer[]} Array of Layers
         */
        getLayers : function () {
            return this.getChildByType(me.TMXLayer).concat(this.getChildByType(me.ImageLayer)).concat(this.getChildByType(me.ColorLayer));
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
