"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CustomError_1 = require("../exceptions/CustomError");
var LayoutManager = /** @class */ (function () {
    function LayoutManager(layoutProvider, dimensions, isHorizontal, cachedLayouts) {
        if (isHorizontal === void 0) { isHorizontal = false; }
        this._layoutProvider = layoutProvider;
        this._window = dimensions;
        this._totalHeight = 0;
        this._totalWidth = 0;
        this._layouts = cachedLayouts ? cachedLayouts : [];
        this._isHorizontal = isHorizontal;
    }
    LayoutManager.prototype.getLayoutDimension = function () {
        return { height: this._totalHeight, width: this._totalWidth };
    };
    LayoutManager.prototype.getLayouts = function () {
        return this._layouts;
    };
    LayoutManager.prototype.getOffsetForIndex = function (index) {
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
    LayoutManager.prototype.overrideLayout = function (index, dim) {
        var layout = this._layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
    };
    LayoutManager.prototype.setMaxBounds = function (itemDim) {
        if (this._isHorizontal) {
            itemDim.height = Math.min(this._window.height, itemDim.height);
        }
        else {
            itemDim.width = Math.min(this._window.width, itemDim.width);
        }
    };
    //TODO:Talha laziliy calculate in future revisions
    LayoutManager.prototype.reLayoutFromIndex = function (startIndex, itemCount) {
        startIndex = this._locateFirstNeighbourIndex(startIndex);
        var startX = 0;
        var startY = 0;
        var maxBound = 0;
        var startVal = this._layouts[startIndex];
        if (startVal) {
            startX = startVal.x;
            startY = startVal.y;
            this._pointDimensionsToRect(startVal);
        }
        var oldItemCount = this._layouts.length;
        var itemDim = { height: 0, width: 0 };
        var itemRect = null;
        var oldLayout = null;
        for (var i = startIndex; i < itemCount; i++) {
            oldLayout = this._layouts[i];
            if (oldLayout && oldLayout.isOverridden) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            }
            else {
                this._layoutProvider.setLayoutForType(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
            }
            this.setMaxBounds(itemDim);
            while (!this._checkBounds(startX, startY, itemDim, this._isHorizontal)) {
                if (this._isHorizontal) {
                    startX += maxBound;
                    startY = 0;
                    this._totalWidth += maxBound;
                }
                else {
                    startX = 0;
                    startY += maxBound;
                    this._totalHeight += maxBound;
                }
                maxBound = 0;
            }
            maxBound = this._isHorizontal ? Math.max(maxBound, itemDim.width) : Math.max(maxBound, itemDim.height);
            //TODO: Talha creating array upfront will speed this up
            if (i > oldItemCount - 1) {
                this._layouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });
            }
            else {
                itemRect = this._layouts[i];
                itemRect.x = startX;
                itemRect.y = startY;
                itemRect.width = itemDim.width;
                itemRect.height = itemDim.height;
            }
            if (this._isHorizontal) {
                startY += itemDim.height;
            }
            else {
                startX += itemDim.width;
            }
        }
        if (oldItemCount > itemCount) {
            this._layouts.splice(itemCount, oldItemCount - itemCount);
        }
        this._setFinalDimensions(maxBound);
    };
    LayoutManager.prototype._pointDimensionsToRect = function (itemRect) {
        if (this._isHorizontal) {
            this._totalWidth = itemRect.x;
        }
        else {
            this._totalHeight = itemRect.y;
        }
    };
    LayoutManager.prototype._setFinalDimensions = function (maxBound) {
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth += maxBound;
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight += maxBound;
        }
    };
    LayoutManager.prototype._locateFirstNeighbourIndex = function (startIndex) {
        if (startIndex === 0) {
            return 0;
        }
        var i = startIndex - 1;
        for (; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[i].y === 0) {
                    break;
                }
            }
            else if (this._layouts[i].x === 0) {
                break;
            }
        }
        return i;
    };
    LayoutManager.prototype._checkBounds = function (itemX, itemY, itemDim, isHorizontal) {
        return isHorizontal ? (itemY + itemDim.height <= this._window.height) : (itemX + itemDim.width <= this._window.width);
    };
    return LayoutManager;
}());
exports.default = LayoutManager;
//# sourceMappingURL=LayoutManager.js.map