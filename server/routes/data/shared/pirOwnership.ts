export function canOwnPir(
  tokenUser: { id: number; role: string; school_id: number | null },
  pir: {
    created_by_user_id: number | null;
    aip?: { school_id?: number | null } | null;
  },
) {
  if (pir.created_by_user_id != null) {
    return pir.created_by_user_id === tokenUser.id;
  }
  return (
    tokenUser.role === "School" &&
    tokenUser.school_id != null &&
    pir.aip?.school_id === tokenUser.school_id
  );
}
