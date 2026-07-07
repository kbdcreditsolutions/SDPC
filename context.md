# SDPC — Sridatri Physio Care · Project Context

> **Purpose:** This file is the single source of truth for any AI agent picking up work on this project.
> Read this before touching any code.
>
> **Last updated:** 2026-07-08

---

## 1. What This Project Is

This is now **two things in one repo**:

1. **Public marketing website** — `app/(marketing)/` — the patient-facing site
2. **Admin portal** — `app/admin/` — a full clinic management system (staff-only)

### Clinic details
- **Name:** Sridatri Physio Care
- **Tagline:** "Healing from Core"
- **Lead doctor:** Dr. Tejaswini Damerla (Consultant Physiotherapist — 16+ years, sports injury rehab & musculoskeletal physio)
- **Specialisms highlighted:** Neuro Rehab + Paediatric Wellness
- **Locations:** Narayanguda (primary) + Himayatnagar
- **Address:** Flat 101, Narasimha Nilayam, 3-4-529/2, Narayanguda, Hyderabad, Telangana 500027
- **Phone:** +91 81432 38246 / +91 82477 31436
- **Email:** care@sridatriwellness.com
- **Hours:** All Days: 8am – 9pm
- **Live URL:** https://sdpc.vercel.app
- **Repo:** https://github.com/kbdcreditsolutions/SDPC
- **Vercel project:** kbdcreditsolutions-projects/sdpc

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.10** (App Router, React 19) |
| Styling | **Tailwind CSS v4** (utility-first, no CSS modules) |
| Language | **TypeScript** |
| Icons | **lucide-react ^1.23.0** |
| Fonts | **Outfit** (headings, `font-display`) + **Figtree** (body, `font-sans`) via `next/font/google` |
| ORM | **Prisma 6** + **PostgreSQL** (admin portal DB) |
| Auth | **JWT** via `jose` + `bcrypt`; sessions in HTTP-only cookies |
| Images | **Pexels** (Indian doctor/patient photos) + **next/image** |
| Deployment | **Vercel** (auto-deploy on push to `main`) |
| Build cmd | `next build --webpack` |

> ⚠️ **Next.js 16 + React 19 are cutting-edge.** Always check `node_modules/next/dist/docs/` before writing code.

### New packages added (since initial build)
- `jose`, `bcryptjs`, `@types/bcryptjs` — JWT auth
- `@prisma/client`, `prisma` — database ORM
- Image domains: `images.pexels.com` and `images.unsplash.com` allowed in `next.config.ts`

---

## 3. Project File Structure

```
/Users/manojaaa/SDPC/
├── app/
│   ├── layout.tsx                      # Root layout (fonts, global meta only — no Navbar/Footer here now)
│   ├── globals.css                     # Tailwind base + custom utilities
│   │
│   ├── (marketing)/                    # Route group — public marketing site
│   │   ├── layout.tsx                  # Marketing layout — includes Navbar + Footer
│   │   ├── page.tsx                    # Home page
│   │   ├── about/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── contact/page.tsx            # Has live Google Maps embed
│   │   └── services/page.tsx
│   │
│   ├── admin/                          # Staff-only admin portal
│   │   ├── login/page.tsx              # Login page (outside auth guard)
│   │   └── (protected)/               # Route group — requires valid JWT session
│   │       ├── layout.tsx              # Admin layout — Sidebar + TopBar
│   │       ├── page.tsx                # Dashboard (revenue, patients, appointments, charts)
│   │       ├── patients/
│   │       │   ├── page.tsx            # Patient list + search + add
│   │       │   └── [id]/page.tsx       # Patient detail (packages, clinical notes)
│   │       ├── appointments/page.tsx
│   │       ├── invoices/
│   │       │   ├── page.tsx            # GST invoice list
│   │       │   └── [id]/page.tsx       # Invoice detail + payment recording
│   │       ├── staff/page.tsx          # Staff & doctor management
│   │       ├── attendance/page.tsx     # Daily staff/patient attendance
│   │       ├── marketing/page.tsx      # Campaigns, workshops, lead attribution
│   │       └── ratings/page.tsx        # Doctor ratings (patient + dept-head)
│   │
│   └── api/                            # Next.js API routes (admin backend)
│       ├── auth/login/route.ts
│       ├── auth/logout/route.ts
│       ├── auth/me/route.ts
│       ├── dashboard/route.ts
│       ├── patients/[id]/...
│       ├── appointments/route.ts
│       ├── invoices/[id]/...
│       ├── staff/[id]/...
│       ├── attendance/route.ts
│       ├── marketing/...
│       ├── ratings/route.ts
│       └── doctors/route.ts
│
├── components/
│   ├── Navbar.tsx                      # Floating glass-pill navbar (marketing only)
│   ├── Footer.tsx                      # Site footer (marketing only)
│   ├── Logo.tsx                        # SVG logo
│   ├── BlogCard.tsx                    # Blog card — now has cover image + doctor avatar/byline
│   ├── ServiceCard.tsx                 # Service card — now has topic-matched photo
│   ├── ContactForm.tsx                 # Appointment booking form
│   ├── Card.tsx                        # Generic card component (admin)
│   ├── Sidebar.tsx                     # Admin sidebar navigation
│   └── TopBar.tsx                      # Admin top bar
│
├── lib/
│   ├── data.ts                         # Static content: blogPosts[], services[] — now includes image URLs
│   ├── auth.ts                         # JWT sign/verify helpers (jose + bcrypt)
│   ├── db.ts                           # Prisma client singleton
│   ├── guard.ts                        # requireSession() — checks JWT + isActive in DB
│   ├── nav.ts                          # Admin sidebar nav config
│   ├── roleLabel.ts                    # Role → display label map
│   └── scope.ts                        # tenantScope() — Prisma where clause for tenant isolation
│
├── prisma/
│   ├── schema.prisma                   # Full DB schema (321 lines)
│   └── seed.ts                         # Seeds SDPC tenant + demo data
│
├── proxy.ts                            # Middleware proxy for auth-guarding /admin routes
├── context.md                          # ← YOU ARE HERE
└── AGENTS.md                           # Agent rules (do not delete)
```

