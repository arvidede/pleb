import { HTMLAttributes } from "react"
import config from "../config"
import imageRegistry from "./registry"
import { getFileName, ImageFormat, ImageSize, SIZES } from "./utils"

interface ImageProps extends HTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    wrapperClassName?: string
    loading?: "lazy" | "eager"
    sizes?: string
}

function generateSrc(name: string, size: ImageSize) {
    return `${config.imgDir}/${name} ${size}w`
}

function generateSrcSet(src: string, format: ImageFormat): string {
    return SIZES.map((size) => {
        const name = getFileName(src, size, format)
        return generateSrc(name, size)
    }).join(", ")
}

const FALLBACK_SIZE = 1280

function generateFallbackSrc(src: string) {
    return generateSrc(
        getFileName(src, FALLBACK_SIZE, ImageFormat.Jpg),
        FALLBACK_SIZE,
    )
}

export default function Image({
    src,
    alt,
    width,
    height,
    sizes,
    className,
    wrapperClassName,
    loading = "lazy",
    ...props
}: ImageProps) {
    imageRegistry.add(src)

    const webpSrcSet = generateSrcSet(src, ImageFormat.Webp)
    const fallbackSrcSet = generateSrcSet(src, ImageFormat.Jpg)
    const fallbackSrc = generateFallbackSrc(src)

    return (
        <picture className={wrapperClassName}>
            <source
                srcSet={webpSrcSet}
                type={`image/${ImageFormat.Webp}`}
                sizes={sizes}
            />
            <source
                srcSet={fallbackSrcSet}
                type={`image/${ImageFormat.Jpg}`}
                sizes={sizes}
            />
            <img
                className={className}
                src={fallbackSrc}
                alt={alt}
                width={width}
                height={height}
                loading={loading}
                {...props}
            />
        </picture>
    )
}
