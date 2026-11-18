import { useEffect, useRef, useState, type FormEvent } from "react";
import { site } from "../data/site";
import { Corners } from "./Corners";
import { CheckIcon, ChevronDownIcon } from "./Icons";
import { buttonPrimary } from "./styles";

type FieldName = "handle" | "email" | "track" | "experience" | "message";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

const initialValues: FormValues = {
  handle: "",
  email: "",
  track: "",
  experience: "",
  message: "",
};

const trackOptions = ["Red Team", "Blue Team", "Both / undecided"];
const experienceOptions = ["New to security", "Some labs or CTFs", "Working professionally"];

const entryPoints = [
  "Curious beginners who want a structured first step",
  "Students running their own labs and home ranges",
  "Working analysts and engineers who want a sparring partner",
  "Researchers who would rather publish than posture",
];

const rules = [
  {
    title: "Authorization first",
    body: "If you do not own it or have written permission, it is out of scope. Full stop.",
  },
  {
    title: "Share what you learn",
    body: "Bring your notes, your failures, and your questions. The debrief is the product.",
  },
  {
    title: "Respect the pack",
    body: "No harassment, no gatekeeping, no leaking targets or member data. Ever.",
  },
];

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const handle = values.handle.trim();
  const email = values.email.trim();

  if (handle.length < 3) {
    errors.handle = "Use at least 3 characters.";
  } else if (!/^[a-zA-Z0-9_.@-]+$/.test(handle)) {
    errors.handle = "Letters, numbers, and _ . @ - only.";
  }

  if (!email) {
    errors.email = "Enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.track) errors.track = "Pick a track.";
  if (!values.experience) errors.experience = "Pick a starting point.";

  return errors;
}

