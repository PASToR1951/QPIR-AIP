const PIR_READABLE_ROLES = new Set([
  "Admin",
  "Observer",
  "CES-SGOD",
  "CES-ASDS",
  "CES-CID",
  "Cluster Coordinator",
]);

export function pirReadableWhereFor(
  user: { role: string; cluster_id?: number | null },
) {
  if (user.role === "Cluster Coordinator") {
    return {
      status: { not: "Draft" },
      aip: { school: { cluster_id: user.cluster_id ?? -1 } },
    };
  }

  return { status: { not: "Draft" } };
}

export function canReadPirRecord(
  user: { role: string; cluster_id?: number | null },
  pir: { aip?: { school?: { cluster_id?: number | null } | null } | null },
): boolean {
  if (!PIR_READABLE_ROLES.has(user.role)) return false;
  if (user.role !== "Cluster Coordinator") return true;
  return pir.aip?.school?.cluster_id === user.cluster_id;
}