---

## 4. Design System (Marketing Site)

### Colors (Tailwind classes)
- **Primary gradient:** `from-teal-900 via-teal-800 to-emerald-900` — ALL hero sections
- **Accent/CTA:** `bg-teal-700` (primary buttons), `bg-emerald-500` (highlight CTAs)
- **Page background:** `bg-[#F8FAFC]` (slate-50)
- **Card background:** `bg-white` + `border border-slate-100` + `shadow-[0_4px_20px_rgb(0,0,0,0.02)]`
- **Headings:** `text-teal-950` or `text-teal-900`
- **Body text:** `text-slate-600` or `text-slate-700`
- **No cyan** — fully replaced with teal/emerald

### Typography
- **Headings:** `font-display` (Outfit font)
- **Body:** `font-sans` (Figtree font)
- **Hero H1:** `text-5xl font-display font-bold` (inner pages) / `text-5xl md:text-7xl` (home)

### Layout
- **Max width:** `max-w-6xl mx-auto`
- **Hero padding:** `pt-36 pb-24 px-4` — the `pt-36` is CRITICAL to clear the fixed floating navbar
- **Card radius:** `rounded-3xl`
- **Button radius:** `rounded-full`

### Custom CSS Utilities (`globals.css`)
- `.card-hover` — lift + shadow on hover
- `.glass-panel` — frosted glass
- `.font-display` — Outfit font

---

## 5. Key Component Notes

### `Navbar.tsx` (marketing only)
- **Fixed, floating pill** — `fixed top-0`, centered, `bg-white/90 backdrop-blur-lg`
- Always visible over dark hero backgrounds (opacity never drops)
- Shrinks + shadow on scroll via `scrolled` state
- CTA: "Book Appointment" → `/contact`

### `BlogCard.tsx`
- Now shows **cover image** (top), category badge, title, excerpt
- Shows **doctor avatar + byline** (Dr. Tejaswini) on first 3 posts
- Links to `/blog/[slug]` — fully clickable

### `ServiceCard.tsx`
- Now shows a **topic-matched Pexels photo** for each service
- 9 services total (see lib/data.ts) including new Kids Wellness & Paediatric Physio

### `lib/data.ts`
- `blogPosts[]` — schema: `{ id, slug, title, category, date, excerpt, content: string[], image?: string, author?: {...} }`
- `services[]` — schema: `{ id, title, description, icon, image?: string }`
- All images now use **Pexels** (Indian doctor/patient context), IDs carefully matched to service topic

### `proxy.ts` (middleware auth guard)
- Guards all `/admin` routes EXCEPT `/admin/login`
- Reads JWT from cookie, redirects to `/admin/login` if missing/invalid

### Admin Auth
- Login: `/admin/login` — credentials set via seed: `admin@sridatriphysio.in` / `Admin@123`
- JWT stored in HTTP-only cookie, 7-day TTL
- `lib/guard.ts` checks `user.isActive` in DB on every protected request

---

## 6. What Has Been Done (Full History)

### Phase 1 — Initial Setup
- Created Next.js 16 project with Tailwind CSS v4
- Built all marketing pages: Home, About, Services, Blog, Contact, Blog/[slug]
- Deployed to Vercel, fixed build errors

