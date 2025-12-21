# AGENTS.md – Development Standards (≈90 lines)

## Build / Test / Lint
pnpm dev          # dev server
pnpm build        # production build
pnpm start        # run built app
pnpm test         # all Jest tests
pnpm lint         # ESLint
pnpm lint:fix     # auto‑fix lint
pnpm test -- tests/<file>.test.ts   # single test

## Imports, Types & Naming
- Group: React/Next → third‑party → '@/...'
- camelCase funcs/vars, PascalCase components
- TS strict; no any; descriptive names
- kebab-case dirs, .tsx/.ts files
- End files with newline

## Purpose of project
✅ **Dual Proxy Mastery**: Simultaneously emulate **LM Studio** (port 1234) AND **Ollama** (port 11434) Who are SERVED in backends with llama-server (llama.cpp) 
✅ **Enterprise-Grade Audio**: Powered by **faster-whisper** for lightning-fast speech-to-text transcription 
✅ **Zero-Compromise Performance**: CPU-optimized with intelligent resource management 
✅ **Headless Hero**: Perfect for servers, Docker containers, and CI/CD pipelines 
✅ **Future-Proof Architecture**: Designed for tomorrow's AI models, not just today's 


### Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```


