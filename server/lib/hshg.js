/***
Can't be bothered to touch this shit yet.

- damocles
***/

/***
you never will because we fired you lol

- zephi
***/

/***
Shit goes here, touchy-touchy.

- Toothless
***/

// Hierarchical Spatial Hash Grid: HSHG
// https://gist.github.com/kirbysayshi/1760774
(function(root, undefined) {
    //---------------------------------------------------------------------
    // GLOBAL FUNCTIONS
    //---------------------------------------------------------------------

    /**
     * Updates every object's position in the grid, but only if
     * the hash value for that object has changed.
     * This method DOES NOT take into account object expansion or
     * contraction, just position, and does not attempt to change
     * the grid the object is currently in; it only (possibly) changes
     * the cell.
     *
     * If the object has significantly changed in size, the best bet is to
     * call removeObject() and addObject() sequentially, outside of the
     * normal update cycle of HSHG.
     *
     * @return void desc
     */
    function update_RECOMPUTE() {
        var i, obj, grid, meta, objAABB, newObjHash;

        // for each object
        for (i = 0; i < this._globalObjects.length; i++) {
            obj = this._globalObjects[i];
            meta = obj.HSHG;
            grid = meta.grid;

            // recompute hash
            objAABB = obj.getAABB();
            newObjHash = grid.toHash(objAABB.min[0], objAABB.min[1]);

            if (newObjHash !== meta.hash) {
                // grid position has changed, update!
                grid.removeObject(obj, false);
                grid.addObject(obj, newObjHash);
            }
        }
    }

    // not implemented yet :)
    function update_REMOVEALL() {}

    function testAABBOverlap(objA, objB) {
        var a = objA.getAABB(),
            b = objB.getAABB();

        if (!a.active && !b.active) return false;

        return !(
            a.min[0] > b.max[0] ||
            a.min[1] > b.max[1] ||
            a.max[0] < b.min[0] ||
            a.max[1] < b.min[1]
        );
    }

    function getLongestAABBEdge(min, max) {
        return Math.max(
            Math.abs(max[0] - min[0]),
            Math.abs(max[1] - min[1])
        );
    }

    //---------------------------------------------------------------------
    // ENTITIES
    //---------------------------------------------------------------------

    function HSHG() {
        this.MAX_OBJECT_CELL_DENSITY = 1 / 8; // objects / cells
        this.INITIAL_GRID_LENGTH = 256; // 16x16
        this.HIERARCHY_FACTOR = 2;
        this.HIERARCHY_FACTOR_SQRT = Math.SQRT2;
        this.UPDATE_METHOD = update_RECOMPUTE; // or update_REMOVEALL

        this._grids = [];
        this._globalObjects = [];
    }

    HSHG.prototype.addObject = function(obj) {
        var objAABB = obj.getAABB(),
            objSize = getLongestAABBEdge(objAABB.min, objAABB.max),
            newGrid = this.findOrCreateGridFor(objSize);

        // for HSHG metadata
        obj.HSHG = {
            globalObjectsIndex: this._globalObjects.length,
            hash: null,
            grid: newGrid
        };

        // add to global object array
        this._globalObjects.push(obj);

        newGrid.addObject(obj);
    };

    HSHG.prototype.findOrCreateGridFor = function(objSize) {
        var grid, x, i, oneGrid;

        if (this._grids.length == 0) {
            // no grids exist yet
            grid = new Grid(objSize * this.HIERARCHY_FACTOR_SQRT, this.INITIAL_GRID_LENGTH, this);
            grid.initCells();
            this._grids.push(grid);
        } else {
            x = 0;

            // grids are sorted by cellSize, smallest to largest
            for (i = 0; i < this._grids.length; i++) {
                oneGrid = this._grids[i];
                x = oneGrid.cellSize;
                if (objSize < x) {
                    x = x / this.HIERARCHY_FACTOR;
                    if (objSize < x) {
                        // find appropriate size
                        while (objSize < x) {
                            x = x / this.HIERARCHY_FACTOR;
                        }
                        grid = new Grid(x * this.HIERARCHY_FACTOR, this.INITIAL_GRID_LENGTH, this);
                        grid.initCells();
                        this._grids.splice(i, 0, grid);
                    } else {
                        grid = oneGrid;
                    }
                    return grid;
                }
            }

            while (objSize >= x) {
                x = x * this.HIERARCHY_FACTOR;
            }

            grid = new Grid(x, this.INITIAL_GRID_LENGTH, this);
            grid.initCells();
            this._grids.push(grid);
        }

        return grid;
    };

    HSHG.prototype.checkIfInHSHG = function(obj) {
        var meta = obj.HSHG;

        return meta !== undefined;
    };

    HSHG.prototype.removeObject = function(obj) {
        var meta = obj.HSHG,
            globalObjectsIndex,
            replacementObj;

        if (meta === undefined) throw Error(obj + " was not in the HSHG.");

        // remove object from global object list
        globalObjectsIndex = meta.globalObjectsIndex;
        if (globalObjectsIndex === this._globalObjects.length - 1) {
            this._globalObjects.pop();
        } else {
            replacementObj = this._globalObjects.pop();
            replacementObj.HSHG.globalObjectsIndex = globalObjectsIndex;
            this._globalObjects[globalObjectsIndex] = replacementObj;
        }

        meta.grid.removeObject(obj);

        // remove meta data
        delete obj.HSHG;
    };

    HSHG.prototype.update = function() {
        this.UPDATE_METHOD.call(this);
    };

    HSHG.prototype.queryForCollisionPairs = function(broadOverlapTestCallback) {
        var i, j, k, l, c, grid, cell, objA, objB, offset, adjacentCell, biggerGrid, objAAABB, objAHashInBiggerGrid, possibleCollisions = [],
            broadOverlapTest;

        // default broad test to internal aabb overlap test
        broadOverlapTest = broadOverlapTestCallback || testAABBOverlap;

        // for all grids ordered by cell size ASC
        for (i = 0; i < this._grids.length; i++) {
            grid = this._grids[i];

            // for each cell of the grid that is occupied
            for (j = 0; j < grid.occupiedCells.length; j++) {
                cell = grid.occupiedCells[j];

                // collide all objects within the occupied cell
                for (k = 0; k < cell.objectContainer.length; k++) {
                    objA = cell.objectContainer[k];
                    if (!objA.getAABB().active) continue;
                    for (l = k + 1; l < cell.objectContainer.length; l++) {
                        objB = cell.objectContainer[l];
                        if (!objB.getAABB().active) continue;
                        if (broadOverlapTest(objA, objB) === true) {
                            possibleCollisions.push([objA, objB]);
                        }
                    }
                }

                // for the first half of all adjacent cells (offset 4 is the current cell)
                for (c = 0; c < 4; c++) {
                    offset = cell.neighborOffsetArray[c];

                    adjacentCell = grid.allCells[cell.allCellsIndex + offset];

                    // collide all objects in cell with adjacent cell
                    for (k = 0; k < cell.objectContainer.length; k++) {
                        objA = cell.objectContainer[k];
                        if (!objA.getAABB().active) continue;
                        for (l = 0; l < adjacentCell.objectContainer.length; l++) {
                            objB = adjacentCell.objectContainer[l];
                            if (!objB.getAABB().active) continue;
                            if (broadOverlapTest(objA, objB) === true) {
                                possibleCollisions.push([objA, objB]);
                            }
                        }
                    }
                }
            }

            // forall objects that are stored in this grid
            for (j = 0; j < grid.allObjects.length; j++) {
                objA = grid.allObjects[j];
                objAAABB = objA.getAABB();
                if (!objAAABB.active) continue;
                // for all grids with cellsize larger than grid
                for (k = i + 1; k < this._grids.length; k++) {
                    biggerGrid = this._grids[k];
                    objAHashInBiggerGrid = biggerGrid.toHash(objAAABB.min[0], objAAABB.min[1]);
                    cell = biggerGrid.allCells[objAHashInBiggerGrid];

                    // check objA against every object in all cells in offset array of cell
                    // for all adjacent cells...
                    for (c = 0; c < cell.neighborOffsetArray.length; c++) {
                        offset = cell.neighborOffsetArray[c];

                        adjacentCell = biggerGrid.allCells[cell.allCellsIndex + offset];

                        // for all objects in the adjacent cell...
                        for (l = 0; l < adjacentCell.objectContainer.length; l++) {
                            objB = adjacentCell.objectContainer[l];
                            if (!objB.getAABB().active) continue;
                            // test against object A
                            if (broadOverlapTest(objA, objB) === true) {
                                possibleCollisions.push([objA, objB]);
                            }
                        }
                    }
                }
            }
        }

        // return list of object pairs
        return possibleCollisions;
    };

    HSHG.update_RECOMPUTE = update_RECOMPUTE;
    HSHG.update_REMOVEALL = update_REMOVEALL;

    /**
     * Grid
     *
     * @constructor
     * @param int cellSize the pixel size of each cell of the grid
     * @param int cellCount the total number of cells for the grid (width x height)
     * @param HSHG parentHierarchy the HSHG to which this grid belongs
     * @return void
     */
    function Grid(cellSize, cellCount, parentHierarchy) {
        this.cellSize = cellSize;
        this.inverseCellSize = 1 / cellSize;
        this.rowColumnCount = ~~Math.sqrt(cellCount);
        this.xyHashMask = this.rowColumnCount - 1;
        this.occupiedCells = [];
        this.allCells = Array(this.rowColumnCount * this.rowColumnCount);
        this.allObjects = [];
        this.sharedInnerOffsets = [];

        this._parentHierarchy = parentHierarchy || null;
    }

    Grid.prototype.initCells = function() {
        var i, gridLength = this.allCells.length,
            x, y, wh = this.rowColumnCount,
            isOnRightEdge, isOnLeftEdge, isOnTopEdge, isOnBottomEdge,
            innerOffsets = [wh - 1, wh, wh + 1, -1, 0, 1, -1 + -wh, -wh, -wh + 1],
            leftOffset, rightOffset, topOffset, bottomOffset,
            uniqueOffsets = [],
            cell;

        this.sharedInnerOffsets = innerOffsets;

        // init all cells, creating offset arrays as needed

        for (i = 0; i < gridLength; i++) {
            cell = new Cell();
            // compute row (y) and column (x) for an index
            y = ~~(i / this.rowColumnCount);
            x = ~~(i - y * this.rowColumnCount);

            // reset / init
            isOnRightEdge = false;
            isOnLeftEdge = false;
            isOnTopEdge = false;
            isOnBottomEdge = false;

            // right or left edge cell
            if ((x + 1) % this.rowColumnCount == 0) {
                isOnRightEdge = true;
            } else if (x % this.rowColumnCount == 0) {
                isOnLeftEdge = true;
            }

            // top or bottom edge cell
            if ((y + 1) % this.rowColumnCount == 0) {
                isOnTopEdge = true;
            } else if (y % this.rowColumnCount == 0) {
                isOnBottomEdge = true;
            }

            // if cell is edge cell, use unique offsets, otherwise use inner offsets
            if (isOnRightEdge || isOnLeftEdge || isOnTopEdge || isOnBottomEdge) {
                // figure out cardinal offsets first
                rightOffset = isOnRightEdge === true ? -wh + 1 : 1;
                leftOffset = isOnLeftEdge === true ? wh - 1 : -1;
                topOffset = isOnTopEdge === true ? -gridLength + wh : wh;
                bottomOffset = isOnBottomEdge === true ? gridLength - wh : -wh;

                // diagonals are composites of the cardinals
                uniqueOffsets = [
                    leftOffset + topOffset,
                    topOffset,
                    rightOffset + topOffset,
                    leftOffset,
                    0,
                    rightOffset,
                    leftOffset + bottomOffset,
                    bottomOffset,
                    rightOffset + bottomOffset
                ];

                cell.neighborOffsetArray = uniqueOffsets;
            } else {
                cell.neighborOffsetArray = this.sharedInnerOffsets;
            }

            cell.allCellsIndex = i;
            this.allCells[i] = cell;
        }
    };

    Grid.prototype.toHash = function(x, y, z) {
        var i, xHash, yHash;

        if (x < 0) {
            i = -x * this.inverseCellSize;
            xHash = this.rowColumnCount - 1 - (~~i & this.xyHashMask);
        } else {
            i = x * this.inverseCellSize;
            xHash = ~~i & this.xyHashMask;
        }

        if (y < 0) {
            i = -y * this.inverseCellSize;
            yHash = this.rowColumnCount - 1 - (~~i & this.xyHashMask);
        } else {
            i = y * this.inverseCellSize;
            yHash = ~~i & this.xyHashMask;
        }

        return xHash + yHash * this.rowColumnCount;
    };

    Grid.prototype.addObject = function(obj, hash) {
        var objAABB = obj.getAABB(),
            objHash = hash === undefined ? this.toHash(objAABB.min[0], objAABB.min[1]) : hash,
            targetCell = this.allCells[objHash];

        if (obj.HSHG === undefined) throw Error(obj + " was passed directly to the grid.");

        // add to cell
        targetCell.objectContainer.push(obj);

        // add to cell list
        if (targetCell.objectContainer.length === 1) {
            this.occupiedCells.push(targetCell);
        }

        // update obj's HSHG meta data
        obj.HSHG.hash = objHash;
        obj.HSHG.grid = this;

        // we can assume that the object is already added (for whatever reason) to the
        // HSHG global list

        this.allObjects.push(obj);
    };

    // Set deleteGrid property to false if you are readding object
    Grid.prototype.removeObject = function(obj, deleteGrid = true) {
        var meta = obj.HSHG,
            hash, targetCell, cellObjects,
            i, cellObjectCount;

        if (meta === undefined) throw Error(obj + " was not in the HSHG.");

        // remove from cell
        hash = meta.hash;
        targetCell = this.allCells[hash];
        cellObjects = targetCell.objectContainer;
        cellObjectCount = cellObjects.length;

        // find index of obj in cell
        for (i = 0; i < cellObjectCount; i++) {
            if (cellObjects[i] === obj) {
                cellObjects.splice(i, 1);
                break;
            }
        }

        // if that was the last object in the cell, remove the cell from the
        // occupied list
        if (cellObjects.length === 0) {
            for (i = 0; i < this.occupiedCells.length; i++) {
                if (this.occupiedCells[i] === targetCell) {
                    this.occupiedCells.splice(i, 1);
                    break;
                }
            }
        }

        // remove object from global object list
        cellObjectCount = this.allObjects.length;
        for (i = 0; i < cellObjectCount; i++) {
            if (this.allObjects[i] === obj) {
                this.allObjects.splice(i, 1);
                break;
            }
        }

        // remove meta data
        if (deleteGrid) delete obj.HSHG;
    };

    function Cell() {
        this.objectContainer = [];
        this.neighborOffsetArray = [];
        this.allCellsIndex = -1;
    }

    //---------------------------------------------------------------------
    // EXPORTS
    //---------------------------------------------------------------------

    root.HSHG = HSHG;
})(this);
