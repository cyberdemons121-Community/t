import { useEffect, useState } from "react";
import { Corners } from "../components/Corners";
import { Reveal } from "../components/Reveal";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CrosshairIcon,
  FileIcon,
} from "../components/Icons";
import { buttonGhost, buttonPrimary } from "../components/styles";
import { site } from "../data/site";

interface Upload {
  field: string;
  name: string;
  url: string;
}

interface MeResponse {
  ok: boolean;
  uniqueId: string;
  name: string;
  event: string;
  eventName: string;
  registeredFor: string;
  status: string;
  details: Record<string, unknown>;
  uploads: Upload[];
  score?: number | null;
  error?: string;
}

type AuthState = "loading" | "guest" | "ready";

const labelMap: Record<string, string> = {
  eventName: "Event",
  teamName: "Team",
  captain: "Captain",
  handle: "Handle",
  teamSize: "Team size",
  email: "Email",
  phone: "Phone",
  name: "Name",
  college: "College",
  city: "City",
  experience: "Experience",
  repo: "Project repo",
  ppt: "Presentation",
  paymentScreenshot: "Payment proof",
  transactionId: "Transaction ID",
};

function humanize(key: string) {
  return (
    labelMap[key] ||
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/^./, (char) => char.toUpperCase())
  );
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function UserDashboardPage() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/me");
        const result = (await response.json().catch(() => ({}))) as MeResponse;
        if (cancelled) return;
        if (!response.ok || !result.ok) {
          setAuth("guest");
          return;
        }
        setMe(result);
        setAuth("ready");
      } catch {
        if (!cancelled) {
          setError("Could not reach the server. Try again in a moment.");
          setAuth("guest");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function copyId() {
    if (!me?.uniqueId) return;
    try {
      await navigator.clipboard.writeText(me.uniqueId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.assign("/login.html");
    }
  }

  if (auth === "loading") {
    return (
      <section className="container-x pb-24 pt-36">
        <Reveal>
          <div className="border border-white/10 bg-ink-800/50 p-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ice">
              Loading your portal...
            </p>
          </div>
        </Reveal>
      </section>
    );
  }

  if (auth === "guest" || !me) {
    return (
      <section className="container-x pb-24 pt-36">
        <Reveal>
          <div className="group relative mx-auto max-w-xl border border-white/10 bg-ink-800/60 p-8 text-center sm:p-12">
            <Corners className="text-ice/50" />
            <CrosshairIcon className="mx-auto h-10 w-10 text-ice" />
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
              Sign in to view your dashboard
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-fog">
              Your registration, credentials status, uploads, and event updates live here. Use the unique ID and password sent after verification.
            </p>
            {error ? <p className="mt-4 text-sm text-blood-bright">{error}</p> : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/login.html" className={buttonPrimary}>Go to login</a>
              <a href="/hackathon.html" className={buttonGhost}>Hackathon</a>
            </div>
          </div>
        </Reveal>
      </section>
    );
  }

  const verified = me.status === "verified";
  const detailPairs = Object.entries(me.details || {}).filter(
    ([key, value]) => !["files", "uploads", "registeredFor"].includes(key) && displayValue(value) !== "—",
  );

  return (
    <section className="relative overflow-hidden pb-24 pt-28 md:pb-32 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -left-32 top-16 h-[420px] w-[420px] animate-drift rounded-full bg-blood/10 blur-[120px] motion-reduce:animate-none" />
        <div className="absolute -right-24 top-1/3 h-[440px] w-[440px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow flex items-center gap-3 text-fog">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-blink bg-ice motion-reduce:animate-none" />
                <span className="text-ice">Operator portal</span>
                <span aria-hidden="true" className="text-white/20">//</span>
                <span>Your details</span>
              </p>
              <h1 className="mt-6 text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-none tracking-[-0.03em]">
                Welcome back, <span className="text-ice">{me.name || "operator"}</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
                Everything stored for your {me.registeredFor || me.eventName} registration is below.
              </p>
            </div>
            <button type="button" onClick={signOut} disabled={signingOut} className={buttonGhost}>
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="group relative h-full border border-white/10 bg-ink-800/60 p-6 sm:p-8">
              <Corners className="text-ice/50" />
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight text-white">Registration</h2>
                <span
                  className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                    verified
                      ? "border-ice/40 bg-ice/[0.06] text-ice"
                      : "border-blood/40 bg-blood/[0.06] text-blood-bright"
                  }`}
                >
                  {verified ? "Verified" : me.status || "Pending"}
                </span>
              </div>

              <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <dt className="field-label">Unique ID</dt>
                  <dd className="mt-1 flex items-center gap-3 font-mono text-sm text-white">
                    {me.uniqueId}
                    <button
                      type="button"
                      onClick={copyId}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Email</dt>
                  <dd className="mt-1 break-all text-sm text-white">
                    {displayValue(me.details.email)}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Event</dt>
                  <dd className="mt-1 text-sm text-white">{me.eventName || me.event}</dd>
                </div>
                <div>
                  <dt className="field-label">Team</dt>
                  <dd className="mt-1 text-sm text-white">
                    {displayValue(me.details.teamName || me.details.handle)}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Captain</dt>
                  <dd className="mt-1 text-sm text-white">
                    {displayValue(me.details.captain || me.details.handle)}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Phone</dt>
                  <dd className="mt-1 text-sm text-white">{displayValue(me.details.phone)}</dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="group relative h-full border border-ice/20 bg-ice/[0.04] p-6 sm:p-8">
              <Corners className="text-ice/50" />
              <div className="flex items-center gap-3">
                <CheckIcon className="h-5 w-5 text-ice" />
                <h2 className="text-xl font-semibold tracking-tight text-white">Credentials</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-fog">
                Your password is stored in the database as a one-way bcrypt hash. It is never saved in plain text and cannot be displayed here.
              </p>
              <div className="mt-5 border border-white/10 bg-ink/60 p-4 font-mono text-[11px] leading-relaxed text-fog">
                <p><span className="text-white">Login ID:</span> {me.uniqueId}</p>
                <p className="mt-1"><span className="text-white">Password:</span> •••••••••• (sent to your email)</p>
                <p className="mt-1"><span className="text-white">Session:</span> active</p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-fog/80">
                Lost your password? Contact{" "}
                <a
                  href={`mailto:${site.email}?subject=Password%20reset%20${me.uniqueId}`}
                  className="text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current"
                >
                  {site.email}
                </a>
                .
              </p>
              {typeof me.score === "number" ? (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="field-label">CTF score</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-ice">{me.score}</p>
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="group relative border border-white/10 bg-ink-800/60 p-6 sm:p-8">
              <Corners className="text-ice/40" />
              <h2 className="text-lg font-semibold tracking-tight text-white">Submitted details</h2>
              <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {detailPairs.map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="field-label">{humanize(key)}</dt>
                    <dd className="mt-1 break-words text-sm text-white">{displayValue(value)}</dd>
                  </div>
                ))}
                {detailPairs.length === 0 ? (
                  <p className="text-sm text-fog">No additional details were submitted.</p>
                ) : null}
              </dl>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="group relative border border-white/10 bg-ink-800/60 p-6 sm:p-8">
              <Corners className="text-ice/40" />
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-ice" />
                <h2 className="text-lg font-semibold tracking-tight text-white">Your uploads</h2>
              </div>
              {me.uploads.length ? (
                <ul className="mt-5 space-y-3">
                  {me.uploads.map((file, index) => (
                    <li key={`${file.field}-${index}`}>
                      <a
                        href={file.url}
                        className="flex items-center justify-between gap-4 border border-white/10 bg-ink/50 px-4 py-3 text-sm text-white transition-colors hover:border-ice/50 hover:text-ice"
                      >
                        <span className="truncate">{file.name}</span>
                        <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-ice" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-fog">
                  No files uploaded yet. Hackathon teams can submit a presentation from the event page.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/hackathon.html" className={buttonGhost}>Hackathon</a>
                <a href="/hackathon-updates.html" className={buttonGhost}>Updates</a>
                <a href={site.ctfUrl} className={buttonPrimary} target="_blank" rel="noreferrer">
                  CTF board
                  <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
