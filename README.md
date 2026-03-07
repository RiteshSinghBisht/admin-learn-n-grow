# Learn N Grow Admin

Admin dashboard for managing a coaching/tuition center: students, attendance, finance, user access, settings, and announcements.

## Features

- Dashboard with operational summaries
- Student management (add/edit/delete, teacher mapping, status, monthly fee)
- Attendance tracking
- Finance tracking (income/expense, payment status, CSV export)
- Unified task + announcement calendar for owner planning
- Role-based access management (`admin`, `students_only`)
- Login/logout with Supabase Auth
- Settings for profile, preferences, and data operations
- Announcements API endpoints

## Tech Stack

- Next.js 16 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Radix UI primitives
- Supabase (Auth + Postgres + RLS)
- Recharts (charts/visuals)

## Routes

- `/` - Dashboard
- `/tasks` - To-do and calendar planning
- `/finance` - Finance module
- `/students` - Student + attendance module
- `/access-management` - User and role management
- `/agents` - AI agents module
- `/settings` - Profile/preferences/data
- `/login` - Authentication


## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Then update `.env.local` with real values.

3. Apply database schema in Supabase SQL editor:

- Run `supabase/schema.sql`
- (Optional) Run `supabase/seed.sql` for sample data

4. Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

`supabase/schema.sql` now includes both `announcements` and `tasks`, so rerun that file after pulling changes to create the calendar tables in your Supabase project.

## Admin Access Bootstrap

- Access management is restricted to `admin` role.
- If roles are missing, add/update an admin manually:

```sql
insert into public.app_user_roles (user_id, role, assigned_teachers)
values ('<USER_UUID>', 'admin', '{}'::text[])
on conflict (user_id)
do update
set role = 'admin', assigned_teachers = '{}'::text[], updated_at = now();
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Deploy to Vercel

1. Link project:

```bash
vercel link
```

2. Add all required env vars in Vercel for `Production`, `Preview`, and `Development`.

3. Deploy:

```bash
vercel deploy -y --target preview
vercel deploy --prod -y
```
