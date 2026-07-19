import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNavItems } from "@/lib/nav";
import { roleLabel } from "@/lib/roleLabel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const items = getNavItems(session.role);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar items={items} userName={session.name} roleLabel={roleLabel(session.role)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          userFirstName={session.name.split(" ")[0]}
          mobileSidebarProps={{
            items,
            userName: session.name,
            roleLabel: roleLabel(session.role),
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
