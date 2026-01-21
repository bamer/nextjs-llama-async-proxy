# Llama Async Proxy Dashboard

This document describes the architecture, setup, and use of the Llama Async Proxy Dashboard.

- This repository uses a Bridge-based approach to routing events between client and server via Socket.IO.
- Dashboard-first migration strategy is in PLAN.md and CONTRACTS.md with a canary rollout plan.
- All changes are designed to be backward-compatible with minimal disruption.