import { default as LayoutProvider, Dimension } from "./dependencies/LayoutProvider";
import ViewabilityTracker, { TOnItemStatusChanged } from "./ViewabilityTracker";
import { LayoutManagerInterface, Point } from "./dependencies/LayoutManagerInterface";
/***
 * Renderer which keeps track of recyclable items and the currently rendered items. Notifies list view to re render if something changes, like scroll offset
 */
export interface RenderStackItem {
    key?: number;
    type?: string | number;
    dataIndex?: number;
}
export interface RenderStack {
    [key: string]: RenderStackItem;
}
export interface RenderStackParams {
    isHorizontal?: boolean;
    itemCount: number;
    initialOffset?: number;
    initialRenderIndex?: number;
    renderAheadOffset?: number;
}
export default class VirtualRenderer {
    onVisibleItemsChanged: TOnItemStatusChanged | null;
    private _scrollOnNextUpdate;
    private _renderStackIndexKeyMap;
    private _renderStack;
    private _renderStackChanged;
    private _isRecyclingEnabled;
    private _isViewTrackerRunning;
    private _startKey;
    private _layoutProvider;
    private _recyclePool;
    private _params;
    private _layoutManager;
    private _viewabilityTracker;
    private _dimensions;
    constructor(renderStackChanged: (renderStack: RenderStack) => void, scrollOnNextUpdate: (point: Point) => void, isRecyclingEnabled: boolean);
    getLayoutDimension(): Dimension;
    updateOffset(offsetX: number, offsetY: number): void;
    attachVisibleItemsListener(callback: TOnItemStatusChanged): void;
    removeVisibleItemsListener(): void;
    getLayoutManager(): LayoutManagerInterface | null;
    setParamsAndDimensions(params: RenderStackParams, dim: Dimension): void;
    setLayoutManager(layoutManager: LayoutManagerInterface): void;
    setLayoutProvider(layoutProvider: LayoutProvider): void;
    getViewabilityTracker(): ViewabilityTracker | null;
    refreshWithAnchor(): void;
    refresh(): void;
    getInitialOffset(): Point;
    init(): void;
    startViewabilityTracker(): void;
    private _getNewKey();
    private _prepareViewabilityTracker();
    private _onVisibleItemsChanged(all, now, notNow);
    private _onEngagedItemsChanged(all, now, notNow);
    private _updateRenderStack(itemIndexes);
}
