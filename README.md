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
- `/dashboard.html` — Participant workspace: readiness status, profile picture,
  editable profile and team members, uploads, PPT/repo updates, activity, and
  CTF score.
- `/admin.html` — Admin dashboard: users and details, new-user notifications,
  hackathon PPT submissions, and CTF scoreboard.

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
- The API inserts each registration into Postgres (`registrations` table), stores
  the PPT and payment screenshot in S3-compatible object storage, then emails a
  verification link with the submitted details and attachments to `ADMIN_EMAIL`
  (`cyberdemons121@gmail.com` by default).
- Only a SHA-256 hash of the verification token is stored. Clicking **Mark
  verified & send credentials** in that mail calls `/api/verify?token=...`, marks
  the row verified, generates a one-time password, stores only its bcrypt hash,
  and emails the participant their unique ID + password. If Resend rejects the
  participant address (for example while using the `resend.dev` test sender),
  the mail falls back to `ADMIN_EMAIL` so the credentials are not lost, and the
  verification state is rolled back only when every delivery attempt fails.
- `POST /api/login` checks those credentials against the verified database row;
  `src/pages/LoginPage.tsx` uses it for sign-in.
- The home **Join** form (`src/components/Join.tsx`) is still mailto-only.

## Design notes

- Palette follows the supplied artwork: near-black ink, blood red, ice cyan.
- Motion is progressive: scroll reveals, marquee, and HUD animations are
  disabled under `prefers-reduced-motion`.
- All interactive elements have visible focus states and accessible labels.

## Backend setup

Copy `.env.example` to `.env` and fill in:

- `RESEND_API_KEY` — API key for HTTPS delivery of admin and fallback mail.
  `FROM_EMAIL` must be a sender verified in Resend; the default test sender is
  `onboarding@resend.dev`, which can only mail the account owner.
- `MAIL_RELAY_URL` / `MAIL_RELAY_SECRET` — URL and shared secret for the
  `mailrelay` Neon Function. The relay sends participant confirmation mail over
  Gmail SMTP, which free Render services cannot reach directly. Deploy it with
  `neon functions deploy mailrelay --src functions/mailrelay.ts --env SMTP_USER=... --env SMTP_PASS=... --env MAIL_RELAY_SECRET=...`.
  Without these, participant mail falls back to Resend (and then to the admin
  address when Resend rejects an unverified recipient).
- `SMTP_EMAIL` / `SMTP_APP_PASSWORD` — Gmail account and App Password used by
  the relay. This is not the account password.
- `DATABASE_URL` — Postgres connection string (Neon's pooled URL works well).
  The `registrations` and `scores` tables are created automatically on startup
  from `server/schema.sql`.
- `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY` — AWS-standard S3 credentials injected by Neon for the
  `uploads` bucket declared in `neon.ts`. `OBJECT_STORAGE_BUCKET` defaults to
  `uploads`. Files are no longer kept in the local `uploads/` folder, so they
  survive redeploys.
- `APP_URL` — public URL of this service (used in verification/login links).
- `ADMIN_EMAIL` — address that receives verification mail.
- `ADMIN_USER`, `ADMIN_PASSWORD` — username and password for `/admin.html`. Both are required; admin login is disabled if either is missing.

Local dev: run `npm run server` and `npm run dev` in separate terminals; Vite
proxies `/api` to port 3001.

## Participant dashboard

Signing in sends verified users to `/dashboard.html`. The page reads `/api/me`
and lets participants:

- Track readiness: verification, payment proof, PPT, and profile/team completion.
- Edit captain name, team name, phone, college, city, experience, and repo via
  `PATCH /api/me/profile`.
- Add, edit, and remove up to 10 team members in the same profile payload; team
  size is recalculated automatically.
- Upload or replace a profile picture, payment proof, and PPT through
  `POST /api/me/uploads`, or remove them with `DELETE /api/me/uploads/:field`.
  Old objects are deleted from Neon Object Storage when replaced.
- Download every stored file through the owner-only `/api/files/:field` route.

Only verified, unblocked sessions can read or change this data. Password hashes
stay server-side and are never returned to the browser.

## Admin dashboard

Open `/admin.html` and sign in with `ADMIN_USER` and `ADMIN_PASSWORD`. The
console opens on an overview with registration counts and tabs for every
management area:

- **Users** — search/filter all registrations, inspect every stored detail and
  uploaded file, resend fresh credentials, block/unblock access, or permanently
  delete a user and their files. Blocked users cannot log in to `/dashboard.html`.
- **Notifications** — pending registrations waiting for review, with a live
  unread badge and a "Mark all read" action. A registration leaves this panel
  once it is verified or dismissed.
- **Hackathon** — lists every PPT uploaded by participants (at registration or
  later from the submission portal), with download links to the original files.
- **CTF** — scoreboard ranked by points, highest first. Pick a registered team
  (or type a new one), enter points, and save; scores live in the `scores`
  Postgres table.

Admin sessions use an httpOnly `cd_admin` cookie signed with `SESSION_SECRET`;
the score and file endpoints reject requests without it.

## Deploying

`render.yaml` defines a Render web service: `npm run build` then `npm start`,
where `npm start` runs `server/index.js` and serves both the API and the built
`dist/` site. Set `APP_URL`, `RESEND_API_KEY`, `FROM_EMAIL`, `MAIL_RELAY_URL`,
`MAIL_RELAY_SECRET`, `DATABASE_URL`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `OBJECT_STORAGE_BUCKET`,
`SESSION_SECRET`, `ADMIN_USER`, and `ADMIN_PASSWORD` in the Render dashboard
(they are `sync: false` in the blueprint). Free Render services block SMTP
ports, so Gmail SMTP is routed through the `mailrelay` Neon Function while
Resend handles admin and fallback mail. Keep event page URLs as
`/hackathon.html` and `/ctf.html`.

