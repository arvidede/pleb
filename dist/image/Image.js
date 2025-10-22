// @bun
import {
  SIZES,
  getFileName,
  registry_default
} from "../index-75bwv6rr.js";
import {
  __toESM,
  config_default,
  require_jsx_runtime
} from "../index-gnp5a539.js";

// src/image/Image.tsx
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
var FALLBACK_SIZE = 1280;
var FALLBACK_FORMAT = "jpg";
var MODERN_FORMAT = "webp";
function generateSrc(name, size) {
  return `${config_default.imgDir}/${name} ${size}w`;
}
function generateSrcSet(src, format) {
  return SIZES.map((size) => {
    const name = getFileName(src, size, format);
    return generateSrc(name, size);
  }).join(", ");
}
function generateFallbackSrc(src) {
  return generateSrc(getFileName(src, FALLBACK_SIZE, FALLBACK_FORMAT), FALLBACK_SIZE);
}
function Image({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  wrapperClassName,
  loading = "lazy",
  ...props
}) {
  registry_default.add(src);
  const webpSrcSet = generateSrcSet(src, MODERN_FORMAT);
  const fallbackSrcSet = generateSrcSet(src, FALLBACK_FORMAT);
  const fallbackSrc = generateFallbackSrc(src);
  return /* @__PURE__ */ jsx_runtime.jsxs("picture", {
    className: wrapperClassName,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx("source", {
        srcSet: webpSrcSet,
        type: `image/${MODERN_FORMAT}`,
        sizes
      }),
      /* @__PURE__ */ jsx_runtime.jsx("source", {
        srcSet: fallbackSrcSet,
        type: `image/${FALLBACK_FORMAT}`,
        sizes
      }),
      /* @__PURE__ */ jsx_runtime.jsx("img", {
        className,
        src: fallbackSrc,
        alt,
        width,
        height,
        loading,
        ...props
      })
    ]
  });
}
export {
  Image as default
};

//# debugId=E2BE962DFD2DDFB964756E2164756E21
//# sourceMappingURL=Image.js.map
