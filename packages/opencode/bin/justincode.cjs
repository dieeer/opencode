#!/usr/bin/env node

const childProcess = require("child_process")
const path = require("path")

const scriptDir = path.dirname(require.resolve("./package.json"))
const entry = path.join(scriptDir, "src", "index.ts")

const child = childProcess.spawn("bun", ["run", "--conditions=browser", entry, ...process.argv.slice(2)], {
  stdio: "inherit",
})

child.on("error", (error) => {
  console.error(error.message)
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(typeof code === "number" ? code : 0)
})
