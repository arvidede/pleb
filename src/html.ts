import React from "react"
import ReactDOMServer from "react-dom/server"
import { LanguageProvider } from "./i18n"
import { Metadata, PageProps, Script, ScriptTag, Translations } from "./types"

export async function loadHtmlTemplate(templatePath: string): Promise<string> {
    const htmlTemplateFile = Bun.file(templatePath)
    const htmlTemplateString: string = (await htmlTemplateFile.text()).trim()
    return htmlTemplateString
}

export interface PageExports {
    metadata: Metadata
    script?: Script
}

interface PageModuleExports {
    generateMetadata?: (content: Translations) => Metadata
    script?: Script
}

export function extractPageExports(
    pageModule: PageModuleExports,
    content: Translations,
): PageExports {
    const metadata: Metadata = pageModule.generateMetadata
        ? pageModule.generateMetadata(content) || { title: "", description: "" }
        : { title: "", description: "" }
    return {
        metadata,
        script: pageModule.script,
    }
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
    locale: string
    title: string
    description: string
    css: string
    pageContent: string
}

export function populateHtmlTemplate(
    template: string,
    data: HtmlTemplateData,
): string {
    return template
        .replace(/{{\s*locale\s*}}/g, data.locale)
        .replace(/{{\s*title\s*}}/g, data.title || "")
        .replace(/{{\s*description\s*}}/g, data.description || "")
        .replace(/{{\s*css\s*}}/g, data.css || "")
        .replace(/{{\s*pageContent\s*}}/g, data.pageContent || "")
}

export function injectDevModeSseScript(html: string): string {
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
    return html.replace("</body>", `${sseClientScript}</body>`)
}

export function generateScriptTagString(scriptObject: ScriptTag): string {
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

export function renderScripts(html: string, script?: Script): string {
    if (script) {
        html = html
            .replace(
                "{{scriptBefore}}",
                script.before?.map(generateScriptTagString).join("\n") || "",
            )
            .replace(
                "{{scriptAfter}}",
                script.after?.map(generateScriptTagString).join("\n") || "",
            )
    } else {
        html = html
            .replace("{{scriptBefore}}", "")
            .replace("{{scriptAfter}}", "")
    }

    return html
}

export function renderMetadata(html: string, metadata: Metadata): string {
    html = html
        .replace("{{title}}", metadata.title || "")
        .replace("{{description}}", metadata.description || "")
        .replace("{{og:title}}", metadata.og?.title || metadata.title || "")
        .replace(
            "{{og:description}}",
            metadata.og?.description || metadata.description || "",
        )
        .replace("{{og:type}}", metadata.og?.type || "website")
        .replace("{{og:url}}", metadata.og?.url || "")
        .replace("{{og:image}}", metadata.og?.image || "")
        .replace(
            "{{twitter:title}}",
            metadata.twitter?.title || metadata.title || "",
        )
        .replace(
            "{{twitter:description}}",
            metadata.twitter?.description || metadata.description || "",
        )
        .replace("{{twitter:image}}", metadata.twitter?.image || "")

    return html
}

export function processHtmlLinks(
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
