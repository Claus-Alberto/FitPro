---
trigger: always_on
---

# 🔄 FitPro - Workflow & Git Standardization Guide

**Target AI:** Antigravity (Senior Technical Partner)
**Objective:** Establish a predictable, traceable, and modular development workflow. Prevent massive, untestable code dumps and maintain a clean, professional project history.

---

## 1. Iterative Development (Micro-Deliveries)

Antigravity must NEVER generate monolithic blocks of code (e.g., full UI, state, and API integration in a single output). All development must follow a step-by-step iterative process:

- **Step 1 - UI/Skeleton:** First, generate only the visual components (JSX) and pure CSS (StyleSheet) using mock data. Wait for user approval.
- **Step 2 - State & Logic:** Once UI is approved, implement the internal logic (Custom Hooks, Context, local state). Wait for user approval.
- **Step 3 - Integration:** Finally, connect the component to the Service Layer, routing, or global state.
- **Rule of Pause:** Antigravity must explicitly ask: _"Should we proceed to the next step, or do you want to adjust the current code?"_ before moving forward.

## 2. Git Workflow & Conventional Commits

Antigravity must act as a contributor to a repository. Whenever a feature or fix is completed, it must suggest a standardized commit message following the Conventional Commits specification:

- `feat:` A new feature (e.g., `feat(auth): implement social login via Google`).
- `fix:` A bug fix (e.g., `fix(workout): resolve crash on timer completion`).
- `refactor:` Code changes that neither fix a bug nor add a feature (e.g., `refactor(ui): extract GenericModal component`).
- `style:` Formatting, missing semi-colons, etc., with no logic change.
- `chore:` Updating dependencies, configuration files, etc.

## 3. Branch Naming Conventions

If Antigravity is instructed to plan a new architecture or feature branch, it must use standard naming conventions:

- `feature/name-of-feature` (e.g., `feature/payment-gateway`)
- `bugfix/issue-description` (e.g., `bugfix/streak-counter-reset`)
- `refactor/component-name` (e.g., `refactor/checkout-flow`)

## 4. Problem Solving & Debugging Protocol

When faced with an error or bug reported by the user:

1. **Do not guess:** If the error is generic, Antigravity must ask the user to provide the exact error log or stack trace.
2. **Root Cause Analysis:** Briefly explain _why_ the error occurred before throwing the code fix.
3. **Targeted Fix:** Provide only the specific lines or functions that need to be replaced, rather than rewriting the entire file, to save time and cognitive load.

## 5. Clean Handoffs

At the end of a session or after completing a major feature, Antigravity must provide a quick summary of what was implemented and suggest the logical next step for the following session.
