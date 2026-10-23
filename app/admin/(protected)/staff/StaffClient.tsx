"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/Card";
import { FloatingInput, FloatingSelect } from "@/components/FloatingField";
import {
  UserPlus,
  Key,
  Pencil,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  Search,
  Building2,
  Shield,
  Stethoscope,
  UserCheck,
  UserX,
  AlertCircle,
  Mail,
  Lock,
} from "lucide-react";

export type StaffUser = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  specialty: string | null;
  title: string | null;
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
  hasPassword: boolean;
  createdAt?: string;
};

export type BranchOption = {
  id: string;
  name: string;
  city: string | null;
};

interface StaffClientProps {
  initialUsers: StaffUser[];
  branches?: BranchOption[];
  currentUserId?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function generateSecurePassword() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Sdpc@${num}`;
}

export default function StaffClient({ initialUsers, branches = [], currentUserId }: StaffClientProps) {
  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [branchList, setBranchList] = useState<BranchOption[]>(branches);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "DOCTOR" | "STAFF" | "CLINIC_ADMIN" | "INACTIVE">("ALL");

  // Inline Add Form toggle
  const [showAddForm, setShowAddForm] = useState(false);

  // Modals for actions
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<StaffUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<StaffUser | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR" as "DOCTOR" | "STAFF" | "CLINIC_ADMIN",
    specialty: "Physiotherapist",
    title: "",
    branchId: "",
    hasAccess: true,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "DOCTOR" as "DOCTOR" | "STAFF" | "CLINIC_ADMIN",
    specialty: "",
    title: "",
    branchId: "",
    hasAccess: true,
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feedback toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.users)) setUsers(data.users);
      if (Array.isArray(data.branches)) setBranchList(data.branches);
    } catch {
      // ignore reload error
    }
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = users;

    if (activeTab === "INACTIVE") {
      list = list.filter((u) => !u.isActive);
    } else if (activeTab !== "ALL") {
      list = list.filter((u) => u.role === activeTab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.specialty && u.specialty.toLowerCase().includes(q)) ||
          (u.branchName && u.branchName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [users, activeTab, search]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      doctors: users.filter((u) => u.role === "DOCTOR").length,
      staff: users.filter((u) => u.role === "STAFF").length,
      admins: users.filter((u) => u.role === "CLINIC_ADMIN").length,
      inactive: users.filter((u) => !u.isActive).length,
    };
  }, [users]);

  // Open Edit Modal
  function handleOpenEdit(u: StaffUser) {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email || "",
      role: (u.role as "DOCTOR" | "STAFF" | "CLINIC_ADMIN") || "STAFF",
      specialty: u.specialty || "",
      title: u.title || "",
      branchId: u.branchId || "",
      hasAccess: !!u.email,
      isActive: u.isActive,
    });
  }

  // Open Password Modal
  function handleOpenPassword(u: StaffUser) {
    setPasswordModalUser(u);
    setNewPassword(generateSecurePassword());
    setShowPassword(true);
    setCopied(false);
  }

  // Handle Add Form Submission
  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          role: addForm.role,
          specialty: addForm.role === "DOCTOR" ? addForm.specialty : undefined,
          title: addForm.title || undefined,
          branchId: addForm.branchId || null,
          hasAccess: addForm.hasAccess,
          email: addForm.hasAccess ? addForm.email : "",
          password: addForm.hasAccess ? addForm.password : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to add team member", "error");
        return;
      }

      showToast(`Added ${data.user.name} successfully!`, "success");
      setAddForm({
        name: "",
        email: "",
        password: generateSecurePassword(),
        role: "DOCTOR",
        specialty: "Physiotherapist",
        title: "",
        branchId: "",
        hasAccess: true,
      });
      setShowAddForm(false);
      load();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // Handle Edit Submission
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${editingUser.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          role: editForm.role,
          specialty: editForm.role === "DOCTOR" ? editForm.specialty : null,
          title: editForm.title || null,
          branchId: editForm.branchId || null,
          isActive: editForm.isActive,
          hasAccess: editForm.hasAccess,
          email: editForm.hasAccess ? editForm.email : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update member", "error");
        return;
      }

      showToast(`Updated details for ${data.user.name}`, "success");
      setEditingUser(null);
      load();
    } catch {
      showToast("Network error while updating. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // Handle Password Reset Submission
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!newPassword || newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${passwordModalUser.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to assign password", "error");
        return;
      }

      showToast(`New password assigned to ${passwordModalUser.name}!`, "success");
      setPasswordModalUser(null);
      load();
    } catch {
      showToast("Failed to assign password. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // Handle Toggle Active
  async function toggleActive(u: StaffUser) {
    try {
      const nextActive = !u.isActive;
      const res = await fetch(`/api/staff/${u.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to change status", "error");
        return;
      }
      showToast(nextActive ? `${u.name} activated` : `${u.name} deactivated`, "success");
      load();
    } catch {
      showToast("Network error while toggling status", "error");
    }
  }

  // Handle Delete User
  async function handleDeleteSubmit() {
    if (!deletingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${deletingUser.id}/`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to delete user", "error");
        return;
      }
      showToast(`${deletingUser.name} deleted successfully`, "success");
      setDeletingUser(null);
      load();
    } catch {
      showToast("Network error. Could not delete user.", "error");
    } finally {
      setSaving(false);
    }
  }

  function copyPasswordToClipboard() {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-sand bg-forest px-4 py-3 text-cream shadow-xl transition-all">
          {toast.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-amber-300 shrink-0" />
          ) : (
            <Check className="h-5 w-5 text-emerald-300 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 rounded-full p-1 text-cream/70 hover:bg-white/10 hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Staff &amp; Doctors</h1>
          <p className="mt-1 text-sm text-ink/60">
            Manage clinic team members, grant dashboard access, assign passwords, and configure roles.
          </p>
        </div>
        <button
          onClick={() => {
            if (!showAddForm) {
              setAddForm({
                name: "",
                email: "",
                password: generateSecurePassword(),
                role: "DOCTOR",
                specialty: "Physiotherapist",
                title: "",
                branchId: "",
                hasAccess: true,
              });
              setShowAddForm(true);
            } else {
              setShowAddForm(false);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-cream shadow-sm hover:bg-forest-deep transition focus:ring-2 focus:ring-forest/40 focus:outline-none"
        >
          <UserPlus className="h-4 w-4" />
          {showAddForm ? "Close Form" : "+ Add Team Member"}
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* INLINE ADD TEAM MEMBER FORM (Redesigned & Clean) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showAddForm && (
        <Card className="border border-sand bg-white/90 shadow-sm p-6 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-sand/40">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-forest/10 p-2 text-forest">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Add New Team Member</h2>
                <p className="text-xs text-ink/60">Register a doctor, clinic admin, or staff member</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-full p-1.5 text-ink/50 hover:bg-sand/60 hover:text-ink transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                required
                label="Full name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />

              <FloatingSelect
                label="Role"
                value={addForm.role}
                onChange={(e) => {
                  const r = e.target.value as "DOCTOR" | "STAFF" | "CLINIC_ADMIN";
                  setAddForm({
                    ...addForm,
                    role: r,
                    hasAccess: r === "CLINIC_ADMIN" ? true : addForm.hasAccess,
                    specialty: r === "DOCTOR" ? (addForm.specialty || "Physiotherapist") : "",
                  });
                }}
              >
                <option value="DOCTOR">Doctor / Physiotherapist</option>
                <option value="STAFF">Staff / Front Desk</option>
                <option value="CLINIC_ADMIN">Clinic Admin</option>
              </FloatingSelect>

              {addForm.role === "DOCTOR" && (
                <FloatingInput
                  label="Specialty (e.g. Physiotherapist)"
                  value={addForm.specialty}
                  onChange={(e) => setAddForm({ ...addForm, specialty: e.target.value })}
                />
              )}

              <FloatingSelect
                label="Branch"
                value={addForm.branchId}
                onChange={(e) => setAddForm({ ...addForm, branchId: e.target.value })}
              >
                <option value="">All / Both Branches</option>
                {branchList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.city ? `(${b.city})` : ""}
                  </option>
                ))}
              </FloatingSelect>
            </div>

            {/* Dashboard Login Access Card */}
            <div className="rounded-xl border border-sand bg-sand/20 p-4 space-y-3">
              <label className="flex items-center gap-2.5 text-sm font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.hasAccess}
                  disabled={addForm.role === "CLINIC_ADMIN"}
                  onChange={(e) => setAddForm({ ...addForm, hasAccess: e.target.checked })}
                  className="h-4 w-4 rounded border-sand text-forest focus:ring-forest cursor-pointer"
                />
                <span>Grant dashboard login access</span>
              </label>

              {!addForm.hasAccess ? (
                <p className="text-xs text-ink/65 leading-relaxed">
                  No login credentials needed. This records their name so sessions, attendance, and
                  appointments can be assigned to them.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <FloatingInput
                    required
                    type="email"
                    label="Login Email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-ink/60">Temporary Password</label>
                      <button
                        type="button"
                        onClick={() => setAddForm({ ...addForm, password: generateSecurePassword() })}
                        className="text-[11px] font-medium text-forest hover:underline"
                      >
                        Generate random
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        required
                        type={showAddPassword ? "text" : "password"}
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        className="w-full rounded-lg border border-sand bg-white px-3 py-2 pr-12 text-sm text-ink outline-none focus:outline-none focus:ring-1 focus:ring-forest font-data"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink text-xs p-1"
                      >
                        {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50 shadow-sm transition"
              >
                {saving ? "Saving…" : "Save member"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-ink/60 hover:bg-sand/60 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-sand/30 border border-sand/50 text-xs">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "ALL" ? "bg-forest text-cream shadow-xs" : "text-ink/70 hover:text-ink hover:bg-sand/60"
            }`}
          >
            All <span className="ml-1 opacity-75">({counts.all})</span>
          </button>
          <button
            onClick={() => setActiveTab("DOCTOR")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "DOCTOR" ? "bg-forest text-cream shadow-xs" : "text-ink/70 hover:text-ink hover:bg-sand/60"
            }`}
          >
            Doctors / Physios <span className="ml-1 opacity-75">({counts.doctors})</span>
          </button>
          <button
            onClick={() => setActiveTab("STAFF")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "STAFF" ? "bg-forest text-cream shadow-xs" : "text-ink/70 hover:text-ink hover:bg-sand/60"
            }`}
          >
            Staff <span className="ml-1 opacity-75">({counts.staff})</span>
          </button>
          <button
            onClick={() => setActiveTab("CLINIC_ADMIN")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "CLINIC_ADMIN"
                ? "bg-forest text-cream shadow-xs"
                : "text-ink/70 hover:text-ink hover:bg-sand/60"
            }`}
          >
            Clinic Admins <span className="ml-1 opacity-75">({counts.admins})</span>
          </button>
          {counts.inactive > 0 && (
            <button
              onClick={() => setActiveTab("INACTIVE")}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                activeTab === "INACTIVE"
                  ? "bg-forest text-cream shadow-xs"
                  : "text-ink/70 hover:text-ink hover:bg-sand/60"
              }`}
            >
              Inactive <span className="ml-1 opacity-75">({counts.inactive})</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, specialty…"
            className="w-full rounded-xl border border-sand bg-white/80 pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-ink/60 text-sm">No team members match your filter.</p>
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setActiveTab("ALL");
              }}
              className="mt-3 text-xs font-medium text-forest hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u) => {
            const isSelf = u.id === currentUserId;
            const roleBadge =
              u.role === "CLINIC_ADMIN"
                ? { label: "Clinic Admin", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" }
                : u.role === "DOCTOR"
                ? { label: "Doctor / Physio", bg: "bg-teal-100 text-teal-800 border-teal-200" }
                : { label: "Staff", bg: "bg-amber-100 text-amber-800 border-amber-200" };

            return (
              <Card
                key={u.id}
                className={`flex flex-col justify-between transition-all hover:shadow-md ${
                  !u.isActive ? "opacity-60 bg-slate-50/70" : ""
                }`}
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-data text-sm font-semibold shadow-xs ${
                          u.role === "CLINIC_ADMIN"
                            ? "bg-forest text-cream"
                            : u.role === "DOCTOR"
                            ? "bg-teal-600 text-white"
                            : "bg-sand text-ink"
                        }`}
                      >
                        {initials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-ink text-sm truncate" title={u.name}>
                            {u.name}
                          </h3>
                          {isSelf && (
                            <span className="rounded-full bg-forest/10 px-1.5 py-0.2 text-[10px] font-medium text-forest">
                              You
                            </span>
                          )}
                        </div>
                        {u.specialty && (
                          <p className="text-xs text-ink/70 truncate" title={u.specialty}>
                            {u.specialty}
                          </p>
                        )}
                        {u.branchName && (
                          <p className="flex items-center gap-1 text-[11px] text-ink/60 mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {u.branchName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Badges / Meta */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${roleBadge.bg}`}
                    >
                      {u.role === "CLINIC_ADMIN" ? (
                        <Shield className="h-3 w-3" />
                      ) : u.role === "DOCTOR" ? (
                        <Stethoscope className="h-3 w-3" />
                      ) : null}
                      {roleBadge.label}
                    </span>

                    {u.email ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink/70 bg-sand/40 rounded-md px-2 py-0.5 truncate max-w-full">
                        <Mail className="h-3 w-3 shrink-0 text-ink/40" />
                        <span className="truncate">{u.email}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink/50 bg-sand/20 rounded-md px-2 py-0.5 italic">
                        <Lock className="h-3 w-3 shrink-0 text-ink/30" />
                        No login access
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-sand/40 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    {/* Edit Details */}
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-ink/75 hover:bg-sand/70 hover:text-ink transition"
                      title="Edit member details"
                    >
                      <Pencil className="h-3.5 w-3.5 text-ink/60" />
                      Edit
                    </button>

                    {/* Assign/Reset Password */}
                    <button
                      onClick={() => handleOpenPassword(u)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-forest hover:bg-forest/10 transition"
                      title="Assign or reset dashboard password"
                    >
                      <Key className="h-3.5 w-3.5" />
                      Password
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Active */}
                    <button
                      onClick={() => toggleActive(u)}
                      className="p-1.5 rounded-lg text-ink/60 hover:text-ink hover:bg-sand/60 transition"
                      title={u.isActive ? "Deactivate member" : "Activate member"}
                    >
                      {u.isActive ? (
                        <UserX className="h-3.5 w-3.5 text-amber-700" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                    </button>

                    {/* Delete Member */}
                    <button
                      disabled={isSelf}
                      onClick={() => setDeletingUser(u)}
                      className={`p-1.5 rounded-lg transition ${
                        isSelf
                          ? "opacity-30 cursor-not-allowed text-ink/30"
                          : "text-red-500 hover:text-red-700 hover:bg-red-50"
                      }`}
                      title={isSelf ? "You cannot delete your own account" : "Delete member"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EDIT MEMBER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-sand">
            <div className="flex items-center justify-between pb-3 border-b border-sand/40">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-forest/10 p-2 text-forest">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Edit Team Member</h2>
                  <p className="text-xs text-ink/60">{editingUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-full p-1.5 text-ink/50 hover:bg-sand/60 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <FloatingInput
                required
                label="Full Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingSelect
                  label="Role"
                  value={editForm.role}
                  onChange={(e) => {
                    const r = e.target.value as "DOCTOR" | "STAFF" | "CLINIC_ADMIN";
                    setEditForm({
                      ...editForm,
                      role: r,
                      hasAccess: r === "CLINIC_ADMIN" ? true : editForm.hasAccess,
                      specialty: r === "DOCTOR" ? (editForm.specialty || "Physiotherapist") : "",
                    });
                  }}
                >
                  <option value="DOCTOR">Doctor / Physiotherapist</option>
                  <option value="STAFF">Staff / Front Desk</option>
                  <option value="CLINIC_ADMIN">Clinic Admin</option>
                </FloatingSelect>

                <FloatingSelect
                  label="Branch"
                  value={editForm.branchId}
                  onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                >
                  <option value="">All / Both Branches</option>
                  {branchList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.city ? `(${b.city})` : ""}
                    </option>
                  ))}
                </FloatingSelect>
              </div>

              {editForm.role === "DOCTOR" && (
                <FloatingInput
                  label="Specialty (e.g. Physiotherapist)"
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                />
              )}

              {/* Status toggle */}
              <div className="flex items-center justify-between rounded-xl border border-sand bg-sand/20 px-3.5 py-3">
                <div>
                  <p className="text-xs font-semibold text-ink">Account Status</p>
                  <p className="text-[11px] text-ink/60">
                    {editForm.isActive ? "Active member (can log in and be assigned to patients)" : "Inactive member"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    editForm.isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-300 text-slate-800"
                  }`}
                >
                  {editForm.isActive ? "Active" : "Inactive"}
                </button>
              </div>

              {/* Login Access & Email */}
              <div className="rounded-xl border border-sand bg-sand/20 p-3.5 space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.hasAccess}
                    disabled={editForm.role === "CLINIC_ADMIN"}
                    onChange={(e) => setEditForm({ ...editForm, hasAccess: e.target.checked })}
                    className="h-4 w-4 rounded border-sand text-forest focus:ring-forest cursor-pointer"
                  />
                  <span>Dashboard Login Access</span>
                </label>

                {editForm.hasAccess && (
                  <FloatingInput
                    required
                    type="email"
                    label="Login Email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-ink/65">
                  <span>Need to reset their password?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const u = editingUser;
                      setEditingUser(null);
                      handleOpenPassword(u);
                    }}
                    className="font-medium text-forest hover:underline"
                  >
                    Open Password Reset →
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-sand/40">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={saving}
                  className="rounded-xl px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50 shadow-sm"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ASSIGN / RESET PASSWORD MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-sand">
            <div className="flex items-center justify-between pb-3 border-b border-sand/40">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-forest/10 p-2 text-forest">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Assign / Reset Password</h2>
                  <p className="text-xs text-ink/60">{passwordModalUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="rounded-full p-1.5 text-ink/50 hover:bg-sand/60 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!passwordModalUser.email ? (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
                <p className="font-medium">This member does not have an email address yet.</p>
                <p>An email is required for logging into the dashboard. Please edit this member and add an email first.</p>
                <button
                  onClick={() => {
                    const u = passwordModalUser;
                    setPasswordModalUser(null);
                    handleOpenEdit(u);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 text-white px-3 py-1.5 font-medium hover:bg-amber-900"
                >
                  <Pencil className="h-3 w-3" />
                  Add Email Address
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                <div className="rounded-xl bg-sand/20 border border-sand/60 p-3 text-xs text-ink/80 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Account:</span>
                    <span className="font-semibold">{passwordModalUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Email:</span>
                    <span className="font-data font-medium">{passwordModalUser.email}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-ink">New Password</label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateSecurePassword())}
                      className="text-xs font-medium text-forest hover:underline"
                    >
                      Generate another
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 pr-20 text-sm text-ink outline-none focus:outline-none focus:ring-1 focus:ring-forest font-data tracking-wide"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={copyPasswordToClipboard}
                        className="p-1 rounded-md text-ink/50 hover:text-ink hover:bg-sand/60"
                        title="Copy password"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded-md text-ink/50 hover:text-ink hover:bg-sand/60"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {copied && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">Copied to clipboard!</p>
                  )}
                </div>

                <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-3 text-xs text-blue-900 leading-relaxed">
                  💡 Once saved, share this temporary password with <strong>{passwordModalUser.name}</strong>. They can log in immediately and can update it anytime from their dashboard.
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-sand/40">
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    disabled={saving}
                    className="rounded-xl px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-50 shadow-sm"
                  >
                    {saving ? "Saving…" : "Save New Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DELETE MEMBER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-sand">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-sand/40">
              <div className="rounded-xl bg-red-100 p-2">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Delete Team Member</h2>
                <p className="text-xs text-ink/60">Remove member from clinic roster</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-ink/80 leading-relaxed">
              <p>
                Are you sure you want to delete <strong>{deletingUser.name}</strong> ({deletingUser.email || "No email"})?
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 space-y-1">
                <p className="font-semibold">What happens after deletion:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>They will immediately lose dashboard login access.</li>
                  <li>They will no longer appear in active staff rosters or attendance sheets.</li>
                  <li>Historical appointments, clinical notes, and session logs remain safely preserved for audit.</li>
                  <li>Their email address will be released and can be re-registered if needed in the future.</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-sand/40">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={saving}
                className="rounded-xl px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={saving}
                className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
              >
                {saving ? "Deleting…" : "Yes, Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
