import React from "react"
import ReactDOMServer from "react-dom/server"
import { LanguageProvider } from "./i18n"
import {
    LinkedData,
    Metadata,
    PageProps,
    Script,
    ScriptTag,
    Translations,
} from "./types"

export async function loadHtmlTemplate(templatePath: string): Promise<string> {
    const htmlTemplateFile = Bun.file(templatePath)
    if (await htmlTemplateFile.exists()) {
        return (await htmlTemplateFile.text()).trim()
    }

    console.warn(
        `No template found at ${templatePath}, using default template.`,
    )

    return Bun.file("./constants/template.html").text()
}

export function renderReactComponentToString(
    PageComponent: React.ComponentType<PageProps>,
    translations: Translations,
): string {
    return ReactDOMServer.renderToStaticMarkup(
        React.createElement(LanguageProvider, {
            t: translations,
            children: React.createElement(PageComponent, { t: translations }),
        }),
    )
}

export interface HtmlTemplateData {
    templatePath: string
    locale: string
    locales: string[]
    defaultLocale: string
    baseUrl: string
    title: string
    description: string
    css: string
    pageContent: string
    scripts?: Script
    metadata?: Metadata
    linkedData?: LinkedData | null
    translations: Translations
    dev: boolean
}

export async function populateHtmlTemplate(
    data: HtmlTemplateData,
): Promise<string> {
    let html = await loadHtmlTemplate(data.templatePath)

    html = renderLocale(
        html,
        data.locale,
        data.locales,
        data.defaultLocale,
        data.baseUrl,
    )
    html = renderTitle(html, data.title)
    html = renderDescription(html, data.description)
    html = renderStyles(html, data.css)
    html = renderScripts(html, data.scripts)
    html = renderContent(html, data.pageContent)

    if (data.metadata) {
        html = renderMetadata(html, data.metadata)
    }

    if (data.linkedData) {
        html = renderLinkedData(html, data.linkedData)
    }

    html = processHtmlLinks(html, data.locale, data.defaultLocale)

    html = renderTranslations(html, data.translations)

    if (data.dev) {
        html = renderDevModeSseScript(html)
    }

    return html
}

function insertInHead(html: string, tag: string, last = true) {
    if (last) {
        return html.replace("<head>", `<head>${tag}`)
    }

    return html.replace("</head>", `${tag}</head>`)
}

function insertInBody(html: string, tag: string, last = true) {
    if (last) {
        return html.replace("</body>", `${tag}</body>`)
    }

    return html.replace("<body>", `<body>${tag}`)
}

function createMetaTag(attributes: {
    property?: string
    name?: string
    content?: string
}) {
    let tag = "<meta "
    for (const [key, value] of Object.entries(attributes)) {
        if (value) {
            tag += `${key}="${value}" `
        }
    }
    tag += "/>"

    return tag
}

function renderDevModeSseScript(html: string): string {
    const sseClientScript = `
        <script>
            const es = new EventSource('/pleb-dev-events');
            es.onmessage = function(event) {
                if (event.data === 'reload') {
                    console.log('[Pleb Dev] Reloading page due to file change...');
                    window.location.reload();
                }
            };
            es.onerror = function(err) {
                console.error('[Pleb Dev] EventSource failed:', err);
                es.close(); 
            };
        </script>
    `
    return insertInBody(html, sseClientScript)
}

function renderLocale(
    html: string,
    locale: string,
    locales: string[],
    defaultLocale: string,
    baseUrl: string,
) {
    html = html.replace("<html>", `<html lang="${locale}">`)

    for (const lang of locales) {
        if (lang === locale) {
            continue
        }
        const href = lang === defaultLocale ? baseUrl : `${baseUrl}/${lang}`
        const linkTag = `<link rel="alternate" hreflang="${lang}" href="${href}" />`
        html = insertInHead(html, linkTag)
    }

    const linkTag = `<link rel="alternate" hreflang="x-default" href="${baseUrl}" />`
    html = insertInHead(html, linkTag)

    return html
}

function renderTitle(html: string, title: string) {
    const titleTag = `<title>${title}</title>`
    return insertInHead(html, titleTag, false)
}

function renderDescription(html: string, description: string) {
    const descriptionTag = createMetaTag({
        property: "description",
        content: description,
    })

    return insertInHead(html, descriptionTag)
}

