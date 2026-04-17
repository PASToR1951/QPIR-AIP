import * as XLSX from "xlsx";

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")
  );
  return "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
}

export function toXLSX(
  rows: Record<string, unknown>[],
  sheetName = "Sheet1",
): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const output = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as
    | Uint8Array
    | ArrayBuffer;
  if (output instanceof ArrayBuffer) return output;

  const body = new ArrayBuffer(output.byteLength);
  new Uint8Array(body).set(output);
  return body;
}

export function toMultiSheetXLSX(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  const output = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as
    | Uint8Array
    | ArrayBuffer;
  if (output instanceof ArrayBuffer) return output;

  const body = new ArrayBuffer(output.byteLength);
  new Uint8Array(body).set(output);
  return body;
}
