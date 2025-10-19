# Convex Setup Guide

This guide will help you set up and run your Crime Awareness Web App with Convex as the backend.

## Prerequisites

- Node.js 18+ installed
- pnpm (or npm/yarn) package manager
- A Convex account (sign up at https://www.convex.dev)

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Convex

First, install the Convex CLI globally (if not already installed):

```bash
npm install -g convex
```

Then, log in to Convex:

```bash
npx convex login
```

Initialize Convex in your project:

```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to an existing one)
- Generate a deployment URL
- Start watching your Convex functions for changes

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
cd frontend
cp .env.local.example .env.local
```

Then edit `frontend/.env.local` and add your Convex deployment URL:

```bash
# Copy the deployment URL from the Convex dashboard or the output of `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
```

You can find your deployment URL at:
- In the terminal output when running `npx convex dev` (from the project root)
- Or at https://dashboard.convex.dev

### 4. Seed the Database

Once Convex is running, you can seed the database with initial data. Open the Convex dashboard:

```bash
npx convex dashboard
```

In the dashboard:
1. Go to the "Functions" tab
2. Find the `seed:seedDatabase` function
3. Click "Run" to execute it

Alternatively, you can run it from the command line:

```bash
npx convex run seed:seedDatabase
```

This will populate your database with:
- 6 sample criminals
- 4 sample crime reports

### 5. Run the Development Server

In a separate terminal (keep `npx convex dev` running from the root), start the Next.js development server:

```bash
cd frontend
pnpm dev
```

Your application should now be running at http://localhost:3000

## Project Structure

### Convex Functions

The Convex backend is organized into the following files:

- **`convex/schema.ts`** - Database schema definitions
- **`convex/criminals.ts`** - Queries and mutations for managing criminals
  - `list` - List all criminals with optional search
  - `get` - Get a single criminal by ID
  - `create` - Create a new criminal entry
  
- **`convex/crimeReports.ts`** - Queries and mutations for crime reports
  - `list` - List all crime reports with optional filtering
  - `create` - Create a new crime report
  - `getByCriminal` - Get reports for a specific criminal
  
- **`convex/seed.ts`** - Database seeding function
  - `seedDatabase` - Populate database with initial mock data

### React Components

The following components have been updated to use Convex:

- **`frontend/app/database/page.tsx`** - Criminal database page (uses `criminals.list` query)
- **`frontend/app/feed/page.tsx`** - Activity feed page (uses `crimeReports.list` query)
- **`frontend/app/map/page.tsx`** - Crime map page (uses `crimeReports.list` query)
- **`frontend/components/criminal-selector.tsx`** - Criminal selection component (uses `criminals.list` query)
- **`frontend/components/report-form.tsx`** - Crime report form (uses `crimeReports.create` mutation)
- **`frontend/components/convex-provider.tsx`** - Convex client provider wrapper

## Database Schema

### Tables

1. **criminals**
   - name, headshotUrl, primaryCrime, description
   - locationLat, locationLng (for mapping)
   - status (Wanted, At Large, etc.)
   - Indexes: by_name, by_createdAt, by_primaryCrime

2. **crimeReports**
   - reportType (existing_criminal or new_crime)
   - criminalId (optional, links to criminals table)
   - description, offenseType, location details
   - status (active, investigating, resolved)
   - Various flags (schoolRelated, drugsInvolved, etc.)
   - Indexes: by_createdAt, by_criminalId, by_offenseType, by_status

3. **users** (for future authentication)
   - username, password
   - Index: by_username

4. **locations** (for future location management)
   - coordinates (lat, lng)
   - policeNumber

5. **persons** (alternative criminal table, for future use)
   - name, imageStorageId, alias, crime
   - location references

6. **tips** (for future tip submission)
   - userId, personId, locationId
   - details, timeOfSighting

## Key Features

### Real-time Updates

All data is automatically synchronized in real-time across all connected clients. When a new report is submitted, it will immediately appear in the activity feed and on the map.

### Search Functionality

The criminal database and selector components support real-time search by:
- Criminal name
- Crime type
- Description

### Filtering

The activity feed and map support filtering by report status:
- All
- Active
- Investigating
- Resolved

## Development Workflow

1. Keep `npx convex dev` running in one terminal **from the project root** - this watches for changes to your Convex functions
2. Keep `pnpm dev` running in another terminal **from the frontend/ directory** - this runs your Next.js app
3. Make changes to your Convex functions in the root `convex/` directory
4. Make changes to your React components in the `frontend/app/` and `frontend/components/` directories

## Troubleshooting

### "NEXT_PUBLIC_CONVEX_URL is not defined"

Make sure you have created a `frontend/.env.local` file with your Convex deployment URL:
```bash
cd frontend
cp .env.local.example .env.local
# Then edit .env.local and add your deployment URL
```

### Database is empty

Run the seed function:
```bash
npx convex run seed:seedDatabase
```

### Changes to Convex functions not appearing

Make sure `npx convex dev` is running and has successfully deployed your functions.

### Type errors in Convex functions

Run `npx convex dev` - it will show you any TypeScript errors in your Convex functions.

## Production Deployment

When deploying to production:

1. Deploy your Convex functions:
```bash
npx convex deploy --prod
```

2. Get your production deployment URL and update your environment variables

3. Deploy your Next.js app to Vercel, Netlify, or your preferred hosting platform

4. Make sure to set the `NEXT_PUBLIC_CONVEX_URL` environment variable in your production environment

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
- [Next.js with Convex](https://docs.convex.dev/client/react/nextjs)

