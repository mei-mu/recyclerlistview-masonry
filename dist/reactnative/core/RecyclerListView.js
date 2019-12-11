"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * DONE: Reduce layout processing on data insert
 * DONE: Add notify data set changed and notify data insert option in data source
 * DONE: Add on end reached callback
 * DONE: Make another class for render stack generator
 * DONE: Simplify rendering a loading footer
 * DONE: Anchor first visible index on any insert/delete data wise
 * DONE: Build Scroll to index
 * DONE: Give viewability callbacks
 * DONE: Add full render logic in cases like change of dimensions
 * DONE: Fix all proptypes
 * DONE: Add Initial render Index support
 * TODO: Destroy less frequently used items in recycle pool, this will help in case of too many types.
 * TODO: Add animated scroll to web scrollviewer
 * TODO: Animate list view transition, including add/remove
 * TODO: Implement sticky headers
 * TODO: Make viewability callbacks configurable
 * TODO: Observe size changes on web to optimize for reflowability
 * TODO: Solve //TSI
 */
var debounce_1 = require("lodash-es/debounce");
var PropTypes = require("prop-types");
var React = require("react");
var ts_object_utils_1 = require("ts-object-utils");
var ContextProvider_1 = require("./dependencies/ContextProvider");
var DataProvider_1 = require("./dependencies/DataProvider");
var CustomError_1 = require("./exceptions/CustomError");
var RecyclerListViewExceptions_1 = require("./exceptions/RecyclerListViewExceptions");
// import LayoutManager, { Point, Rect } from "./layoutmanager/LayoutManager";
var MasonaryLayoutManager_1 = require("./layoutmanager/MasonaryLayoutManager");
var Messages_1 = require("./messages/Messages");
var VirtualRenderer_1 = require("./VirtualRenderer");
var ItemAnimator_1 = require("./ItemAnimator");
//#if [REACT-NATIVE]
var ScrollComponent_1 = require("../platform/reactnative/scrollcomponent/ScrollComponent");
var ViewRenderer_1 = require("../platform/reactnative/viewrenderer/ViewRenderer");
var DefaultJSItemAnimator_1 = require("../platform/reactnative/itemanimators/defaultjsanimator/DefaultJSItemAnimator");
var react_native_1 = require("react-native");
var LayoutUtil_1 = require("./dependencies/LayoutUtil");
var IS_WEB = react_native_1.Platform.OS === "web";
//#endif
/***
 * To use on web, start importing from recyclerlistview/web. To make it even easier specify an alias in you builder of choice.
 */
