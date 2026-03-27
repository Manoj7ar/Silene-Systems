import Link from "next/link";

export function BackToHome() {
  return (
    <Link
      href="/"
      className="motion-safe inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background px-4 text-sm font-medium text-primary-dark shadow-[var(--shadow-card)] transition-[transform,box-shadow,background-color] duration-[var(--duration-short)] hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
    >
      Back to home
    </Link>
  );
}
