---
trigger: always_on
---

# 🚀 FitPro - React Native Programming and Architecture Guide

**Target AI:** Antigravity (Senior Technical Partner)
**Goal:** Ensure scalability, clean code, high performance, and UI/UX excellence focused on user psychology for the FitPro project.

---

## 1. Architectural Structure (Feature-Based + Expo Router)

The project uses Expo Router's **File-based Routing** combined with a feature-based architecture. Strictly adhere to the following structure:

- **`/app` (Routing Layer):**
  - `(tabs)`: Organizes the main navigation via bottom tabs.
  - `_layout.tsx`: Manages the global navigation context and themes.
  - Direct files (e.g., `login.tsx`, `onboarding.tsx`): Represent the application's routes/screens.
- **`/src/features` (Domain Layer):**
  - The heart of the app. Group logic by functionality (e.g., `auth`, `workout`, `nutrition`). Each "feature" acts as an independent mini-module with its own hooks, services, and local components.
- **`/src/context`:** Global application state (authentication, user preferences, etc.).
- **`/src/components`:** Reusable UI components (buttons, modals, inputs, cards) that do not belong to a specific functionality.
- **`/src/constants`:** Global settings, color palette, themes, typography, and keys.
- **`/src/assets`:** Images, fonts, and static files.

---

## 2. Code Patterns and Clean Code

- **SOLID & Clean Code:** Rigorously apply SOLID principles. Each component, class, or hook must have a Single Responsibility.
- **Design Patterns:** Whenever possible, structure the code using design patterns (e.g., Container/Presenter, Strategy for API calls, Factory) to ensure high quality and readability.
- **DRY (Don't Repeat Yourself):** If logic or style is repeated, abstract it into a Custom Hook, utility function, or base component.

---

## 3. Rigorous Documentation (ApexDoc/JSDoc Standard)

All code must be documented. Whenever creating a class, method, hook, or important variable, include clear explanatory comments about what they do, their parameters, and returns, maintaining the rigor of corporate documentation.

```javascript
/**
 * @description Brief explanation of the method or component's goal.
 * @param {string} paramName - What this parameter represents.
 * @returns {boolean} What the function returns.
 */
```

## 4. Extreme Componentization

- **Everything is a Generic Component:** Modals, buttons, dashboards, timelines, cards. Instead of creating a fixed modal on a screen, create a dynamic component that receives parameters (`children`, `title`, `actions`) to be reused anywhere in the app.
- **Composition:** Prioritize component composition over giant monolithic components.

## 5. UI, UX, and Styling (Pure CSS)

- **Clean CSS (No Frameworks):** The use of utility frameworks like Tailwind or Bootstrap is strictly prohibited. Use only the native StyleSheet. The code must be free from these constraints to allow full freedom in applying the best design psychology.
- **Design Catalog (Design System):** Never use hardcoded values for colors, font sizes, or spacing. Everything must be imported from a centralized and organized file (e.g., `/src/constants/theme.ts`), allowing for easy and global changes.
- **Dinamism and Animaations:** UX is a priority. Whenever feasible, use animations, smooth transitions, and lazy loading (e.g., skeleton screens). Respond to user interactions with constant visual feedback to enrich the experience.

## 6. Data, Services, and Mocks

- **Service Layer:** No UI component should make direct API calls (like loose fetches on the screen). Every external call must pass through an isolated Service.
- **Mandatory Use of Mocks:** Use data mocks to simulate API or database queries during UI development.
- **Database Agnosticism:** The code must be structured so that switching the database (e.g., from Mock to Firebase, or to a REST API) is dynamic and configurable, without needing to rewrite the interface logic.