//#if [WEB]
//  import ScrollComponent from "../platform/web/scrollcomponent/ScrollComponent";
//  import ViewRenderer from "../platform/web/viewrenderer/ViewRenderer";
//  import { DefaultWebItemAnimator as DefaultItemAnimator} from "../platform/web/itemanimators/DefaultWebItemAnimator";
//  const IS_WEB = true;
//#endif
var refreshRequestDebouncer = debounce_1.default(function (executable) {
    executable();
});
var RecyclerListView = /** @class */ (function (_super) {
    __extends(RecyclerListView, _super);
    function RecyclerListView(props) {
        var _this = _super.call(this, props) || this;
        _this._onEndReachedCalled = false;
        _this._initComplete = false;
        _this._relayoutReqIndex = -1;
        _this._params = {
            initialOffset: 0,
            initialRenderIndex: 0,
            isHorizontal: false,
            itemCount: 0,
            renderAheadOffset: 250
        };
        _this._layout = { height: 0, width: 0 };
        _this._pendingScrollToOffset = null;
        _this._tempDim = { height: 0, width: 0 };
        _this._initialOffset = 0;
        _this._scrollComponent = null;
        _this._defaultItemAnimator = new DefaultJSItemAnimator_1.DefaultJSItemAnimator();
        _this._onScroll = _this._onScroll.bind(_this);
        _this._onSizeChanged = _this._onSizeChanged.bind(_this);
        _this._dataHasChanged = _this._dataHasChanged.bind(_this);
        _this.scrollToOffset = _this.scrollToOffset.bind(_this);
        _this._renderStackWhenReady = _this._renderStackWhenReady.bind(_this);
        _this._onViewContainerSizeChange = _this._onViewContainerSizeChange.bind(_this);
        _this._virtualRenderer = new VirtualRenderer_1.default(_this._renderStackWhenReady, function (offset) {
            _this._pendingScrollToOffset = offset;
        }, !props.disableRecycling);
        _this._dataProvider = new DataProvider_1.default(_this.props.rowHasChanged);
        _this._layoutProvider = LayoutUtil_1.LayoutUtil.getLayoutProvider(_this.props.data);
        _this.state = {
            renderStack: {}
        };
        return _this;
    }
    RecyclerListView.prototype.componentWillReceiveProps = function (newProps) {
        this._assertDependencyPresence(newProps);
        this._checkAndChangeLayouts(newProps);
        if (!this.props.onVisibleIndexesChanged) {
            this._virtualRenderer.removeVisibleItemsListener();
        }
        else {
            this._virtualRenderer.attachVisibleItemsListener(this.props.onVisibleIndexesChanged);
        }
        if (this._dataProvider == null)
            this._dataProvider = new DataProvider_1.default(newProps.rowHasChanged);
        else
            this._dataProvider = this._dataProvider.cloneWithRows(newProps.data);
        this._layoutProvider = LayoutUtil_1.LayoutUtil.getLayoutProvider(newProps.data);
    };
    RecyclerListView.prototype.componentDidUpdate = function () {
        // if (this._pendingScrollToOffset) {
        //   const offset = this._pendingScrollToOffset;
        //   this._pendingScrollToOffset = null;
        //   if (this.props.isHorizontal) {
        //     offset.y = 0;
        //   } else {
        //     offset.x = 0;
        //   }
        //   setTimeout(() => {
        //     this.scrollToOffset(offset.x, offset.y, false);
        //   }, 0);
        // }
        this._processOnEndReached();
        this._checkAndChangeLayouts(this.props);
    };
    RecyclerListView.prototype.componentWillUnmount = function () {
        if (this.props.contextProvider) {
            var uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                this.props.contextProvider.save(uniqueKey, this.getCurrentScrollOffset());
                if (this.props.forceNonDeterministicRendering) {
                    if (this._virtualRenderer) {
                        var layoutManager = this._virtualRenderer.getLayoutManager();
                        if (layoutManager) {
                            var layoutsToCache = layoutManager.getLayouts();
                            this.props.contextProvider.save(uniqueKey + "_layouts", JSON.stringify({ layoutArray: layoutsToCache }));
                        }
                    }
                }
            }
        }
    };
    RecyclerListView.prototype.componentWillMount = function () {
        if (this.props.contextProvider) {
            var uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                var offset = this.props.contextProvider.get(uniqueKey);
                if (typeof offset === "number" && offset > 0) {
                    this._initialOffset = offset;
                }
                if (this.props.forceNonDeterministicRendering) {
                    var cachedLayouts = this.props.contextProvider.get(uniqueKey + "_layouts");
                    if (cachedLayouts && typeof cachedLayouts === "string") {
                        this._cachedLayouts = JSON.parse(cachedLayouts).layoutArray;
                    }
                }
                this.props.contextProvider.remove(uniqueKey);
            }
        }
    };
    RecyclerListView.prototype.scrollToIndex = function (index, animate) {
        var layoutManager = this._virtualRenderer.getLayoutManager();
        if (layoutManager) {
            var offsets = layoutManager.getOffsetForIndex(index);
            this.scrollToOffset(offsets.x, offsets.y, animate);
        }
        else {
            console.warn(Messages_1.default.WARN_SCROLL_TO_INDEX); //tslint:disable-line
        }
    };
    RecyclerListView.prototype.scrollToItem = function (data, animate) {
        var count = this._dataProvider.getSize();
        for (var i = 0; i < count; i++) {
            if (this._dataProvider.getDataForIndex(i) === data) {
                this.scrollToIndex(i, animate);
                break;
            }
        }
    };
    RecyclerListView.prototype.scrollToTop = function (animate) {
        this.scrollToOffset(0, 0, animate);
    };
    RecyclerListView.prototype.scrollToEnd = function (animate) {
        var lastIndex = this._dataProvider.getSize() - 1;
        this.scrollToIndex(lastIndex, animate);
    };
    RecyclerListView.prototype.scrollToOffset = function (x, y, animate) {
        if (animate === void 0) { animate = false; }
        if (this._scrollComponent) {
            this._scrollComponent.scrollTo(x, y, animate);
        }
    };
    RecyclerListView.prototype.getCurrentScrollOffset = function () {
        var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
    };
    RecyclerListView.prototype.findApproxFirstVisibleIndex = function () {
        var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker
            ? viewabilityTracker.findFirstLogicallyVisibleIndex()
            : 0;
    };
    RecyclerListView.prototype.render = function () {
        var _this = this;
        return (React.createElement(ScrollComponent_1.default, __assign({ ref: function (scrollComponent) {
                return (_this._scrollComponent = scrollComponent);
            } }, this.props, this.props.scrollViewProps, { onScroll: this._onScroll, onSizeChanged: this._onSizeChanged, contentHeight: this._initComplete
                ? this._virtualRenderer.getLayoutDimension().height
                : 0, contentWidth: this._initComplete
                ? this._virtualRenderer.getLayoutDimension().width
                : 0 }), this._generateRenderStack()));
    };
    RecyclerListView.prototype._checkAndChangeLayouts = function (newProps, forceFullRender) {
        this._params.isHorizontal = newProps.isHorizontal;
        this._params.itemCount = this._dataProvider.getSize();
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        if (forceFullRender ||
            this.props.data !== newProps.data ||
            this.props.isHorizontal !== newProps.isHorizontal) {
            //TODO:Talha use old layout manager
            this._virtualRenderer.setLayoutManager(new MasonaryLayoutManager_1.default(2, LayoutUtil_1.LayoutUtil.getLayoutProvider(newProps.data), this._layout, newProps.isHorizontal));
            this._virtualRenderer.refreshWithAnchor();
            this._refreshViewability();
        }
        else if (this._dataProvider !== this._dataProvider.cloneWithRows(newProps.data)) {
            var layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.reLayoutFromIndex(this._dataProvider.getFirstIndexToProcessInternal(), this._dataProvider.getSize());
                this._virtualRenderer.refresh();
            }
        }
        else if (this._relayoutReqIndex >= 0) {
            var layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.reLayoutFromIndex(this._relayoutReqIndex, this._dataProvider.getSize());
                this._relayoutReqIndex = -1;
                this._refreshViewability();
            }
        }
    };
    RecyclerListView.prototype._refreshViewability = function () {
        this._virtualRenderer.refresh();
        this._queueStateRefresh();
    };
    RecyclerListView.prototype._queueStateRefresh = function () {
        var _this = this;
        refreshRequestDebouncer(function () {
            _this.setState(function (prevState) {
                return prevState;
            });
        });
    };
    RecyclerListView.prototype._onSizeChanged = function (layout) {
        var hasHeightChanged = this._layout.height !== layout.height;
        var hasWidthChanged = this._layout.width !== layout.width;
        this._layout.height = layout.height;
        this._layout.width = layout.width;
        if (layout.height === 0 || layout.width === 0) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.layoutException);
        }
        if (!this._initComplete) {
            this._initComplete = true;
            this._initTrackers();
            this._processOnEndReached();
        }
        else {
            if ((hasHeightChanged && hasWidthChanged) ||
                (hasHeightChanged && this.props.isHorizontal) ||
                (hasWidthChanged && !this.props.isHorizontal)) {
                this._checkAndChangeLayouts(this.props, true);
            }
            else {
                this._refreshViewability();
            }
        }
    };
    RecyclerListView.prototype._renderStackWhenReady = function (stack) {
        this.setState(function () {
            return { renderStack: stack };
        });
    };
    RecyclerListView.prototype._initTrackers = function () {
        this._assertDependencyPresence(this.props);
        if (this.props.onVisibleIndexesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this.props.onVisibleIndexesChanged);
        }
        this._params = {
            initialOffset: this.props.initialOffset
                ? this.props.initialOffset
                : this._initialOffset,
            initialRenderIndex: this.props.initialRenderIndex,
            isHorizontal: this.props.isHorizontal,
            itemCount: this._dataProvider.getSize(),
            renderAheadOffset: this.props.renderAheadOffset
        };
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        this._virtualRenderer.setLayoutManager(new MasonaryLayoutManager_1.default(2, this._layoutProvider, this._layout, this.props.isHorizontal, this._cachedLayouts));
        this._virtualRenderer.setLayoutProvider(this._layoutProvider);
        this._virtualRenderer.init();
        var offset = this._virtualRenderer.getInitialOffset();
        if (offset.y > 0 || offset.x > 0) {
            this._pendingScrollToOffset = offset;
            this.setState({});
        }
        else {
            this._virtualRenderer.startViewabilityTracker();
        }
    };
    RecyclerListView.prototype._assertDependencyPresence = function (props) {
        if (!this._dataProvider || !this._layoutProvider) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.unresolvedDependenciesException);
        }
    };
    RecyclerListView.prototype._assertType = function (type) {
        if (!type && type !== 0) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.itemTypeNullException);
        }
    };
    RecyclerListView.prototype._dataHasChanged = function (row1, row2) {
        return this._dataProvider.rowHasChanged(row1, row2);
    };
    RecyclerListView.prototype._renderRowUsingMeta = function (itemMeta) {
        var dataSize = this._dataProvider.getSize();
        var dataIndex = itemMeta.dataIndex;
        if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(dataIndex) && dataIndex < dataSize) {
            var itemRect = this._virtualRenderer.getLayoutManager().getLayouts()[dataIndex];
            var data = this._dataProvider.getDataForIndex(dataIndex);
            var type = this._layoutProvider.getLayoutTypeForIndex(dataIndex);
            this._assertType(type);
            if (!this.props.forceNonDeterministicRendering) {
                this._checkExpectedDimensionDiscrepancy(itemRect, type, dataIndex);
            }
            return (React.createElement(ViewRenderer_1.default, { key: itemMeta.key, data: data, dataHasChanged: this._dataHasChanged, x: itemRect.x, y: itemRect.y, layoutType: type, index: dataIndex, layoutProvider: this._layoutProvider, forceNonDeterministicRendering: this.props.forceNonDeterministicRendering, isHorizontal: this.props.isHorizontal, onSizeChanged: this._onViewContainerSizeChange, childRenderer: this.props.rowRenderer, height: itemRect.height, width: itemRect.width, itemAnimator: ts_object_utils_1.Default.value(this.props.itemAnimator, this._defaultItemAnimator), extendedState: this.props.extendedState }));
        }
        return null;
    };
    RecyclerListView.prototype._onViewContainerSizeChange = function (dim, index) {
        //Cannot be null here
        this._virtualRenderer.getLayoutManager().overrideLayout(index, dim);
        if (this._relayoutReqIndex === -1) {
            this._relayoutReqIndex = index;
        }
        else {
            this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
        }
        this._queueStateRefresh();
    };
    RecyclerListView.prototype._checkExpectedDimensionDiscrepancy = function (itemRect, type, index) {
        //Cannot be null here
        var layoutManager = this._virtualRenderer.getLayoutManager();
        layoutManager.setMaxBounds(this._tempDim);
        this._layoutProvider.setLayoutForType(type, this._tempDim, index);
        //TODO:Talha calling private method, find an alternative and remove this
        layoutManager.setMaxBounds(this._tempDim);
        if (itemRect.height !== this._tempDim.height ||
            itemRect.width !== this._tempDim.width) {
            if (this._relayoutReqIndex === -1) {
                this._relayoutReqIndex = index;
            }
            else {
                this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
            }
        }
    };
    RecyclerListView.prototype._generateRenderStack = function () {
        var renderedItems = [];
        for (var key in this.state.renderStack) {
            if (this.state.renderStack.hasOwnProperty(key)) {
                renderedItems.push(this._renderRowUsingMeta(this.state.renderStack[key]));
            }
        }
        return renderedItems;
    };
    RecyclerListView.prototype._onScroll = function (offsetX, offsetY, rawEvent) {
        this._virtualRenderer.updateOffset(offsetX, offsetY);
        if (this.props.onScroll) {
            this.props.onScroll(rawEvent, offsetX, offsetY);
        }
        this._processOnEndReached();
    };
    RecyclerListView.prototype._processOnEndReached = function () {
        if (this.props.onEndReached && this._virtualRenderer) {
            var layout = this._virtualRenderer.getLayoutDimension();
            var windowBound = this.props.isHorizontal
                ? layout.width - this._layout.width
                : layout.height - this._layout.height;
            var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
            var lastOffset = viewabilityTracker
                ? viewabilityTracker.getLastOffset()
                : 0;
            if (windowBound - lastOffset <=
                ts_object_utils_1.Default.value(this.props.onEndReachedThreshold, 0)) {
                if (!this._onEndReachedCalled) {
                    this._onEndReachedCalled = true;
                    this.props.onEndReached();
                }
            }
            else {
                this._onEndReachedCalled = false;
            }
        }
    };
    RecyclerListView.defaultProps = {
        canChangeSize: false,
        disableRecycling: false,
        initialOffset: 0,
        initialRenderIndex: 0,
        isHorizontal: false,
        onEndReachedThreshold: 0,
        renderAheadOffset: IS_WEB ? 1000 : 250
    };
    RecyclerListView.propTypes = {};
    return RecyclerListView;
}(React.Component));
exports.default = RecyclerListView;
RecyclerListView.propTypes = {
    //Refer the sample
    rowHasChanged: PropTypes.func.isRequired,
    //Refer the sample
    data: PropTypes.array.isRequired,
    //Used to maintain scroll position in case view gets destroyed e.g, cases of back navigation
    contextProvider: PropTypes.instanceOf(ContextProvider_1.default),
    //Methods which returns react component to be rendered. You get type of view and data in the callback.
    rowRenderer: PropTypes.func.isRequired,
    //Initial offset you want to start rendering from, very useful if you want to maintain scroll context across pages.
    initialOffset: PropTypes.number,
    //Specify how many pixels in advance do you want views to be rendered. Increasing this value can help reduce blanks (if any). However keeping this as low
    //as possible should be the intent. Higher values also increase re-render compute
    renderAheadOffset: PropTypes.number,
    //Whether the listview is horizontally scrollable. Both use staggeredGrid implementation
    isHorizontal: PropTypes.bool,
    //On scroll callback onScroll(rawEvent, offsetX, offsetY), note you get offsets no need to read scrollTop/scrollLeft
    onScroll: PropTypes.func,
    //Provide your own ScrollView Component. The contract for the scroll event should match the native scroll event contract, i.e.
    // scrollEvent = { nativeEvent: { contentOffset: { x: offset, y: offset } } }
    //Note: Please extend BaseScrollView to achieve expected behaviour
    externalScrollView: PropTypes.func,
    //Callback given when user scrolls to the end of the list or footer just becomes visible, useful in incremental loading scenarios
    onEndReached: PropTypes.func,
    //Specify how many pixels in advance you onEndReached callback
    onEndReachedThreshold: PropTypes.number,
    //Provides visible index, helpful in sending impression events etc, onVisibleIndexesChanged(all, now, notNow)
    onVisibleIndexesChanged: PropTypes.func,
    //Provide this method if you want to render a footer. Helpful in showing a loader while doing incremental loads.
    renderFooter: PropTypes.func,
    //Specify the initial item index you want rendering to start from. Preferred over initialOffset if both are specified.
    initialRenderIndex: PropTypes.number,
    //iOS only. Scroll throttle duration.
    scrollThrottle: PropTypes.number,
    //Specify if size can change, listview will automatically relayout items. For web, works only with useWindowScroll = true
    canChangeSize: PropTypes.bool,
    //Web only. Specify how far away the first list item is from window top. This is an adjustment for better optimization.
    distanceFromWindow: PropTypes.number,
    //Web only. Layout elements in window instead of a scrollable div.
    useWindowScroll: PropTypes.bool,
    //Turns off recycling. You still get progressive rendering and all other features. Good for lazy rendering. This should not be used in most cases.
    disableRecycling: PropTypes.bool,
    //Default is false, if enabled dimensions provided in layout provider will not be strictly enforced.
    //Rendered dimensions will be used to relayout items. Slower if enabled.
    forceNonDeterministicRendering: PropTypes.bool,
    //In some cases the data passed at row level may not contain all the info that the item depends upon, you can keep all other info
    //outside and pass it down via this prop. Changing this object will cause everything to re-render. Make sure you don't change
    //it often to ensure performance. Re-renders are heavy.
    extendedState: PropTypes.object,
    //Enables animating RecyclerListView item cells e.g, shift, add, remove etc. This prop can be used to pass an external item animation implementation.
    //Look into BaseItemAnimator/DefaultJSItemAnimator/DefaultNativeItemAnimator/DefaultWebItemAnimator for more info.
    //By default there are few animations, to disable completely simply pass blank new BaseItemAnimator() object. Remember, create
    //one object and keep it do not create multiple object of type BaseItemAnimator.
    //Note: You might want to look into DefaultNativeItemAnimator to check an implementation based on LayoutAnimation. By default,
    //animations are JS driven to avoid workflow interference. Also, please note LayoutAnimation is buggy on Android.
    itemAnimator: PropTypes.instanceOf(ItemAnimator_1.BaseItemAnimator),
    //For TS use case, not necessary with JS use.
    //For all props that need to be proxied to inner/external scrollview. Put them in an object and they'll be spread
    //and passed down.
    scrollViewProps: PropTypes.object
};
//# sourceMappingURL=RecyclerListView.js.map