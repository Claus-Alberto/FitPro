# Multi-agent workflow

FitPro is meant to be driven end-to-end by AI with minimal interruption to the user. Work happens through four roles:

- **Gestor** — the main Claude Code thread (not a separate subagent file). Breaks the user's goal into tasks, decides which specialist(s) a task needs, delegates via the Agent tool, relays findings between specialists, and decides when a task is actually done.
- **design-ui-specialist** (`.claude/agents/design-ui-specialist.md`) — critiques changed screens against the design system, copy voice, and psychology/sales rules. Read-only: no Edit/Write.
- **dev-specialist** (`.claude/agents/dev-specialist.md`) — implements. Takes a task plus any findings handed to it and writes the code.
- **tester** (`.claude/agents/tester.md`) — actually drives the running app (Playwright, web target) to confirm a change works, not just that it compiles. Read-only: reports issues, doesn't fix them.

## Important implementation note

The `.claude/agents/*.md` files are **not** auto-registered as invokable subagent types in every session — confirmed 2026-08-19: only `claude`, `claude-code-guide`, `Explore`, `general-purpose`, `Plan`, `statusline-setup` were available as `subagent_type` even with the three role files present. Until/unless that changes, spawn `general-purpose` (which has full tool access) and open the prompt with an explicit instruction to read the relevant `.claude/agents/<role>.md` file first and act per that role definition for the rest of the task — the file still works as the role spec, it just has to be pulled in manually per call instead of selected via `subagent_type`. Re-check whether `subagent_type` picks the custom names up directly before repeating this workaround in a new session.

## How they connect

Subagents do not talk to each other directly or in real time — the Gestor is the hub. A typical cycle for one task:

1. Gestor scopes the task (reads relevant code/docs itself if scope is unclear — doesn't ask the user for things answerable from `CLAUDE.md`, `.agents/rules/`, or the existing code).
2. dev-specialist implements.
3. If the change touches UI, design-ui-specialist reviews the result; its findings go back to dev-specialist as a follow-up task, not to the user.
4. tester verifies the change actually works end to end (see its file for the Playwright/web-target workflow specifics).
5. If tester finds a break, Gestor routes the repro straight back to dev-specialist. Repeat 2-4 until tester passes.
6. Gestor moves to the next task without checking in, unless step 7 applies.

Independent tasks can be delegated in parallel (multiple Agent calls in one message); dependent steps (e.g. tester after dev-specialist) must run sequentially.

## When it's OK to interrupt the user anyway

Despite the "don't call me until it's ready" default, some things still warrant surfacing immediately rather than batching:

- Irreversible or externally-visible actions: `git push`, force operations, deleting data, anything touching a shared/remote system.
- A genuine product/scope decision that isn't answerable from this repo's docs or existing patterns (e.g. two reasonable but conflicting ways to design a flow, with no precedent to break the tie).
- The Gestor is fully blocked (e.g. a failure that repeats after a real fix attempt, not just a flaky rerun).
- The overall goal is done and ready for the user to review in the app.

Everything else — implementation details, styling choices within the existing design system, minor copy wording, which of several reasonable approaches to take — gets decided autonomously using the conventions already documented in `CLAUDE.md` and this `.agents/rules/` folder.
