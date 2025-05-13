import { ReactNode } from "react"

export interface UserConfig {
    projectRoot: string
    port: number
    appDir: string
    outDir: string
    pagesDir: string
    localesDir: string
    stylesDir: string
    publicDir: string
    templatePath: string
    cssFilePath: string
    defaultLocale: string
    baseUrl: string
}

export interface Translations extends Record<string, string> {}

export interface Metadata {
    title: string
    description: string
    og?: {
        title?: string
        description?: string
        type?: string
        url?: string
        image?: string
    }
    twitter?: {
        card?: string
        title?: string
        description?: string
        image?: string
    }
}

export interface ScriptTag {
    src?: string
    type?: string
    async?: boolean
    defer?: boolean
    [key: string]: unknown
    textContent?: string
}

export interface Script {
    before?: ScriptTag[]
    after?: ScriptTag[]
}

export interface LanguageProviderProps {
    t: Translations
    children: ReactNode
}

export interface LanguageContextType {
    t: Translations
}

export interface LocaleInfo {
    code: string
    isDefault: boolean
}

export interface PageProps {
    t: Translations
}
