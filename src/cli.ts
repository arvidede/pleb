import path from "path"
import { buildSite } from "./build"
import { startDevServer } from "./dev"
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

async function runCli() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (!command) {
        console.error("Usage: pleb <command>")
        console.error("Commands: dev, build")
        process.exit(1)
    }

    const userProjectRoot = process.cwd()

    const userConfig = await getUserConfig(userProjectRoot)

    const defaultConfig: Config = {
        projectRoot: userProjectRoot,
        port: 3000,
        appDir: "./app",
        outDir: "./out",
        pagesDir: "./app/pages",
        localesDir: "./app/locales",
        stylesDir: "./app/styles",
        publicDir: "./app/public",
        templatePath: "./app/template.html",
        cssFilePath: "./app/styles/main.css",
        defaultLocale: "en",
        baseUrl: "http://localhost:3000",
    }

    const mergedConfig: Config = {
        ...defaultConfig,
        ...userConfig,
        projectRoot: userProjectRoot,
    }

    mergedConfig.appDir = path.resolve(userProjectRoot, mergedConfig.appDir)
    mergedConfig.outDir = path.resolve(userProjectRoot, mergedConfig.outDir)

    mergedConfig.pagesDir = path.resolve(userProjectRoot, mergedConfig.pagesDir)
    mergedConfig.localesDir = path.resolve(
        userProjectRoot,
        mergedConfig.localesDir,
    )
    mergedConfig.stylesDir = path.resolve(
        userProjectRoot,
        mergedConfig.stylesDir,
    )
    mergedConfig.publicDir = path.resolve(
        userProjectRoot,
        mergedConfig.publicDir,
    )
    mergedConfig.templatePath = path.resolve(
        userProjectRoot,
        mergedConfig.templatePath,
    )
    mergedConfig.cssFilePath = path.resolve(
        userProjectRoot,
        mergedConfig.cssFilePath,
    )

    const essentialProps: (keyof UserConfig)[] = [
        "projectRoot",
        "defaultLocale",
    ]
    for (const prop of essentialProps) {
        if (mergedConfig[prop] === undefined) {
            console.error(
                `❌ Internal Error: Missing essential configuration property after merge: "${prop}"`,
            )
            process.exit(1)
        }
    }

    switch (command) {
        case "dev":
            console.log("Starting development server...")

            await startDevServer(mergedConfig)
            break
        case "build":
            console.log("Running build...")

            await buildSite(mergedConfig)
            break
        default:
            console.error(`Unknown command: ${command}`)
            console.error("Commands: dev, build")
            process.exit(1)
    }
}

runCli()
