"use client";

import { useState } from "react";
import { Card } from "@/components/Card";

export function ChangePasswordButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to change password");
        return;
      }
      reset();
      setOpen(false);
    } catch {
      setError("Failed to change password — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? "mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-ink/60 hover:bg-sand/60 hover:text-ink"}
      >
        Change password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <Card className="w-full max-w-sm">
            <h2 className="font-display text-lg">Change password</h2>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                required
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
              <input
                required
                type="password"
                minLength={8}
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
              <input
                required
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
              {error && <p className="text-xs text-clay">{error}</p>}
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                  disabled={saving}
                  className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-sand/60 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-deep disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Update password"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
