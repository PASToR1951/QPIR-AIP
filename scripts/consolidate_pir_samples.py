#!/usr/bin/env python3
"""Consolidate local PIR sample CSV exports into one tidy CSV.

The source files are spreadsheet exports, so this script normalizes headers,
section rows, text spacing, simple percentages, and fraction-like metrics into
one row per program entry.
"""

from __future__ import annotations

import csv
import re
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = ROOT / "PIR Sample"
OUTPUT_FILE = INPUT_DIR / "consolidated_pir_clean.csv"

NULL_LIKE = {
    "",
    "na",
    "n/a",
    "none",
    "not applicable",
    "not applicable.",
}

FIELDNAMES = [
    "source_file",
    "source_type",
    "source_unit",
    "report_year",
    "report_quarter",
    "next_quarter",
    "program_category",
    "program_no",
    "program",
    "program_owner",
    "owner_status",
    "accomplishment_raw",
    "accomplishment_status",
    "accomplishment_numerator",
    "accomplishment_denominator",
    "accomplishment_percent",
    "accomplishment_percent_source",
    "ta_target_type",
    "ta_raw",
    "ta_status",
    "ta_numerator",
    "ta_denominator",
    "ta_percent",
    "ta_percent_source",
    "gaps",
    "gap_status",
    "recommendations",
    "management_response",
    "next_quarter_compliance",
    "compliance_level",
    "data_quality_flags",
]


