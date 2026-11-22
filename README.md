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
| `npm run server`    | Start the Express API on port 3001          |
| `npm run build`     | Type-check with `tsc`, then build to `dist` |
| `npm start`         | Serve built site + API (used on Render)     |
| `npm run typecheck` | Type-check only                             |

## Pages

- `/` (`index.html`) — Home: mission, tracks, operations, recurring sessions,
  flagship event cards, join form, FAQ.
- `/hackathon.html` — CyberDemons Hackathon 2026 (PPT submissions close
  **23 December 2026**, event day **26 December 2026**).
- `/ctf.html` — CyberDemons CTF 2026 (event day **27 December 2026**).
- `/admin.html` — Admin dashboard: hackathon PPT submissions and CTF scoreboard.

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

- Event registration forms (`src/components/RegistrationForm.tsx`) POST to the
  Express API at `/api/register` (multipart, including uploads).
- The API appends each registration to a Google Sheet, then emails a verification
  link with the submitted details and attachments to `ADMIN_EMAIL`
  (`cyberdemons121@gmail.com` by default).
- Clicking **Mark verified & send credentials** in that mail calls
  `/api/verify?token=...`, marks the row verified, generates a unique password,
  and emails the participant their unique ID + password.
- `POST /api/login` checks those credentials against the verified sheet row;
  `src/pages/LoginPage.tsx` uses it for sign-in.
- The home **Join** form (`src/components/Join.tsx`) is still mailto-only.

## Design notes

- Palette follows the supplied artwork: near-black ink, blood red, ice cyan.
- Motion is progressive: scroll reveals, marquee, and HUD animations are
  disabled under `prefers-reduced-motion`.
- All interactive elements have visible focus states and accessible labels.

## Backend setup

Copy `.env.example` to `.env` and fill in:

- `SMTP_EMAIL`, `SMTP_APP_PASSWORD` — Gmail address and a **Gmail App Password**
  (not the account password). Enable 2-Step Verification and generate an app
  password for "Mail". `FROM_EMAIL` defaults to `SMTP_EMAIL`.
- `GOOGLE_SHEET_ID` — the registration spreadsheet. Authentication uses
  Application Default Credentials (ADC): run `gcloud auth application-default
  login` locally with the Google account that has Editor access to the sheet,
  and enable the Sheets API. No service-account key or `GOOGLE_PRIVATE_KEY` is
  needed. A `Registrations` tab and header row are created automatically.
- `APP_URL` — public URL of this service (used in verification/login links).
- `ADMIN_EMAIL` — address that receives verification mail.
- `ADMIN_PASSWORD` — password for `/admin.html`. Without it the dashboard login is disabled.

Local dev: run `npm run server` and `npm run dev` in separate terminals; Vite
proxies `/api` to port 3001.

## Admin dashboard

Open `/admin.html` and sign in with `ADMIN_PASSWORD`. The dashboard asks which
event to review:

- **Hackathon** — lists every PPT uploaded by participants (at registration or
  later from the submission portal), with download links to the original files.
- **CTF** — scoreboard ranked by points, highest first. Pick a registered team
  (or type a new one), enter points, and save; a `Scores` tab is created in the
  registration spreadsheet automatically.

Admin sessions use an httpOnly `cd_admin` cookie signed with `SESSION_SECRET`;
the score and file endpoints reject requests without it.

## Deploying

`render.yaml` defines a Render web service: `npm run build` then `npm start`,
where `npm start` runs `server/index.js` and serves both the API and the built
`dist/` site. Set the env vars above in the Render dashboard (or blueprint).
Keep event page URLs as `/hackathon.html` and `/ctf.html`.

