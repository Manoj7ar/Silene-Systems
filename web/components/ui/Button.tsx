import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

export const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/90 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]",
  secondary:
    "border-2 border-primary/35 bg-background text-primary-dark hover:bg-primary/10",
  ghost: "text-primary-dark hover:bg-primary/10",
  danger:
    "border-2 border-red-700/40 bg-background text-red-800 hover:bg-red-50",
};

export const sizeClass: Record<Size, string> = {
  md: "min-h-[44px] px-5 py-2.5 text-sm",
  lg: "min-h-[52px] px-8 py-3 text-base",
};

const baseInteractive =
  "motion-safe inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,box-shadow,background-color,border-color,opacity] duration-[var(--duration-short)] ease-[var(--ease-out)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]";

export function buttonClassName(
  options: { variant?: Variant; size?: Size; className?: string } = {}
) {
  const { variant = "primary", size = "md", className = "" } = options;
  return `${baseInteractive} ${variantClass[variant]} ${sizeClass[size]} ${className}`;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={`${buttonClassName({ variant, size })} disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
