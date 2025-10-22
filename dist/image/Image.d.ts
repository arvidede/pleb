import { HTMLAttributes } from "react";
interface ImageProps extends HTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    wrapperClassName?: string;
    loading?: "lazy" | "eager";
    sizes?: string;
}
export default function Image({ src, alt, width, height, sizes, className, wrapperClassName, loading, ...props }: ImageProps): import("react/jsx-runtime").JSX.Element;
export {};
