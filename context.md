# SDPC — Sridatri Physio Care · Project Context

> **Purpose:** This file is the single source of truth for any AI agent picking up work on this project.
> Read this before touching any code.

---

## 1. What This Project Is

A **public-facing marketing website** for **Sridatri Physio Care**, a physiotherapy clinic in Hyderabad.

- **Clinic name:** Sridatri Physio Care
- **Tagline:** "Healing from Core"
- **Doctor:** Dr. Tejaswini Damerla (Consultant Physiotherapist — sports injury rehabilitation & musculoskeletal physiotherapy)
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
| Deployment | **Vercel** (auto-deploy on push to `main`) |
| Build cmd | `next build --webpack` |

> ⚠️ **Next.js 16 + React 19 are cutting-edge.** Always check `node_modules/next/dist/docs/` for API changes before writing code.

---

## 3. Project File Structure

```
/Users/manojaaa/SDPC/
├── app/
│   ├── layout.tsx          # Root layout — Navbar, Footer, font variables, global meta
│   ├── globals.css         # Tailwind base, custom utilities (card-hover, glass-panel, font-display)
│   ├── page.tsx            # Home page (hero, services preview, blog preview, CTA)
│   ├── about/page.tsx      # About page (story, values, team, CTA)
│   ├── blog/
│   │   ├── page.tsx        # Blog listing page
│   │   └── [slug]/page.tsx # Individual blog post page
│   ├── contact/page.tsx    # Contact page (contact info cards, Google Maps embed, contact form)
│   └── services/page.tsx   # Services listing page (cards + CTA)
├── components/
│   ├── Navbar.tsx          # Floating glass-pill navbar (fixed, glassmorphic)
│   ├── Footer.tsx          # Site footer
│   ├── Logo.tsx            # SVG logo component
│   ├── BlogCard.tsx        # Blog post card (links to /blog/[slug])
│   ├── ServiceCard.tsx     # Service card
│   └── ContactForm.tsx     # Contact/appointment booking form
├── lib/
│   └── data.ts             # All static content: blogPosts[], services[] arrays
├── public/                 # Static assets
├── context.md              # ← YOU ARE HERE
└── AGENTS.md               # Agent-specific rules (do not delete)
```

---

## 4. Design System

### Colors (Tailwind classes)
- **Primary gradient:** `from-teal-900 via-teal-800 to-emerald-900` — used on ALL hero sections
- **Accent/CTA:** `bg-teal-700` (primary buttons), `bg-emerald-500` (secondary/highlight CTAs)
- **Page background:** `bg-[#F8FAFC]` (slate-50)
- **Card background:** `bg-white` with `border border-slate-100` and soft shadow `shadow-[0_4px_20px_rgb(0,0,0,0.02)]`
- **Headings:** `text-teal-950` or `text-teal-900`
- **Body text:** `text-slate-600` or `text-slate-700`
- **Muted/label text:** `text-slate-400` or `text-slate-500`
- **Icon backgrounds:** `bg-teal-50` with `text-teal-600` icons
- **No cyan colors** — cyan has been fully replaced with teal/emerald throughout

### Typography
- **Headings:** `font-display` (maps to `--font-outfit`, Outfit font)
- **Body:** `font-sans` (maps to `--font-figtree`, Figtree font)
- **Hero H1 size:** `text-5xl font-display font-bold` (inner pages) / `text-5xl md:text-7xl` (home)
- **Section H2:** `text-4xl font-display font-bold`
- **Category badges:** `text-[10px] font-bold uppercase tracking-widest bg-teal-50 border border-teal-100 rounded-full`

### Layout
- **Max width:** `max-w-6xl mx-auto` for sections, `max-w-3xl mx-auto` for text-heavy sections
- **Section padding:** `py-24 px-4` for content sections, `pt-36 pb-24 px-4` for hero sections (to clear fixed navbar)
- **Card radius:** `rounded-3xl` for cards
- **Button radius:** `rounded-full` for primary CTAs

### Custom CSS Utilities (in `globals.css`)
- `.card-hover` — smooth lift + shadow on hover
- `.glass-panel` — frosted glass background + blur
- `.font-display` — maps to Outfit font

---

## 5. Key Components — Notes

