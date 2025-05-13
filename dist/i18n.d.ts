import React from "react";
import { LanguageContextType, LanguageProviderProps, LocaleInfo, Translations, UserConfig } from "./types";
export declare const LanguageContext: React.Context<LanguageContextType>;
export declare function useLanguage(): LanguageContextType;
export declare function LanguageProvider({ t, children }: LanguageProviderProps): React.JSX.Element;
export declare function getLocales(config: UserConfig): LocaleInfo[];
export declare function getTranslations(config: UserConfig, locale: string): Translations;
