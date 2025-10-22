import { buildSite } from "./build"
import { startDevServer } from "./dev"

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

            await buildSite()
            break
        default:
            console.error(`Unknown command: ${command}`)
            console.error("Commands: dev, build")
            process.exit(1)
    }
}

runCli()