function renderContent(html: string, content: string) {
    const last = false
    return insertInBody(html, content, last)
}

function renderStyles(html: string, css: string) {
    const styleTag = `
    <style>
        ${css}
    </style>
    `
    return insertInHead(html, styleTag)
}

function renderTranslations(html: string, translations: Translations): string {
    const translationScript = `<script id="__APP_TRANSLATIONS__" type="application/json">${JSON.stringify(
        translations,
    )}</script>`

    return html.replace("</head>", `${translationScript}</head>`)
}

function createScriptTag(scriptObject: ScriptTag): string {
    let attributes = ""
    let textContent = ""

    for (const key in scriptObject) {
        if (Object.prototype.hasOwnProperty.call(scriptObject, key)) {
            const value = scriptObject[key]

            if (key === "textContent") {
                textContent = String(value ?? "")
            } else {
                if (typeof value === "boolean" && value) {
                    attributes += ` ${key}`
                } else if (typeof value === "string" && value.length > 0) {
                    const escapedValue = value.replace(/"/g, "&quot;")
                    attributes += ` ${key}="${escapedValue}"`
                }
            }
        }
    }

    if (textContent) {
        return `<script${attributes}>${textContent}</script>`
    } else {
        return `<script${attributes}></script>`
    }
}

function renderScripts(html: string, script?: Script): string {
    if (!script) {
        return html
    }

    if (script.before) {
        for (const scriptTag of script.before) {
            html = insertInHead(html, createScriptTag(scriptTag))
        }
    }

    if (script.after) {
        for (const scriptTag of script.after) {
            html = insertInBody(html, createScriptTag(scriptTag))
        }
    }

    return html
}

function renderMetadata(html: string, metadata: Metadata): string {
    const tagDefinitions = [
        {
            property: "og:title",
            content: metadata.og?.title || metadata.title,
        },
        {
            property: "og:description",
            content: metadata.og?.description || metadata.description,
        },
        {
            property: "og:type",
            content: metadata.og?.type || "website",
        },
        {
            property: "og:url",
            content: metadata.og?.url,
        },
        {
            property: "og:image",
            content: metadata.og?.image,
        },
        {
            name: "twitter:title",
            content: metadata.twitter?.title || metadata.title,
        },
        {
            name: "twitter:description",
            content: metadata.twitter?.description || metadata.description,
        },
        {
            name: "twitter:card",
            content: metadata.twitter?.card,
        },
        {
            name: "twitter:image",
            content: metadata.twitter?.image,
        },
    ]

    for (const tagDefinition of tagDefinitions) {
        html = insertInHead(html, createMetaTag(tagDefinition))
    }

    return html
}

function renderLinkedData(html: string, linkedData: LinkedData): string {
    const linkedDataTag = `
    <script type="application/ld+json">
        ${JSON.stringify(linkedData)}
    </script>
    `
    return insertInHead(html, linkedDataTag)
}

function processHtmlLinks(
    html: string,
    locale: string,
    defaultLocale: string,
): string {
    const internalLinkRegex = /(<a\s+[^>]*href=["'])(\/[^"']*)(["'][^>]*>)/g

    const processedHtml = html.replace(
        internalLinkRegex,
        (_, beforeHref, hrefPath, afterHref) => {
            let newHref = hrefPath

            if (locale !== defaultLocale) {
                newHref =
                    hrefPath === "/" ? `/${locale}/` : `/${locale}${hrefPath}`
            } else {
                if (hrefPath.startsWith(`/${defaultLocale}/`)) {
                    newHref = hrefPath.substring(defaultLocale.length + 1)
                } else if (hrefPath === `/${defaultLocale}`) {
                    newHref = "/"
                }
            }

            return `${beforeHref}${newHref}${afterHref}`
        },
    )

    return processedHtml
}

export function renderError(error: unknown) {
    const e = error instanceof Error ? error : new Error(String(error))
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Error</title>
        <style>
            body { font-family: sans-serif; background-color: #f8d7da; color: #721c24; padding: 20px; }
            h1 { color: #721c24; }
            pre { background-color: #f5c6cb; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
        </style>
    </head>
    <body>
        <h1>Rendering Error</h1>
        <p>An error occurred while rendering the page:</p>
        <pre>${e.message}\n\n${e.stack}</pre>
        <p>Check the console for more details.</p>
    </body>
    </html>`
}
