# Health Dashboard

Team wellness dashboard powered by Oura Ring API v2.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Preview

![Dashboard Screenshot](docs/screenshot.png)

*Data will populate once Oura Ring is paired and synced.*

## Features

- **Score Rings** — Sleep, Readiness, Activity scores at a glance
- **Today's Condition** — Computed wellness status (Great / Good / Take It Easy / Rest Up)
- **Activity Stats** — Steps, calories, distance, heart rate
- **7-Day Trends** — Sleep & Readiness score charts
- **Multi-user** — Side-by-side view for team members

## Setup

### 1. Get your Oura Personal Access Token

Go to [cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens) and create a token.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
OURA_USERS=kan:YOUR_PAT_HERE,miyamae:THEIR_PAT_HERE
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add `OURA_USERS` environment variable
4. Deploy

Data refreshes every 5 minutes via ISR.

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts** for trend visualization
- **Oura API v2** for health data