def clean_text(value: str | None) -> str:
    if value is None:
        return ""
    value = value.replace("\ufeff", "")
    value = value.replace("\r", "\n").replace("\t", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def null_normalized(value: str) -> str:
    return re.sub(r"\s+", " ", clean_text(value).lower())


def is_null_like(value: str) -> bool:
    normalized = null_normalized(value)
    return normalized in NULL_LIKE or normalized == "not applicable"


def sanitize_free_text(value: str) -> str:
    value = clean_text(value)
    if is_null_like(value) or value.lower() in {"no gaps", "no gap"}:
        return ""
    return value


def strip_program_number(program: str) -> tuple[str, str]:
    program = clean_text(program).rstrip(",")
    match = re.match(r"^(\d+)\s*(?:\.\s*|\s+)(\S.*)$", program)
    if not match:
        return "", program
    return match.group(1), clean_text(match.group(2))


def infer_source(path: Path, rows: list[list[str]]) -> dict[str, str]:
    name = path.name
    text = " ".join(clean_text(cell) for row in rows[:4] for cell in row)
    source_type = "cluster" if "CLUSTER" in name.upper() else "division_consolidated"

    unit = ""
    if source_type == "cluster":
        unit = path.stem.split(" - ")[-1]
    else:
        match = re.search(r"-\s*(CID|OSDS|SGOD)-Cons", name, re.IGNORECASE)
        if match:
            unit = match.group(1).upper()
        else:
            match = re.search(r"\b(CID|OSDS|SGOD)-BASED\b", text, re.IGNORECASE)
            unit = match.group(1).upper() if match else ""

    year_match = re.search(r"\bCY\s*(20\d{2})\b", text, re.IGNORECASE)
    quarter_match = re.search(r"\bQ([1-4])\b", text, re.IGNORECASE)
    if not quarter_match:
        quarter_match = re.search(r"FOR\s+Q([1-4])", text, re.IGNORECASE)

    if not quarter_match:
        quarter = "Q3" if source_type == "cluster" else "Q2"
    else:
        quarter = f"Q{quarter_match.group(1)}"

    next_quarter_match = re.search(r"\bQ([1-4])\s+Compliance\b", text, re.IGNORECASE)
    next_quarter = f"Q{next_quarter_match.group(1)}" if next_quarter_match else ""

    return {
        "source_file": name,
        "source_type": source_type,
        "source_unit": unit,
        "report_year": year_match.group(1) if year_match else "",
        "report_quarter": quarter,
        "next_quarter": next_quarter,
        "ta_target_type": "teachers" if source_type == "cluster" else "schools",
    }


def category_from_row(row: list[str]) -> str:
    row_text = " ".join(clean_text(cell) for cell in row)
    match = re.search(r"\b(CID|SGOD|OSDS)\s*-\s*BASED PROGRAMS?\b", row_text, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return ""


def find_header_index(rows: list[list[str]]) -> int:
    for idx, row in enumerate(rows):
        normalized = [clean_text(cell).upper() for cell in row]
        if "PROGRAM" in normalized and any("PROGRAM OWNERS" in cell for cell in normalized):
            return idx
    return 0


def decimal_string(value: Decimal | None) -> str:
    if value is None:
        return ""
    quantized = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return format(quantized.normalize(), "f")


def safe_decimal(value: str) -> Decimal | None:
    try:
        return Decimal(value.replace(",", ""))
    except (InvalidOperation, AttributeError):
        return None


def first_percent(value: str) -> Decimal | None:
    match = re.search(r"(-?\d+(?:\.\d+)?)\s*%", value)
    return safe_decimal(match.group(1)) if match else None


def first_fraction(value: str) -> tuple[Decimal | None, Decimal | None]:
    text = clean_text(value).lower()

    slash = re.search(r"\(?\s*(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)\s*\)?", text)
    if slash:
        return safe_decimal(slash.group(1)), safe_decimal(slash.group(2))

    out_of = re.search(
        r"(\d+(?:\.\d+)?)\s*out\s*(?:of|0f)?\s*(\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE,
    )
    if out_of:
        return safe_decimal(out_of.group(1)), safe_decimal(out_of.group(2))

    reversed_out_of = re.search(
        r"(\d+(?:\.\d+)?)\s+\w+\s+out\s+(?:of\s+)?(\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE,
    )
    if reversed_out_of:
        return safe_decimal(reversed_out_of.group(1)), safe_decimal(reversed_out_of.group(2))

    return None, None


def metric_status(value: str) -> str:
    text = clean_text(value).lower()
    if text == "":
        return "missing"
    if is_null_like(text):
        return "not_applicable"
    if "no activit" in text:
        return "no_activity"
    if "no ta" in text:
        return "no_ta"
    return "reported"


def parse_metric(value: str) -> dict[str, str]:
    value = clean_text(value)
    status = metric_status(value)
    numerator, denominator = first_fraction(value)
    percent = first_percent(value)
    source = "reported" if percent is not None else ""

    if percent is None and numerator is not None and denominator is not None:
        if denominator != 0:
            percent = (numerator / denominator) * Decimal("100")
            source = "calculated"
        else:
            source = "not_calculated_zero_denominator"

    if percent is None and re.fullmatch(r"0+(?:\.0+)?", value):
        percent = Decimal("0")
        source = "reported_zero"

    return {
        "raw": value,
        "status": status,
        "numerator": decimal_string(numerator),
        "denominator": decimal_string(denominator),
        "percent": decimal_string(percent),
        "percent_source": source,
    }


def gap_status(value: str) -> str:
    text = clean_text(value)
    if text == "":
        return "none_reported"
    lowered = text.lower()
    if lowered in {"none", "no gaps", "no gap", "na", "n/a"}:
        return "none_reported"
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        return "count_reported"
    return "described"


def compliance_level(value: str) -> str:
    value = clean_text(value)
    if re.fullmatch(r"\d+", value):
        return value
    return ""


def metric_quality_flags(prefix: str, parsed: dict[str, str]) -> list[str]:
    flags: list[str] = []
    status = parsed["status"]
    if status in {"missing", "not_applicable", "no_activity", "no_ta"}:
        flags.append(f"{prefix}_{status}")

    percent = safe_decimal(parsed["percent"])
    if percent is not None and percent > 100:
        flags.append(f"{prefix}_over_100_percent")

    numerator = safe_decimal(parsed["numerator"])
    denominator = safe_decimal(parsed["denominator"])
    if (
        percent is not None
        and numerator is not None
        and denominator not in {None, Decimal("0")}
    ):
        calculated = (numerator / denominator) * Decimal("100")
        if abs(calculated - percent) > Decimal("1"):
            flags.append(f"{prefix}_percent_fraction_mismatch")

    return flags


def is_data_row(row: list[str], source_type: str) -> bool:
    cells = [clean_text(cell) for cell in row[:9]]
    if not any(cells):
        return False
    if category_from_row(cells):
        return False
    joined = " ".join(cells).upper()
    if "PROGRAM OWNERS" in joined or "DEDUCED FROM FACTORS" in joined:
        return False
    if "CONSOLIDATED BY" in joined or "PROJECT DEVELOPMENT OFFICER" in joined:
        return False

    if source_type == "division_consolidated":
        return bool(cells[0] and cells[1])
    return bool(cells[1] and cells[2])


def normalize_row(
    row: list[str],
    metadata: dict[str, str],
    program_category: str,
) -> dict[str, str]:
    cells = [clean_text(cell) for cell in row[:9]]
    while len(cells) < 9:
        cells.append("")

    if metadata["source_type"] == "division_consolidated":
        program_no = cells[0]
        program_name = cells[1]
        owner = cells[2]
        accomplishment_value = cells[3]
        ta_value = cells[4]
        gaps = cells[5]
        recommendations = cells[6]
        management_response = cells[7]
        compliance = cells[8]
    else:
        extracted_no, program_name = strip_program_number(cells[1])
        program_no = cells[0] or extracted_no
        owner = cells[2]
        accomplishment_value = cells[3]
        ta_value = cells[4]
        gaps = cells[5]
        recommendations = cells[6]
        management_response = cells[7]
        compliance = cells[8]

    if metadata["source_type"] == "division_consolidated":
        extracted_no, cleaned_program = strip_program_number(program_name)
        program_no = program_no or extracted_no
        program_name = cleaned_program

    owner_status = "missing" if clean_text(owner) == "" else "reported"
    if is_null_like(owner):
        owner_status = "not_applicable"
        owner = ""

    accomplishment = parse_metric(accomplishment_value)
    ta = parse_metric(ta_value)
    clean_gaps = sanitize_free_text(gaps)
    clean_recommendations = sanitize_free_text(recommendations)
    clean_response = sanitize_free_text(management_response)
    clean_compliance = sanitize_free_text(compliance)

    flags = []
    if not program_category:
        flags.append("missing_program_category")
    if owner_status != "reported":
        flags.append(f"owner_{owner_status}")
    flags.extend(metric_quality_flags("accomplishment", accomplishment))
    flags.extend(metric_quality_flags("ta", ta))

    return {
        **metadata,
        "program_category": program_category,
        "program_no": clean_text(program_no),
        "program": clean_text(program_name),
        "program_owner": clean_text(owner),
        "owner_status": owner_status,
        "accomplishment_raw": accomplishment["raw"],
        "accomplishment_status": accomplishment["status"],
        "accomplishment_numerator": accomplishment["numerator"],
        "accomplishment_denominator": accomplishment["denominator"],
        "accomplishment_percent": accomplishment["percent"],
        "accomplishment_percent_source": accomplishment["percent_source"],
        "ta_raw": ta["raw"],
        "ta_status": ta["status"],
        "ta_numerator": ta["numerator"],
        "ta_denominator": ta["denominator"],
        "ta_percent": ta["percent"],
        "ta_percent_source": ta["percent_source"],
        "gaps": clean_gaps,
        "gap_status": gap_status(gaps),
        "recommendations": clean_recommendations,
        "management_response": clean_response,
        "next_quarter_compliance": clean_compliance,
        "compliance_level": compliance_level(compliance),
        "data_quality_flags": ";".join(flags),
    }


def consolidate() -> list[dict[str, str]]:
    records: list[dict[str, str]] = []

    if not INPUT_DIR.exists():
        raise SystemExit(
            f"Missing input folder: {INPUT_DIR}\n"
            "Create a 'PIR Sample' folder at the project root and copy the raw PIR CSV exports into it."
        )

    input_files = [
        path for path in sorted(INPUT_DIR.glob("*.csv"))
        if path.name != OUTPUT_FILE.name
    ]
    if not input_files:
        raise SystemExit(
            f"No source CSV files found in: {INPUT_DIR}\n"
            "Copy the raw PIR CSV exports into that folder, then rerun this script."
        )

    for path in input_files:
        with path.open(newline="", encoding="utf-8-sig") as handle:
            rows = list(csv.reader(handle))

        metadata = infer_source(path, rows)
        header_index = find_header_index(rows)
        program_category = metadata["source_unit"] if metadata["source_type"] == "division_consolidated" else ""

        for row in rows[header_index + 1 :]:
            category = category_from_row(row)
            if category:
                program_category = category
                continue
            if not is_data_row(row, metadata["source_type"]):
                continue
            records.append(normalize_row(row, metadata, program_category))

    return records


def main() -> None:
    records = consolidate()
    with OUTPUT_FILE.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(records)

    print(f"Wrote {len(records)} rows to {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
