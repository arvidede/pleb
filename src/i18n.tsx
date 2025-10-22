import fs from "fs"
import path from "path"
import { createContext, useContext } from "react"
import config from "./config"
import {
    LanguageContextType,
    LanguageProviderProps,
    Translations,
} from "./types"

const DEFAULT_CONTEXT: LanguageContextType = {
    t: {} as Translations,
}

export const LanguageContext =
    createContext<LanguageContextType>(DEFAULT_CONTEXT)

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === DEFAULT_CONTEXT) {
        console.warn(
            "useLanguage hook used outside of LanguageProvider. Translations may not be available.",
        )
    }
    return context
}

export function LanguageProvider({ t, children }: LanguageProviderProps) {
    return (
        <LanguageContext.Provider value={{ t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function getTranslations(locale: string): Translations {
    const localesDir = config.localesDir
    const contentPath = path.join(localesDir, `${locale}.json`)
    if (!fs.existsSync(contentPath)) {
        console.error(
            `Locale content not found for locale "${locale}" at ${contentPath}.`,
        )
        return {}
    }
    return JSON.parse(fs.readFileSync(contentPath, "utf-8"))
}
