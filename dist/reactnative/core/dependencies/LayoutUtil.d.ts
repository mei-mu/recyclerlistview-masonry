import LayoutProvider, { LayoutType } from "./LayoutProvider";
export declare class LayoutUtil {
    static getWindowWidth(offset: number | undefined): number;
    static getLayoutProvider(data: UIData[], offset: number | undefined): LayoutProvider;
}
export interface UIData {
    height: number;
    width: number;
    viewType: LayoutType;
}
