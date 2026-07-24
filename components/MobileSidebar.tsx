"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { PulseMark } from "@/components/PulseMark";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";
import { NavItem } from "@/lib/nav";

export function MobileSidebar({
  items,
  userName,
  roleLabel,
}: {
  items: NavItem[];
  userName: string;
  roleLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-ink/70 hover:bg-sand/60 rounded-lg mr-2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex w-64 max-w-sm flex-col bg-cream px-4 py-5 shadow-xl border-r border-sand">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <PulseMark className="h-8 w-8" />
                <div className="leading-tight">
                  <div className="font-display text-base font-medium">Sridatri Physio</div>
                  <div className="font-data text-[9px] uppercase tracking-[0.18em] text-sage">
                    Admin Portal
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-ink/70 hover:bg-sand/60 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
              {items.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-forest text-cream"
                        : "text-ink/70 hover:bg-sand/60 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-sand pt-4">
              <div className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-light font-data text-xs font-semibold text-clay">
                  {userName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-medium">{userName}</div>
                  <div className="text-xs text-ink/70">{roleLabel}</div>
                </div>
              </div>
              <ChangePasswordButton className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-ink/60 hover:bg-sand/60 hover:text-ink" />
              <button
                onClick={signOut}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-ink/60 hover:bg-sand/60 hover:text-ink"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
