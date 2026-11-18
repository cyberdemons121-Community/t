import type { EventPageData } from "../data/events";
import { site } from "../data/site";
import { CheckIcon, ArrowUpRightIcon } from "./Icons";
import { Corners } from "./Corners";
import { Reveal } from "./Reveal";
import { RegistrationForm } from "./RegistrationForm";
import { SectionHeading } from "./SectionHeading";
import { buttonGhost, buttonPrimary } from "./styles";

interface Accent {
  text: string;
  border: string;
  corner: string;
  chip: string;
  glow: string;
}

const accents: Record<EventPageData["accent"], Accent> = {
  red: {
    text: "text-blood-bright",
    border: "hover:border-blood/50",
    corner: "text-blood-bright/60",
    chip: "border-blood/20 text-white/80",
    glow: "hover:shadow-glow-red",
  },
  blue: {
    text: "text-ice",
    border: "hover:border-ice/50",
    corner: "text-ice/60",
    chip: "border-ice/20 text-white/80",
    glow: "hover:shadow-glow-ice",
  },
};

function EventHero({ event }: { event: EventPageData }) {
  const accent = accents[event.accent];
  const isRed = event.accent === "red";
  const registerLabel =
    event.id === "hackathon" ? "Register your team" : "Register for Main CTF";

  return (
    <section
      id="top"
      aria-labelledby="event-title"
      className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -left-32 top-8 h-[420px] w-[420px] animate-drift rounded-full bg-blood/10 blur-[120px] motion-reduce:animate-none" />
        <div className="absolute -right-24 top-1/3 h-[440px] w-[440px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
        <div
          className={`absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 animate-pulse-glow rounded-full blur-[100px] motion-reduce:animate-none ${
            isRed ? "bg-blood/10" : "bg-ice/10"
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="container-x relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="eyebrow flex flex-wrap items-center gap-3 text-fog motion-safe:animate-fade-up">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 animate-blink motion-reduce:animate-none ${
                  isRed ? "bg-blood" : "bg-ice"
                }`}
              />
              <span className={`${accent.text} animate-flicker motion-reduce:animate-none`}>
                {event.status}
              </span>
              <span aria-hidden="true" className="text-white/20">//</span>
              <span>{event.date}</span>
            </p>

            <p
              className={`mt-8 font-mono text-[11px] uppercase tracking-[0.3em] motion-safe:animate-fade-up motion-safe:animate-delay-100 ${accent.text}`}
            >
              {event.kicker}
            </p>

            <h1
              id="event-title"
              className="mt-4 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.03em] motion-safe:animate-fade-up motion-safe:animate-delay-200"
            >
              {event.title}
            </h1>

            <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/70 motion-safe:animate-fade-up motion-safe:animate-delay-200">
              {event.tagline}
            </p>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-fog motion-safe:animate-fade-up motion-safe:animate-delay-300 md:text-lg">
              {event.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 motion-safe:animate-fade-up motion-safe:animate-delay-400 sm:flex-row sm:flex-wrap">
              <a href="#register" className={`${buttonPrimary} shine-hover`}>
                {registerLabel}
                <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              {event.liveCta ? (
                <a
                  href={event.liveCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonGhost}
                >
                  {event.liveCta.label}
                  <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ) : null}
              <a href="#schedule" className={buttonGhost}>
                See the timeline
              </a>
            </div>

            <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-7 motion-safe:animate-fade-up motion-safe:animate-delay-500 sm:grid-cols-4">
              {event.stats.map((stat, index) => (
                <li
                  key={stat.label}
                  className="group motion-safe:animate-fade-up"
                  style={{ animationDelay: `${520 + index * 70}ms` }}
                >
                  <p className={`font-mono text-lg font-medium tracking-tight text-white transition-colors ${isRed ? "group-hover:text-blood-bright" : "group-hover:text-ice"}`}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase leading-snug tracking-[0.14em] text-fog/80">
                    {stat.label}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] motion-safe:animate-scale-in motion-safe:animate-delay-200">
            <div
              aria-hidden="true"
              className={`absolute -inset-8 animate-pulse-glow rounded-full blur-2xl motion-reduce:animate-none ${
                isRed
                  ? "bg-[radial-gradient(circle,rgba(224,27,46,0.18),transparent_65%)]"
                  : "bg-[radial-gradient(circle,rgba(95,212,230,0.16),transparent_65%)]"
              }`}
            />
            <div className="group relative animate-float-slow motion-reduce:animate-none">
              <Corners className={`z-20 ${accent.corner}`} />
              <div
                className={`relative aspect-[4/5] overflow-hidden border border-white/10 bg-ink-800 transition duration-500 ${
                  isRed ? "glow-ring-red group-hover:border-blood/30" : "glow-ring-ice group-hover:border-ice/30"
                }`}
              >
                <img
                  src="/hero-poster.jpg"
                  alt="CyberDemons demon mask artwork lit in red and cyan against a black background"
                  width={714}
                  height={1280}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"
                />
                <div aria-hidden="true" className="scanlines absolute inset-0 opacity-20 mix-blend-overlay" />
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-24 animate-sweep bg-gradient-to-b from-transparent to-transparent motion-reduce:hidden ${
                    isRed ? "via-blood/20" : "via-ice/20"
                  }`}
                />
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                  <span>EVENT FILE // {event.id}</span>
                  <span className={`flex items-center gap-2 ${accent.text}`}>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 animate-blink motion-reduce:animate-none ${
                        isRed ? "bg-blood" : "bg-ice"
                      }`}
                    />
                    {event.status}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${accent.text}`}>
                    {event.name}
                  </p>
                  <p className="mt-1 flex items-end gap-3">
                    <span className="font-display text-[clamp(4.5rem,11vw,7.5rem)] font-semibold leading-none tracking-[-0.04em] text-white">
                      {event.dateDisplay}
                    </span>
                    <span className="pb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fog/80">
                      {event.month}
                    </span>
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/75">
                    {event.deadline}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
              <span>file: flagship_event</span>
              <span>status: confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EventPageView({ event }: { event: EventPageData }) {
  const accent = accents[event.accent];
  const isHackathon = event.id === "hackathon";

  const briefTitle = isHackathon ? (
    <>
      A deadline with <span className="text-ice">teeth.</span>
    </>
  ) : (
    <>
      A board with <span className="text-blood-bright">teeth.</span>
    </>
  );

  const briefDescription = isHackathon
    ? "You have an idea and a clock. We have reviewers who will read the work."
    : "One day, a finite scoreboard, and more than one way in.";

  const scheduleDescription = isHackathon
    ? "Registration is open now. Submissions close 26 December 2026. Payment verification required for confirmation."
    : "Registration is open now. Main CTF runs 27 December 2026 (solo). Access after payment verification.";

  const tracksKicker = isHackathon ? "Tracks" : "Categories";
  const keyLabel = isHackathon ? "Submission deadline" : "Event day";
  const formatText = isHackathon
    ? "Online · Teams up to 4 · ₹200 per head"
    : "Online · Solo · ₹200 per head";

  const beforeSend = isHackathon
    ? [
        "Every teammate is listed in the registration/project details.",
        "Upload your presentation (PPT/PPTX/PDF) and payment screenshot.",
        "Payment is completed and screenshot is clear/readable.",
        "Contact email and phone details are correct for confirmation.",
      ]
    : [
        "You are registering as a solo participant.",
        "Payment screenshot (₹200) is uploaded and readable.",
        "Contact email and WhatsApp/phone number are correct.",
        "After verification you’ll receive confirmation mail, unique ID, and login credentials.",
      ];

  const claimText = isHackathon ? "Claim your place" : "Reserve your spot";

  return (
    <>
      <EventHero event={event} />

      <section
        id="brief"
        aria-labelledby="brief-title"
        className="relative border-t border-white/10 py-20 md:py-28"
      >
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              id="brief-title"
              index="01"
              kicker="Brief"
              title={briefTitle}
              description={briefDescription}
            />
            <Reveal delay={100}>
              <div className="hover-lift mt-8 border border-white/10 bg-ink-800/50 p-5 transition-colors hover:border-white/20">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">
                  {isHackathon ? "Hard deadline" : "Event day"}
                </p>
                <p className="mt-2 text-lg leading-snug text-white">{event.deadline}</p>
                <p className="mt-2 text-sm text-fog">
                  Entry fee: <span className="text-white">{site.entryFee} {site.entryFeeNote}</span> · Prize pool: <span className="text-white">{site.prizePool}</span>
                </p>
                <a
                  href="#register"
                  className={`group mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${accent.text}`}
                >
                  {claimText}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </Reveal>
          </div>

          <div className="space-y-5 text-base leading-relaxed text-fog">
            {event.brief.map((paragraph) => (
              <Reveal key={paragraph}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
            <Reveal>
              <ul className="grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
                {event.stats.slice(0, 3).map((stat) => (
                  <li key={stat.label}>
                    <p className={`font-mono text-sm font-medium ${accent.text}`}>{stat.value}</p>
                    <p className="mt-1 text-[10px] uppercase leading-snug tracking-[0.14em] text-fog/80">
                      {stat.label}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="tracks" aria-labelledby="tracks-title" className="relative py-20 md:py-28">
        <div className="container-x">
          <SectionHeading
            id="tracks-title"
            index="02"
            kicker={tracksKicker}
            title={event.tracksTitle}
            description={event.tracksDescription}
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {event.tracks.map((track, index) => (
              <Reveal key={track.title} className="h-full" delay={(index % 3) * 80}>
                <article
                  className={`shine-hover group relative flex h-full flex-col border border-white/10 bg-gradient-to-b from-ink-800 to-ink p-6 transition-all duration-500 hover:-translate-y-1.5 sm:p-7 ${accent.border} ${accent.glow}`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r to-transparent transition-transform duration-500 group-hover:scale-x-100 ${
                      event.accent === "red" ? "from-blood/80 via-blood/30" : "from-ice/80 via-ice/30"
                    }`}
                  />
                  <span className={`font-mono text-[10px] uppercase tracking-[0.24em] ${accent.text}`}>
                    {track.code}
                  </span>
                  <h3 className="mt-4 text-xl font-medium text-white transition-colors group-hover:text-ice">
                    {track.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-fog">{track.description}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {track.prompts.map((prompt) => (
                      <li
                        key={prompt}
                        className={`border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-fog transition-all duration-300 group-hover:-translate-y-0.5 ${
                          event.accent === "red"
                            ? "group-hover:border-blood/30 group-hover:text-white/90"
                            : "group-hover:border-ice/30 group-hover:text-white/90"
                        }`}
                      >
                        {prompt}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="schedule"
        aria-labelledby="schedule-title"
        className="relative border-y border-white/10 bg-ink-900/40 py-20 md:py-28"
      >
        <div className="container-x">
          <SectionHeading
            id="schedule-title"
            index="03"
            kicker="Timeline"
            title={event.scheduleTitle}
            description={scheduleDescription}
          />

          <ol className="mt-12 border-t border-white/10">
            {event.schedule.map((item, index) => (
              <li key={`${item.when}-${item.title}`} className="group border-b border-white/10">
                <Reveal delay={index * 70}>
                  <div className="grid gap-3 py-6 transition-all duration-300 group-hover:translate-x-1 sm:grid-cols-[170px_1fr] sm:gap-8 sm:py-7">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 font-mono text-[10px] transition-transform duration-300 group-hover:scale-110 ${accent.text}`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-fog/80 transition-colors group-hover:text-fog">
                        {item.when}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white transition-colors group-hover:text-ice">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fog">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="rules" aria-labelledby="rules-title" className="relative py-20 md:py-28">
        <div className="container-x">
          <SectionHeading
            id="rules-title"
            index="04"
            kicker="Rules"
            title={event.rulesTitle}
            description="Pay the entry fee, upload proof, respect scope, and wait for verification to receive confirmation and credentials."
          />

          <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {event.rules.map((rule, index) => (
              <Reveal key={rule.title} delay={(index % 3) * 70}>
                <div className="group relative h-full overflow-hidden bg-ink p-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 sm:p-7">
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r to-transparent transition-transform duration-500 group-hover:scale-x-100 ${
                      event.accent === "red" ? "from-blood/70 via-blood/20" : "from-ice/70 via-ice/20"
                    }`}
                  />
                  <span
                    className={`font-mono text-[10px] transition-transform duration-300 group-hover:scale-110 ${accent.text}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-base font-medium text-white transition-colors group-hover:text-ice">
                    {rule.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{rule.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="register"
        aria-label="Registration"
        className="relative overflow-hidden border-t border-white/10 py-20 md:py-28"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 top-0 h-[480px] w-[480px] animate-drift rounded-full bg-blood/10 blur-[140px] motion-reduce:animate-none" />
          <div className="absolute -left-32 bottom-0 h-[420px] w-[420px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
        </div>

        <div className="container-x relative grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-12">
          <Reveal>
            <RegistrationForm eventName={event.name} config={event.registration} />
          </Reveal>

          <aside className="space-y-5">
            <Reveal delay={80}>
              <div className="hover-lift border border-white/10 bg-ink-800/40 p-6 transition-colors hover:border-ice/30">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Key details</h3>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">{keyLabel}</dt>
                    <dd className="mt-1 text-lg text-white">{event.date}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">Format</dt>
                    <dd className="mt-1 text-sm text-fog">{formatText}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">Entry fee & prize</dt>
                    <dd className="mt-1 text-sm text-fog">
                      {site.entryFee} {site.entryFeeNote} · Prize pool {site.prizePool}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">Contact</dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${site.email}`}
                        className="break-all text-sm text-white underline decoration-white/20 underline-offset-4 transition-colors hover:text-ice hover:decoration-ice"
                      >
                        {site.email}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="hover-lift border border-white/10 bg-ink-800/40 p-6 transition-colors hover:border-white/20">
                <h3 className={`font-mono text-[10px] uppercase tracking-[0.24em] ${accent.text}`}>
                  Before you submit
                </h3>
                <ul className="mt-4 space-y-3">
                  {beforeSend.map((item) => (
                    <li
                      key={item}
                      className="group/item flex gap-3 text-sm leading-relaxed text-fog transition-colors hover:text-white/90"
                    >
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ice transition-transform duration-300 group-hover/item:scale-110" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {event.liveCta ? (
              <Reveal delay={200}>
                <div className="shine-hover hover-lift border border-ice/20 bg-ice/[0.04] p-6 transition-colors hover:border-ice/40">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ice">Event board</p>
                  <p className="mt-2 text-sm leading-relaxed text-fog">
                    The challenge board lives on its own host. Login credentials are provided after registration and payment verification.
                  </p>
                  <a
                    href={event.liveCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ice underline decoration-white/20 underline-offset-4 transition-colors hover:text-ice-bright hover:decoration-current"
                  >
                    {event.liveCta.label}
                    <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={240}>
              <div className="hover-lift border border-white/10 bg-ink-800/40 p-6 transition-colors hover:border-white/20">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">After verification</h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-fog">
                  <li>• Confirmation mail sent after payment verification</li>
                  <li>• Unique team/individual ID issued</li>
                  <li>• Login credentials provided to access CTF or hackathon updates</li>
                </ul>
                <a href="/login.html" className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ice underline decoration-white/20 underline-offset-4 transition-colors hover:text-ice-bright hover:decoration-current">
                  Go to login <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
