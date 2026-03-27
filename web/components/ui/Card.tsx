import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
};

export function Card({
  children,
  className = "",
  hover = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-primary/15 bg-surface-alt p-5 shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-[var(--duration-medium)] ease-[var(--ease-out)] motion-safe ${
        hover
          ? "hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-px"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
