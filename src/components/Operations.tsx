import { site } from "../data/site";
import { iconMap } from "./Icons";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Operations() {
  return (
    <section id="operations" aria-labelledby="operations-title" className="relative py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          id="operations-title"
          index="03"
          kicker="Operations"
          title="What the pack runs."
          description="A steady rhythm of labs, competitions, and briefings. Show up, pair up, and leave with something you can actually use."
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {site.operations.map((operation, index) => {
            const Icon = iconMap[operation.icon];
            return (
              <Reveal key={operation.title} delay={(index % 3) * 80}>
                <div className="group relative h-full overflow-hidden bg-ink p-6 transition-all duration-500 hover:-translate-y-1 hover:bg-ink-800 sm:p-7">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ice/[0.06] via-transparent to-blood/[0.04] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <div className="relative flex h-10 w-10 items-center justify-center border border-white/15 text-fog transition-all duration-300 group-hover:scale-110 group-hover:border-ice/50 group-hover:text-ice group-hover:shadow-glow-ice">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-3" />
                  </div>
                  <h3 className="relative mt-5 text-lg font-medium text-white transition-colors group-hover:text-ice">
                    {operation.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-fog">{operation.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
