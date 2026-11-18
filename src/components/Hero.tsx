import { site } from "../data/site";
import { eventPages } from "../data/events";
import { Corners } from "./Corners";
import { ArrowUpRightIcon } from "./Icons";
import { buttonGhost, buttonPrimary } from "./styles";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -left-32 top-8 h-[420px] w-[420px] animate-drift rounded-full bg-blood/10 blur-[120px] motion-reduce:animate-none" />
        <div className="absolute -right-24 top-1/3 h-[440px] w-[440px] animate-drift-reverse rounded-full bg-ice/10 blur-[130px] motion-reduce:animate-none" />
        <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 animate-pulse-glow rounded-full bg-blood/10 blur-[90px] motion-reduce:animate-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="container-x relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="eyebrow flex flex-wrap items-center gap-3 text-fog motion-safe:animate-fade-up">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-blink bg-blood motion-reduce:animate-none"
              />
              <span className="animate-flicker text-ice motion-reduce:animate-none">CyberDemons</span>
              <span aria-hidden="true" className="text-white/20">
                //
              </span>
              <span>Security collective</span>
            </p>

            <h1
              id="hero-title"
              className="mt-6 text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.92] tracking-[-0.03em] motion-safe:animate-fade-up motion-safe:animate-delay-100"
            >
              We break systems.
              <span className="mt-1 block">
                Then we <span className="text-blood">harden</span> them.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-fog motion-safe:animate-fade-up motion-safe:animate-delay-200 md:text-lg">
              A community for red teamers and blue teamers who learn by doing. Offense, defense, and the
              debrief that makes both sharper. Authorized targets only.
            </p>

            <div className="mt-8 flex flex-col gap-3 motion-safe:animate-fade-up motion-safe:animate-delay-300 sm:flex-row sm:flex-wrap">
              <a
                href={`${eventPages.hackathon.href}#register`}
                className={`${buttonPrimary} shine-hover`}
              >
                Register for Hackathon
                <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href={`${eventPages.ctf.href}#register`} className={buttonGhost}>
                Register for CTF
                <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80 motion-safe:animate-fade-up motion-safe:animate-delay-300">
              <a
                href="#join"
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-white"
              >
                Join the pack
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
              <a
                href="#tracks"
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-ice"
              >
                Explore the tracks
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
              <a
                href="#flagship"
                className="group inline-flex items-center gap-1.5 transition-colors hover:text-blood-bright"
              >
                Event briefing
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </div>

            <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-7 motion-safe:animate-fade-up motion-safe:animate-delay-400 sm:grid-cols-4">
              {site.stats.map((stat, index) => (
                <li
                  key={stat.label}
                  className="group motion-safe:animate-fade-up"
                  style={{ animationDelay: `${450 + index * 80}ms` }}
                >
                  <p className="font-mono text-lg font-medium tracking-tight text-white transition-colors group-hover:text-ice">
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
              className="absolute -inset-8 animate-pulse-glow rounded-full bg-[radial-gradient(circle,rgba(224,27,46,0.16),transparent_65%)] blur-2xl motion-reduce:animate-none"
            />
            <div className="group relative animate-float-slow motion-reduce:animate-none">
              <Corners className="z-20 text-ice/60 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="glow-ring-ice relative aspect-[4/5] overflow-hidden border border-white/10 bg-ink-800 transition duration-500 group-hover:border-ice/30">
                <img
                  src="/hero-poster.jpg"
                  alt="CyberDemons artwork: a demon mask lit in red and cyan against a black background"
                  width={714}
                  height={1280}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/85 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="scanlines absolute inset-0 opacity-20 mix-blend-overlay"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-24 animate-sweep bg-gradient-to-b from-transparent via-ice/20 to-transparent motion-reduce:hidden"
                />

                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                  <span>SIG // 01</span>
                  <span className="flex items-center gap-2 text-ice">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 animate-blink bg-ice motion-reduce:animate-none"
                    />
                    live feed
                  </span>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog/80">
                    one pack // two fronts
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tracking-[0.02em] text-white">
                    RED <span className="text-blood">/</span> BLUE
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
              <span>artifact: demon_mask</span>
              <span>exif: stripped</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
