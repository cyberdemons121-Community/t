import { site } from "../data/site";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Mission() {
  return (
    <section id="mission" aria-labelledby="mission-title" className="relative py-20 md:py-28">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading
              id="mission-title"
              index="01"
              kicker="Mission"
              title={
                <>
                  Built by attackers.
                  <br />
                  <span className="text-ice">Kept honest by defenders.</span>
                </>
              }
            />
            <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-fog">
              <p>
                CyberDemons is a community for people who take systems apart to understand them, then put
                them back together harder to break.
              </p>
              <p>
                Red teamers sharpen offense. Blue teamers sharpen defense. Everyone shows up for the
                debrief, where the two sides trade notes and the whole pack gets stronger.
              </p>
              <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-white/70">
                No gatekeeping. No leaked targets. No ego.
              </p>
            </div>
          </div>

          <ul className="space-y-px self-start border-y border-white/10 bg-white/5">
            {site.principles.map((principle, index) => (
              <li key={principle.index}>
                <Reveal delay={index * 90}>
                  <div className="group relative overflow-hidden bg-ink px-6 py-7 transition-all duration-300 hover:bg-ink-800 hover:pl-7 sm:px-8 sm:hover:pl-9">
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 bg-gradient-to-b from-blood via-blood-bright to-ice transition-transform duration-500 group-hover:scale-y-100"
                    />
                    <div className="flex gap-5">
                      <span className="font-mono text-xs text-blood-bright transition-transform duration-300 group-hover:scale-110">
                        {principle.index}
                      </span>
                      <div>
                        <h3 className="text-lg font-medium text-white transition-colors group-hover:text-ice">
                          {principle.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-fog">{principle.body}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
