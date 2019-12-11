"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RecycleItemPool_1 = require("../utils/RecycleItemPool");
var CustomError_1 = require("./exceptions/CustomError");
var RecyclerListViewExceptions_1 = require("./exceptions/RecyclerListViewExceptions");
var ViewabilityTracker_1 = require("./ViewabilityTracker");
var ts_object_utils_1 = require("ts-object-utils");
var TSCast_1 = require("../utils/TSCast");
var VirtualRenderer = /** @class */ (function () {
    function VirtualRenderer(renderStackChanged, scrollOnNextUpdate, isRecyclingEnabled) {
        this._layoutProvider = TSCast_1.default.cast(null); //TSI
        this._recyclePool = TSCast_1.default.cast(null); //TSI
        this._layoutManager = null;
        this._viewabilityTracker = null;
        //Keeps track of items that need to be rendered in the next render cycle
        this._renderStack = {};
        //Keeps track of keys of all the currently rendered indexes, can eventually replace renderStack as well if no new use cases come up
        this._renderStackIndexKeyMap = {};
        this._renderStackChanged = renderStackChanged;
        this._scrollOnNextUpdate = scrollOnNextUpdate;
        this._dimensions = null;
        this._params = null;
        this._isRecyclingEnabled = isRecyclingEnabled;
        this._isViewTrackerRunning = false;
        //Would be surprised if someone exceeds this
        this._startKey = 0;
        this.onVisibleItemsChanged = null;
        this._onEngagedItemsChanged = this._onEngagedItemsChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
    }
    VirtualRenderer.prototype.getLayoutDimension = function () {
        if (this._layoutManager) {
            return this._layoutManager.getLayoutDimension();
        }
        return { height: 0, width: 0 };
    };
    VirtualRenderer.prototype.updateOffset = function (offsetX, offsetY) {
        if (this._viewabilityTracker) {
            if (!this._isViewTrackerRunning) {
                this.startViewabilityTracker();
            }
            if (this._params && this._params.isHorizontal) {
                this._viewabilityTracker.updateOffset(offsetX);
            }
            else {
                this._viewabilityTracker.updateOffset(offsetY);
            }
        }
    };
    VirtualRenderer.prototype.attachVisibleItemsListener = function (callback) {
        this.onVisibleItemsChanged = callback;
    };
    VirtualRenderer.prototype.removeVisibleItemsListener = function () {
        this.onVisibleItemsChanged = null;
        if (this._viewabilityTracker) {
            this._viewabilityTracker.onVisibleRowsChanged = null;
        }
    };
    VirtualRenderer.prototype.getLayoutManager = function () {
        return this._layoutManager;
    };
    VirtualRenderer.prototype.setParamsAndDimensions = function (params, dim) {
        this._params = params;
        this._dimensions = dim;
    };
    VirtualRenderer.prototype.setLayoutManager = function (layoutManager) {
        this._layoutManager = layoutManager;
        if (this._params) {
            this._layoutManager.reLayoutFromIndex(0, this._params.itemCount);
        }
    };
    VirtualRenderer.prototype.setLayoutProvider = function (layoutProvider) {
        this._layoutProvider = layoutProvider;
    };
    VirtualRenderer.prototype.getViewabilityTracker = function () {
        return this._viewabilityTracker;
    };
    VirtualRenderer.prototype.refreshWithAnchor = function () {
        if (this._viewabilityTracker) {
            var firstVisibleIndex = this._viewabilityTracker.findFirstLogicallyVisibleIndex();
            this._prepareViewabilityTracker();
            var offset = 0;
            if (this._layoutManager && this._params) {
                var point = this._layoutManager.getOffsetForIndex(firstVisibleIndex);
                this._scrollOnNextUpdate(point);
                offset = this._params.isHorizontal ? point.x : point.y;
            }
            this._viewabilityTracker.forceRefreshWithOffset(offset);
        }
    };
    VirtualRenderer.prototype.refresh = function () {
        if (this._viewabilityTracker) {
            this._prepareViewabilityTracker();
            if (this._viewabilityTracker.forceRefresh()) {
                if (this._params && this._params.isHorizontal) {
                    this._scrollOnNextUpdate({ x: this._viewabilityTracker.getLastOffset(), y: 0 });
                }
                else {
                    this._scrollOnNextUpdate({ x: 0, y: this._viewabilityTracker.getLastOffset() });
                }
            }
        }
    };
    VirtualRenderer.prototype.getInitialOffset = function () {
        var offset = { x: 0, y: 0 };
        if (this._params) {
            var initialRenderIndex = ts_object_utils_1.Default.value(this._params.initialRenderIndex, 0);
            if (initialRenderIndex > 0 && this._layoutManager) {
                offset = this._layoutManager.getOffsetForIndex(initialRenderIndex);
                this._params.initialOffset = this._params.isHorizontal ? offset.x : offset.y;
            }
            else {
                if (this._params.isHorizontal) {
                    offset.x = ts_object_utils_1.Default.value(this._params.initialOffset, 0);
                    offset.y = 0;
                }
                else {
                    offset.y = ts_object_utils_1.Default.value(this._params.initialOffset, 0);
                    offset.x = 0;
                }
            }
        }
        return offset;
    };
    VirtualRenderer.prototype.init = function () {
        this.getInitialOffset();
        this._recyclePool = new RecycleItemPool_1.default();
        if (this._params) {
            this._viewabilityTracker = new ViewabilityTracker_1.default(ts_object_utils_1.Default.value(this._params.renderAheadOffset, 0), ts_object_utils_1.Default.value(this._params.initialOffset, 0));
        }
        else {
            this._viewabilityTracker = new ViewabilityTracker_1.default(0, 0);
        }
        this._prepareViewabilityTracker();
    };
    VirtualRenderer.prototype.startViewabilityTracker = function () {
        if (this._viewabilityTracker) {
            this._isViewTrackerRunning = true;
            this._viewabilityTracker.init();
        }
    };
    VirtualRenderer.prototype._getNewKey = function () {
        return this._startKey++;
    };
    VirtualRenderer.prototype._prepareViewabilityTracker = function () {
        if (this._viewabilityTracker && this._layoutManager && this._dimensions && this._params) {
            this._viewabilityTracker.onEngagedRowsChanged = this._onEngagedItemsChanged;
            if (this.onVisibleItemsChanged) {
                this._viewabilityTracker.onVisibleRowsChanged = this._onVisibleItemsChanged;
            }
            this._viewabilityTracker.setLayouts(this._layoutManager.getLayouts(), this._params.isHorizontal
                ? this._layoutManager.getLayoutDimension().width
                : this._layoutManager.getLayoutDimension().height);
            this._viewabilityTracker.setDimensions({
                height: this._dimensions.height,
                width: this._dimensions.width,
            }, ts_object_utils_1.Default.value(this._params.isHorizontal, false));
        }
        else {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.initializationException);
        }
    };
    VirtualRenderer.prototype._onVisibleItemsChanged = function (all, now, notNow) {
        if (this.onVisibleItemsChanged) {
            this.onVisibleItemsChanged(all, now, notNow);
        }
    };
    VirtualRenderer.prototype._onEngagedItemsChanged = function (all, now, notNow) {
        var count = notNow.length;
        var resolvedIndex = 0;
        var disengagedIndex = 0;
        if (this._isRecyclingEnabled) {
            for (var i = 0; i < count; i++) {
                disengagedIndex = notNow[i];
                resolvedIndex = this._renderStackIndexKeyMap[disengagedIndex];
                if (this._params && disengagedIndex < this._params.itemCount) {
                    //All the items which are now not visible can go to the recycle pool, the pool only needs to maintain keys since
                    //react can link a view to a key automatically
                    this._recyclePool.putRecycledObject(this._layoutProvider.getLayoutTypeForIndex(disengagedIndex), resolvedIndex);
                }
                else {
                    //Type provider may not be available in this case, use most probable
                    var itemMeta = this._renderStack[resolvedIndex];
                    this._recyclePool.putRecycledObject(itemMeta.type ? itemMeta.type : 0, resolvedIndex);
                }
            }
        }
        if (this._updateRenderStack(now)) {
            //Ask Recycler View to update itself
            this._renderStackChanged(this._renderStack);
        }
    };
    //Updates render stack and reports whether anything has changed
    VirtualRenderer.prototype._updateRenderStack = function (itemIndexes) {
        var count = itemIndexes.length;
        var type = null;
        var availableKey = null;
        var itemMeta = null;
        var index = 0;
        var hasRenderStackChanged = false;
        for (var i = 0; i < count; i++) {
            index = itemIndexes[i];
            availableKey = this._renderStackIndexKeyMap[index];
            if (availableKey >= 0) {
                //Use if already rendered and remove from pool
                this._recyclePool.removeFromPool(availableKey);
                itemMeta = this._renderStack[availableKey];
                if (itemMeta.key !== availableKey) {
                    hasRenderStackChanged = true;
                    itemMeta.key = availableKey;
                }
            }
            else {
                hasRenderStackChanged = true;
                type = this._layoutProvider.getLayoutTypeForIndex(index);
                availableKey = this._recyclePool.getRecycledObject(type);
                if (availableKey) {
                    //If available in pool use that key instead
                    availableKey = parseInt(availableKey, 10);
                    itemMeta = this._renderStack[availableKey];
                    if (!itemMeta) {
                        itemMeta = {};
                        this._renderStack[availableKey] = itemMeta;
                    }
                    itemMeta.key = availableKey;
                    itemMeta.type = type;
                    //since this data index is no longer being rendered anywhere
                    if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(itemMeta.dataIndex)) {
                        delete this._renderStackIndexKeyMap[itemMeta.dataIndex];
                    }
                }
                else {
                    //Create new if no existing key is available
                    itemMeta = {};
                    availableKey = this._getNewKey();
                    itemMeta.key = availableKey;
                    itemMeta.type = type;
                    this._renderStack[availableKey] = itemMeta;
                }
                //TODO:Talha validate if this causes an issue
                //In case of mismatch in pool types we need to make sure only unique data indexes exist in render stack
                //keys are always integers for all practical purposes
                // alreadyRenderedAtKey = this._renderStackIndexKeyMap[index];
                // if (alreadyRenderedAtKey >= 0) {
                //     this._recyclePool.removeFromPool(alreadyRenderedAtKey);
                //     delete this._renderStack[alreadyRenderedAtKey];
                // }
            }
            this._renderStackIndexKeyMap[index] = itemMeta.key;
            itemMeta.dataIndex = index;
        }
        return hasRenderStackChanged;
    };
    return VirtualRenderer;
}());
exports.default = VirtualRenderer;
//# sourceMappingURL=VirtualRenderer.js.map