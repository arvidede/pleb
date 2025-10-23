export declare enum ImageFormat {
    Webp = "webp",
    Jpg = "jpg"
}
export declare const SIZES: readonly [360, 768, 1280, 1920];
export type ImageSize = (typeof SIZES)[number];
export declare function getFileName(src: string, size: ImageSize, format: ImageFormat): string;
