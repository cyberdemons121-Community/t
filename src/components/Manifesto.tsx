import { Reveal } from "./Reveal";

export function Manifesto() {
  return (
    <section
      aria-label="Manifesto"
      className="relative overflow-hidden border-y border-white/10 bg-ink-900/40 py-16 md:py-20"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 animate-drift rounded-full bg-blood/10 blur-[100px] motion-reduce:animate-none" />
        <div className="absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 animate-drift-reverse rounded-full bg-ice/10 blur-[100px] motion-reduce:animate-none" />
      </div>

      <div className="container-x relative">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog/80">// Manifesto</p>
          <blockquote className="mt-5 max-w-4xl text-2xl font-medium leading-snug sm:text-3xl md:text-4xl">
            &ldquo;Anyone can run a tool. We teach you{" "}
            <span className="text-blood animate-pulse-glow motion-reduce:animate-none">why it works</span>, how to{" "}
            <span className="text-ice animate-pulse-glow motion-reduce:animate-none [animation-delay:400ms]">detect it</span>, and how to stop it next time.&rdquo;
          </blockquote>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">
            The CyberDemons operating principle
          </p>
        </Reveal>
      </div>
    </section>
  );
}
