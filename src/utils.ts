import fs from "fs/promises"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import path from "path"
import config from "./config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const getDirname = () => __dirname

export async function processPublicDirectory(): Promise<void> {
    const publicDir = config.publicDir
    const buildDir = config.outDir

    try {
        await fs.access(publicDir)
    } catch {
        console.warn(
            `Public directory not found at ${publicDir}. Skipping asset processing.`,
        )
        return
    }

    const walk = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name)
            const destPath = path.join(
                buildDir,
                path.relative(publicDir, srcPath),
            )

            if (entry.isDirectory()) {
                await fs.mkdir(destPath, { recursive: true })
                await walk(srcPath)
            } else {
                if (/\.(js|ts|tsx|mjs)$/.test(srcPath)) {
                    console.log(
                        `  - Bundling: ${path.relative(publicDir, srcPath)}`,
                    )
                    const result = await Bun.build({
                        entrypoints: [srcPath],
                        outdir: path.dirname(destPath),
                        target: "browser",
                        splitting: true,
                        minify: true,
                        naming: "[name].js",
                        define: {
                            "process.env.NODE_ENV":
                                JSON.stringify("production"),
                        },
                        plugins: [
                            {
                                name: "react-alias",
                                setup(build) {
                                    build.onResolve(
                                        { filter: /^react(\/.*)?$/ },
                                        (args) => {
                                            try {
                                                const resolvedPath =
                                                    require.resolve(args.path)
                                                return { path: resolvedPath }
                                            } catch {
                                                console.error(
                                                    `Could not resolve aliased module: ${args.path}`,
                                                )
                                                return null
                                            }
                                        },
                                    )
                                },
                            },
                        ],
                    })

                    if (!result.success) {
                        console.error("❌ Script bundling failed.")
                        for (const message of result.logs) {
                            console.error(message)
                        }
                    } else {
                        console.log("✅ Scripts bundled.")
                    }

                    if (!result.success) {
                        console.error(`❌ Failed to build script: ${srcPath}`)
                        for (const message of result.logs) {
                            console.error(message)
                        }
                    }
                } else {
                    await fs.copyFile(srcPath, destPath)
                }
            }
        }
    }

    console.log(`Processing assets from ${publicDir} to ${buildDir}`)
    await walk(publicDir)
}

export async function getAllTsxFiles(
    dirPath: string,
    fileList: string[] = [],
): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
        const filePath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
            await getAllTsxFiles(filePath, fileList)
        } else if (filePath.endsWith(".tsx")) {
            fileList.push(filePath)
        }
    }
    return fileList
}

async function findHtmlFiles(directory: string): Promise<string[]> {
    const htmlFiles: string[] = []

    async function walkDir(currentDir: string) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name)

            if (entry.isDirectory()) {
                await walkDir(fullPath)
            } else if (entry.isFile() && entry.name.endsWith(".html")) {
                const relativeDirPath = path.relative(directory, currentDir)
                htmlFiles.push(
                    relativeDirPath === "" ? "index" : relativeDirPath,
                )
            }
        }
    }

    try {
        await walkDir(directory)
        return htmlFiles
    } catch (err: unknown) {
        console.error(`Error reading directory ${directory}:`, err)
        throw err
    }
}

export async function generateSitemap(): Promise<string> {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    const pages = await findHtmlFiles(config.outDir)

    for (const page of pages) {
        const urlPath = page === "index" ? "/" : `/${page}/`

        const fullUrl = `${config.baseUrl}${urlPath}`

        sitemap += "  <url>\n"
        sitemap += `    <loc>${fullUrl}</loc>\n`
        sitemap += "  </url>\n"
    }

    sitemap += "</urlset>"
    return sitemap
}
