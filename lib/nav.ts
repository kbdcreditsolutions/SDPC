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
    { label: "Activity Log", href: "/admin/activity" },
  ];

  // Overall sales/revenue overview is admin-only — staff don't get it.
  // Activity log (who added/edited/deleted what) is CLINIC_ADMIN/SUPER_ADMIN only.
  // Doctor Ratings is hidden until there's a real way to collect ratings —
  // nothing in the app writes a Rating row today, so it always showed 0/5.
  // Page code is untouched; this is reversible the moment collection exists.
  return items.filter((i) => {
    if (i.href === "/admin" && role === "STAFF") return false;
    if (i.href === "/admin/activity" && role !== "CLINIC_ADMIN" && role !== "SUPER_ADMIN") return false;
    if (i.href === "/admin/ratings") return false;
    return true;
  });
}
