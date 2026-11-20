import { useState, type FormEvent } from "react";
import { site } from "../data/site";
import { Corners } from "../components/Corners";
import { Reveal } from "../components/Reveal";
import { buttonGhost, buttonPrimary } from "../components/styles";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setStatus("error");
      setMessage("Enter both your unique ID or email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        name?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Access pending or credentials not recognized.");
      }
      setName(data.name || "operator");
      setMessage("Access verified.");
      setStatus("ok");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -left-32 top-8 h-[420px] w-[420px] animate-drift rounded-full bg-blood/10 blur-[120px] motion-reduce:animate-none" />
        <div className="absolute -right-24 top-1/3 h-[440px] w-[440px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Reveal>
          <div>
            <p className="eyebrow flex items-center gap-3 text-fog">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-blink bg-ice motion-reduce:animate-none" />
              <span className="text-ice">Portal access</span>
              <span aria-hidden="true" className="text-white/20">//</span>
              <span>Verified players</span>
            </p>
            <h1 className="mt-6 text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
              Login to your <span className="text-ice">event portal</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-fog md:text-lg">
              Credentials (unique ID / login details) are provided by email after registration and payment verification.
              Use them to access the CTF board or see hackathon updates once your access is activated.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 bg-ink-800/40 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">After verification</p>
                <ul className="mt-3 space-y-2 text-sm text-fog">
                  <li>• Confirmation mail sent to your registered email</li>
                  <li>• Unique team/individual ID issued</li>
                  <li>• Login credentials provided</li>
                </ul>
              </div>
              <div className="border border-ice/20 bg-ice/[0.04] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Need help?</p>
                <p className="mt-2 text-sm leading-relaxed text-fog">
                  Contact us if you registered and haven’t received credentials after verification.
                </p>
                <a
                  href={`mailto:${site.email}?subject=Login%20credentials%20request`}
                  className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-[0.18em] text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current"
                >
                  {site.email}
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/hackathon.html" className={buttonGhost}>Hackathon</a>
              <a href="/ctf.html" className={`${buttonPrimary} shine-hover`}>Main CTF</a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="group relative border border-white/10 bg-ink-800/60 p-6 sm:p-8">
            <Corners className="text-ice/50" />
            <h2 className="text-2xl font-semibold tracking-tight text-white">Sign in</h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">
              Use the credentials sent to your email after payment verification.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
              <div>
                <label htmlFor="login-id" className="field-label">Email or Unique ID</label>
                <input
                  id="login-id"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setStatus("idle"); setMessage(""); }}
                  className={`field ${status === "error" && !identifier.trim() ? "field-error" : ""}`}
                  placeholder="your@email.com or CD-XXXX"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="field-label">Password / Access code</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setStatus("idle"); setMessage(""); }}
                  className={`field ${status === "error" && !password.trim() ? "field-error" : ""}`}
                  placeholder="Credentials from confirmation mail"
                />
              </div>

              {status === "error" ? (
                <div className="border border-blood/40 bg-blood/10 p-4 text-sm text-fog" role="status">
                  <p className="font-medium text-white">{message}</p>
                  <p className="mt-1 leading-relaxed">
                    Login is enabled after registration and verification. If you’ve been verified, use the exact credentials sent to your mail.
                  </p>
                </div>
              ) : null}

              {status === "ok" ? (
                <div className="border border-ice/40 bg-ice/[0.06] p-4 text-sm text-fog" role="status">
                  <p className="font-medium text-white">Welcome, {name}.</p>
                  <p className="mt-1 leading-relaxed">Your credentials are verified and access is active.</p>
                  <a href={site.ctfUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-[0.18em] text-ice underline decoration-white/20 underline-offset-4 hover:decoration-current">
                    Enter the CTF board <span aria-hidden="true">→</span>
                  </a>
                </div>
              ) : null}

              <button type="submit" disabled={submitting} className={`${buttonPrimary} w-full disabled:cursor-not-allowed disabled:opacity-60`}>
                {submitting ? "Checking..." : "Login"}
                <span aria-hidden="true">→</span>
              </button>

              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
                No credentials yet? Register for an event, complete payment, and you’ll receive confirmation + unique ID + login details after verification.
              </p>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
