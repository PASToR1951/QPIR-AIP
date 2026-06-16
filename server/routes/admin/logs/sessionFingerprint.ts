const POSTGRES_INT_MAX = 2_147_483_647;

export function buildSessionFingerprint(sessionHash: string): number {
  const raw = parseInt(sessionHash.slice(0, 8), 16);
  if (!Number.isFinite(raw)) return 0;
  if (raw <= 0) return 1;
  return (raw % POSTGRES_INT_MAX) || 1;
}
