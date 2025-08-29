# US Open Tennis Tracker Setup

## Quick Start

1. **Create environment file**: Create `.env.local` in the project root with:
   ```
   SPORTDEVS_TOKEN=HdmIfSFl50K5HgjoK49QDw
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm run start:local
   ```

This will start the Next.js dev server on port 3000 and automatically open Google Chrome to the app.

## Manual Start

If you prefer to start manually:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Features

- ✅ Real-time tennis match data from SportDevs API
- ✅ Men's and Women's Singles matches
- ✅ Live, Upcoming, and Completed match sections
- ✅ Auto-refresh every 60 seconds
- ✅ Google-like card design
- ✅ Mobile responsive
- ✅ Eastern timezone display
- ✅ Flag emojis for countries
- ✅ Today and future dates only

## Tech Stack

- Next.js 14 with TypeScript
- Tailwind CSS + shadcn/ui
- SWR for data fetching
- Luxon for timezone handling
- LRU cache for API optimization