function buildMailto(values: FormValues): string {
  const subject = `[RECRUIT] ${values.handle.trim()} — ${values.track}`;
  const body = [
    `Handle: ${values.handle.trim()}`,
    `Email: ${values.email.trim()}`,
    `Track: ${values.track}`,
    `Experience: ${values.experience}`,
    "",
    "Why I want in:",
    values.message.trim() || "(not provided)",
    "",
    "Sent from the CyberDemons join form.",
  ].join("\n");

  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function Join() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sent) confirmationRef.current?.focus();
  }, [sent]);

  const update = (field: FieldName, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstError = (Object.keys(nextErrors) as FieldName[])[0];
    if (firstError) {
      document.getElementById(`join-${firstError}`)?.focus();
      return;
    }

    window.location.href = buildMailto(values);
    setSent(true);
  };

  const editApplication = () => {
    setSent(false);
    window.requestAnimationFrame(() => document.getElementById("join-handle")?.focus());
  };

  return (
    <section id="join" aria-labelledby="join-title" className="relative overflow-hidden border-t border-white/10 py-20 md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-0 h-[480px] w-[480px] animate-drift rounded-full bg-blood/10 blur-[140px] motion-reduce:animate-none" />
        <div className="absolute -left-32 bottom-0 h-[420px] w-[420px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
        <div className="group relative border border-white/10 bg-ink-800/60 p-6 transition-colors duration-500 hover:border-white/20 sm:p-8">
          <Corners className="text-ice/50" />

          <div className="eyebrow flex items-center gap-3">
            <span className="text-blood-bright">05</span>
            <span aria-hidden="true" className="h-px w-8 origin-left bg-gradient-to-r from-blood/70 to-transparent" />
            <span className="text-fog/80">Recruitment</span>
          </div>

          <h2 id="join-title" className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Join the pack.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-fog">
            Tell us where you are starting from. Submitting opens your email client with everything
            prefilled, so you can review it before it goes anywhere.
          </p>

          {sent ? (
            <div
              ref={confirmationRef}
              role="status"
              aria-live="polite"
              tabIndex={-1}
              className="mt-8 border border-ice/30 bg-ice/[0.05] p-6 motion-safe:animate-scale-in focus:outline-none"
            >
              <span className="flex h-10 w-10 animate-border-pulse items-center justify-center border border-ice/50 text-ice motion-reduce:animate-none">
                <CheckIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-xl font-medium text-white">
                Transmission queued, {values.handle.trim()}.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">
                Your mail client should be open with the application ready to send. Hit send and a mentor
                will get back to you within a few days.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <a
                  href={buildMailto(values)}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-ice underline decoration-ice/30 underline-offset-4 transition-colors hover:decoration-ice"
                >
                  Reopen the email
                </a>
                <button
                  type="button"
                  onClick={editApplication}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
                >
                  Edit application
                </button>
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
                Nothing opened? Email {site.email} directly.
              </p>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="mt-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="join-handle" className="field-label">
                    Handle <span className="text-blood-bright">*</span>
                  </label>
                  <input
                    id="join-handle"
                    name="handle"
                    type="text"
                    autoComplete="nickname"
                    required
                    minLength={3}
                    value={values.handle}
                    onChange={(event) => update("handle", event.target.value)}
                    aria-invalid={Boolean(errors.handle)}
                    aria-describedby={errors.handle ? "join-handle-error" : undefined}
                    placeholder="0xghost"
                    className={`field ${errors.handle ? "field-error" : ""}`}
                  />
                  {errors.handle ? (
                    <p id="join-handle-error" className="mt-1.5 font-mono text-[10px] text-blood-bright">
                      {errors.handle}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="join-email" className="field-label">
                    Email <span className="text-blood-bright">*</span>
                  </label>
                  <input
                    id="join-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={values.email}
                    onChange={(event) => update("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "join-email-error" : undefined}
                    placeholder="you@example.com"
                    className={`field ${errors.email ? "field-error" : ""}`}
                  />
                  {errors.email ? (
                    <p id="join-email-error" className="mt-1.5 font-mono text-[10px] text-blood-bright">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="join-track" className="field-label">
                    Primary track <span className="text-blood-bright">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="join-track"
                      name="track"
                      required
                      value={values.track}
                      onChange={(event) => update("track", event.target.value)}
                      aria-invalid={Boolean(errors.track)}
                      aria-describedby={errors.track ? "join-track-error" : undefined}
                      className={`field appearance-none pr-10 ${errors.track ? "field-error" : ""} ${
                        values.track ? "text-white" : "text-fog/80"
                      }`}
                    >
                      <option value="" disabled className="bg-ink text-fog">
                        Select a track
                      </option>
                      {trackOptions.map((option) => (
                        <option key={option} value={option} className="bg-ink text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog/80" />
                  </div>
                  {errors.track ? (
                    <p id="join-track-error" className="mt-1.5 font-mono text-[10px] text-blood-bright">
                      {errors.track}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="join-experience" className="field-label">
                    Starting point <span className="text-blood-bright">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="join-experience"
                      name="experience"
                      required
                      value={values.experience}
                      onChange={(event) => update("experience", event.target.value)}
                      aria-invalid={Boolean(errors.experience)}
                      aria-describedby={errors.experience ? "join-experience-error" : undefined}
                      className={`field appearance-none pr-10 ${
                        errors.experience ? "field-error" : ""
                      } ${values.experience ? "text-white" : "text-fog/80"}`}
                    >
                      <option value="" disabled className="bg-ink text-fog">
                        Select your level
                      </option>
                      {experienceOptions.map((option) => (
                        <option key={option} value={option} className="bg-ink text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog/80" />
                  </div>
                  {errors.experience ? (
                    <p id="join-experience-error" className="mt-1.5 font-mono text-[10px] text-blood-bright">
                      {errors.experience}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="join-message" className="field-label">
                    What are you chasing? <span className="normal-case tracking-normal text-fog/80">(optional)</span>
                  </label>
                  <textarea
                    id="join-message"
                    name="message"
                    rows={4}
                    value={values.message}
                    onChange={(event) => update("message", event.target.value)}
                    placeholder="A certification, a first CTF, a detection you cannot get right..."
                    className="field resize-y"
                  />
                </div>
              </div>

              <button type="submit" className={`${buttonPrimary} mt-6 w-full`}>
                Send application
                <span aria-hidden="true">→</span>
              </button>

              <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-fog/80">
                No account, no tracking. We only use your details to reply.
              </p>
            </form>
          )}
        </div>

        <aside className="space-y-5">
          <div className="hover-lift border border-white/10 bg-ink-800/40 p-6 transition-colors hover:border-ice/30">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">
              Who we are looking for
            </h3>
            <ul className="mt-4 space-y-3">
              {entryPoints.map((entry) => (
                <li
                  key={entry}
                  className="group/item flex gap-3 text-sm leading-relaxed text-fog transition-colors hover:text-white/90"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ice transition-transform duration-300 group-hover/item:scale-110" />
                  {entry}
                </li>
              ))}
            </ul>
          </div>

          <div className="hover-lift border border-white/10 bg-ink-800/40 p-6 transition-colors hover:border-blood/30">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-blood-bright">
              Rules of engagement
            </h3>
            <ol className="mt-4 space-y-4">
              {rules.map((rule, index) => (
                <li key={rule.title} className="group/rule flex gap-3">
                  <span className="font-mono text-[10px] text-blood-bright transition-transform duration-300 group-hover/rule:scale-110">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white transition-colors group-hover/rule:text-ice">
                      {rule.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-fog">{rule.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="shine-hover hover-lift border border-ice/20 bg-ice/[0.04] p-6 transition-colors hover:border-ice/40">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Direct line</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-2 inline-block break-all text-sm text-white underline decoration-white/20 underline-offset-4 transition-colors hover:text-ice hover:decoration-ice"
            >
              {site.email}
            </a>
            <p className="mt-3 text-xs leading-relaxed text-fog/80">
              Prefer plain email? Send the same details and we will route it to a mentor.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
