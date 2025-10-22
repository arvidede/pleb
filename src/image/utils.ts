import path from "path"

export enum ImageFormat {
    Webp = "webp",
    Jpg = "jpg",
}

export const SIZES = [360, 768, 1280, 1920] as const
export type ImageSize = (typeof SIZES)[number]

export function getFileName(src: string, size: ImageSize, format: ImageFormat) {
    const name = path.basename(src, path.extname(src))
    return `${name}-${size}w.${format}`
}
