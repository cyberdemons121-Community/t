import { site } from "./site";

export type EventId = "hackathon" | "ctf";
export type EventAccent = "red" | "blue";

export interface EventStat {
  value: string;
  label: string;
}

export interface EventTrack {
  code: string;
  title: string;
  description: string;
  prompts: string[];
}

export interface EventScheduleItem {
  when: string;
  title: string;
  description: string;
}

export interface EventRule {
  title: string;
  body: string;
}

export interface RegistrationField {
  name: string;
  label: string;
  type: "text" | "email" | "select" | "textarea" | "file";
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  fullWidth?: boolean;
  help?: string;
  accept?: string;
}

export interface RegistrationConfig {
  title: string;
  description: string;
  submitLabel: string;
  subjectTag: string;
  fields: RegistrationField[];
  webhookUrl?: string;
  whatsappUrl?: string;
  discordInviteUrl?: string;
}

export interface EventPageData {
  id: EventId;
  accent: EventAccent;
  href: string;
  name: string;
  cardTitle: string;
  cardDescription: string;
  cardFacts: string[];
  kicker: string;
  status: string;
  date: string;
  eventDate: string;
  entryFeeLabel: string;
  dateDisplay: string;
  month: string;
  deadline: string;
  title: string;
  tagline: string;
  description: string;
  brief: string[];
  stats: EventStat[];
  tracksTitle: string;
  tracksDescription: string;
  tracks: EventTrack[];
  scheduleTitle: string;
  schedule: EventScheduleItem[];
  rulesTitle: string;
  rules: EventRule[];
  registrationTitle: string;
  registrationDescription: string;
  registration: RegistrationConfig;
  liveCta?: {
    label: string;
    href: string;
  };
}

const paymentAndConfirmNote = (entryFeeLabel: string) =>
  `Entry fee: ${entryFeeLabel} · Prize pool: ${site.prizePool}. Complete payment, upload your payment screenshot, and submit. After payment verification you will receive a confirmation mail and a unique ID (team/individual) with login credentials.`;

