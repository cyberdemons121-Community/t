import { eventPages } from "../data/events";
import { site } from "../data/site";
import { ArrowUpRightIcon, CheckIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { buttonGhost, buttonPrimary } from "./styles";

const flagship = [eventPages.hackathon, eventPages.ctf];

const accents = {
  blue: {
    text: "text-ice",
    border: "hover:border-ice/50 hover:shadow-glow-ice",
    chip: "border-ice/20",
    dot: "bg-ice",
  },
  red: {
    text: "text-blood-bright",
    border: "hover:border-blood/50 hover:shadow-glow-red",
    chip: "border-blood/20",
    dot: "bg-blood",
  },
} as const;

export function FlagshipEvents() {
  return (
    <section
      id="flagship"
      aria-labelledby="flagship-title"
      className="relative overflow-hidden py-20 md:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-12 h-[360px] w-[360px] animate-drift rounded-full bg-blood/10 blur-[130px] motion-reduce:animate-none" />
        <div className="absolute -right-24 bottom-0 h-[360px] w-[360px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative">
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow text-fog/80">
                <span aria-hidden="true" className="text-blood-bright">
                  //
                </span>{" "}
                Flagship events 2026
              </p>
              <h2
                id="flagship-title"
                className="mt-5 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl"
              >
                Two events. One <span className="text-blood">pack</span>.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-fog md:text-lg">
                The Hackathon builds, the CTF breaks. Hackathon entry is {eventPages.hackathon.entryFeeLabel}
                (flat for teams of 1–4); CTF entry is {eventPages.ctf.entryFeeLabel}. Both have a {site.prizePool} prize pool.
                Register, pay, and upload your payment screenshot — we verify and send your confirmation,
                unique ID, and login credentials.
              </p>
            </div>
            <a
              href="#events"
              className="group inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ice transition-colors hover:text-ice-bright"
            >
              All events
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {flagship.map((event, index) => {
            const accent = accents[event.accent];
            const isHackathon = event.id === "hackathon";

            return (
              <Reveal key={event.id} delay={index * 120} className="h-full">
                <article
                  className={`group relative flex h-full flex-col border border-white/10 bg-gradient-to-b from-ink-800 to-ink p-6 transition-all duration-500 hover:-translate-y-1 sm:p-7 ${accent.border}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] ${accent.text}`}>
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 animate-blink motion-reduce:animate-none ${accent.dot}`}
                      />
                      {event.kicker}
                    </p>
                    <span
                      className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-fog ${accent.chip}`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold leading-snug text-white sm:text-2xl">
                    {event.name}
                  </h3>
                  <p className={`mt-2 font-mono text-[11px] uppercase tracking-[0.16em] ${accent.text}`}>
                    {event.tagline}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-fog">{event.description}</p>

                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-5">
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog/70">Date</dt>
                      <dd className="mt-1 text-sm font-medium text-white">{event.date}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog/70">Format</dt>
                      <dd className="mt-1 text-sm font-medium text-white">
                        {isHackathon ? "Teams 1–4" : "Solo"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog/70">Entry</dt>
                      <dd className="mt-1 text-sm font-medium text-white">
                        {event.entryFeeLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog/70">
                        Prize pool
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-white">{site.prizePool}</dd>
                    </div>
                  </dl>

                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-fog/80">
                    <CheckIcon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accent.text}`} />
                    <span>{event.deadline}</span>
                  </p>

                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    <a href={`${event.href}#register`} className={buttonPrimary}>
                      Register for {isHackathon ? "Hackathon" : "CTF"}
                      <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                    <a href={event.href} className={buttonGhost}>
                      Event details
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
