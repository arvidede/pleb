import { cpSync, existsSync, mkdirSync, promises, watch } from "fs"
import path from "path"
import config from "./config"
import { renderError } from "./html"
import imageRegistry from "./image/registry"
import { renderPage } from "./render"
import * as response from "./response"

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

async function tryServeFile(fullPath: string): Promise<Response | null> {
    const file = Bun.file(fullPath)

    if (!(await file.exists())) {
        return null
    }

    try {
        const stat = await promises.stat(fullPath)
        if (stat.isFile()) {
            return new Response(file)
        }
        if (stat.isDirectory() && fullPath.endsWith("index.html")) {
            return new Response(file)
        }
    } catch (e: unknown) {
        console.warn(`Error stating file ${fullPath}: ${e}`)
    }

    return null
}

function parsePageRequest(
    publicPath: string,
    locales: string[],
    defaultLocale: string,
): { pagePath: string; locale: string } {
    let pagePath = publicPath.replace(".html", "")

    if (pagePath === "" || pagePath === "/") {
        return {
            pagePath: "index",
            locale: defaultLocale,
        }
    }

    const pathParts = pagePath.split("/")
    const locale = pathParts.shift()

    if (locale && locales.includes(locale)) {
        return {
            pagePath: pathParts.join("/"),
            locale,
        }
    }

    return {
        pagePath,
        locale: defaultLocale,
    }
}

function findPageModule(pagePath: string): string | null {
    const directPagePath = path.join(config.pagesDir, `${pagePath}.tsx`)

    if (existsSync(directPagePath)) {
        return directPagePath
    }

    const indexPagePath = path.join(config.pagesDir, pagePath, "index.tsx")

    if (existsSync(indexPagePath)) {
        return indexPagePath
    }

    return null
}

async function renderPageResponse(
    pageModulePath: string,
    locale: string,
): Promise<Response> {
    try {
        const html = await renderPage(
            path.relative(config.pagesDir, pageModulePath),
            locale,
            true,
        )

        return response.html(html)
    } catch (error: unknown) {
        return response.html(renderError(error), {
            status: 500,
        })
    }
}

export async function handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const requestPath = url.pathname.substring(1)

    const publicFileResponse = await tryServeFile(
        path.join(config.outDir, requestPath),
    )

    if (publicFileResponse) {
        return publicFileResponse
    }

    const { pagePath, locale } = parsePageRequest(
        requestPath,
        config.locales,
        config.defaultLocale,
    )

    const pageModulePath = findPageModule(pagePath)

    if (pageModulePath) {
        return await renderPageResponse(pageModulePath, locale)
    }

    return new Response("Page not found", { status: 404 })
}

function reloadCache() {
    Object.keys(require.cache).forEach((key: string) => {
        // Only clear modules that are inside the user's app directory.
        // Crucially, do NOT clear the SSG's own code or anything from node_modules,
        // as this can cause multiple instances of React to be loaded.
        if (key.startsWith(config.appDir)) {
            delete require.cache[key]
        }
    })
}

function broadcastReload(sseClients: SSEClients) {
    console.log("[Pleb Dev] Broadcasting reload to SSE clients...")
    for (const client of sseClients) {
        try {
            client.controller.enqueue("data: reload\n\n")
        } catch (e) {
            console.warn("[Pleb Dev] Error sending to SSE client, removing:", e)
            sseClients.delete(client)
            try {
                client.controller.close()
            } catch {
                /* Ignore */
            }
        }
    }
}

type SSEClients = Set<{ controller: ReadableStreamDefaultController<unknown> }>

export function startFileWatcher(sseClients: SSEClients): void {
    const localesDir = config.localesDir
    const configJsPath = path.join(config.projectRoot, "config.js")
    const configTsPath = path.join(config.projectRoot, "config.ts")
    const configPath = existsSync(configJsPath) ? configJsPath : configTsPath

    function watchHandler(
        eventType: string,
        filename: string | null | undefined,
    ) {
        if (filename) {
            console.log(`File changed: ${filename}. Type: ${eventType}`)
            reloadCache()

            const fullPath = path.resolve(filename)

            if (
                fullPath.startsWith(localesDir) ||
                fullPath === path.resolve(configPath)
            ) {
                console.log("Config updated, re-fetching locales on server...")
                // TODO: fetch translations
            }

            broadcastReload(sseClients)
        }
    }

    try {
        watch(configPath, watchHandler)
    } catch (e) {
        console.error(`Failed to watch ${configPath}:`, e)
    }

    try {
        watch(config.appDir, { recursive: true }, watchHandler)
    } catch (e) {
        console.error(`Failed to watch ${config.appDir}:`, e)
    }

    try {
        watch(config.publicDir, { recursive: true }, copyPublicFiles)
    } catch (e) {
        console.error(`Failed to watch ${config.publicDir}:`, e)
    }
}

function copyPublicFiles() {
    try {
        if (!existsSync(config.outDir)) {
            mkdirSync(config.outDir, { recursive: true })
        }

        cpSync(config.publicDir, config.outDir, { recursive: true })
    } catch (error: unknown) {
        console.error(
            `❌ Error copying directory: ${error instanceof Error ? error.message : error}`,
        )
    }
}

export async function startDevServer(): Promise<void> {
    const sseClients: Set<{
        controller: ReadableStreamDefaultController<unknown>
    }> = new Set()

    copyPublicFiles()

    console.log(`🚀 Starting server on port ${config.port}...`)

    Bun.serve({
        development: true,
        port: config.port,
        idleTimeout: 255,
        async fetch(req: Request) {
            console.log(`${req.method} ${req.url}`)
            const url = new URL(req.url)

            if (url.pathname === "/pleb-dev-events") {
                return handleSSE(req, sseClients)
            }

            const response = await handleRequest(req)

            await imageRegistry.processImages()

            return response
        },
        error(error: Error) {
            console.error("Server error:", error)
            return new Response("Internal Server Error", { status: 500 })
        },
    })

    console.log(`Server is listening on http://localhost:${config.port}`)
    console.log(`🌐 Available locales: ${config.locales.join(", ")}`)
    console.log("👀 Watching for file changes...")

    startFileWatcher(sseClients)
}
