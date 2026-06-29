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