### Phase 2 — Blog Content
- Researched and filled all blog posts with real physiotherapy content
- Blog cards are clickable (Link component)

### Phase 3 — UI/UX Audit & Redesign
- Dual-font system (Outfit + Figtree)
- Teal + Emerald palette replacing cyan
- Floating glassmorphic pill navbar
- Rich dark gradient hero sections on all pages
- Rounded-3xl cards with soft shadows + hover animations

### Phase 4 — Fixes
- Navbar visibility fix: `bg-white/90` always applied
- Hero spacing: `pt-36` on all inner pages to clear fixed navbar
- Google Maps: live iframe embedded on contact page

### Phase 5 — Major Feature: Admin Portal (separate session, 2026-07-07)
- **Full clinic management system** added at `/admin`
- Prisma 6 + PostgreSQL schema (321 lines) covering: users, patients, appointments, invoices, staff, attendance, marketing, ratings
- JWT auth (jose + bcrypt), proxy middleware for route guarding
- Dashboard: revenue, patients, appointments, outstanding balance, charts
- Patients: list/search/add + detail view with packages and clinical notes
- Appointments: schedule + status tracking
- Billing: GST invoices with line items, partial/full payment recording
- Staff & Doctors: add/deactivate by role
- Attendance: mark staff and patient attendance by date
- Marketing: campaigns, workshops, lead attribution
- Doctor Ratings: patient + dept-head
- Route groups: marketing → `(marketing)/`, admin auth-protected → `admin/(protected)/`
- Fixed: login redirect loop (login page moved outside protected route group)
- Fixed: IDOR vulnerability in `lib/scope.ts` (throws on null tenantId)
- Fixed: JWT secret checked at call-time (throws if unset, no weak default)
- Perf: removed per-request isActive DB lookup (checked at login only)
- Added show/hide password toggle to login form

### Phase 6 — Marketing Site Content & Images (2026-07-07)
- Added 9th service: **Kids Wellness & Paediatric Physio**
- Updated stats: 8+ → **16+ years experience**
- Updated hero badge: Neuro Rehab + Paediatric Wellness prominent
- Fixed service terminology: Body Recovery → **Electrotherapy & Ultrasound**, Sports Injury tags fixed
- Added **Meet the Team** section (Dr. Tejaswini only — placeholder doctors removed)
- Added **2 Locations** section (Narayanguda + Himayatnagar)
- Added doctor avatar + byline to BlogCard for first 3 posts
- Added **real photos** to hero (physio photo background), service cards, blog cards
- Switched from Unsplash → **Pexels** (better Indian context photos)
- Corrected mismatched service card photos to match service topics

---

## 7. Known Issues / Open Items

- [ ] **Admin DB setup** — requires `DATABASE_URL` env var in Vercel + `prisma db push` + `npm run seed` to initialise
- [ ] **ContactForm.tsx** — no backend. Needs Formspree, Resend, or a Next.js API route
- [ ] **Google Maps embed** — may show consent wall in some regions; consider Google Maps Embed API with key
- [ ] **Blog post images** — static Pexels URLs in data.ts; no CMS yet
- [ ] **Team photos** — Dr. Tejaswini's photo is still an SVG silhouette placeholder
- [ ] **SEO** — Open Graph / Twitter card images not set
- [ ] **Analytics** — no tracking set up
- [ ] **Custom domain** — on sdpc.vercel.app; may want a subdomain of kbdcreditsolutions.in

---

## 8. Deployment & Setup

```bash
# Local dev
cd /Users/manojaaa/SDPC
npm run dev

# Admin DB setup (first time only)
npx prisma db push
npm run seed

# Build check
npm run build

# Deploy: push to main — Vercel auto-deploys
git add -A && git commit -m "your message" && git push origin main
```

### Required env vars (Vercel + local .env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-random-secret>
```

---

## 9. Design Decisions & Constraints

1. **Teal/Emerald palette is locked** — do not revert to cyan anywhere
2. **Glassmorphic navbar must stay** — keep `bg-white/90 backdrop-blur-lg`
3. **`pt-36` on inner page heroes** — required because navbar is `fixed`. Do not change to `sticky`
4. **Route groups are important** — `(marketing)` has Navbar/Footer, `admin/(protected)` has Sidebar/TopBar, they must not bleed into each other
5. **Pexels for images** — Unsplash was replaced; use Pexels IDs, ensure `images.pexels.com` stays in `next.config.ts` allowed domains
6. **Single-tenant admin** — the DB schema supports multi-tenant but SDPC runs as one tenant. `lib/scope.ts` tenantScope scopes all queries — never bypass it
7. **No CMS** — content in `lib/data.ts`. Future: could add Sanity or Contentful
