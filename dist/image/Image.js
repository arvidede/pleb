// @bun
import {
  SIZES,
  config_default,
  getFileName,
  registry_default
} from "../index-nrxsvcc9.js";
import {
  require_jsx_runtime
} from "../index-qj5yn1j4.js";
import {
  __toESM
} from "../index-c3pew69r.js";

// src/image/Image.tsx
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
function generateSrc(name, size) {
  return `${config_default.imgDir}/${name} ${size}w`;
}
function generateSrcSet(src, format) {
  return SIZES.map((size) => {
    const name = getFileName(src, size, format);
    return generateSrc(name, size);
  }).join(", ");
}
var FALLBACK_SIZE = 1280;
function generateFallbackSrc(src) {
  return generateSrc(getFileName(src, FALLBACK_SIZE, "jpg" /* Jpg */), FALLBACK_SIZE);
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
  const webpSrcSet = generateSrcSet(src, "webp" /* Webp */);
  const fallbackSrcSet = generateSrcSet(src, "jpg" /* Jpg */);
  const fallbackSrc = generateFallbackSrc(src);
  return /* @__PURE__ */ jsx_runtime.jsxs("picture", {
    className: wrapperClassName,
    children: [
      /* @__PURE__ */ jsx_runtime.jsx("source", {
        srcSet: webpSrcSet,
        type: `image/${"webp" /* Webp */}`,
        sizes
      }),
      /* @__PURE__ */ jsx_runtime.jsx("source", {
        srcSet: fallbackSrcSet,
        type: `image/${"jpg" /* Jpg */}`,
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

//# debugId=F3D3DAB2B097A58F64756E2164756E21
//# sourceMappingURL=Image.js.map
