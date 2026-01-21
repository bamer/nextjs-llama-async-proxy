# Install Required Plugins/Libraries

## Overview
To support real-time data streaming and API integration, the following npm packages need to be installed:

- `socket.io-client` – for WebSocket connections (if used in addition to SSE)
- `axios` – for HTTP client usage in fallback or polling strategies
- `supabase-js` – optional for real-time database integration
- `date-fns` – for date formatting utilities

## Installation Command
```bash
pnpm add socket.io-client axios supabase-js date-fns
```

## Usage Notes
- Import `axios` in relevant service files for HTTP calls.
- Use `socket.io-client` in frontend components that need persistent WebSocket connections.
- `supabase-js` can be used for real-time database changes; configure with project URL and anon key.
- `date-fns` provides lightweight date formatting; install and use as needed.

## Verification
- Run `pnpm list` to confirm packages are listed.
- Ensure no peer dependency conflicts.

*Prepared by: Development Agent*