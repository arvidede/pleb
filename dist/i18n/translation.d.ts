import { Translations } from "../types";
export declare function translate(forceTranslate?: boolean): Promise<void>;
export declare function getTranslations(locale: string): Promise<Translations | null>;
