#!/usr/bin/env bun
/**
 * pr-spawn.ts — Auto-spawn opencode agents for new PRs
 *
 * Usage:
 *   bun run script/pr-spawn.ts                  # Check once
 *   bun run script/pr-spawn.ts --watch           # Poll every 5 minutes
 *   bun run script/pr-spawn.ts --repos dieeer/*  # Filter repos
 *
 * Requires: gh CLI authenticated, opencode SDK running
 */

import { execSync } from "node:child_process"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const STATE_DIR = join(process.env.HOME ?? "~", ".local", "state", "opencode")
const STATE_FILE = join(STATE_DIR, "pr-spawn-state.json")
const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

type State = {
  seen: Record<string, number> // prKey -> timestamp
}

function loadState(): State {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })
  if (!existsSync(STATE_FILE)) return { seen: {} }
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"))
  } catch {
    return { seen: {} }
  }
}

function saveState(state: State) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

type PR = {
  number: number
  title: string
  body: string
  url: string
  branch: string
  repo: string
  author: string
  createdAt: string
}

function getOpenPRs(repos?: string[]): PR[] {
  const repoFilter = repos?.length ? repos.join(" ") : ""
  const cmd = `gh pr list --state open --json number,title,body,url,headRefName,repository,author,createdAt --limit 50 ${repoFilter ? `--repo ${repoFilter}` : ""}`

  try {
    const output = execSync(cmd, { encoding: "utf-8", timeout: 15000 })
    const raw = JSON.parse(output)

    return raw.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body ?? "",
      url: pr.url,
      branch: pr.headRefName,
      repo: pr.repository?.nameWithOwner ?? pr.repository?.name ?? "unknown",
      author: pr.author?.login ?? "unknown",
      createdAt: pr.createdAt,
    }))
  } catch (error) {
    console.error("Failed to fetch PRs:", error)
    return []
  }
}

function prKey(pr: PR): string {
  return `${pr.repo}#${pr.number}`
}

function isNewPR(pr: PR, state: State): boolean {
  const key = prKey(pr)
  if (state.seen[key]) return false
  return true
}

function buildPrompt(pr: PR): string {
  const bodyPreview = pr.body.length > 500 ? pr.body.slice(0, 500) + "..." : pr.body
  return `New PR detected: ${pr.title}
Repository: ${pr.repo}
Branch: ${pr.branch}
Author: ${pr.author}
URL: ${pr.url}

PR Description:
${bodyPreview || "(no description)"}

Please analyze this PR. Check out the branch, review the changes, and provide:
1. A summary of what the PR does
2. Code quality assessment
3. Any potential issues or suggestions
4. Whether it's ready to merge`
}

async function spawnAgent(prompt: string): Promise<string | null> {
  const { createOpencodeClient } = await import("@opencode-ai/sdk")

  const client = createOpencodeClient({
    baseUrl: process.env.OPENCODE_URL ?? "http://localhost:4096",
  })

  try {
    // Create a new session
    const session = await client.session.create({})
    if (!session.data?.id) {
      console.error("Failed to create session")
      return null
    }

    const sessionID = session.data.id

    // Send the prompt
    await client.session.prompt({
      path: { id: sessionID },
      body: {
        parts: [{ type: "text", text: prompt }],
      },
    })

    return sessionID
  } catch (error) {
    console.error("Failed to spawn agent:", error)
    return null
  }
}

async function checkForNewPRs(repos?: string[]) {
  const state = loadState()
  const prs = getOpenPRs(repos)
  const newPRs = prs.filter((pr) => isNewPR(pr, state))

  if (newPRs.length === 0) {
    console.log(`[${new Date().toISOString()}] No new PRs found.`)
    return
  }

  console.log(`[${new Date().toISOString()}] Found ${newPRs.length} new PR(s):`)

  for (const pr of newPRs) {
    console.log(`  - ${pr.repo}#${pr.number}: ${pr.title}`)
    const prompt = buildPrompt(pr)
    const sessionID = await spawnAgent(prompt)
    if (sessionID) {
      console.log(`    → Agent spawned in session ${sessionID}`)
    }
    state.seen[prKey(pr)] = Date.now()
  }

  // Prune old entries (older than 7 days)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  for (const [key, ts] of Object.entries(state.seen)) {
    if (ts < cutoff) delete state.seen[key]
  }

  saveState(state)
}

// CLI
const args = process.argv.slice(2)
const watchMode = args.includes("--watch")
const reposFlag = args.indexOf("--repos")
const repos = reposFlag !== -1 ? args.slice(reposFlag + 1).filter((a) => !a.startsWith("--")) : undefined

async function main() {
  console.log(`PR Auto-Spawn Agent — ${new Date().toISOString()}`)
  console.log(`Repos: ${repos?.join(", ") ?? "all"}`)
  console.log(`Mode: ${watchMode ? "watching (5min interval)" : "one-shot"}`)
  console.log("---")

  await checkForNewPRs(repos)

  if (watchMode) {
    setInterval(() => checkForNewPRs(repos), POLL_INTERVAL_MS)
    console.log(`\nWatching for new PRs every ${POLL_INTERVAL_MS / 1000}s...`)
  }
}

main()
