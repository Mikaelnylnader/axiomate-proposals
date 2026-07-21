"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/admin/logout-button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/proposals", label: "Proposals" },
  { href: "/clients", label: "Clients" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <img
              src="https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png"
              alt="AxiomateAI"
              className="h-5 object-contain"
            />
          </Link>
          <nav className="flex items-center gap-0.5" aria-label="Main">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-all duration-150 ${
                    active
                      ? "text-foreground bg-accent font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hidden sm:inline">{email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
