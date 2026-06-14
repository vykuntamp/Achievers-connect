# Achievers Connect

A production-ready Progressive Web App for managing a home-based tutoring business.
**Teacher/Admin** runs everything; **parents** get a secure view-only link (no login).

**Stack:** React + TypeScript + Vite · Tailwind CSS · Supabase (Postgres + Auth + Edge Functions) · Resend email · installable PWA · mobile-first.

---

## Features

| Module | What it does |
|---|---|
| **Teacher auth** | Email/password login, protected admin area |
| **Students** | Full CRUD + auto-generated secure parent portal link |
| **Batches** | Create batches, assign students, batch-wise attendance |
| **Attendance** | Present / Absent / Leave |
| **Class updates** | Batch, subject, topic, homework, remarks, date |
| **Quick Entry** ⚡ | Pick batch → tap to mark attendance → add lesson → **one save** (defaults everyone to Present so a normal day is a few taps) |
| **Parent portal** | Per-student secure URL — attendance, topics, homework, remarks, announcements |
| **Announcements** | Target All / Home / Online / Home Visit |
| **Email** | On save, parents are emailed via Resend with a portal link |
| **Dashboard** | Totals, breakdown by tuition type, attendance summary, recent activity |

---

## Project structure

```
achievers-connect/
├─ index.html
├─ vite.config.ts            # PWA config lives here
├─ tailwind.config.js        # navy / white / gold theme
├─ .env.example
├─ public/                   # icons, manifest assets, SPA redirects
├─ src/
│  ├─ main.tsx               # router + protected routes
│  ├─ context/AuthContext.tsx
│  ├─ lib/{supabase,email}.ts
│  ├─ types/index.ts
│  ├─ components/{Layout,Spinner,StatusBadge}.tsx
│  └─ pages/{Login,Dashboard,QuickEntry,Students,Batches,
│            ClassUpdates,Announcements,ParentPortal}.tsx
└─ supabase/
   ├─ schema.sql             # tables, indexes, RLS, parent-portal RPC
   ├─ seed.sql               # sample data
   └─ functions/send-class-email/index.ts   # Resend Edge Function
```

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query →** paste all of `supabase/schema.sql` → **Run**.
   This creates every table, index, RLS policy, and the `get_parent_portal` RPC that powers the no-login parent view.
3. **Project Settings → API** — copy the **Project URL** and **anon public key**.

### Security model
- Teachers can only read/write **their own** rows (enforced by RLS via `auth.uid()`).
- Parents have **no table access**. The portal calls a single `security definer` RPC keyed by an unguessable `portal_token` (UUID) that returns only that one student's data.

---

## 2. App setup

```bash
npm install
cp .env.example .env       # fill in the two values below
npm run dev                # http://localhost:5173
```

`.env`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Then: open the app → **Create account** (this is your teacher login) → sign in.

### Sample data (optional)
1. Run `select id, email from auth.users;` to get your teacher UUID.
2. Open `supabase/seed.sql`, replace `PASTE-YOUR-AUTH-USER-UUID-HERE`, run it in the SQL Editor.
3. `select student_name, portal_token from public.students;` → visit `/portal/<portal_token>`.

---

## 3. Email (Resend) setup

1. Get an API key at [resend.com](https://resend.com) and verify a sending domain.
2. Deploy the Edge Function and set secrets:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy send-class-email
   supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL="Achievers <updates@yourdomain.com>"
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Saving a class update (or a Quick Entry) emails every parent in the batch with a portal link. If no key is set, saving still works — email is simply skipped (never blocks the teacher).

---

## 4. Deployment

### Vercel (recommended)
1. Push to GitHub, import the repo in Vercel.
2. Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Build command `npm run build`, output `dist`. `vercel.json` handles SPA routing.

### Netlify
1. Build command `npm run build`, publish directory `dist`.
2. `public/_redirects` already handles SPA routing.

### Installable PWA
After the first deploy, open the site on a phone → **Add to Home Screen**. It installs as "Achievers", works offline-first for the shell, and auto-updates.

---

## Daily teacher workflow (optimized)
Open app → **⚡ Quick Entry** → batch is preselected, everyone defaults to **Present** → tap only the absentees → type topic/homework → **Save everything**. Attendance, the class record, and parent emails all go out in one action.
