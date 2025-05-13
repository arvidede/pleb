import autoprefixer from "autoprefixer"
import cssnano from "cssnano"
import path from "path"
import postcss from "postcss"
import postcssImport from "postcss-import"
import postcssURL from "postcss-url"
import {
    extractPageExports,
    injectDevModeSseScript,
    loadHtmlTemplate,
    populateHtmlTemplate,
    processHtmlLinks,
    renderMetadata,
    renderReactComponentToString,
    renderScripts,
} from "./html"
import { getTranslations } from "./i18n"
import { Metadata, PageProps, Script, Translations, UserConfig } from "./types"

interface PageModule {
    default: React.ComponentType<PageProps>
    generateMetadata?: (content: Translations) => Metadata
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
    config: UserConfig,
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
    config: UserConfig,
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
    config: UserConfig,
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

export async function renderPage(
    config: UserConfig,
    pageModuleBaseDir: string,
    pageRelativePath: string,
    locale: string,
    isDevMode: boolean,
    passedHtmlTemplateString?: string,
): Promise<string> {
    const htmlTemplateString =
        passedHtmlTemplateString ??
        (await loadHtmlTemplate(config.templatePath))
    let pageModule: PageModule
    try {
        pageModule = await loadPageModule(pageModuleBaseDir, pageRelativePath)
    } catch (error) {
        console.error(error)

        throw error
    }

    const translations = getTranslations(config, locale)
    const { metadata, script: pageScript } = extractPageExports(
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

    let html = populateHtmlTemplate(htmlTemplateString, {
        locale,
        title: metadata.title,
        description: metadata.description,
        css: inlinedCSS,
        pageContent: pageContentHtml,
    })

    html = renderScripts(html, pageScript)
    html = renderMetadata(html, metadata)
    html = processHtmlLinks(html, locale, config.defaultLocale)

    if (isDevMode) {
        html = injectDevModeSseScript(html)
    }

    return html
}

export async function buildPage(
    config: UserConfig,
    compiledPagesDir: string,
    pageRelativePath: string,
    locale: string,
    htmlTemplateString: string,
): Promise<void> {
    const outputPath = determineOutputFilePath(config, pageRelativePath, locale)

    const html = await renderPage(
        config,
        compiledPagesDir,
        pageRelativePath,
        locale,
        false,
        htmlTemplateString,
    )
    await Bun.write(outputPath, html)
}
