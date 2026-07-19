import type { Role } from "@/lib/auth";

export type NavItem = { label: string; href: string };

export function getNavItems(role?: Role): NavItem[] {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/admin" },
    { label: "Patients", href: "/admin/patients" },
    { label: "Appointments", href: "/admin/appointments" },
    { label: "Sessions", href: "/admin/sessions" },
    { label: "Billing", href: "/admin/invoices" },
    { label: "Staff & Doctors", href: "/admin/staff" },
    { label: "Attendance", href: "/admin/attendance" },
    { label: "Marketing", href: "/admin/marketing" },
    { label: "Doctor Ratings", href: "/admin/ratings" },
  ];

  // Overall sales/revenue overview is admin-only — staff don't get it.
  if (role === "STAFF") {
    return items.filter((i) => i.href !== "/admin");
  }
  return items;
}
