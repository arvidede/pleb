import fs from "fs"
import path from "path"
import React, { createContext, useContext } from "react"
import {
    LanguageContextType,
    LanguageProviderProps,
    LocaleInfo,
    Translations,
    UserConfig,
} from "./types"

const DEFAULT_CONTEXT: LanguageContextType = {
    t: {} as Translations,
}

export const LanguageContext =
    createContext<LanguageContextType>(DEFAULT_CONTEXT)

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === DEFAULT_CONTEXT && process.env.NODE_ENV !== "production") {
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

export function getLocales(config: UserConfig): LocaleInfo[] {
    const localesDir = config.localesDir
    if (!fs.existsSync(localesDir)) {
        console.warn(
            `Locales directory not found at ${localesDir}. Returning empty locales.`,
        )
        return []
    }
    const localeFiles = fs
        .readdirSync(localesDir)
        .filter((f: string) => f.endsWith(".json"))

    const localeInfos: LocaleInfo[] = localeFiles.map((f: string) => {
        const localeCode = path.basename(f, ".json")

        return {
            code: localeCode,
            isDefault: localeCode === config.defaultLocale,
        }
    })

    if (!localeInfos.some((info) => info.isDefault)) {
        if (localeInfos.length > 0) {
            const configDefault = config.defaultLocale
            const configDefaultInfo = localeInfos.find(
                (info) => info.code === configDefault,
            )
            if (configDefaultInfo) {
                configDefaultInfo.isDefault = true
                console.warn(
                    `No locale marked as default in JSON. Using config default "${configDefault}".`,
                )
            } else {
                localeInfos[0].isDefault = true
                console.warn(
                    `No locale marked as default in JSON and config default "${configDefault}" not found. Using the first locale "${localeInfos[0].code}" as default.`,
                )
            }
        } else {
            console.warn("No locales found. Cannot set a default locale.")
        }
    } else if (localeInfos.filter((info) => info.isDefault).length > 1) {
        console.warn(
            "Multiple locales marked as default in JSON. Using the first one found.",
        )
        const firstDefaultIndex = localeInfos.findIndex(
            (info) => info.isDefault,
        )
        localeInfos.forEach((info, index) => {
            if (index !== firstDefaultIndex) {
                info.isDefault = false
            }
        })
    }

    return localeInfos
}

export function getTranslations(
    config: UserConfig,
    locale: string,
): Translations {
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
