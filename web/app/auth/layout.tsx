import Link from "next/link";
import { BackToHome } from "@/components/BackToHome";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-primary/15 bg-background/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <BackToHome />
          <Link href="/app" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_dark.svg" alt="" className="h-8 w-auto" />
            <span className="font-serif text-lg font-semibold text-primary-dark">
              ElderCare
            </span>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
