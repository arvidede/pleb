import { promises, watch } from "fs"
import path from "path"
import { getLocales } from "./i18n"
import { renderPage } from "./render"
import { LocaleInfo, UserConfig } from "./types"
import { getDirname } from "./utils"

export function handleSSE(
    req: Request,
    sseClients: Set<{ controller: ReadableStreamDefaultController<unknown> }>,
): Response {
    const stream = new ReadableStream({
        start(controller) {
            const client = { controller }
            sseClients.add(client)
            controller.enqueue("data: connected\n\n")

            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(": heartbeat\n\n")
                } catch {
                    clearInterval(heartbeatInterval)
                    sseClients.delete(client)
                }
            }, 10000)

            req.signal.addEventListener("abort", () => {
                clearInterval(heartbeatInterval)
                sseClients.delete(client)
                try {
                    controller.close()
                } catch {
                    /* empty */
                }
                console.log("[Pleb Dev] SSE client disconnected.")
            })

            console.log("[Pleb Dev] SSE client connected.")
        },
        cancel() {
            console.log("[Pleb Dev] SSE stream cancelled by client (possibly).")
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    })
}

export async function handleRequest(
    req: Request,
    config: UserConfig,
    locales: string[],
    defaultLocale: string,
    pagesDir: string,
    publicDir: string,
): Promise<Response> {
    const url = new URL(req.url)
    let requestPathname = decodeURIComponent(url.pathname)
    if (requestPathname.startsWith("/")) {
        requestPathname = requestPathname.substring(1)
    }
    if (requestPathname === "" || requestPathname.endsWith("/")) {
        requestPathname += "index.html"
    }

    const publicFilePath = path.join(publicDir, requestPathname)
    const publicFile = Bun.file(publicFilePath)
    if (await publicFile.exists()) {
        try {
            const stat = await promises.stat(publicFilePath)
            if (stat.isFile()) {
                return new Response(publicFile)
            } else if (
                stat.isDirectory() &&
                publicFilePath.endsWith("index.html")
            ) {
                return new Response(publicFile)
            }
        } catch (e) {
            console.warn(`Error stating file ${publicFilePath}: ${e}`)
        }
    }

    if (requestPathname.endsWith("/index.html")) {
        requestPathname =
            requestPathname.substring(
                0,
                requestPathname.length - "/index.html".length,
            ) || "index"
    } else if (requestPathname.endsWith(".html")) {
        requestPathname = requestPathname.substring(
            0,
            requestPathname.length - ".html".length,
        )
    }

    let locale = defaultLocale
    const pathParts = requestPathname.split("/")
    if (pathParts.length > 0 && locales.includes(pathParts[0])) {
        locale = pathParts[0]
        requestPathname = pathParts.slice(1).join("/") || "index"
    }

    const pageFileName = `${requestPathname}.tsx`
    let pageFilePath = path.join(pagesDir, pageFileName)
    const pageFile = Bun.file(pageFilePath)

    if (!(await pageFile.exists())) {
        const potentialIndexPagePath = path.join(
            pagesDir,
            requestPathname,
            "index.tsx",
        )
        const potentialIndexFile = Bun.file(potentialIndexPagePath)
        if (await potentialIndexFile.exists()) {
            pageFilePath = potentialIndexPagePath
        } else {
            const fallbackPublicFilePath = path.join(
                publicDir,
                requestPathname + ".html",
            )
            const fallbackPublicFile = Bun.file(fallbackPublicFilePath)
            if (await fallbackPublicFile.exists()) {
                return new Response(fallbackPublicFile)
            }
            return new Response("Page not found", { status: 404 })
        }
    }

    try {
        const html = await renderPage(
            config,
            pagesDir,
            path.relative(pagesDir, pageFilePath),
            locale,
            true,
        )
        return new Response(html, {
            headers: { "Content-Type": "text/html" },
        })
    } catch (error: unknown) {
        console.error("Error rendering page:", error)
        const errorMessage =
            error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : ""
        return new Response(
            `<!DOCTYPE html>
                    <html>
                    <head>
                        <title>Error</title>
                        <style>
                            body { font-family: sans-serif; background-color: #f8d7da; color: #721c24; padding: 20px; }
                            h1 { color: #721c24; }
                            pre { background-color: #f5c6cb; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
                        </style>
                    </head>
                    <body>
                        <h1>Rendering Error</h1>
                        <p>An error occurred while rendering the page:</p>
                        <pre>${errorMessage}\n\n${errorStack}</pre>
                        <p>Check the console for more details.</p>
                    </body>
                    </html>`,
            {
                status: 500,
                headers: { "Content-Type": "text/html" },
            },
        )
    }
}