const hackathon: EventPageData = {
  id: "hackathon",
  accent: "blue",
  href: "/hackathon.html",
  name: "CyberDemons Hackathon 2026",
  cardTitle: "The CyberDemons Hackathon",
  cardDescription:
    "Build offensive tooling, a defense that holds, or research worth reading. PPT submissions close 23 December 2026. Event day 26 December 2026.",
  cardFacts: ["PPT due 23 Dec", "Event 26 Dec", "Teams 1–4", `₹300/team · flat fee`],
  kicker: "Hackathon // 2026",
  status: "Registration open",
  date: "26 Dec 2026",
  eventDate: "26 December 2026",
  entryFeeLabel: "₹300 Entry/Team",
  dateDisplay: "26",
  month: "DEC 2026",
  deadline: "23 December 2026 — PPT submission deadline",
  title: "Build it. Break it. Ship the writeup.",
  tagline: "A security build sprint with a deadline that bites.",
  description:
    "A build sprint for offensive tooling, defensive engineering, and security research. Work solo or bring a team of up to four. Submit your PPT by 23 December 2026. Event day is 26 December 2026. Entry is a flat ₹300 per team (even for a team of one), prize pool ₹20,000.",
  brief: [
    "The CyberDemons Hackathon is for people who learn by shipping. Pick a track, build something real, document how it works, and put it in front of reviewers who will actually read it.",
    "You do not need a polished product. A sharp prototype, a working detection, or a reproducible piece of research is enough — as long as we can run it, read it, and understand the decisions behind it.",
    "PPT submissions close on 23 December 2026. The event runs on 26 December 2026. Entry is ₹300 per team regardless of team size (1–4), with a ₹20,000 prize pool. Complete payment and upload your payment screenshot and presentation (PPT) during registration.",
  ],
  stats: [
    { value: "23 DEC", label: "PPT submission deadline" },
    { value: "26 DEC", label: "Event day" },
    { value: "₹300", label: "Entry / team (1–4)" },
    { value: "₹20,000", label: "Prize pool" },
  ],
  tracksTitle: "Pick a track. Ship something real.",
  tracksDescription: "Three tracks, one standard: it has to work, and you have to explain it.",
  tracks: [
    {
      code: "01 / OFFENSE",
      title: "Offensive tooling",
      description:
        "Recon automation, exploitation helpers, adversary-emulation utilities, or a cleaner way to do a dirty job inside a lab.",
      prompts: ["Recon and OSINT tooling", "Payload or C2 research", "Evasion and detection gaps"],
    },
    {
      code: "02 / DEFENSE",
      title: "Defensive engineering",
      description:
        "A detection, a hardening pipeline, an incident-response workflow, or a control that survives contact with a real attack.",
      prompts: ["Detection engineering", "Hardening automation", "Incident response tooling"],
    },
    {
      code: "03 / RESEARCH",
      title: "Research and writeups",
      description:
        "A reproducible vulnerability analysis, threat report, lab walkthrough, or deep dive that makes the next person faster.",
      prompts: ["Vulnerability research", "Threat intelligence", "Lab walkthroughs"],
    },
  ],
  scheduleTitle: "The clock is the point.",
  schedule: [
    {
      when: "Open now",
      title: "Registration & payment",
      description:
        "Register your team (1–4 members), pay the flat ₹300 team fee (scan QR), upload payment screenshot and your PPT, and submit your details.",
    },
    {
      when: "After verification",
      title: "Confirmation",
      description:
        "After payment verification you will receive a confirmation mail with a unique team/individual ID and login credentials for updates.",
    },
    {
      when: "Until 23 Dec 2026",
      title: "Build & PPT window",
      description:
        "Work at your pace. Keep a lab notebook, commit early, and make the submission reproducible.",
    },
    {
      when: "23 Dec 2026",
      title: "PPT submission deadline",
      description: "Presentations, writeups, and demo links close. Late entries are not judged.",
    },
    {
      when: "26 Dec 2026",
      title: "Hackathon event day",
      description: "Final judging and results on the event day.",
    },
  ],
  rulesTitle: "Rules of engagement.",
  rules: [
    {
      title: "Authorized targets only",
      body: "Everything you build or test must target systems you own, systems you have written permission to test, or an isolated lab.",
    },
    {
      title: "Teams of one to four",
      body: "Solo entries are welcome at the same ₹300 team fee. List every teammate on the registration so credit lands in the right place.",
    },
    {
      title: "Payment & verification",
      body: "Entry fee is a flat ₹300 per team, even for a team of one (max 4 members). Upload a valid payment screenshot. Confirmation mail, unique ID, and login credentials are sent after payment verification.",
    },
    {
      title: "Submit the writeup & PPT",
      body: "Upload your presentation (PPT/PPTX). Show what it does, how to run it, and what you learned.",
    },
    {
      title: "No live malware",
      body: "If your research needs a sample, use a harmless test artifact or a controlled lab. Never ship live malware in the submission.",
    },
  ],
  registrationTitle: "Register your team.",
  registrationDescription:
    "Pay the flat ₹300 team fee (1–4 members, same price for a solo entry), upload payment screenshot and your PPT, and submit. Details and files are sent for verification; you’ll receive a confirmation mail and unique ID after verification.",
  registration: {
    title: "Hackathon registration",
    description: paymentAndConfirmNote("₹300 Entry/Team (flat, 1–4 members)"),
    submitLabel: "Submit hackathon registration",
    subjectTag: "[HACKATHON]",
    whatsappUrl: "https://chat.whatsapp.com/BXuYn1xhdU0COABDHuX8NM?s=cl&p=a&iam=2",
    fields: [
      {
        name: "teamName",
        label: "Team name",
        type: "text",
        required: true,
        minLength: 3,
        maxLength: 60,
        placeholder: "Null Route",
        autoComplete: "organization",
      },
      {
        name: "captain",
        label: "Captain handle / name",
        type: "text",
        required: true,
        minLength: 2,
        maxLength: 40,
        placeholder: "0xghost",
        autoComplete: "nickname",
      },
      {
        name: "email",
        label: "Contact email",
        type: "email",
        required: true,
        maxLength: 120,
        placeholder: "captain@example.com",
        autoComplete: "email",
      },
      {
        name: "phone",
        label: "Phone / WhatsApp number",
        type: "text",
        required: true,
        minLength: 8,
        maxLength: 20,
        placeholder: "+91...",
        autoComplete: "tel",
      },
      {
        name: "teamSize",
        label: "Team size (max 4)",
        type: "select",
        required: true,
        options: ["1 (solo)", "2", "3", "4"],
        help: "The ₹300 team fee is the same for any team size, including a team of one.",
      },
      {
        name: "track",
        label: "Track",
        type: "select",
        required: true,
        options: ["Offensive tooling", "Defensive engineering", "Research and writeups"],
      },
      {
        name: "repo",
        label: "Repository or project link",
        type: "text",
        maxLength: 200,
        placeholder: "https://github.com/...",
        help: "Optional. Add it if the work is already public.",
      },
      {
        name: "project",
        label: "What are you building?",
        type: "textarea",
        required: true,
        minLength: 20,
        maxLength: 700,
        fullWidth: true,
        placeholder: "What it does, who it helps, and the first thing a reviewer should try.",
      },
      {
        name: "ppt",
        label: "Presentation (PPT/PPTX)",
        type: "file",
        required: true,
        accept: ".ppt,.pptx,.pdf",
        fullWidth: true,
        help: "Upload your presentation file (PPT/PPTX/PDF).",
      },
      {
        name: "paymentScreenshot",
        label: "Payment screenshot",
        type: "file",
        required: true,
        accept: "image/*",
        fullWidth: true,
        help: "Upload a screenshot of your ₹300 team payment (scan the QR above).",
      },
    ],
  },
};

