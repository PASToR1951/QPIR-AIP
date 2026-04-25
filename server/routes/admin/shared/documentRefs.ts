import { safeParseInt } from "../../../lib/safeParseInt.ts";

const NUMERIC_REF_RE = /^\d+$/;

export function documentWhereFromRef(ref: string | undefined | null) {
  const value = String(ref ?? "").trim();
  if (NUMERIC_REF_RE.test(value)) {
    return { id: safeParseInt(value, 0) };
  }
  return { public_id: value };
}

export function publicDocumentRef(record: { public_id?: string | null; id: number }) {
  return record.public_id ?? String(record.id);
}
