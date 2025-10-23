import { createContext, useContext } from "react"
import {
    LanguageContextType,
    LanguageProviderProps,
    Translations,
} from "../types"

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
