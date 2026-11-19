# OTS - Online Task Scheduler

A calm, timezone-aware task planner built with **React, Vite and Tailwind CSS**, with an **Express** backend that sends email reminders through Gmail. Tasks and accounts are stored in the browser (`localStorage`), so there is no database to set up.

> School project. Accounts and passwords live in the browser only and are **not** secure. Do not use real passwords.

## Special Thanks to
- Abdila
- Cilvania
- Amanda
- Regiana
- Gerrard

For helping me build this project!

## Current Features

- **Accounts:** register, log in and log out (stored in `localStorage`).
- **Three task types:** single-day schedule, multi-day work project, and weekly recurring routine.
- **Schedule Board:** Past Due, Today, Tomorrow and Upcoming columns, sorted by time. Complete, edit, undo and delete tasks here. Edited cards glide to their new position.
- **Task List:** read-only catalog with search, category, priority and status filters, and time tabs. Load templates and export to CSV.
- **Dashboard:** completion ring, stat tiles, priority breakdown, status and category charts, and a time filter.
- **Focus Plan:** the next 5 tasks to work on, ranked by lateness, priority and how soon they are due. An AI model can add short reasons and a tip, but the order always comes from the local scoring.
- **Timezone adjustment:** tick "Adjust to my timezone" for tasks tied to a real moment (like a meeting elsewhere). Their days and times update when your device timezone changes. Leave it off for routines that stay at the same clock time.
- **Email reminders:** Gmail alerts before a task, with timing set per priority (defaults: Low 30 min, Medium 1 hour, High 3 hours). Change them on the Settings page. Email styling also changes by priority.
- **AI assistance (optional):** AI Breakdown suggests subtasks, category and priority from a task title. Without an API key, a built-in rule-based engine is used instead.

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React, Vite, Tailwind CSS v4, React Router, Chart.js (react-chartjs-2), Framer Motion |
| Backend | Node.js, Express, Nodemailer, dotenv, cors |
| Templates | json-server (serves `db.json`) |
| AI (optional) | Any OpenAI-compatible API (Groq, OpenRouter, Mistral, Gemini) |

## Project structure

```
ProjectFrontEnd/
├── backend/
│   ├── server.js        # Email + AI endpoints
│   ├── db.json          # Task templates (json-server)
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js   # Tailwind plugin + proxy to the backend
    ├── package.json
    └── src/
        ├── api/         # email, templates, AI calls
        ├── auth/        # login, register, route guards
        ├── components/  # cards, navbar, task modal, Focus Plan
        ├── hooks/       # reminders, clock, device timezone
        ├── modal/       # add/edit task modal provider
        ├── pages/       # Dashboard, Tasks, Board, Settings, Login, Register
        ├── tasks/       # task state and storage
        ├── toast/       # notifications
        └── utils/       # dates, ranking, CSV, styles
```

## Getting started

### Requirements

- Node.js 18 or newer
- A Gmail account with 2-Step Verification and an [App Password](https://myaccount.google.com/apppasswords) (only needed for email reminders)

### 1. Install

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and fill it in:

```
PORT=5000

# Email reminders (Gmail SMTP)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASS=your 16 character app password
NOTIFICATION_RECIPIENT=your_email@gmail.com

# AI features (optional, leave out to use the built-in engine)
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```

`AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` must all come from the same provider. To switch providers, only change these three lines and restart the backend.

Never commit `.env`. It is already listed in `.gitignore`.

### 3. Run (three terminals)

| Terminal | Folder | Command | Port | Purpose |
|---|---|---|---|---|
| 1 | `frontend/` | `npm run dev` | 5173 | React app |
| 2 | `backend/` | `npm start` | 5000 | Email and AI endpoints |
| 3 | `backend/` | `npm run api` | 3000 | Task templates |

Open **http://localhost:5173**, register an account and start planning.

The app still works if terminals 2 or 3 are off: email reminders and AI wording are skipped, and the Load Templates button shows a warning banner.

## How reminders work

Reminders run inside the browser, once a minute, while the app is open in a tab. When a task enters its alert window, the app shows a toast and asks the backend to send an email. Closing the tab stops reminders.

## Testing the AI features

1. Start the backend and check that the log shows your model name and "key found".
2. Open the Dashboard and look at the Focus Plan footer. "Wording by AI" means the API answered. "Smart ranking" means the local fallback is in use.
3. If it falls back, read the backend terminal. A line starting with `[AI] HTTP ...` explains why (for example 404 means a wrong model name, 429 means a rate limit, 403 means a bad key or restricted project).

## Known limitations

- Data lives in one browser. Clearing site data deletes it.
- Passwords are stored as plain text in `localStorage` (demo only).
- Reminders only fire while the app is open.
- Free AI tiers have rate limits and their terms may allow training on your input, so avoid sensitive text in task titles.

## Upcoming features and updates

- AI Assistant help with managing work.
- Optimisation on adding pages if tasks gets too long.
- Using firebase for users.

## Scripts

**Frontend** (`frontend/`): `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`

**Backend** (`backend/`): `npm start`, `npm run api`

## License

For educational use.
