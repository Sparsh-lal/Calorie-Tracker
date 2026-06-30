# 🔥 Calorie Tracker

A personal nutrition tracker built with **React + Vite + Redux Toolkit**. Log meals, track daily macros against your goals, and browse your history on a monthly calendar — all stored locally in the browser with no backend required.

---

## Features

- **Daily food log** — search a built-in food database (~55 items) and add entries with custom quantities
- **Meal categories** — entries are grouped into Breakfast, Lunch, Dinner, and Snacks
- **Editable meal names** — rename any category from the Goals page; changes apply going forward without altering past logs
- **Macro tracking** — real-time progress bars for Calories, Protein, Carbs, and Fat
- **TDEE calculator** — enter your weight, height, age, activity level, and goal (lose / maintain / gain) to auto-calculate your daily macro targets using the Mifflin-St Jeor formula
- **Monthly calendar view** — History page shows a 7-column calendar with per-day calorie bars and all 4 macro values; click any day to see the full breakdown below
- **Dark mode** — persistent theme toggle in the header
- **Export / Import** — download your entire log as JSON or restore from a backup
- **Fully local** — all data lives in `localStorage`; nothing leaves your device

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18, JSX |
| Build | Vite 7 |
| State | Redux Toolkit 2 + React-Redux 9 |
| Styling | CSS Modules + global design tokens |
| Animation | Framer Motion 11 |
| Toasts | react-hot-toast 2 |
| Date utils | date-fns 3 (partial) + custom helpers |

---

## Project Structure

```
src/
├── App.jsx                 # Root: hydration, theme, page routing
├── main.jsx                # Entry: Redux Provider, Toaster
├── components/
│   ├── Dashboard/          # DashboardPage — today's log + macro cards
│   ├── History/            # HistoryPage — monthly calendar + day detail
│   ├── Goals/              # GoalsPage — profile, TDEE calc, macro goals, meal names
│   ├── FoodLog/            # AddFoodModal, FoodLogTable (grouped by meal)
│   ├── Header/             # Sticky header with calorie pill, theme + export buttons
│   ├── Nav/                # NavTabs with animated indicator
│   └── UI/                 # MacroCard (reusable progress card)
├── store/
│   ├── store.js            # configureStore
│   └── slices/
│       ├── foodLogSlice.js # entries keyed by YYYY-MM-DD
│       ├── goalsSlice.js   # macro goals, meal names, body profile
│       ├── uiSlice.js      # theme, active page, active date
│       └── persistSlice.js # hydration thunk (load from localStorage)
├── data/
│   └── foods.json          # Local food database (55 items, 8 categories)
├── utils/
│   ├── dateHelpers.js      # todayKey, dateKey, daysInMonth, firstCellOffset, …
│   ├── macroCalc.js        # scaleMacros, sumEntries, pct
│   ├── storage.js          # saveToStorage, loadFromStorage, exportAllData
│   └── tdeeCalc.js         # calcBMR, calcTDEE, calcMacros, meal/activity constants
└── styles/
    └── index.css           # Design tokens: brand orange, macro colours, dark mode
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install and run

```bash
npm install
npm run dev
```

App is served at `http://localhost:5173` (or the next available port).

### Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # serve the production build locally
```

> The build sets `base: "/Calorie-tracker/"` in `vite.config.js`, so the app is ready to deploy under a subdirectory (e.g. GitHub Pages at `username.github.io/Calorie-tracker/`).

---

## Data & Privacy

All data is stored in the browser's `localStorage` under these keys:

| Key | Contents |
|---|---|
| `cal_log` | Food log entries (all dates) |
| `cal_goals` | Macro goals, meal names, body profile |
| `cal_theme` | Light / dark preference |

Use the **Export** button in the header to download a JSON backup, and **Import** to restore it.

---

## Food Database

The built-in database (`src/data/foods.json`) has 55 common foods across 8 categories: protein, grain, vegetable, fruit, dairy, fat, snack, and beverage. Each entry includes `calories`, `protein`, `carbs`, and `fat` per serving size. The database is intentionally kept local — no API keys or network requests required.

---

## Macro Calculation

- **TDEE** uses the Mifflin-St Jeor BMR formula with 5 activity multipliers
- **Protein** target: 1.8 g / kg body weight
- **Fat** target: 25 % of target calories
- **Carbs** target: remaining calories after protein and fat

These defaults can be overridden manually in the Goals page.
