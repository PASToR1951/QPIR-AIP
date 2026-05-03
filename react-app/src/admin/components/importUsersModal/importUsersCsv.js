const VALID_ROLES = new Set([
  'School',
  'Division Personnel',
  'Admin',
  'CES-SGOD',
  'CES-ASDS',
  'CES-CID',
]);

const SYSTEM_ROLES = new Set([
  'Admin',
  'CES-SGOD',
  'CES-ASDS',
  'CES-CID',
]);

export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]
    .replace(/^\uFEFF/, '')
    .split(',')
    .map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? '']));

    row.program_ids = row.program_ids
      ? row.program_ids
          .split(';')
          .map((value) => parseInt(value.trim(), 10))
          .filter((value) => !Number.isNaN(value) && value > 0)
      : [];

    row.school_id = row.school_id ? parseInt(row.school_id, 10) || null : null;
    const errors = [];
    const email = (row.email || '').toLowerCase().trim();
    row.email = email;

    if (!email || !email.endsWith('@deped.gov.ph')) {
      errors.push('Email must end with @deped.gov.ph');
    }

    if (!VALID_ROLES.has(row.role)) {
      errors.push(`Unknown role: "${row.role || '(empty)'}"`);
    } else {
      if (SYSTEM_ROLES.has(row.role) && !row.name?.trim()) {
        errors.push(`"name" is required for role "${row.role}"`);
      }
      if (row.role === 'Division Personnel' && (!row.first_name?.trim() || !row.last_name?.trim())) {
        errors.push('first_name and last_name are required for Division Personnel');
      }
      if (row.role === 'School' && !row.school_id) {
        errors.push('Valid school_id is required for School role');
      }
    }

    return {
      ...row,
      _row: index + 2,
      _valid: errors.length === 0,
      _errors: errors,
    };
  });
}

export const EXAMPLE_CSV = `email,role,name,first_name,last_name,middle_initial,school_id,program_ids
101234@deped.gov.ph,School,,,,,42,
juan.delacruz@deped.gov.ph,Division Personnel,,Juan,Dela Cruz,D,,2;5
juan.delacruz001@deped.gov.ph,Division Personnel,,Juan,Dela Cruz,A,,3
ces.head@deped.gov.ph,CES-SGOD,Rowena Flores,,,,,`;
