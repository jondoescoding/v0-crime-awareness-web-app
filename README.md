# Crime Awareness Web App

A real-time crime reporting and tracking platform powered by Next.js and Convex.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Convex account (free at [convex.dev](https://convex.dev))

### Setup

1. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   cd frontend
   pnpm install
   cd ..
   ```

2. **Start Convex** (from project root):
   ```bash
   npx convex dev
   ```
   This will prompt you to log in and create/link a project.

3. **Configure environment:**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Edit .env.local and add your NEXT_PUBLIC_CONVEX_URL
   ```

4. **Seed the database** (from project root):
   ```bash
   npx convex run seed:seedDatabase
   ```

5. **Start the dev server:**
   ```bash
   cd frontend
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
v0-crime-awareness-web-app/
├── convex/                    # Backend (Convex functions)
│   ├── schema.ts             # Database schema
│   ├── criminals.ts          # Criminal queries/mutations
│   ├── crimeReports.ts       # Report queries/mutations
│   └── seed.ts               # Database seeding
│
├── frontend/                  # Frontend (Next.js app)
│   ├── app/                  # Pages
│   │   ├── database/         # Criminal database
│   │   ├── feed/             # Activity feed
│   │   ├── map/              # Crime map
│   │   └── layout.tsx        # Root layout with Convex provider
│   ├── components/           # React components
│   │   ├── convex-provider.tsx
│   │   ├── criminal-selector.tsx
│   │   └── report-form.tsx
│   └── .env.local            # Environment variables (create this!)
│
└── backend/                   # Python scraping scripts
```

## 🎯 Features

- **Real-time Crime Reports** - Submit and view reports instantly
- **Criminal Database** - Search wanted criminals with photos
- **Activity Feed** - Filter by status (active, investigating, resolved)
- **Crime Map** - Visualize incidents geographically
- **Type-Safe** - Full TypeScript support with generated types

## 📚 Documentation

- **[CONVEX_SETUP.md](./CONVEX_SETUP.md)** - Complete setup guide
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Technical migration details

## 🛠 Development

Keep two terminals running:

**Terminal 1** (project root):
```bash
npx convex dev
```

**Terminal 2** (frontend directory):
```bash
cd frontend
pnpm dev
```

## 📝 Environment Variables

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
```

Get your URL from:
- Terminal output of `npx convex dev`
- [Convex Dashboard](https://dashboard.convex.dev)

## 🗄 Database

The app uses Convex with the following tables:
- **criminals** - Wanted persons with photos and details
- **crimeReports** - Crime reports with location and status
- **users** - User accounts (future)
- **locations** - Location details (future)
- **tips** - Anonymous tips (future)

## 🔧 Commands

```bash
# Start Convex (from root)
npx convex dev

# Seed database (from root)
npx convex run seed:seedDatabase

# Start Next.js (from frontend/)
cd frontend && pnpm dev

# Build for production (from frontend/)
cd frontend && pnpm build
```

## 🚨 Troubleshooting

### "NEXT_PUBLIC_CONVEX_URL is not defined"
Create `frontend/.env.local` with your Convex deployment URL.

### Database is empty
Run `npx convex run seed:seedDatabase` from the project root.

### Import errors
Make sure `npx convex dev` is running - it generates TypeScript types.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

MIT

## 🔗 Links

- [Convex Docs](https://docs.convex.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [Project Dashboard](https://dashboard.convex.dev)

---

Built with ❤️ using Next.js and Convex

