import { site } from "../data/site";

export function Ticker() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-ink-900/70 py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink-900 to-transparent sm:w-24"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink-900 to-transparent sm:w-24"
      />
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex items-center">
            {site.ticker.map((item) => (
              <li
                key={`${copy}-${item}`}
                className="flex items-center gap-6 px-6 font-mono text-[10px] uppercase tracking-[0.28em] text-fog/80 transition-colors hover:text-white sm:text-[11px]"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-1 shrink-0 animate-blink bg-blood motion-reduce:animate-none"
                />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
