import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, className = "" }: PageHeaderProps) {
  return (
    <header className={`space-y-2 ${className}`}>
      <h1 className="font-serif text-3xl font-semibold text-primary-dark">
        {title}
      </h1>
      {description != null && (
        <div className="max-w-2xl text-foreground/70">{description}</div>
      )}
    </header>
  );
}