export function startFileWatcher(
    config: UserConfig,
    sseClients: Set<{ controller: ReadableStreamDefaultController<unknown> }>,
    initialLocaleData: {
        locales: string[]
        defaultLocale: string
        localeInfos: LocaleInfo[]
    },
): void {
    let { locales, defaultLocale, localeInfos } = initialLocaleData
    const localesDir = config.localesDir
    const configPath = path.join(config.projectRoot, "config.js")

    const reloadCache = () => {
        Object.keys(require.cache).forEach((key: string) => {
            if (key.includes(config.appDir) || key.includes(getDirname())) {
                delete require.cache[key]
            }
        })
    }

    const broadcastReload = () => {
        console.log("[Pleb Dev] Broadcasting reload to SSE clients...")
        for (const client of sseClients) {
            try {
                client.controller.enqueue("data: reload\n\n")
            } catch (e) {
                console.warn(
                    "[Pleb Dev] Error sending to SSE client, removing:",
                    e,
                )
                sseClients.delete(client)
                try {
                    client.controller.close()
                } catch {
                    /* Ignore */
                }
            }
        }
    }

    const watchHandler = (
        eventType: string,
        filename: string | null | undefined,
    ) => {
        if (filename) {
            console.log(`File changed: ${filename}. Type: ${eventType}`)
            reloadCache()

            const fullPath = path.resolve(filename)

            if (
                fullPath.startsWith(localesDir) ||
                fullPath === path.resolve(configPath)
            ) {
                console.log(
                    "Config or locales updated, re-fetching locales on server...",
                )
                localeInfos = getLocales(config)
                locales = localeInfos.map((info) => info.code)
                const defaultLocaleInfo = localeInfos.find(
                    (info) => info.isDefault,
                )
                defaultLocale = defaultLocaleInfo
                    ? defaultLocaleInfo.code
                    : config.defaultLocale
                console.log(
                    `Available locales: ${locales.join(", ")}. Default locale: ${defaultLocale}`,
                )
            }

            broadcastReload()
        }
    }

    try {
        watch(config.appDir, { recursive: true }, watchHandler)
        console.log(`Watching ${config.appDir} for changes.`)
    } catch (e) {
        console.error(`Failed to watch ${config.appDir}:`, e)
    }

    try {
        watch(
            config.publicDir,
            { recursive: true },
            (eventType: string, filename: string | null | undefined) => {
                if (filename) {
                    console.log(
                        `Public file changed: ${filename}. Type: ${eventType}. Client should refresh.`,
                    )
                }
            },
        )
        console.log(`Watching ${config.publicDir} for changes.`)
    } catch (e) {
        console.error(`Failed to watch ${config.publicDir}:`, e)
    }

    try {
        watch(configPath, watchHandler)
        console.log(`Watching ${configPath} for changes.`)
    } catch (e) {
        console.error(`Failed to watch ${configPath}:`, e)
    }
}

export async function startDevServer(config: UserConfig): Promise<void> {
    const localeInfos = getLocales(config)
    const locales: string[] = localeInfos.map((info) => info.code)
    const defaultLocaleInfo = localeInfos.find((info) => info.isDefault)
    const defaultLocale: string = defaultLocaleInfo
        ? defaultLocaleInfo.code
        : config.defaultLocale

    const pagesDir = config.pagesDir
    const publicDir = config.publicDir

    const sseClients: Set<{
        controller: ReadableStreamDefaultController<unknown>
    }> = new Set()

    console.log(`🚀 Starting Bun server on port ${config.port}...`)

    Bun.serve({
        port: config.port,
        idleTimeout: 255,
        async fetch(req: Request) {
            const url = new URL(req.url)

            if (url.pathname === "/pleb-dev-events") {
                return handleSSE(req, sseClients)
            }

            return handleRequest(
                req,
                config,
                locales,
                defaultLocale,
                pagesDir,
                publicDir,
            )
        },
        error(error: Error) {
            console.error("Bun server error:", error)
            return new Response("Internal Server Error", { status: 500 })
        },
    })

    console.log(`Bun server is listening on http://localhost:${config.port}`)
    console.log(`🌐 Available locales: ${locales.join(", ")}`)
    console.log(
        "👀 Watching for file changes... (Note: Full HMR with Bun.serve is evolving)",
    )

    startFileWatcher(config, sseClients, {
        locales,
        defaultLocale,
        localeInfos,
    })
}
