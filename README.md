<p align="center">
  <img src="/pomotide-cover.jpg" alt="Pomotide cover" />
</p>

# Pomotide

Catch the tide of productivity. A clean, fast Pomodoro app with tasks, real statistics, and per‑user settings.

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Radix UI" src="https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radixui&logoColor=white" />
  <img alt="Recharts" src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://pomotide-timer.vercel.app/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Live%20Demo-View%20Pomotide-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
  </a>
</p>

## 💡 Problem
Most Pomodoro apps either reset on reload, overcomplicate the UI, or don’t connect sessions to real tasks and stats.

## ✅ Solution
Pomotide keeps things simple and reliable — a delightful timer with task focus, accurate persistence, and meaningful statistics.

## ✨ Key Features
- ⏱️ Resilient timer: persists to the second across reloads and sleep
- 🗂️ Tasks: quick add/edit/delete with “active task” linked to the timer
- 📊 Real stats: Supabase-backed, with Week | Month | Year ranges
- ⚙️ Per-user settings: durations, auto-starts, cycle length, etc.
- 🔔 Desktop notifications and 🔉 optional session sounds
- 👤 Guest mode → seamless local-to-cloud migration when you sign in
- 📱 Responsive, accessible UI (shadcn/ui + Tailwind)

## 🚀 Deployment
Designed for Vercel. Just set environment variables and deploy.

## 🧭 Notes
- Statistics ranges are fully wired via `useStatistics(timeRange)`.
- “Reset Settings” restores default values in the UI; click “Save” to persist to Supabase.

## 🍴 If you want to fork — here’s how
1) Install

```bash
pnpm install
# or
npm install
```

2) Env vars (create `.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional (local OAuth redirect)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

3) Database
- Run the SQL in `scripts/001_create_tables.sql` (and subsequent scripts) inside Supabase.

4) Run locally

```bash
pnpm dev
# or
npm run dev
```

## 🤝 Contributing
Small, focused PRs welcome. Please follow existing style and keep changes scoped.

## 📄 License
No license file yet. If you plan to publish, add one (MIT, Apache‑2.0, etc.).
