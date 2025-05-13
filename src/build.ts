import { promises as fsPromises } from "fs"
import path from "path"
import { loadHtmlTemplate } from "./html"
import { getLocales } from "./i18n"
import { buildPage } from "./render"
import { UserConfig } from "./types"
import { copyStatic, generateSitemap, getAllTsxFiles } from "./utils"

export async function prepareBuildDirectory(config: UserConfig): Promise<void> {
    const buildDir = config.outDir
    console.log(`🗑️ Cleaning build directory: ${buildDir}`)
    if (await Bun.file(buildDir).exists()) {
        await fsPromises.rm(buildDir, { recursive: true })
    }
    await fsPromises.mkdir(buildDir, { recursive: true })
}

export async function buildLocalizedPages(
    config: UserConfig,
    pagesDir: string,
    allPages: string[],
    locales: string[],
    htmlTemplateString: string,
): Promise<void> {
    console.log("🏗️ Building pages...")
    for (const locale of locales) {
        console.log(`  - Building for locale: ${locale}`)
        for (const pageFilePath of allPages) {
            const pageRelativePath = path.relative(pagesDir, pageFilePath)
            await buildPage(
                config,
                pagesDir,
                pageRelativePath,
                locale,
                htmlTemplateString,
            )
        }
    }
    console.log("✅ Pages built.")
}

export async function performPostBuildActions(
    config: UserConfig,
): Promise<void> {
    console.log("📦 Copying static assets...")
    copyStatic(config)
    console.log("✅ Static assets copied.")

    console.log("🗺️ Generating sitemap...")
    const sitemapXml = await generateSitemap(config)
    await Bun.write(path.join(config.outDir, "sitemap.xml"), sitemapXml)
    console.log("✅ Sitemap generated.")
}

export async function buildSite(config: UserConfig): Promise<void> {
    const startTime = performance.now()
    const pagesDir = config.pagesDir

    console.log("🚀 Starting build...")

    await prepareBuildDirectory(config)

    const localeInfos = getLocales(config)
    const locales: string[] = localeInfos.map((info) => info.code)
    if (locales.length === 0) {
        console.error("❌ No locales found. Build aborted.")
        process.exit(1)
    }

    const allPages: string[] = getAllTsxFiles(config, pagesDir)
    if (allPages.length === 0) {
        console.warn(
            "⚠️ No pages (.tsx files) found in the pages directory. Building an empty site.",
        )
    }

    console.log(
        `📄 Found ${allPages.length} pages and ${locales.length} locales.`,
    )

    const htmlTemplateString = await loadHtmlTemplate(config.templatePath)

    await buildLocalizedPages(
        config,
        pagesDir,
        allPages,
        locales,
        htmlTemplateString,
    )

    await performPostBuildActions(config)

    const endTime = performance.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    console.log(`⏱️ Total build time: ${duration}s`)
    console.log("🎉 Build complete!")
}
