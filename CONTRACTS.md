Flat Contracts: Router Bridge (router:* <-> llama:*)

Overview
- The bridge provides backward compatibility by ensuring router:* client events map to the canonical llama:* backend handlers. Payload shapes mirror the corresponding llama:* responses.
- Frontend continues to listen for router:* events to avoid UI churn; canary migration to llama:* can be performed later.

Requests (Client to Server)
- router:status
  - Payload: any shape accepted by llama:status; server forwards to llama:status, replies with { success, data, timestamp }
- router:start
  - Payload: { modelName? } forwarded to llama:start; replies with { success, data? }
- router:stop
  - Payload: {} forwarded to llama:stop; replies with { success, data? }
- router:restart
  - Payload: {} forwarded to llama:restart; replies with { success, data? }

Broadcasts (Server to Client)
- router:status
  - Broadcasted when llama:status emits, using the same payload shape as llama:status if possible
- models:updated
  - Broadcasted as part of model state changes; no change required
- llama:status
  - Broadcasted to all when llama status changes, used by frontend under the bridged path

Payload Formats (Examples)
- router:status response (bridged)
  {"success": true, "data": {"status": "running", "uptime": "2h"}, "timestamp": "2026-01-...</timestamp>"}
- router:start response (bridged)
  {"success": true, "data": {"started": true}, "timestamp": "..."}

Notes
- This file is a flat contract reference for the bridging approach and should be kept in sync with the code changes in Phase 2.
- Any deviation in payload fields between router:* and llama:* should be reconciled in the bridge module with explicit payload mapping.
