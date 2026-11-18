import { site, type PageId } from "../data/site";
import { eventLinks } from "../data/events";
import { Logo } from "./Logo";

interface FooterProps {
  page: PageId;
}

export function Footer({ page }: FooterProps) {
  const homeHref = page === "home" ? "#top" : "/";
  const joinHref = page === "home" ? "#join" : "/#join";
  const sectionHref = (href: string) => (page === "home" ? href : `/${href}`);

  return (
    <footer className="border-t border-white/10 bg-ink-900/60">
      <div className="container-x py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <a href={homeHref} className="inline-flex items-center gap-3" aria-label={`${site.name} home`}>
              <Logo className="h-9 w-9" loading="lazy" />
              <span className="font-display text-sm font-bold tracking-[0.22em] text-white">
                CYBER<span className="text-blood-bright">DEMONS</span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog">
              {site.tagline} A cybersecurity community for people who learn by breaking, detecting, and
              documenting.
            </p>
            <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-fog/80">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-blink bg-ice motion-reduce:animate-none" />
              Range status: online
            </p>
          </div>

          <nav aria-label="Footer sections">
            <h2 className="font-mono text-[10px] font-normal uppercase tracking-[0.24em] text-white/70">
              Sections
            </h2>
            <ul className="mt-4 space-y-2.5">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={sectionHref(item.href)}
                    className="inline-block text-sm text-fog transition-all duration-300 hover:translate-x-1 hover:text-ice"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={joinHref}
                  className="inline-block text-sm text-fog transition-all duration-300 hover:translate-x-1 hover:text-ice"
                >
                  Join
                </a>
              </li>
              <li>
                <a
                  href="/login.html"
                  className="inline-block text-sm text-fog transition-all duration-300 hover:translate-x-1 hover:text-ice"
                >
                  Login
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Flagship events">
            <h2 className="font-mono text-[10px] font-normal uppercase tracking-[0.24em] text-white/70">
              Events
            </h2>
            <ul className="mt-4 space-y-2.5">
              {eventLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-block text-sm text-fog transition-all duration-300 hover:translate-x-1 hover:text-ice"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[10px] font-normal uppercase tracking-[0.24em] text-white/70">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="break-all text-sm text-fog transition-colors hover:text-ice"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a href={sectionHref("#faq")} className="text-sm text-fog transition-colors hover:text-ice">
                  Code of conduct
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}?subject=Responsible%20disclosure`}
                  className="text-sm text-fog transition-colors hover:text-ice"
                >
                  Responsible disclosure
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
            © {new Date().getFullYear()} CyberDemons · Hack with permission.
          </p>
          <a
            href={homeHref}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80 transition-colors hover:text-ice"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
