import { buildSite } from "./build"
import { startDevServer } from "./dev"
import { translate } from "./i18n/translation"

async function runCli() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (!command) {
        console.error("Usage: pleb <command>")
        console.error("Commands: dev, build")
        process.exit(1)
    }

    switch (command) {
        case "dev":
            console.log("Starting development server...")

            await startDevServer()
            break
        case "build":
            console.log("Running build...")
            const forceTranslate = args[1] === "--force-translate"

            await buildSite(forceTranslate)
            break
        case "translate":
            console.log("Running translation...")
            await translate()
            break
        default:
            console.error(`Unknown command: ${command}`)
            console.error("Commands: dev, build")
            process.exit(1)
    }
}

runCli()
