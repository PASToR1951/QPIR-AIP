const QUARTER_LABEL_PATTERN =
  /^(?:q\s*)?([1-4])(?:st|nd|rd|th)?\s+quarter\s+cy\s+(\d{4})$/i;
const SHORT_QUARTER_PATTERN = /^q\s*([1-4])\s+cy\s+(\d{4})$/i;

function ordinalQuarter(quarter: number): string {
  const ordinals = ["", "1st", "2nd", "3rd", "4th"];
  return ordinals[quarter] ?? String(quarter);
}

export function normalizeQuarterLabel(value: string): string {
  const compact = value.trim().replace(/\s+/g, " ");
  const match = compact.match(QUARTER_LABEL_PATTERN) ??
    compact.match(SHORT_QUARTER_PATTERN);
  if (!match) return compact;

  const quarter = Number(match[1]);
  const year = match[2];
  return `${ordinalQuarter(quarter)} Quarter CY ${year}`;
}
