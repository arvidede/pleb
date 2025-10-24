import { Dirent } from "node:fs"
import { readdir } from "node:fs/promises"
import { join } from "path"

const MODULE_SPECIFIER_REGEX =
    /((?:import|export)\s+.*?from\s+['"]\..*?)(?<!\.js|\.mjs|\.css|\.json)(['"]);/g

function rewriteSpecifiers(content: string): string {
    return content.replace(MODULE_SPECIFIER_REGEX, "$1.js$2")
}

async function processDirectory(directory: string) {
    let dirents: Dirent[]
    try {
        dirents = await readdir(directory, { withFileTypes: true })
    } catch (e) {
        if (
            e instanceof Error &&
            "code" in e &&
            (e as NodeJS.ErrnoException).code === "ENOENT"
        ) {
            return
        }
        throw e
    }

    const promises: Promise<void>[] = []

    for (const dirent of dirents) {
        const fullPath = join(directory, dirent.name)

        if (dirent.isDirectory()) {
            promises.push(processDirectory(fullPath))
        } else if (dirent.isFile() && dirent.name.endsWith(".d.ts")) {
            promises.push(
                (async () => {
                    try {
                        const file = Bun.file(fullPath)
                        const content = await file.text()
                        const newContent = rewriteSpecifiers(content)

                        if (newContent !== content) {
                            await Bun.write(fullPath, newContent)
                        }
                    } catch (error) {
                        console.error(`Error processing ${fullPath}:`, error)
                    }
                })(),
            )
        }
    }

    await Promise.all(promises)
}

try {
    const distPath = join(process.cwd(), "dist")
    await processDirectory(distPath)
    console.log("DTS specifier rewriting complete.")
} catch (error) {
    console.error("DTS fixing failed:", error)
    process.exit(1)
}
