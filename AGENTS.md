# AGENTS.md – Development Standards (≈20 lines)

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
✅ **Dual Proxy Mastery**: Simultaneously emulate **LM Studio** (port 1234) AND **Ollama** (port 11434) backends with llama-server (llama.cpp)  
✅ **Enterprise-Grade Audio**: Powered by **faster-whisper** for lightning-fast speech-to-text transcription  
✅ **Zero-Compromise Performance**: CPU-optimized with intelligent resource management  
✅ **Headless Hero**: Perfect for servers, Docker containers, and CI/CD pipelines  
✅ **Future-Proof Architecture**: Designed for tomorrow's AI models, not just today's  

## Error Handling
- Throw clearly; log then re‑throw, never swallow; use `AppError` # No Cursor/Copilot rules