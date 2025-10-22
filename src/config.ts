import path from "path"
import { Config, UserConfig } from "./types"

async function getUserConfig(projectRoot: string): Promise<UserConfig> {
    const possibleFilenames = ["config.ts", "config.js"]

    for (const filename of possibleFilenames) {
        const configPath = path.join(projectRoot, filename)
        const configFile = Bun.file(configPath)

        if (await configFile.exists()) {
            console.log(`Loading configuration from ${configPath}`)
            try {
                const configModule = await import(configPath)
                if (configModule.default) {
                    return configModule.default
                }
                console.error(
                    `❌ Error: Configuration file "${filename}" was found but does not have a default export.`,
                )
                process.exit(1)
            } catch (error: unknown) {
                console.error(
                    `❌ Error loading "${filename}":`,
                    error instanceof Error ? error.message : error,
                )
                process.exit(1)
            }
        }
    }

    console.warn(
        "⚠️ No config file (config.ts or config.js) found. Using default configuration.",
    )
    return {}
}

function verifyLocaleConfig(config: Config) {
    if (!config.defaultLocale) {
        console.error(`❌ Missing defaultLocale in config"`)
        process.exit(1)
    }

    if (!config.locales || !config.locales.length) {
        console.error(`❌ Missing locales in config"`)
        process.exit(1)
    }

    if (!config.locales.includes(config.defaultLocale)) {
        console.error(`❌ Default locale not in locales"`)
        process.exit(1)
    }
}

async function loadConfig() {
    const userProjectRoot = process.cwd()

    const userConfig = await getUserConfig(userProjectRoot)

    const defaultConfig: Config = {
        projectRoot: userProjectRoot,
        port: 3000,
        outDir: "./out",
        buildDir: "/_pleb",
        imgDir: "/images",
        appDir: "./app",
        pagesDir: "/pages",
        localesDir: "/locales",
        publicDir: "/public",
        templatePath: "/template.html",
        stylesDir: "/styles",
        cssFilePath: "/main.css",
        defaultLocale: "en",
        locales: ["en"],
        baseUrl: "http://localhost:3000",
    }

    const mergedConfig: Config = {
        ...defaultConfig,
        ...userConfig,
        projectRoot: userProjectRoot,
    }

    mergedConfig.appDir = path.resolve(userProjectRoot, mergedConfig.appDir)
    mergedConfig.outDir = path.relative(userProjectRoot, mergedConfig.outDir)

    // mergedConfig.buildDir = path.join(
    //     mergedConfig.outDir,
    //     mergedConfig.buildDir,
    // )

    mergedConfig.imgDir = path.join(mergedConfig.buildDir, mergedConfig.imgDir)

    mergedConfig.pagesDir = path.join(
        mergedConfig.appDir,
        mergedConfig.pagesDir,
    )
    mergedConfig.localesDir = path.join(
        mergedConfig.appDir,
        mergedConfig.localesDir,
    )
    mergedConfig.stylesDir = path.join(
        mergedConfig.appDir,
        mergedConfig.stylesDir,
    )
    mergedConfig.publicDir = path.join(
        mergedConfig.appDir,
        mergedConfig.publicDir,
    )

    mergedConfig.templatePath = path.join(
        mergedConfig.appDir,
        mergedConfig.templatePath,
    )
    mergedConfig.cssFilePath = path.join(
        mergedConfig.stylesDir,
        mergedConfig.cssFilePath,
    )

    verifyLocaleConfig(mergedConfig)

    return mergedConfig
}

const config = await loadConfig()

export default config
