import { useEffect, useState } from "react";
import { site, type PageId } from "../data/site";
import { eventLinks } from "../data/events";
import { ArrowUpRightIcon, CloseIcon, MenuIcon } from "./Icons";
import { Logo } from "./Logo";
import { buttonGhost, buttonPrimary } from "./styles";

interface HeaderProps {
  page: PageId;
}

export function Header({ page }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (page !== "home") {
      setActive("");
      return;
    }

    const sections = site.nav
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [page]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };

    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const homeHref = page === "home" ? "#top" : "/";
  const joinHref = page === "home" ? "#join" : "/#join";
  const sectionHref = (href: string) => (page === "home" ? href : `/${href}`);

  const isEventActive = (href: string) => href === `/${page}.html`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open ? "border-white/10 bg-ink/90 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between lg:h-20">
        <a href={homeHref} className="group flex items-center gap-3" aria-label={`${site.name} home`}>
          <Logo className="h-8 w-8 transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="font-display text-sm font-bold tracking-[0.22em] text-white">
            CYBER<span className="text-blood-bright">DEMONS</span>
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-7">
          {site.nav.map((item) => {
            const isActive = page === "home" && active === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                aria-current={isActive ? "true" : undefined}
                className={`group relative font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive ? "text-white" : "text-fog hover:text-white"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-1 left-0 h-px bg-ice transition-all duration-300 ${
                    isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"
                  }`}
                />
              </a>
            );
          })}
          <span aria-hidden="true" className="h-4 w-px bg-white/10" />
          {eventLinks.map((item) => {
            const isActive = isEventActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? item.accent === "red"
                      ? "text-blood-bright"
                      : "text-ice"
                    : "text-fog hover:text-white"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${
                    item.accent === "red" ? "bg-blood" : "bg-ice"
                  } ${isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"}`}
                />
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login.html"
            aria-current={page === "login" ? "page" : undefined}
            className="inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-ice/60 hover:text-ice"
          >
            Login
          </a>
          <a href={joinHref} className={`${buttonPrimary} py-2.5`}>
            Join the pack
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white transition-colors hover:border-ice/50 hover:text-ice lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-ink/95 lg:hidden"
      >
        <nav aria-label="Mobile" className="container-x flex flex-col py-4">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={sectionHref(item.href)}
              onClick={() => setOpen(false)}
              className="border-b border-white/5 py-4 font-display text-lg text-white transition-colors hover:text-ice"
            >
              {item.label}
            </a>
          ))}
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-fog/80">
            Flagship events
          </p>
          {eventLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={isEventActive(item.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`border-b border-white/5 py-4 font-display text-lg transition-colors ${
                isEventActive(item.href)
                  ? item.accent === "red"
                    ? "text-blood-bright"
                    : "text-ice"
                  : "text-white hover:text-ice"
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-5 grid gap-3">
            <a href="/login.html" onClick={() => setOpen(false)} className={`${buttonGhost} w-full`}>
              Login
            </a>
            <a href={joinHref} onClick={() => setOpen(false)} className={`${buttonPrimary} w-full`}>
              Join the pack
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
