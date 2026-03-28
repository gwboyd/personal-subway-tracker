# Transit Arrival Tracker

A Next.js application for viewing real-time transit arrivals and saving user-specific station preferences.

## Features

- Real-time arrival lookups
- Station, direction, and line filtering
- Saved stations per user
- Phone-number-based sign-in with a signed session cookie
- Guest mode and client-side station pinning
- PWA support
- Supabase-backed persistence with RLS

## Stack

- Next.js (App Router)
- React and TypeScript
- Tailwind CSS
- Supabase Postgres and PostgREST

## Prerequisites

- Node.js 18+
- npm
- A Supabase project with a `subway` schema

## Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your Supabase publishable key>
SUPABASE_JWT_SECRET=<your Supabase legacy JWT secret>
SUBWAY_SESSION_SECRET=<your app session secret>
```

Notes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is used for normal RLS-backed access.
- `SUPABASE_JWT_SECRET` is required because this app signs a custom JWT for Supabase RLS.
- `SUBWAY_SESSION_SECRET` signs the app's own session cookie.

## Installation

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Security Model

- The app does not use full Supabase Auth.
- User identity starts with phone number lookup or registration.
- The server issues a signed app session cookie.
- The server derives a Supabase JWT from that session for RLS-backed access.
- User station reads and writes are scoped to the current signed session.

## API Routes

- `GET /api/subway?stationId=&direction=&lines=`
- `GET /api/subway?tripId=&line=`
- `GET /api/subway/available-lines?stationId=&direction=&lines=`
- `POST /api/users`
- `POST /api/users/phone`
- `GET /api/user-stations`
- `POST /api/user-stations`
- `GET /api/session`
- `DELETE /api/session`

## Project Structure

- `app/` application routes and API handlers
- `components/` reusable UI
- `lib/` feed helpers, station utilities, and Supabase/session code
- `public/` static assets and PWA files
- `types/` shared TypeScript types
