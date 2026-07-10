import { MobileSidebar } from "@/components/MobileSidebar";
import { NavItem } from "@/lib/nav";

export function TopBar({
  userFirstName,
  mobileSidebarProps,
}: {
  userFirstName: string;
  mobileSidebarProps: { items: NavItem[]; userName: string; roleLabel: string };
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between border-b border-sand px-4 md:px-8 py-4">
      <div className="flex items-center">
        <MobileSidebar {...mobileSidebarProps} />
        <p className="text-sm text-ink/60">
          Welcome back, <span className="font-medium text-ink">{userFirstName}</span>
        </p>
      </div>
      <p className="font-data text-xs text-ink/40">{today}</p>
    </div>
  );
}
