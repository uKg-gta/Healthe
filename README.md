# GymLog

**GymLog** is a private, mobile-first personal fitness, nutrition, health, and performance tracking web application built strictly with **HTML, CSS, and Vanilla JavaScript**.

All personal data and progress photographs are stored exclusively in the user's browser (`localStorage`) with zero backend, zero accounts, zero third-party frameworks, and zero external APIs.

## Features

- **Home Dashboard**: Daily overview of workout status, latest body weight, calculated BMI, calorie & macronutrient intake against targets, water, sleep, steps, one-tap quick logging, and an honest 7-day trend chart.
- **Workouts**:
  - Flexible weekday scheduling (no forced weekly split).
  - Built-in + custom exercise library (`Barbell`, `Dumbbell` per hand, `Machine stack`, `Bodyweight`) supporting `kg` and `lb`.
  - Simple workout logging (sets, reps, weight, unit) with unlimited history and filters by date, weekday, and exercise.
  - Automatic Personal Records (heaviest weight, highest reps, best recorded performance).
  - **Same-Weekday Comparison**: Compare any weekday session against prior sessions on the same weekday with per-exercise deltas and status (`Improved`, `Declined`, `Stable`).
- **Nutrition**:
  - Manual daily food list (no rigid meal categories) supporting calories, protein, carbs, fats, fibre, sugar, sodium, and optional micronutrients.
  - Reusable saved food profiles with automatic quantity scaling.
  - Fully user-controlled daily targets with current, remaining, and percentage progress.
- **Progress & Analytics**:
  - 10 interactive SVG charts with date range (`7D`, `30D`, `90D`, `1Y`, `All`) and `Daily / Weekly / Monthly` aggregation: Body Weight, BMI, Calories, Protein, Carbs & Fat, Workout Performance, Exercise-Specific Strength Progression, Water, Sleep, and Steps.
  - Honest gap handling: missing days are never fabricated as zero.
  - Body weight & historical BMI log (snapshots height per entry).
  - Private Progress Photo Journal with client-side image compression, live storage capacity warnings, chronological gallery, and side-by-side comparison.
- **Profile & Data Ownership**:
  - Optional personal fields (name, height), preferred weight & water units, and light/dark theme persistence.
  - JSON backup export and validated JSON import with overwrite-protection preview.

## File Structure

- `index.html` — Semantic application shell and navigation
- `styles.css` — Clinical off-white & forest green design system (light + dark themes)
- `app.js` — Application state, localStorage persistence, analytics, SVG charts, and UI controllers
- `README.md` — Project documentation and GitHub Pages deployment guide

## Hosting on GitHub Pages

1. Create a GitHub repository (e.g., `gymlog`) and upload `index.html`, `styles.css`, `app.js`, and `README.md` to the root of the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, select `main` and `/ (root)`, then click **Save**.
4. Open the published GitHub Pages URL on your Android phone (and optionally use Chrome's **Add to Home screen** for an app-like experience).

## Known Limitations

- **Browser Storage Quota**: Browser `localStorage` is typically limited to ~5 MB per origin. Progress photos are automatically compressed (max 800 px JPEG) and a live storage meter warns at 70% and 88% usage, but storing dozens of high-resolution photos will eventually require exporting a JSON backup and pruning older photos.
- **Single-Device Persistence**: By design, data stays strictly on the device/browser where it is entered. To move or back up data across devices, use **Profile → Export JSON Backup** and **Import JSON Backup**.
- **No Reminders or Notifications**: Intentionally omitted per specification.