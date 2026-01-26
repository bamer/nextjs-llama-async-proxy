PR Plan: Socket.IO Architecture Refactor

Goal: Implement modular domain-based Socket.IO handlers and registrar wiring, plus client wrapper, with a safe, incremental rollout.

Proposed PR title: feat(socket): modular domain-based Socket.IO handlers with registrar wiring

Plan:
- [ ] td-01: ensure per-domain handlers compile and mount via registrar
- [ ] td-02: complete registrar wiring with dynamic domain imports
- [ ] td-03: integrate client SocketService usage across core components
- [ ] td-04: finalize event naming convention references across plan/docs
- [ ] td-05: add tests for models flow and registrar wiring
- [ ] td-06: update docs SOCKET_CONTRACTS.md with registrar contract and naming
- [ ] td-07: implement minimal models:list flow (server side models:list, broadcast models:updated)
- [ ] td-08: configure CI to run tests and lint on PRs
- [ ] td-09: finalize PR description with trace references to bg_bebcdb16, bg_9fda7f6b, bg_8f3287b9

Reviewers: @reviewer

Decision required: Approve proceeding with the proposed patch set and associated task dependencies.
