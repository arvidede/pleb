import { createElement } from "react"
import { hydrateRoot } from "react-dom/client"
import { LanguageProvider } from "../i18n/context"
import { Translations } from "../types"

function getTranslationsFromDOM(): Translations {
    const scriptTag = document.getElementById("__APP_TRANSLATIONS__")

    if (!scriptTag?.textContent) {
        console.error(
            "Hydration failed: Could not find translations data in the DOM.",
        )
        return {} as Translations
    }

    try {
        return JSON.parse(scriptTag.textContent)
    } catch (error) {
        console.error(
            "Hydration failed: Could not parse translations JSON.",
            error,
        )
        return {} as Translations
    }
}

export function hydrate(root: Element, Component: React.ComponentType) {
    const t = getTranslationsFromDOM()

    hydrateRoot(
        root,
        createElement(LanguageProvider, {
            t,
            children: createElement(Component),
        }),
    )
}
