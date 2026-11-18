import { site, type TrackId } from "../data/site";
import { Corners } from "./Corners";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

interface Accent {
  text: string;
  border: string;
  corner: string;
  bar: string;
  chip: string;
  glow: string;
}

const accents: Record<TrackId, Accent> = {
  red: {
    text: "text-blood-bright",
    border: "hover:border-blood/50",
    corner: "text-blood-bright/60",
    bar: "bg-blood",
    chip: "group-hover:border-blood/40",
    glow: "hover:shadow-glow-red",
  },
  blue: {
    text: "text-ice",
    border: "hover:border-ice/50",
    corner: "text-ice/60",
    bar: "bg-ice",
    chip: "group-hover:border-ice/40",
    glow: "hover:shadow-glow-ice",
  },
};

export function Tracks() {
  return (
    <section id="tracks" aria-labelledby="tracks-title" className="relative py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          id="tracks-title"
          index="02"
          kicker="Two tracks, one pack"
          title={
            <>
              Pick a side. <span className="text-fog/80">Cross-train anyway.</span>
            </>
          }
          description="Every member starts with a primary track, then spends time on the other side. You cannot defend what you have never tried to break."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {site.tracks.map((track, index) => {
            const accent = accents[track.id];
            return (
              <Reveal key={track.id} className="h-full" delay={index * 110}>
                <article
                  className={`shine-hover group relative flex h-full flex-col border border-white/10 bg-gradient-to-b from-ink-800 to-ink p-6 transition-all duration-500 hover:-translate-y-1.5 sm:p-8 ${accent.border} ${accent.glow}`}
                >
                  <Corners className={accent.corner} />
                  <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r ${
                      track.id === "red" ? "from-blood/80 via-blood/30" : "from-ice/80 via-ice/30"
                    } to-transparent transition-transform duration-500 group-hover:scale-x-100`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`font-mono text-[10px] uppercase tracking-[0.28em] ${accent.text}`}>
                      {track.code}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
                      {track.role}
                    </span>
                  </div>

                  <h3 className="mt-6 text-3xl font-semibold tracking-tight">{track.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-fog">{track.description}</p>

                  <div className="mt-7">
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">
                      Focus areas
                    </h4>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {track.focus.map((skill) => (
                        <li
                          key={skill}
                          className={`border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-fog transition-all duration-300 group-hover:-translate-y-0.5 ${accent.chip}`}
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 border-t border-white/10 pt-6">
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">
                      In the lab
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {track.operations.map((operation) => (
                        <li key={operation} className="flex items-start gap-2.5 text-sm text-fog transition-colors group-hover:text-white/80">
                          <span
                            aria-hidden="true"
                            className={`mt-[7px] h-1 w-1 shrink-0 ${accent.bar} transition-transform duration-300 group-hover:scale-150`}
                          />
                          {operation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-6 flex flex-col gap-3 border border-white/10 bg-ink-900/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/80">
              <span className="text-ice">Purple team</span>
              <span aria-hidden="true" className="mx-2 text-white/20">
                //
              </span>
              Where red findings become blue detections.
            </p>
            <a
              href="#events"
              className="group font-mono text-[11px] uppercase tracking-[0.2em] text-fog transition-colors hover:text-ice"
            >
              See the debriefs
              <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
