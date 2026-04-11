export function buildSubmittedBy(
  user:
    | {
      role?: string | null;
      first_name?: string | null;
      middle_initial?: string | null;
      last_name?: string | null;
      name?: string | null;
      email?: string | null;
    }
    | null
    | undefined,
): string {
  if (!user) return "—";
  if (user.role === "Division Personnel" && user.first_name && user.last_name) {
    const middleInitial = user.middle_initial ? ` ${user.middle_initial}.` : "";
    return `${user.first_name}${middleInitial} ${user.last_name}`;
  }
  return user.name ?? user.email ?? "—";
}
