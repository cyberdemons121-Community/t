interface LogoProps {
  className?: string;
  loading?: "eager" | "lazy";
}

export function Logo({ className = "", loading = "eager" }: LogoProps) {
  return (
    <img
      src="/logo-mark-96.png"
      alt=""
      width={96}
      height={96}
      loading={loading}
      decoding="async"
      className={`shrink-0 border border-white/10 object-cover ${className}`}
    />
  );
}
