export type IconName =
  | "terminal"
  | "crosshair"
  | "shield"
  | "radio"
  | "users"
  | "file";

export type TrackId = "red" | "blue";

export type PageId = "home" | "hackathon" | "hackathon-updates" | "ctf" | "login";

export interface NavItem {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Principle {
  index: string;
  title: string;
  body: string;
}

export interface Track {
  id: TrackId;
  code: string;
  title: string;
  role: string;
  description: string;
  focus: string[];
  operations: string[];
}

export interface Operation {
  icon: IconName;
  title: string;
  description: string;
}

export interface EventItem {
  day: string;
  time: string;
  title: string;
  type: string;
  access: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const site = {
  name: "CyberDemons",
  tagline: "Red team. Blue team. One pack.",
  email: "cyberdemons121@gmail.com",
  ctfUrl: "https://www.cyberdemon.run.place/ctf-final-with-dragon.html",
  discordWebhookUrl:
    "https://discord.com/api/webhooks/1572686912580358154/a3IxaGaUM04pEyzPv4oEfRIZjodTSJdd8dU_rk9XErhnE45HmWO6XfBpfrw-xYYJW0BA", // shared registration webhook (all events)
  discordInviteUrl: "https://discord.gg/yTGqUDwzD",
  whatsappUrl: "https://chat.whatsapp.com/BXuYn1xhdU0COABDHuX8NM?s=cl&p=a&iam=2",
  paymentQr: "/pay.jpg",
  prizePool: "₹20,000",
  nav: [
    { label: "Mission", href: "#mission" },
    { label: "Tracks", href: "#tracks" },
    { label: "Operations", href: "#operations" },
    { label: "Events", href: "#events" },
    { label: "FAQ", href: "#faq" },
  ] satisfies NavItem[],
  stats: [
    { value: "02", label: "Tracks: red + blue" },
    { value: "OPEN", label: "Labs and range access" },
    { value: "MONTHLY", label: "CTF nights" },
    { value: "CONSENT", label: "The first rule" },
  ] satisfies Stat[],
  ticker: [
    "Red team operations",
    "Blue team defense",
    "Purple team debriefs",
    "CTF nights",
    "Threat hunting",
    "Malware triage",
    "OSINT tradecraft",
    "Home lab builds",
    "Writeups",
    "Mentorship",
  ],
  principles: [
    {
      index: "01",
      title: "Consent before payloads",
      body: "Every technique we teach lives in a lab we own or an engagement we are authorized to touch. No exceptions, no excuses.",
    },
    {
      index: "02",
      title: "Defense gets the last word",
      body: "An exploit is not the finish line. Every attack we run ends in a detection, a control, or a lesson the blue team can ship.",
    },
    {
      index: "03",
      title: "Share the writeup",
      body: "Knowledge multiplies when it is documented. Publish your notes, review someone else's, and leave the pack sharper than you found it.",
    },
  ] satisfies Principle[],
  tracks: [
    {
      id: "red",
      code: "01 / OFFENSE",
      title: "Red Team",
      role: "Adversary simulation",
      description:
        "Think like the attacker who is already inside. Recon, initial access, persistence, and the clean exit, always inside a scope you are allowed to break.",
      focus: [
        "Recon and OSINT",
        "Web exploitation",
        "Active Directory",
        "C2 and payloads",
        "Social engineering",
        "Evasion tradecraft",
      ],
      operations: [
        "Adversary emulation labs",
        "Crack-the-box nights",
        "Tooling deep dives",
        "Report writing drills",
      ],
    },
    {
      id: "blue",
      code: "02 / DEFENSE",
      title: "Blue Team",
      role: "Detection and response",
      description:
        "Hunt the signal in the noise. Build detections, triage incidents, and turn every red team finding into a control that actually holds under pressure.",
      focus: [
        "SIEM and log pipelines",
        "Threat hunting",
        "Incident response",
        "Malware triage",
        "Network defense",
        "System hardening",
      ],
      operations: [
        "Detection engineering sprints",
        "Purple team debriefs",
        "Incident simulations",
        "Home lab hardening",
      ],
    },
  ] satisfies Track[],
  operations: [
    {
      icon: "terminal",
      title: "Open labs",
      description:
        "Weekly hands-on sessions in our range. Bring a laptop, a question, and leave with working notes.",
    },
    {
      icon: "crosshair",
      title: "CTF nights",
      description:
        "Jeopardy boards, king-of-the-hill, and beginner brackets with mentors on comms the whole way through.",
    },
    {
      icon: "shield",
      title: "Purple debriefs",
      description:
        "Red findings meet blue detections. We replay the attack together and close the gap before the next round.",
    },
    {
      icon: "radio",
      title: "Threat briefings",
      description:
        "A monthly rundown of the techniques, CVEs, and TTPs that matter, translated into actions you can take.",
    },
    {
      icon: "users",
      title: "Mentor pods",
      description:
        "Small groups matched by track and level, with a senior operator checking in and reviewing your work.",
    },
    {
      icon: "file",
      title: "Writeups and tools",
      description:
        "Public research, lab notes, and open-source tooling built by members who would rather show than tell.",
    },
  ] satisfies Operation[],
  events: [
    {
      day: "WED",
      time: "20:00 UTC",
      title: "Open Lab: Attack and Defend",
      type: "Lab",
      access: "Members",
    },
    {
      day: "FRI",
      time: "21:00 UTC",
      title: "CTF Night: Jeopardy + King of the Hill",
      type: "Competition",
      access: "Open",
    },
    {
      day: "SAT",
      time: "18:00 UTC",
      title: "Threat Briefing and Purple Debrief",
      type: "Briefing",
      access: "Open",
    },
    {
      day: "SUN",
      time: "17:00 UTC",
      title: "Writeup Workshop: From Notes to Publish",
      type: "Workshop",
      access: "Members",
    },
  ] satisfies EventItem[],
  faqs: [
    {
      question: "Do I need experience to join?",
      answer:
        "No. We run a fundamentals track for people starting from zero and pair every newcomer with a mentor pod. Curiosity and consistency matter more than certifications.",
    },
    {
      question: "Is this legal?",
      answer:
        "Yes. We only work in environments we own, labs we control, or engagements with written authorization. No one shares live targets, leaked credentials, or unpatched systems belonging to someone else.",
    },
    {
      question: "Does it cost anything?",
      answer:
        "The community is free to join. The Hackathon entry is a flat ₹300 Entry/Team for teams of 1–4 (same price for a solo entry); the main CTF entry is ₹200/Head. Both have a ₹20,000 prize pool (details on each event page). Some sessions may ask you to bring your own laptop or a small lab setup.",
    },
    {
      question: "Do I have to pick red or blue?",
      answer:
        "Pick one to start, then cross-train. The best red teamers understand detection, and the best blue teamers know how an intrusion actually feels.",
    },
    {
      question: "How do I get in?",
      answer:
        "Send an application with the form on this site. After you submit and complete payment, upload your payment screenshot (and required files for the event). Our team verifies payments, then you’ll receive a confirmation mail, a unique ID, and login credentials to access event updates or the CTF portal.",
    },
  ] satisfies FaqItem[],
};
