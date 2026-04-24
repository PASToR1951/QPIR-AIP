import ExcelJS from "exceljs";
import { sanitizeSpreadsheetValue, toCSV, toXLSX } from "./exports.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}

Deno.test("sanitizeSpreadsheetValue neutralizes formula-like strings", () => {
  assertEquals(
    sanitizeSpreadsheetValue("=cmd|calc"),
    "'=cmd|calc",
    "equals formulas should be literal",
  );
  assertEquals(
    sanitizeSpreadsheetValue(" +SUM(A1:A2)"),
    "' +SUM(A1:A2)",
    "trimmed formulas should be literal",
  );
  assertEquals(
    sanitizeSpreadsheetValue("Ordinary text"),
    "Ordinary text",
    "normal text should not change",
  );
});

Deno.test("toCSV emits formula-like cells as literal text", () => {
  const csv = toCSV([{ Name: "=malicious", Notes: "safe" }]);
  assertEquals(
    csv.includes('"\'=malicious"'),
    true,
    "dangerous CSV cell should be prefixed with an apostrophe",
  );
});

Deno.test("toXLSX emits formula-like cells as literal text", async () => {
  const buffer = await toXLSX([{ Name: "@malicious", Notes: "safe" }], "Test");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet("Test");
  assertEquals(
    worksheet?.getCell("A2").value,
    "'@malicious",
    "dangerous XLSX cell should be stored as a literal string",
  );
});
