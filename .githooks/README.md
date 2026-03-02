# Git Hooks

This repository uses `core.hooksPath=.githooks`.

## Install

```bash
bun run hooks:install
```

## Active hooks

- `pre-commit`: runs `bun run typecheck` only
