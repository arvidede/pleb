import fs from "fs/promises"
import path from "path"
import config from "./config"
import { translate } from "./i18n/translation"
import imageRegistry from "./image/registry"
import { buildPage } from "./render"
import {
    generateSitemap,
    getAllTsxFiles,
    processPublicDirectory,
} from "./utils"

export async function prepareBuildDirectory(): Promise<void> {
    const buildDir = config.outDir
    console.log(`🗑️ Cleaning build directory: ${buildDir}`)

    if (await Bun.file(buildDir).exists()) {
        await fs.rm(buildDir, { recursive: true })
    }

    await fs.mkdir(buildDir, { recursive: true })
}

export async function buildLocalizedPages(): Promise<void> {
    const pages = await getAllTsxFiles(config.pagesDir)
    if (pages.length === 0) {
        console.warn(
            "⚠️ No pages (.tsx files) found in the pages directory. Building an empty site.",
        )
    }

    console.log(
        `📄 Found ${pages.length} pages and ${config.locales.length} locales.`,
    )

    console.log("🏗️ Building pages...")
    for (const locale of config.locales) {
        console.log(`  - Building for locale: ${locale}`)
        for (const page of pages) {
            await buildPage(locale, page)
        }
    }

    console.log("✅ Pages built.")
}

export async function performPostBuildActions(): Promise<void> {
    console.log("📦 Processing and copying public assets...")
    await processPublicDirectory()
    console.log("✅ Public assets processed.")

    console.log("🗺️ Generating sitemap...")
    const sitemapXml = await generateSitemap()
    await Bun.write(path.join(config.outDir, "sitemap.xml"), sitemapXml)
    console.log("✅ Sitemap generated.")

    await imageRegistry.processImages()
}

export async function buildSite(forceTranslate: boolean): Promise<void> {
    const startTime = performance.now()

    console.log("🚀 Starting build...")

    await prepareBuildDirectory()

    await translate(forceTranslate)

    await buildLocalizedPages()

    await performPostBuildActions()

    const duration = ((performance.now() - startTime) / 1000).toFixed(2)
    console.log(`⏱️ Total build time: ${duration}s`)
    console.log("🎉 Build complete!")
}
