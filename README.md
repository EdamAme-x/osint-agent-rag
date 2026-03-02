# osint-mcp

An MCP server for OSINT workflows, powered by local knowledge from `writeups/`.
Implementation stack: `hono + @hono/mcp`.

## Install from npm

```bash
npm i -g osint-mcp
```

or run it directly:

```bash
npx -y osint-mcp
```

## Setup

```bash
bun install
bun run dev
```

## Git Hooks

Install the repository hooks:

```bash
bun run hooks:install
```

Current policy:

- `pre-commit` runs `bun run typecheck` only

## Codex MCP (One Command)

Register this server in Codex with a single command:

```bash
codex mcp add osint-mcp-local -- bun --cwd "$(pwd)" run mcp:stdio
```

If you run the command outside this repository, replace `"$(pwd)"` with the absolute path to this project.

If you use the published npm package:

```bash
codex mcp add osint-mcp -- npx -y osint-mcp
```

Verify registration:

```bash
codex mcp list
```

## Start Modes

```bash
# HTTP mode (default)
bun run dev:http
bun run start:http

# Command mode (stdio transport for MCP clients)
bun run dev:stdio
bun run start:stdio
bun run mcp:stdio
```

## Build / Start

```bash
bun run build
bun run start
```

## Checks

```bash
bun run typecheck
bun run test
```

After startup:

- `GET /health`
- `ALL /mcp`

## Implemented MCP tools

- `search_past_writeups`
  - Full-text search over `writeups/**/README.md` and return top matching hints
- `list_frequent_domains_in_writeups`
  - Aggregate frequently referenced domains from writeups
- `duckduckgo_search_api`
  - Query DuckDuckGo Instant Answer API (no API key required)
- `wayback_cdx_lookup`
  - Query Wayback Machine CDX API snapshots
- `jina_fetch_url`
  - Fetch page text through `https://r.jina.ai/`
- `twstalker_profile_lookup`
  - Fetch Twstalker profile timeline via `r.jina.ai` and extract recent post snippets
- `capsolver_create_and_poll`
  - Create a CapSolver task and poll until completion (`apiKey` passed as input)
- `yandex_image_search_scrape`
  - Scrape Yandex image search results without an API key
- `archive_today_lookup`
  - Fetch archive.today/archive.md timemap entries
- `domain_recon_bundle`
  - Bundle DNS / RDAP / crt.sh / whois / optional Shodan lookups
- `extract_metadata_from_media`
  - Extract metadata from local or remote media (exiftool/ffprobe/exifr)
