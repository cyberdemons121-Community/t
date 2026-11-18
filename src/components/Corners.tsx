interface CornersProps {
  className?: string;
}

export function Corners({ className = "" }: CornersProps) {
  const corner =
    "absolute h-4 w-4 border-current transition-all duration-300 ease-out group-hover:h-5 group-hover:w-5 group-hover:opacity-100";

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${className}`}
    >
      <span className={`${corner} -left-px -top-px border-l border-t`} />
      <span className={`${corner} -right-px -top-px border-r border-t`} />
      <span className={`${corner} -bottom-px -left-px border-b border-l`} />
      <span className={`${corner} -bottom-px -right-px border-b border-r`} />
    </span>
  );
}
