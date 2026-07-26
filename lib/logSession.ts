import type { Prisma } from "@prisma/client";

/**
 * Logs one PackageSession against a package, claiming a session slot atomically.
 *
 * Shared by POST /api/sessions (Sessions page) and POST /api/visits (Today
 * screen) so the concurrency-safe claim below isn't copied per caller — copies
 * drift, and this guards a paid-for session count from being oversold.
 * POST /api/sessions/bulk still has its own multi-session variant of the claim.
 *
 * Must be called inside a transaction that has already run setTenantContext.
 * Throws the SESSION_ERRORS keys below; callers map them to HTTP responses via
 * sessionErrorMessage().
 */
export async function logSession(
  tx: Prisma.TransactionClient,
  {
    tenantId,
    patientId,
    packageId,
    doctorId,
    date,
    notes,
  }: {
    tenantId: string;
    patientId: string;
    packageId: string;
    doctorId: string;
    date?: Date;
    notes?: string;
  }
) {
  // Fail closed rather than trusting each caller: a null tenantId would make
  // Prisma drop the filter entirely, turning the lookup below into a
  // cross-tenant read.
  if (!tenantId) throw new Error("NO_TENANT");

  const pkg = await tx.package.findFirst({
    where: { id: packageId, patientId, tenantId, deletedAt: null },
  });
  if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
  if (pkg.status !== "ACTIVE") throw new Error("PACKAGE_NOT_ACTIVE");
  if (pkg.usedSessions >= pkg.totalSessions) throw new Error("PACKAGE_EXHAUSTED");

  // The patientId/packageId pairing above is tenant-verified, but doctorId
  // arrives from the request too and must be checked independently.
  const doctor = await tx.user.findFirst({
    where: { id: doctorId, tenantId, role: "DOCTOR", isActive: true, deletedAt: null },
  });
  if (!doctor) throw new Error("DOCTOR_NOT_FOUND");

  // Atomic claim: literal `lt: pkg.totalSessions` (immutable, never edited
  // elsewhere) means only one of N concurrent requests can win this UPDATE once
  // the package is at capacity — prevents usedSessions from overshooting
  // totalSessions.
  const claim = await tx.package.updateMany({
    where: { id: pkg.id, status: "ACTIVE", usedSessions: { lt: pkg.totalSessions } },
    data: { usedSessions: { increment: 1 } },
  });
  if (claim.count === 0) throw new Error("PACKAGE_EXHAUSTED");

  return tx.packageSession.create({
    data: {
      tenantId,
      patientId,
      packageId,
      doctorId,
      ...(date ? { date } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });
}

export function sessionErrorMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  switch (err.message) {
    case "NO_TENANT":
      return "No clinic on this session";
    case "PACKAGE_EXHAUSTED":
      return "Package has no remaining sessions";
    case "PACKAGE_NOT_ACTIVE":
      return "Package is not active";
    case "PACKAGE_NOT_FOUND":
      return "Package not found";
    case "DOCTOR_NOT_FOUND":
      return "Therapist not found";
    default:
      return null;
  }
}
