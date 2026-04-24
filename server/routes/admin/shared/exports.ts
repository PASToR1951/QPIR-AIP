import ExcelJS from "exceljs";

export function sanitizeSpreadsheetValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

function sanitizeRows(rows: Record<string, unknown>[]) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        sanitizeSpreadsheetValue(value),
      ]),
    )
  );
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const sanitizedRows = sanitizeRows(rows);
  return "\uFEFF" + [
    headers.map((header) => JSON.stringify(sanitizeSpreadsheetValue(header)))
      .join(","),
    ...sanitizedRows.map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")
    ),
  ].join("\r\n");
}

export async function toXLSX(
  rows: Record<string, unknown>[],
  sheetName = "Sheet1",
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  worksheet.columns = headers.map((header) => ({
    header: String(sanitizeSpreadsheetValue(header)),
    key: header,
  }));
  for (const row of sanitizeRows(rows)) {
    worksheet.addRow(row);
  }

  const output = await workbook.xlsx.writeBuffer() as Uint8Array | ArrayBuffer;
  if (output instanceof ArrayBuffer) return output;

  const body = new ArrayBuffer(output.byteLength);
  new Uint8Array(body).set(output);
  return body;
}

export async function toMultiSheetXLSX(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    const headers = sheet.rows.length > 0 ? Object.keys(sheet.rows[0]) : [];
    worksheet.columns = headers.map((header) => ({
      header: String(sanitizeSpreadsheetValue(header)),
      key: header,
    }));
    for (const row of sanitizeRows(sheet.rows)) {
      worksheet.addRow(row);
    }
  }

  const output = await workbook.xlsx.writeBuffer() as Uint8Array | ArrayBuffer;
  if (output instanceof ArrayBuffer) return output;

  const body = new ArrayBuffer(output.byteLength);
  new Uint8Array(body).set(output);
  return body;
}
