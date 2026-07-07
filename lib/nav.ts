export type NavItem = { label: string; href: string };

export function getNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/admin" },
    { label: "Patients", href: "/admin/patients" },
    { label: "Appointments", href: "/admin/appointments" },
    { label: "Billing", href: "/admin/invoices" },
    { label: "Staff & Doctors", href: "/admin/staff" },
    { label: "Attendance", href: "/admin/attendance" },
    { label: "Marketing", href: "/admin/marketing" },
    { label: "Doctor Ratings", href: "/admin/ratings" },
  ];
}
