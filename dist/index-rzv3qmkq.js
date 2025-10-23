// @bun
import {
  require_jsx_runtime,
  require_react
} from "./index-qj5yn1j4.js";
import {
  __toESM
} from "./index-c3pew69r.js";

// src/i18n/context.tsx
var import_react = __toESM(require_react(), 1);
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

export { useLanguage, LanguageProvider };

//# debugId=6DE2EDA6CCF3457C64756E2164756E21
//# sourceMappingURL=index-rzv3qmkq.js.map
