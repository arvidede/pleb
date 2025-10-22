import { promises as fsPromises } from "fs"
import path from "path"
import { buildPage } from "./render"
import { Config } from "./types"
import {
    generateSitemap,
    getAllTsxFiles,
    processPublicDirectory,
} from "./utils"

export async function prepareBuildDirectory(config: Config): Promise<void> {
    const buildDir = config.outDir
    console.log(`🗑️ Cleaning build directory: ${buildDir}`)
    if (await Bun.file(buildDir).exists()) {
        await fsPromises.rm(buildDir, { recursive: true })
    }
    await fsPromises.mkdir(buildDir, { recursive: true })
}

export async function buildLocalizedPages(config: Config): Promise<void> {
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
            await buildPage(config, locale, page)
        }
    }

    console.log("✅ Pages built.")
}

export async function performPostBuildActions(config: Config): Promise<void> {
    console.log("📦 Processing and copying public assets...")
    await processPublicDirectory(config)
    console.log("✅ Public assets processed.")

    console.log("🗺️ Generating sitemap...")
    const sitemapXml = await generateSitemap(config)
    await Bun.write(path.join(config.outDir, "sitemap.xml"), sitemapXml)
    console.log("✅ Sitemap generated.")
}

export async function buildSite(config: Config): Promise<void> {
    const startTime = performance.now()

    console.log("🚀 Starting build...")

    await prepareBuildDirectory(config)

    if (config.locales.length === 0) {
        console.error("❌ No locales found. Build aborted.")
        process.exit(1)
    }

    await buildLocalizedPages(config)

    await performPostBuildActions(config)

    const endTime = performance.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    console.log(`⏱️ Total build time: ${duration}s`)
    console.log("🎉 Build complete!")
}
