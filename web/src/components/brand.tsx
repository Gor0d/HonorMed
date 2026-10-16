import { PRODUCT_NAME } from "@/lib/brand";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`honormed-mark ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="19" fill="var(--brand-deep, #123c3a)" />
      <path
        d="M17 16H26V29L38 24V16H47V48H38V34L26 39V48H17V16Z"
        fill="var(--brand-paper, #f8f5ed)"
      />
      <path d="M38 16H47V25L38 29V16Z" fill="var(--brand-gold, #dfb86c)" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-lockup${compact ? " brand-compact" : ""}`}>
      <BrandMark />
      <span className="brand-wordmark">
        {PRODUCT_NAME.slice(0, 5)}
        <span>{PRODUCT_NAME.slice(5)}</span>
        <i aria-hidden="true">.</i>
      </span>
    </span>
  );
}
