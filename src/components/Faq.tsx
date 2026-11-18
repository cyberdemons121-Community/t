import { site } from "../data/site";
import { ChevronDownIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-white/10 py-20 md:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <Reveal>
          <SectionHeading
            id="faq-title"
            index="06"
            kicker="FAQ"
            title={
              <>
                Before you <span className="text-blood">knock.</span>
              </>
            }
            description="Short answers to the questions we get on day one."
          />
        </Reveal>

        <div className="border-t border-white/10">
          {site.faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={index * 60}>
              <details className="group border-b border-white/10 transition-colors open:bg-ink-800/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-medium text-white transition-colors hover:text-ice group-open:text-ice [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/10 transition-all duration-300 group-hover:border-ice/40 group-open:border-ice/40 group-open:bg-ice/10">
                    <ChevronDownIcon className="h-4 w-4 text-fog transition-transform duration-300 group-open:rotate-180 group-open:text-ice" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-sm leading-relaxed text-fog motion-safe:animate-fade-up [animation-duration:350ms]">
                  {faq.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
