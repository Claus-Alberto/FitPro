---
trigger: always_on
---

# 🧠 FitPro - UI/UX Psychology & Sales Guide

**Target AI:** Antigravity (Senior Technical Partner)
**Objective:** Instruct the AI to apply principles of behavioral psychology, sales mental triggers, and cognitive load reduction across every component in FitPro. The code must be built to drive habit formation, user retention, and conversion.

---

## 1. Cognitive Load Reduction (Hick's Law)

Users of a fitness app are often tired, sweaty, or in a rush. The interface cannot make them think.

- **Single Call to Action (CTA):** Every screen must have only one primary goal and one highly contrasting primary action button. Secondary actions should be subtle (e.g., text links or ghost buttons).
- **Progressive Disclosure:** In forms or onboarding, ask for information gradually. Use real progress bars or step-by-step modals.
- **Endowed Progress Effect:** The user should feel they have already started. If there is a 5-step onboarding, show that steps 1 and 2 (e.g., "Download App" and "Create Account") are already completed.

---

## 2. Mental Triggers & Sales Psychology

Whenever Antigravity creates subscription components, upgrades, or workout showcases, it must include visual support for mental triggers:

- **Social Proof:** Include generic slots in components for other users' avatars, star ratings, or text like "Over 10,000 students have completed this workout."
- **Scarcity & Urgency:** On checkout screens or offers, create components for countdown timers, "Limited Spots" tags, or "Offer Expires in 24h", using warm colors (red/orange) to grab attention.
- **Price Anchoring:** On the pricing screen, always place the main or annual plan next to a more expensive monthly plan to create a value contrast effect (highlight the Recommended Plan visually).

---

## 3. Habit Formation & Gamification (The Hook Model)

FitPro needs to be addictive in a good way. The component structure must anticipate the loop: Trigger -> Action -> Reward -> Investment.

- **Variable Positive Reinforcement:** Every time the user finishes a workout or hits a goal, the system must trigger a celebration animation (confetti, success modals). The intensity of the celebration must vary to maintain surprise.
- **Streaks:** Calendar components and "consecutive days" must be prominent on the Home (Dashboard). Breaking a streak should trigger "loss aversion" visually (e.g., gray colors, sad icons).
- **Immediate Feedback:** Every click, swipe, or set completion must have haptic micro-feedback (phone vibration) and visual feedback (button color change).

---

## 4. Color Psychology & Typography

The use of colors must dictate the user's emotional state:

- **Energy & Action (Workouts):** Use vibrant colors (Orange, Red, Yellow) for active workout screens, timers, and "Start" buttons.
- **Focus & Recovery (Yoga/Stretching):** Use cool, calm tones (Blue, Green, Pastel Purple) for rest periods.
- **Trust & Conversion (Checkout/Payment):** Financial transaction screens must be extremely clean, with green buttons and security icons (padlocks, shields).
- **Avoid Failure:** NEVER use red to indicate that the user "failed" a workout. Red is strictly for systemic danger (delete account, wrong password) or sales urgency.

---

## 5. Microcopy (The Voice of FitPro)

The text within components (placeholders, modals, buttons) must act like a motivational personal trainer.

- **Positive Action:** Instead of "Confirm", use "Let's Train!". Instead of "Submit", use "Transform my body".
- **Soft Loss Aversion:** In cancellation modals, do not use "Yes, cancel". Use "I want to lose my progress" vs. "I want to keep evolving".

---

## 6. Specific Instructions for Antigravity

1. **Analyze the Context:** Before styling a screen, Antigravity must ask itself: _"What emotion do I want to evoke here? Urgency, relaxation, or motivation?"_ and apply the CSS accordingly.
2. **Whitespace:** Respect the breathing room between elements. A design with plenty of empty space conveys the feeling of a "Premium" and expensive product.
3. **Focus on the 'Job to be Done':** Reduce friction. If it's a Login screen, remove all distractions.
