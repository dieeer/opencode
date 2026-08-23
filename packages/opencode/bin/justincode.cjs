#!/usr/bin/env node

const childProcess = require("child_process")
const path = require("path")

const projectRoot = path.join(__dirname, "..", "..")
const entry = path.join(projectRoot, "packages", "opencode", "src", "index.ts")

const child = childProcess.spawn("bun", ["run", "--cwd", projectRoot, "--conditions=browser", "packages/opencode/src/index.ts", ...process.argv.slice(2)], {
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