### `Navbar.tsx`
- **Fixed, floating pill design** (`fixed top-0`, centered with `flex justify-center`)
- Uses `bg-white/90 backdrop-blur-lg` so logo/text stays visible on dark hero backgrounds
- Shrinks slightly + shadow increases on scroll (`scrolled` state via `useEffect`)
- Mobile: hamburger menu with dropdown panel
- Logo + "Sridatri Physio Care" + "HEALING FROM CORE" tagline always visible
- CTA button: "Book Appointment" → `/contact`

### `BlogCard.tsx`
- Renders as `<Link href="/blog/[slug]">` — blog cards ARE clickable
- Categories displayed as badge, title, excerpt shown

### `lib/data.ts`
- All blog posts and services live here as static TypeScript arrays
- Blog post schema: `{ id, slug, title, category, date, excerpt, content: string[] }`
- Services schema: `{ id, title, description, icon }`
- Blog content has been researched and filled with real, detailed physiotherapy content (not placeholder text)

### `contact/page.tsx`
- Real Google Maps iframe embedded (not a placeholder)
- Maps src points to the clinic's address: Narasimha Nilayam, Narayanguda, Hyderabad

---

## 6. What Has Been Done (History)

### Phase 1 — Initial Setup
- Created Next.js 16 project with Tailwind CSS v4
- Built all pages: Home, About, Services, Blog, Contact, Blog/[slug]
- Deployed to Vercel, fixed build errors (output: 'export' removed, dynamic routes fixed)

### Phase 2 — Blog Content
- Researched and filled all blog posts with real, detailed physiotherapy content based on titles
- Blog posts are clickable (Link component wraps BlogCard)

### Phase 3 — UI/UX Audit & Redesign
Full redesign based on audit findings:
- **Typography:** Upgraded to dual-font system (Outfit + Figtree)
- **Colors:** Replaced all plain cyan with rich Teal + Emerald palette
- **Navbar:** Redesigned to floating glassmorphic pill (fixed, centered, bg-white/90 + backdrop-blur)
- **Hero sections:** Rich dark gradient on all pages with dot-grid overlay
- **Cards:** Rounded-3xl, soft shadows, hover animations via `.card-hover`
- **Color consistency:** All 5 pages now use the same teal/emerald design tokens

### Phase 4 — Fixes
- **Navbar visibility:** Fixed logo/text disappearing on dark backgrounds by using `bg-white/90` always
- **Hero spacing:** Added `pt-36` to all hero sections to prevent content hiding behind fixed navbar
- **Google Maps:** Replaced placeholder with live Google Maps iframe for clinic location

---

## 7. Known Issues / Open Items

- [ ] **Google Maps embed** may show a consent wall in some regions — consider upgrading to Google Maps Embed API with a key for reliability
- [ ] **ContactForm.tsx** — form currently has no backend. Needs a form submission handler (e.g. Formspree, Resend, or a Next.js API route)
- [ ] **Team section** (About page) uses placeholder avatars (UserCircle icon) — needs real team photos
- [ ] **Blog post images** — no featured images on blog cards or post pages yet
- [ ] **SEO** — meta descriptions are set per page, but Open Graph / Twitter card images not yet added
- [ ] **Analytics** — no Google Analytics or similar tracking set up yet
- [ ] **Custom domain** — currently on sdpc.vercel.app, may want to connect to kbdcreditsolutions.in subdomain

---

## 8. Deployment

```bash
# Local dev
cd /Users/manojaaa/SDPC
npm run dev

# Build check
npm run build

# Deploy: just push to main
git add -A && git commit -m "your message" && git push origin main
# Vercel auto-deploys from main branch
```

---

## 9. Design Decisions & Constraints

1. **No backend** — fully static site with `output: 'export'` NOT set (removed to support dynamic blog routes). Content is hardcoded in `lib/data.ts`.
2. **No CMS** — content updates require code edits. Future: could add Sanity or Contentful.
3. **Glassmorphic navbar must stay** — user preference confirmed. Keep `bg-white/90 backdrop-blur-lg` approach.
4. **Teal/Emerald palette is locked** — do not revert to cyan. The design system is now fully on teal.
5. **pt-36 on all inner page heroes** — required because navbar is `fixed` (not `sticky`). Home page hero uses `pt-12` + inner padding since it's full-height.
