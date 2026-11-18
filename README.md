# CyberDemons

Marketing site for CyberDemons, a red team / blue team cybersecurity community.
Static multi-page site with the home landing page plus dedicated Hackathon and
CTF event pages and validated registration forms.

## Stack

- Vite 5 + React 18 + TypeScript (static multi-page build)
- Tailwind CSS 3
- Self-hosted Space Grotesk and JetBrains Mono (Fontsource)

## Getting started

```bash
npm install
npm run dev
```

The dev server prints a local URL (default `http://localhost:5173`).

## Scripts

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                   |
| `npm run build`     | Type-check with `tsc`, then build to `dist` |
| `npm run preview`   | Serve the production build locally          |
| `npm run typecheck` | Type-check only                             |

## Pages

- `/` (`index.html`) — Home: mission, tracks, operations, recurring sessions,
  flagship event cards, join form, FAQ.
- `/hackathon.html` — CyberDemons Hackathon 2026 (submissions close
  **26 December 2026**).
- `/ctf.html` — CyberDemons CTF 2026 (event day **27 December 2026**).

Page selection is driven by `#root[data-page]` in each HTML entry and wired as
Vite/Rollup inputs in `vite.config.ts`. Event links use absolute paths
(`/hackathon.html`, `/ctf.html`); section links from event pages point back to
home anchors (e.g. `/#mission`).

## Structure

```
public/
  hero-poster.jpg         Hero/event artwork
  logo-mark.png           Square logo mark crop
  logo-mark-96.png        Header/footer logo mark
  favicon-32.png          Favicon
  apple-touch-icon.png    Apple touch icon
src/
  components/             Header, Footer, SiteLayout, Logo, Hero, RegistrationForm,
                          EventPageView, Events, Join, Mission, Tracks, etc.
  data/
    site.ts               Global copy, nav, stats, tracks, FAQ, contact email, CTF URL
    events.ts             Flagship event content, schedules, rules, registration fields
  pages/                  HomePage, HackathonPage, CtfPage
  App.tsx                 Page switch
  main.tsx                Entry point (reads data-page)
  index.css               Tailwind layers, theme utilities, reveal/reduced-motion rules
hackathon.html
ctf.html
index.html
```

## Editing content

- Global copy, navigation, recurring sessions, FAQ, and contact details:
  `src/data/site.ts`. Update `site.email` to change the address used by forms
  and contact links; `site.ctfUrl` is the external CTF destination.
- Flagship event pages (Hackathon/CTF): dates, copy, tracks/categories,
  schedule, rules, registration fields, and CTAs live in `src/data/events.ts`.

## Forms and registration

- The home **Join** form (`src/components/Join.tsx`) and event registration
  forms (`src/components/RegistrationForm.tsx`) are **client-side only** and have
  **no backend**.
- Submissions validate in the browser, then prepare a prefilled `mailto:` to
  `site.email` and show a success/ready state with an explicit **“Open mail
  app”** link. Nothing is sent automatically or stored by the site.
- To collect registrations server-side later, replace the mailto preparation/use
  in `Join.tsx` and `RegistrationForm.tsx` with a `fetch` to your endpoint.

## Design notes

- Palette follows the supplied artwork: near-black ink, blood red, ice cyan.
- Motion is progressive: scroll reveals, marquee, and HUD animations are
  disabled under `prefers-reduced-motion`.
- All interactive elements have visible focus states and accessible labels.

## Deploying

`npm run build` outputs a static site in `dist/` with all three HTML entries.
Upload it to any static host (Netlify, Vercel, Cloudflare Pages, S3 + CDN,
nginx). No SPA rewrite rules are required. Keep event page URLs as
`/hackathon.html` and `/ctf.html` (or configure equivalent rewrites if you
prefer extensionless paths).

