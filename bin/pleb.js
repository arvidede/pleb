#!/usr/bin/env node
import { spawn } from "child_process"
import { resolve } from "path"

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2)
const command = args[0]

const nodeEnv = command === "dev" ? "development" : "production"

const cliScriptPath = resolve(__dirname, "../dist/cli.js")

const child = spawn("bun", [cliScriptPath, ...args], {
    stdio: "inherit",
    env: {
        ...process.env,
        NODE_ENV: nodeEnv,
    },
})

child.on("exit", (code) => {
    process.exit(code ?? 1)
})
