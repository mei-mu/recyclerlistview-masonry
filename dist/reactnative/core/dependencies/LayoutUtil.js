"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
var LayoutProvider_1 = require("./LayoutProvider");
var LayoutUtil = /** @class */ (function () {
    function LayoutUtil() {
    }
    LayoutUtil.getWindowWidth = function () {
        // To deal with precision issues on android
        return Math.round(react_native_1.Dimensions.get("window").width * 1000) / 1000 - 6; //Adjustment for margin given to RLV;
    };
    LayoutUtil.getLayoutProvider = function (data) {
        return new LayoutProvider_1.default(function (index) {
            return data[index] != null && data[index].viewType != null
                ? data[index].viewType
                : LayoutProvider_1.LayoutType.SINGLE; //Since we have just one view type
        }, function (type, dim, index) {
            var dataElement = data[index];
            var columnWidth = 0;
            var columnHeight = 0;
            switch (type) {
                case LayoutProvider_1.LayoutType.SPAN:
                    columnWidth = LayoutUtil.getWindowWidth();
                    columnHeight =
                        (columnWidth * dataElement.height) / dataElement.width;
                    break;
                case LayoutProvider_1.LayoutType.SINGLE:
                    columnWidth = LayoutUtil.getWindowWidth() / 2;
                    columnHeight =
                        (columnWidth * dataElement.height) / dataElement.width;
                default:
                    break;
            }
            dim.width = columnWidth;
            dim.height = columnHeight;
        });
    };
    return LayoutUtil;
}());
exports.LayoutUtil = LayoutUtil;
//# sourceMappingURL=LayoutUtil.js.map