"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
var DataProvider = /** @class */ (function () {
    function DataProvider(rowHasChanged) {
        this._firstIndexToProcess = 0;
        this._size = 0;
        this._data = [];
        this.rowHasChanged = rowHasChanged;
    }
    DataProvider.prototype.getDataForIndex = function (index) {
        return this._data[index];
    };
    DataProvider.prototype.getAllData = function () {
        return this._data;
    };
    DataProvider.prototype.getSize = function () {
        return this._size;
    };
    DataProvider.prototype.getFirstIndexToProcessInternal = function () {
        return this._firstIndexToProcess;
    };
    //No need to override this one
    DataProvider.prototype.cloneWithRows = function (newData) {
        var dp = new DataProvider(this.rowHasChanged);
        var newSize = newData.length;
        var iterCount = Math.min(this._size, newSize);
        var i = 0;
        for (i = 0; i < iterCount; i++) {
            if (this.rowHasChanged(this._data[i], newData[i])) {
                break;
            }
        }
        dp._firstIndexToProcess = i;
        dp._data = newData;
        dp._size = newSize;
        return dp;
    };
    return DataProvider;
}());
exports.default = DataProvider;
//# sourceMappingURL=DataProvider.js.map