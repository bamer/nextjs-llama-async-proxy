DevOps/Infra Specialist Subagent Plan (devops)
- Objective: Lock proxy config to preserve /llamaproxws and add lightweight CI health checks.

- Tasks:
 1. Update proxy/waf or reverse proxy to hard-code path /llamaproxws for websocket traffic and block other variants.
 2. Add lightweight health-check script to CI to ping the proxy endpoint health and ensure it responds properly.
 3. Surface startup/preset flow health in CI dashboards.

- Diffs Placeholder:
  - proxy config: preserve /llamaproxws
  - ci-health-check.yml

- Acceptance: CI health checks pass; path preservation verified.
