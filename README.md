# TableFlow - Restaurant Reservation & Waitlist Management

A modern, mobile-friendly restaurant reservation and waitlist management web application built with Next.js 15, Prisma, Socket.IO, and Tailwind CSS.

## Features

- **Reservation Management** - Book, confirm, modify, and cancel reservations with calendar views
- **Waitlist Management** - Real-time digital waitlist with estimated wait times
- **Floor Plan** - Visual table layout with real-time dining status tracking
- **Guest Profiles** - Guest database with visit history, tags, allergies, and preferences
- **Analytics** - Cover counts, turn times, no-show rates, peak hours heatmap
- **Public Booking** - Guest-facing reservation page with step-by-step flow
- **Public Waitlist** - QR code/link for guests to join and track their position
- **Dark Mode** - Toggle between light and dark themes
- **Role-Based Access** - Owner, Manager, Host, and Server roles
- **Real-Time Updates** - Socket.IO for live updates across all devices
- **Mock Notifications** - SMS/email service (Twilio-ready interface)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: Prisma ORM + SQLite (PostgreSQL-ready)
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS 4 with dark mode
- **Auth**: NextAuth v5
- **Charts**: Recharts
- **Validation**: Zod

## Getting Started

```bash
# Install dependencies
npm install

# Run database migration
npx prisma migrate dev

# Seed the database with demo data
npm run db:seed

# Start development servers (Next.js + Socket.IO)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

| Role   | Email                    | Password    |
|--------|--------------------------|-------------|
| Owner  | owner@tableflow.com      | password123 |
| Host   | host@tableflow.com       | password123 |
| Server | server@tableflow.com     | password123 |

## Project Structure

```
├── prisma/                 # Database schema and migrations
├── server/                 # Socket.IO server
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login page
│   │   ├── (dashboard)/    # Staff dashboard pages
│   │   ├── (public)/       # Guest-facing pages
│   │   └── api/            # REST API routes
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Business logic and utilities
│   └── types/              # TypeScript types
└── scripts/                # Development scripts
```

## Scripts

- `npm run dev` - Start Next.js + Socket.IO servers
- `npm run db:seed` - Seed database with demo data
- `npm run db:reset` - Reset and re-seed database
- `npm run db:studio` - Open Prisma Studio
