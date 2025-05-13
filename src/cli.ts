#!/usr/bin/env bun

import path from "path"
import { buildSite, startDevServer } from "./index"
import { UserConfig } from "./types"

async function runCli() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (!command) {
        console.error("Usage: pleb <command>")
        console.error("Commands: dev, build")
        process.exit(1)
    }

    const userProjectRoot = process.cwd()
    const configFileName = "config.js"
    const configPath = path.join(userProjectRoot, configFileName)

    let userConfig: Partial<UserConfig> = {}
    const configFile = Bun.file(configPath)
    if (await configFile.exists()) {
        try {
            const configModule = require(configPath)
            userConfig = configModule.default
        } catch (error: unknown) {
            console.error(
                `❌ Error loading "${configFileName}" from ${configPath}:`,
                error instanceof Error ? error.message : error,
            )
            console.error(
                `Please ensure your "${configFileName}" file is correctly formatted and exports a default configuration object.`,
            )
            process.exit(1)
        }
    } else {
        console.warn(
            `"${configFileName}" not found in project root. Using default configuration.`,
        )
    }

    const defaultConfig: UserConfig = {
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

    const mergedConfig: UserConfig = {
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
