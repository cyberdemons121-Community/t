import type { ReactNode } from "react";
import type { PageId } from "../data/site";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MouseGlow } from "./MouseGlow";

interface SiteLayoutProps {
  page: PageId;
  children: ReactNode;
}

export function SiteLayout({ page, children }: SiteLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-ice focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-white"
      >
        Skip to content
      </a>

      <Header page={page} />

      <main id="main">{children}</main>

      <Footer page={page} />

      <div
        aria-hidden="true"
        className="noise pointer-events-none fixed inset-0 z-[70] opacity-[0.035]"
      />
      <MouseGlow />
    </div>
  );
}
