// @bun
import {
  __toESM,
  config_default,
  require_jsx_runtime,
  require_react
} from "./index-gnp5a539.js";

// src/i18n.tsx
var import_react = __toESM(require_react(), 1);
import fs from "fs";
import path from "path";
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
var DEFAULT_CONTEXT = {
  t: {}
};
var LanguageContext = import_react.createContext(DEFAULT_CONTEXT);
function useLanguage() {
  const context = import_react.useContext(LanguageContext);
  if (context === DEFAULT_CONTEXT) {
    console.warn("useLanguage hook used outside of LanguageProvider. Translations may not be available.");
  }
  return context;
}
function LanguageProvider({ t, children }) {
  return /* @__PURE__ */ jsx_runtime.jsx(LanguageContext.Provider, {
    value: { t },
    children
  });
}
function getTranslations(locale) {
  const localesDir = config_default.localesDir;
  const contentPath = path.join(localesDir, `${locale}.json`);
  if (!fs.existsSync(contentPath)) {
    console.error(`Locale content not found for locale "${locale}" at ${contentPath}.`);
    return {};
  }
  return JSON.parse(fs.readFileSync(contentPath, "utf-8"));
}

export { LanguageContext, useLanguage, LanguageProvider, getTranslations };

//# debugId=06B0D8AF6D5167B764756E2164756E21
//# sourceMappingURL=index-8nt7n0d7.js.map
