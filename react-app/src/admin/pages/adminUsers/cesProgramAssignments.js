const CES_ROLE_DIVISIONS = {
  'CES-SGOD': 'SGOD',
  'CES-ASDS': 'OSDS',
  'CES-CID': 'CID',
};

export function isCesRole(role) {
  return Object.prototype.hasOwnProperty.call(CES_ROLE_DIVISIONS, role);
}

export function getDivisionProgramOptions(programs = []) {
  return programs
    .filter((program) => program.school_level_requirement === 'Division')
    .map((program) => ({ value: program.id, label: program.title }));
}

export function getCesProgramIds(role, programs = []) {
  const division = CES_ROLE_DIVISIONS[role];
  if (!division) return [];

  return programs
    .filter((program) =>
      program.school_level_requirement === 'Division' &&
      program.division === division
    )
    .map((program) => program.id);
}

export function getDefaultProgramIdsForRole(role, programs = []) {
  return isCesRole(role) ? getCesProgramIds(role, programs) : [];
}

export function haveSameProgramIds(left = [], right = []) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right);
  return left.every((id) => rightIds.has(id));
}
