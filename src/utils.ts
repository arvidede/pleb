import fs from "fs"
import path from "path"
import { UserConfig } from "./types"

export const getDirname = () => __dirname

export function copyStatic(config: UserConfig): void {
    const publicDir = config.publicDir
    const buildDir = config.outDir

    if (!fs.existsSync(publicDir)) {
        console.warn(
            `Public directory not found at ${publicDir}. Skipping static file copy.`,
        )
        return
    }

    const copyRecursive = (src: string, dest: string) => {
        const exists = fs.existsSync(src)
        const stats = exists ? fs.statSync(src) : undefined
        const isDirectory = stats ? stats.isDirectory() : false

        if (isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true })
            }
            fs.readdirSync(src).forEach((childItemName) => {
                copyRecursive(
                    path.join(src, childItemName),
                    path.join(dest, childItemName),
                )
            })
        } else if (exists) {
            fs.copyFileSync(src, dest)
        }
    }

    console.log(`Copying static files from ${publicDir} to ${buildDir}`)
    copyRecursive(publicDir, buildDir)
}

export function getAllTsxFiles(
    config: UserConfig,
    dirPath: string,
    fileList: string[] = [],
): string[] {
    const files = fs.readdirSync(dirPath)

    files.forEach((file) => {
        const filePath = path.join(dirPath, file)
        if (fs.statSync(filePath).isDirectory()) {
            getAllTsxFiles(config, filePath, fileList)
        } else if (filePath.endsWith(".tsx")) {
            fileList.push(filePath)
        }
    })

    return fileList
}

export function findHtmlFilesSync(directory: string): string[] {
    const htmlFiles: string[] = []

    function walkDirSync(currentDir: string) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name)

            if (entry.isDirectory()) {
                walkDirSync(fullPath)
            } else if (entry.isFile() && entry.name.endsWith(".html")) {
                const relativeDirPath = path.relative(directory, currentDir)
                htmlFiles.push(
                    relativeDirPath === "" ? "index" : relativeDirPath,
                )
            }
        }
    }

    try {
        walkDirSync(directory)
        return htmlFiles
    } catch (err: unknown) {
        console.error(
            `Error reading directory ${directory}:`,
            err instanceof Error ? err.message : err,
        )
        throw err
    }
}

export async function generateSitemap(config: UserConfig): Promise<string> {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    const pages = findHtmlFilesSync(config.outDir)

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
