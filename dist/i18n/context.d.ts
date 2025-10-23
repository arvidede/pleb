import { LanguageContextType, LanguageProviderProps } from "../types";
export declare const LanguageContext: import("react").Context<LanguageContextType>;
export declare function useLanguage(): LanguageContextType;
export declare function LanguageProvider({ t, children }: LanguageProviderProps): import("react/jsx-runtime").JSX.Element;