const ctf: EventPageData = {
  id: "ctf",
  accent: "red",
  href: "/ctf.html",
  name: "CyberDemons CTF 2026",
  cardTitle: "The CyberDemons CTF",
  cardDescription:
    "Main event CTF. One day, one board. Event day 27 December 2026. Solo entry, ₹200/Head, ₹20,000 prize pool.",
  cardFacts: ["27 Dec 2026", "Solo", "₹200/Head · ₹20k pool"],
  kicker: "Capture the flag // 2026",
  status: "Registration open",
  date: "27 Dec 2026",
  eventDate: "27 December 2026",
  entryFeeLabel: "₹200/Head",
  dateDisplay: "27",
  month: "DEC 2026",
  deadline: "27 December 2026",
  title: "One day. Every flag you can carry.",
  tagline: "Main CTF — solo board, sharp edges.",
  description:
    "A one-day jeopardy CTF across web, pwn, crypto, forensics, reverse engineering, and OSINT. Solo participation. Entry fee ₹200/Head, prize pool ₹20,000. The board opens on 27 December 2026.",
  brief: [
    "The CyberDemons main CTF is a solo jeopardy event. Expect beginner-friendly footholds and flags that take longer than you think across core security categories.",
    "Every challenge is self-contained. No attacks on shared infrastructure, no guessing games, no flags behind a paywall. Register, complete payment, and bring your notes.",
    "The event runs on 27 December 2026. After payment verification you’ll receive confirmation, a unique ID, and login credentials to access the event.",
  ],
  stats: [
    { value: "27 DEC", label: "Event day" },
    { value: "SOLO", label: "Participation" },
    { value: "₹200/Head", label: "Entry fee" },
    { value: "₹20,000", label: "Prize pool" },
  ],
  tracksTitle: "Six doors. Pick your first.",
  tracksDescription:
    "The board covers the fundamentals and then keeps going. Solo play — own every solve.",
  tracks: [
    { code: "01 / WEB", title: "Web", description: "Request smuggling, auth flaws, injection, and browser-shaped trouble.", prompts: ["HTTP", "Access control", "Client-side"] },
    { code: "02 / PWN", title: "Pwn", description: "Memory corruption, strange binaries, and a debugger you should keep open.", prompts: ["Memory safety", "ROP", "Binary exploitation"] },
    { code: "03 / CRYPTO", title: "Crypto", description: "Broken constructions, bad parameters, and math that rewards patience.", prompts: ["Classical", "Public key", "Protocols"] },
    { code: "04 / FORENSICS", title: "Forensics", description: "Artifacts, packet captures, disk images, and the story hidden in the noise.", prompts: ["Network", "Disk", "Memory"] },
    { code: "05 / REV", title: "Reverse engineering", description: "Code that does not want to be read, and the tools that make it talk.", prompts: ["Static", "Dynamic", "Obfuscation"] },
    { code: "06 / OSINT", title: "OSINT", description: "Public data, careful pivots, and the discipline to cite what you find.", prompts: ["Discovery", "Correlation", "Verification"] },
  ],
  scheduleTitle: "One day on the board.",
  schedule: [
    { when: "Open now", title: "Registration & payment", description: "Register (solo), pay ₹200/Head, upload payment screenshot, and submit your details for verification." },
    { when: "After verification", title: "Confirmation", description: "Receive confirmation mail with your unique ID and login credentials after payment verification." },
    { when: "27 Dec 2026", title: "Board opens", description: "Challenges go live. Login with provided credentials to play." },
    { when: "27 Dec 2026", title: "Scoreboard closes", description: "The board locks at the end of the event day. Results follow verification." },
  ],
  rulesTitle: "Play the board, not the players.",
  rules: [
    { title: "Solo participation", body: "This is a solo CTF. One account per player — no team-hopping or shared accounts." },
    { title: "No flag sharing", body: "Hints are fine in general discussion, but sharing flags is not. Keep the solve yours." },
    { title: "Payment & verification", body: "Entry fee is ₹200/Head. Upload a valid payment screenshot. Credentials are provided after payment verification." },
    { title: "Do not attack the platform", body: "Challenge infrastructure is out of scope. Report platform issues privately." },
    { title: "Keep it legal", body: "Every target is self-contained. Do not pivot to real systems or third-party services." },
  ],
  registrationTitle: "Reserve your spot.",
  registrationDescription:
    "Register for the 27 December solo CTF. Pay ₹200/Head, upload payment screenshot, and submit. You’ll receive confirmation and login credentials after verification.",
  registration: {
    title: "Main CTF registration",
    description: paymentAndConfirmNote("₹200/Head"),
    submitLabel: "Submit CTF registration",
    subjectTag: "[CTF]",
    whatsappUrl: "https://chat.whatsapp.com/DRi5ty5tUPSCEO3jLE0GOF?s=cl&p=a&iam=2",
    fields: [
      { name: "handle", label: "Handle", type: "text", required: true, minLength: 3, maxLength: 40, placeholder: "0xghost", autoComplete: "nickname" },
      { name: "email", label: "Contact email", type: "email", required: true, maxLength: 120, placeholder: "you@example.com", autoComplete: "email" },
      { name: "phone", label: "Phone / WhatsApp number", type: "text", required: true, minLength: 8, maxLength: 20, placeholder: "+91...", autoComplete: "tel" },
      { name: "experience", label: "CTF experience", type: "select", required: true, options: ["First CTF", "A few CTFs", "Regular competitor"] },
      { name: "category", label: "Category interest", type: "select", required: true, options: ["Web", "Pwn", "Crypto", "Forensics", "Reverse engineering", "OSINT", "Mixed"] },
      { name: "message", label: "Anything we should know?", type: "textarea", maxLength: 300, fullWidth: true, placeholder: "Accessibility needs or notes." },
      { name: "paymentScreenshot", label: "Payment screenshot", type: "file", required: true, accept: "image/*", fullWidth: true, help: "Upload a screenshot of your ₹200/Head payment (scan the QR above)." },
    ],
  },
  liveCta: {
    label: "Enter the CTF",
    href: site.ctfUrl,
  },
};

export const eventPages = { hackathon, ctf } as const;

export const eventLinks = [
  { label: "Hackathon", href: hackathon.href, accent: hackathon.accent },
  { label: "CTF", href: ctf.href, accent: ctf.accent },
] as const;
