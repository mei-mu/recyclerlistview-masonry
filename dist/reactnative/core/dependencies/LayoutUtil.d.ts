import LayoutProvider, { LayoutType } from "./LayoutProvider";
export declare class LayoutUtil {
    static getWindowWidth(): number;
    static getLayoutProvider(data: UIData[]): LayoutProvider;
}
export interface UIData {
    height: number;
    width: number;
    viewType: LayoutType;
}
