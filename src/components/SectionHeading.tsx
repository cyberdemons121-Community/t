import type { ReactNode } from "react";

interface SectionHeadingProps {
  id?: string;
  index: string;
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}

export function SectionHeading({
  id,
  index,
  kicker,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div
        className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] ${
          centered ? "justify-center" : ""
        }`}
      >
        <span className="text-blood-bright">{index}</span>
        <span
          className="h-px w-8 origin-left bg-gradient-to-r from-blood/70 via-white/30 to-transparent motion-safe:animate-[fade-in_0.8s_ease-out_0.1s_both]"
          aria-hidden="true"
        />
        <span className="text-fog/80">{kicker}</span>
      </div>
      <h2
        id={id}
        className="mt-5 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl"
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-5 text-base leading-relaxed text-fog md:text-lg ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
