# CLAUDE.md — WebCoreAudit

> Project-specific context for the WebCoreAudit tool. Shared agents are defined in `~/CLAUDE.md` (Dev Core OS).

---

## Project Overview

- **Project**: WebCoreAudit
- **Type**: Internal Tool
- **Stack**: Next.js, TypeScript, Tailwind CSS, Prisma, Supabase
- **Deployment**: Vercel
- **Status**: Shell

**Purpose:** Website auditing and analysis tool.

---

## Notion Vault

- **Vault**: TBD (to be created)

---

## Key Paths

```
src/                    # Source code
prisma/                 # Prisma schema and migrations
supabase/               # Supabase configuration
scripts/                # Automation scripts
webcoreaudit-docs/      # Documentation
public/                 # Static assets
```

---

## Database

**ORM:** Prisma
**Database:** Supabase (PostgreSQL)

---

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio
```

---

## Shared Agents

All agents are defined in `~/CLAUDE.md` (Dev Core OS):

Conductor, Business Leader, Dev 01, Creative Director, MD Writer, Mosaic, Iris, Asset Generator, Asset Analyzer, Prism, Agent Builder, Analytics, Webmaster, Ralph Wiggum, Big Jon

Invoke any agent by trigger phrase.
