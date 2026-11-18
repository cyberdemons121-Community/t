interface SigilProps {
  className?: string;
}

export function Sigil({ className = "" }: SigilProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 2.5 28 9v14l-12 6.5L4 23V9z" className="stroke-blood" />
      <path d="M9.5 10.5c2.8 3.2 3.9 5.8 3.9 8.6" className="stroke-blood" />
      <path d="M22.5 10.5c-2.8 3.2-3.9 5.8-3.9 8.6" className="stroke-ice" />
      <path d="m11.6 21.4 4.4 3.4 4.4-3.4" className="stroke-ice" />
    </svg>
  );
}
