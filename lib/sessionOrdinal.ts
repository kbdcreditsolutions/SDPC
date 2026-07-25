type OrdinalInput = { id: string; date: string | Date; createdAt?: string | Date };

/**
 * Package sessions are numbered by chronological order, but bulk-logged
 * sessions can share an identical `date` (and even `createdAt`, since
 * Postgres freezes now() to transaction start) — createdAt then id break
 * the tie deterministically instead of falling back to render-order,
 * which silently inverted the numbering for tied rows.
 */
export function computeSessionOrdinals(sessions: OrdinalInput[]): Map<string, number> {
  const chronological = [...sessions].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const createdDiff =
      new Date(a.createdAt ?? a.date).getTime() - new Date(b.createdAt ?? b.date).getTime();
    if (createdDiff !== 0) return createdDiff;
    return a.id.localeCompare(b.id);
  });
  const ordinal = new Map<string, number>();
  chronological.forEach((s, i) => ordinal.set(s.id, i + 1));
  return ordinal;
}
