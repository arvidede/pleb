import { LanguageContextType, LanguageProviderProps, LocaleInfo, Translations, UserConfig } from "./types";
export declare const LanguageContext: import("react").Context<LanguageContextType>;
export declare function useLanguage(): LanguageContextType;
export declare function LanguageProvider({ t, children }: LanguageProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function getLocales(config: UserConfig): LocaleInfo[];
export declare function getTranslations(config: UserConfig, locale: string): Translations;
