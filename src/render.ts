import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import path from "path"
import postcss from "postcss"
import postcssImport from "postcss-import"
import postcssURL from "postcss-url"
import { populateHtmlTemplate, renderReactComponentToString } from "./html"
import { getTranslations } from "./i18n"
import {
    Config,
    LinkedData,
    Metadata,
    PageProps,
    Script,
    Translations,
} from "./types"

interface PageModule {
    default: React.ComponentType<PageProps>
    generateMetadata?: (content: Translations) => Metadata
    generateLinkedData?: (content: Translations) => LinkedData
    script?: Script
}

export interface PageExports {
    metadata: Metadata
    linkedData: LinkedData | null
    script?: Script
}

async function loadPageModule(
    baseDir: string,
    relativePath: string,
): Promise<PageModule> {
    const modulePath = path.join(baseDir, relativePath)
    const moduleFile = Bun.file(modulePath)
    if (!(await moduleFile.exists())) {
        throw new Error(
            `Page module not found at ${modulePath}. Cannot render page.`,
        )
    }

    const pageModule = await import(modulePath)
    return pageModule
}

function determinePageSpecificCssPaths(
    config: Config,
    pageRelativePath: string,
): string[] {
    const paths: string[] = []
    if (pageRelativePath.endsWith(".tsx")) {
        const pageCssFileName = pageRelativePath.replace(/\.tsx$/, ".css")
        const specificPageCssPath = path.join(
            config.stylesDir,
            "pages",
            pageCssFileName,
        )
        paths.push(specificPageCssPath)
    }
    return paths
}

function determineOutputFilePath(
    config: Config,
    pageRelativePath: string,
    locale: string,
): string {
    const buildDir = config.outDir
    const defaultLocale = config.defaultLocale

    const pageName = path.basename(pageRelativePath).replace(/\.(tsx|ts)$/, "")
    const dirName = path.dirname(pageRelativePath)

    let outputSubDir = dirName === "." ? "" : dirName
    if (pageName !== "index") {
        outputSubDir = path.join(outputSubDir, pageName)
    }

    let finalOutputDir = path.join(buildDir, outputSubDir)
    if (locale !== defaultLocale) {
        finalOutputDir = path.join(buildDir, locale, outputSubDir)
    }

    return path.join(finalOutputDir, "index.html")
}

export async function processCSS(
    config: Config,
    cssFilePaths: string[] = [],
): Promise<string> {
    let combinedCss = ""
    const allCssPaths = [config.cssFilePath, ...cssFilePaths]

    for (const cssFilePath of allCssPaths) {
        const file = Bun.file(cssFilePath)
        if (await file.exists()) {
            const css = await file.text()
            try {
                const result = await postcss([
                    postcssImport(),
                    postcssURL({ url: "inline" }),
                    autoprefixer(),
                    cssnano(),
                ]).process(css, { from: cssFilePath })
                combinedCss += result.css
            } catch (error: unknown) {
                console.error(
                    `Error processing CSS file ${cssFilePath}:`,
                    error instanceof Error ? error.message : error,
                )
            }
        } else {
            if (cssFilePath !== config.cssFilePath) {
                console.warn(`CSS file not found at ${cssFilePath}. Skipping.`)
            }
        }
    }
    return combinedCss
}

export function extractPageExports(
    pageModule: PageModule,
    content: Translations,
): PageExports {
    const metadata: Metadata = pageModule.generateMetadata
        ? pageModule.generateMetadata(content) || { title: "", description: "" }
        : { title: "", description: "" }

    const linkedData = pageModule.generateLinkedData
        ? pageModule.generateLinkedData(content)
        : null
    return {
        metadata,
        script: pageModule.script,
        linkedData,
    }
}

export async function renderPage(
    config: Config,
    pageRelativePath: string,
    locale: string,
    isDevMode: boolean,
): Promise<string> {
    let pageModule: PageModule
    try {
        pageModule = await loadPageModule(config.pagesDir, pageRelativePath)
    } catch (error) {
        console.error(error)

        throw error
    }

    const translations = getTranslations(config, locale)
    const { metadata, script, linkedData } = await extractPageExports(
        pageModule,
        translations,
    )

    const pageSpecificCssPaths = determinePageSpecificCssPaths(
        config,
        pageRelativePath,
    )

    const inlinedCSS = await processCSS(config, pageSpecificCssPaths)

    const pageContentHtml = renderReactComponentToString(
        pageModule.default,
        translations,
    )

    let html = await populateHtmlTemplate({
        templatePath: config.templatePath,
        locale,
        locales: config.locales,
        defaultLocale: config.defaultLocale,
        baseUrl: config.baseUrl,
        title: metadata.title,
        description: metadata.description,
        css: inlinedCSS,
        pageContent: pageContentHtml,
        scripts: script,
        metadata,
        translations,
        linkedData,
        dev: isDevMode,
    })

    return html
}

export async function buildPage(
    config: Config,
    locale: string,
    pageFilePath: string,
): Promise<void> {
    const pageRelativePath = path.relative(config.pagesDir, pageFilePath)
    const outputPath = determineOutputFilePath(config, pageRelativePath, locale)

    const html = await renderPage(config, pageRelativePath, locale, false)
    await Bun.write(outputPath, html)
}
