import { eventPages } from "../data/events";
import { site } from "../data/site";
import { ArrowUpRightIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const featured = [eventPages.hackathon, eventPages.ctf];

export function Events() {
  return (
    <section id="events" aria-labelledby="events-title" className="relative py-20 md:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <div>
            <SectionHeading
              id="events-title"
              index="04"
              kicker="Events"
              title={
                <>
                  The range is always <span className="text-ice">open.</span>
                </>
              }
              description="Recurring sessions, flagship Hackathon (26 Dec) and main CTF (27 Dec 2026). Hackathon entry ₹300 Entry/Team (flat for teams of 1–4). CTF entry ₹200/Head. ₹20,000 prize pool for each."
            />

            <div className="hover-lift mt-8 border border-white/10 bg-ink-800/50 p-5 transition-colors hover:border-ice/30">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">Next intake</p>
              <p className="mt-2 text-base leading-snug text-white">
                Rolling applications. Intro calls every week.
              </p>
              <a
                href="#join"
                className="group mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ice transition-colors hover:text-ice-bright"
              >
                Request an invite
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </Reveal>

        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((event, index) => (
              <Reveal key={event.id} delay={index * 100} className="h-full">
                <a
                  href={event.href}
                  className={`shine-hover group relative flex h-full flex-col border border-white/10 bg-gradient-to-b from-ink-800 to-ink p-5 transition-all duration-500 hover:-translate-y-1.5 ${
                    event.accent === "red"
                      ? "hover:border-blood/50 hover:shadow-glow-red"
                      : "hover:border-ice/50 hover:shadow-glow-ice"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute right-4 top-4 h-1.5 w-1.5 animate-blink motion-reduce:animate-none ${
                      event.accent === "red" ? "bg-blood" : "bg-ice"
                    }`}
                  />
                  <div className="flex items-start justify-between gap-3 pr-4">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                        event.accent === "red" ? "text-blood-bright" : "text-ice"
                      }`}
                    >
                      {event.date}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/80">
                      {event.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium leading-snug text-white transition-colors group-hover:text-ice">
                    {event.cardTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{event.cardDescription}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {event.cardFacts.map((fact) => (
                      <li
                        key={fact}
                        className="border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-fog/80 transition-colors group-hover:border-white/20 group-hover:text-fog"
                      >
                        {fact}
                      </li>
                    ))}
                  </ul>
                  <span
                    className={`mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] ${
                      event.accent === "red" ? "text-blood-bright" : "text-ice"
                    }`}
                  >
                    View event
                    <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>

          <h3 className="mt-10 font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">
            Recurring sessions
          </h3>
          <ul className="mt-4 border-t border-white/10">
            {site.events.map((event, index) => (
              <li key={event.title} className="group border-b border-white/10">
                <Reveal delay={index * 60}>
                  <div className="flex flex-col gap-4 py-5 transition-all duration-300 group-hover:translate-x-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-5">
                      <div className="w-20 shrink-0 border border-white/10 bg-ink-800/60 px-2 py-2 text-center transition-colors group-hover:border-ice/30">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-blood-bright">
                          {event.day}
                        </span>
                        <span className="mt-1 block font-mono text-[9px] tracking-[0.06em] text-fog/80">
                          {event.time}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium leading-snug text-white transition-colors group-hover:text-ice">
                          {event.title}
                        </h3>
                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
                          {event.type}
                          <span aria-hidden="true"> · </span>
                          {event.access}
                        </p>
                      </div>
                    </div>
                    <span
                      aria-hidden="true"
                      className="hidden font-mono text-fog/30 transition-all group-hover:translate-x-1 group-hover:text-ice sm:block"
                    >
                      →
                    </span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-fog/80">
            All times UTC · Session links posted in Discord · Contact: {site.email}
          </p>
        </div>
      </div>
    </section>
  );
}
