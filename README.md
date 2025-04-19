 # Subway Tracker (NYC Subway ETAs)

 A real-time subway arrival tracker for New York City built with Next.js, React, and Supabase.
 Deployed with Vercel: https://personal-subway-tracker.vercel.app

 ## Table of Contents
 - [Features](#features)
 - [Tech Stack](#tech-stack)
 - [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Environment Variables](#environment-variables)
   - [Installation](#installation)
   - [Development](#development)
   - [Production](#production)
 - [Project Structure](#project-structure)
 - [API Routes](#api-routes)

 ## Features
 - Real-time subway arrival times (1–60 minutes ahead)
 - Filter by station, direction (Uptown/Downtown), and line
 - Save favorite stations per user (phone-based auth)
 - Temporary station pinning with browser persistence
 - Guest mode for users without accounts
 - Progressive Web App support with service worker caching
 - Serverless API routes powered by Next.js
 - Supabase for user management and data persistence

 ## Tech Stack
 - Next.js 13 (App Router)
 - React & TypeScript
 - Tailwind CSS & Radix UI
 - next-pwa (Workbox-powered PWA support)
 - Supabase (Postgres + Auth)
 - MTA GTFS-RT (real-time subway data)
 - Lucide icons, Sonner toasts, Recharts for charts

 ## Getting Started

 ### Prerequisites
 - Node.js v18+
 - npm (or Yarn/pnpm)
 - Supabase project (with tables `users` and `user_stations`)

 ### Environment Variables
 Create a `.env.local` file in the project root with:
 ```bash
 NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
 SUPABASE_SERVICE_ROLE_KEY=<your Supabase Service Role Key>
 ```

 ### Installation
 ```bash
 git clone https://github.com/yourusername/subway-tracker.git
 cd subway-tracker
 npm install
 ```

 ### Development
 ```bash
 npm run dev
 ```
 Open http://localhost:3000 in your browser. PWA support is disabled in development to avoid reload loops.

 ### Production
 ```bash
 npm run build
 npm start
 ```
 Service worker and PWA features will be enabled automatically in production.

 ## Project Structure
 ```
 /app
   /api              # Next.js API routes for subway data and user management
 /components         # Reusable React components
 /hooks              # Custom React hooks
 /lib                # Utility modules (MTA feeds, station utils, Supabase helpers)
 /public             # Static assets & generated PWA files
 /styles             # Global CSS and Tailwind setup
 /types              # TypeScript type definitions
 next.config.mjs     # Next.js and next-pwa configuration
 tailwind.config.ts  # Tailwind CSS configuration
 README.md           # Project documentation
 ```

 ## API Routes
 - `GET /api/subway?stationId=&direction=&lines=`
 - `GET /api/subway?tripId=&line=`
 - `GET /api/subway/available-lines?stationId=&direction=&lines=`
 - `POST /api/users` (create user)
 - `POST /api/user-stations` (save stations)
