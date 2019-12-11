"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CustomError_1 = require("../exceptions/CustomError");
var MasonaryLayoutManager = /** @class */ (function () {
    function MasonaryLayoutManager(columnCount, layoutProvider, dimensions, isHorizontal, cachedLayouts) {
        if (isHorizontal === void 0) { isHorizontal = false; }
        this._columnCount = columnCount;
        this._layoutProvider = layoutProvider;
        this._window = dimensions;
        this._totalHeight = 0;
        this._totalWidth = 0;
        this._layouts = cachedLayouts ? cachedLayouts : [];
        this._isHorizontal = isHorizontal;
    }
    MasonaryLayoutManager.prototype.getLayoutDimension = function () {
        return { height: this._totalHeight, width: this._totalWidth };
    };
    MasonaryLayoutManager.prototype.getLayouts = function () {
        return this._layouts;
    };
    MasonaryLayoutManager.prototype.getOffsetForIndex = function (index) {
        if (this._layouts.length > index) {
            return { x: this._layouts[index].x, y: this._layouts[index].y };
        }
        else {
            throw new CustomError_1.default({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    };
    MasonaryLayoutManager.prototype.overrideLayout = function (index, dim) {
        var layout = this._layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
    };
    MasonaryLayoutManager.prototype.setMaxBounds = function (itemDim) {
        if (this._isHorizontal) {
            itemDim.height = Math.min(this._window.height, itemDim.height);
        }
        else {
            itemDim.width = Math.min(this._window.width, itemDim.width);
        }
    };
    MasonaryLayoutManager.prototype.reLayoutFromIndex = function (startIndex, itemCount) {
        // startIndex = this._locateFirstNeighbourIndex(startIndex);
        //TODO find a way to use start index
        startIndex = 0;
        var startX = 0;
        var startY = 0;
        var itemDim = { height: 0, width: 0 };
        var newLayouts = [];
        var columnLenghts = [];
        for (var idx = 0; idx < this._columnCount; idx++) {
            columnLenghts[idx] = 0;
        }
        var minColumnIdxFn = function (cols) { return cols.reduce(function (acc, val, idx, arr) { return (val < arr[acc] ? idx : acc); }, 0); };
        var maxColumnIdxFn = function () { return columnLenghts.reduce(function (acc, val, idx, arr) { return (arr[acc] > val ? acc : idx); }, 0); };
        var colLenght = (this._isHorizontal ? this._window.height : this._window.width) / this._columnCount;
        for (var i = startIndex; i < itemCount; i++) {
            var oldLayout = this._layouts[i];
            if (oldLayout && oldLayout.isOverridden) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            }
            else {
                this._layoutProvider.setLayoutForType(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
            }
            this.setMaxBounds(itemDim);
            var minColumnIdx = minColumnIdxFn(columnLenghts);
            startY = columnLenghts[minColumnIdx];
            startX = colLenght * minColumnIdx;
            if (this._isHorizontal) {
            }
            else {
                if (itemDim.width > colLenght) {
                    startY = columnLenghts[maxColumnIdxFn()];
                    startX = 0;
                }
            }
            newLayouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });
            if (this._isHorizontal) {
                columnLenghts[minColumnIdx] += itemDim.width;
                if (startY + colLenght <= this._window.height) {
                    startY = startY + colLenght;
                }
                else {
                    startY = 0;
                }
                startX = columnLenghts[minColumnIdxFn(columnLenghts)];
            }
            else {
                if (itemDim.width > colLenght) {
                    columnLenghts[maxColumnIdxFn()] += itemDim.height;
                    var currentMaxHeight = columnLenghts[maxColumnIdxFn()];
                    for (var idx = 0; idx < this._columnCount; idx++) {
                        if (idx != maxColumnIdxFn())
                            columnLenghts[idx] = currentMaxHeight;
                    }
                }
                else {
                    columnLenghts[minColumnIdx] += itemDim.height;
                }
            }
        }
        this._layouts = newLayouts;
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth = columnLenghts[maxColumnIdxFn()];
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight = columnLenghts[maxColumnIdxFn()];
        }
        console.log("COLUMN LENGTH");
        console.log(columnLenghts);
        console.log("START");
        console.log(startX + " " + startY);
    };
    MasonaryLayoutManager.prototype._checkBounds = function (itemX, itemY, itemDim, isHorizontal) {
        return isHorizontal ? itemY + itemDim.height <= this._window.height : itemX + itemDim.width <= this._window.width;
    };
    return MasonaryLayoutManager;
}());
exports.default = MasonaryLayoutManager;
//# sourceMappingURL=MasonaryLayoutManager.js.map