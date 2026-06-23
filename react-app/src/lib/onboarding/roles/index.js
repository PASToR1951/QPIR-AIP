import { adminRoleConfig } from './admin.js';
import { cesRoleConfig } from './ces.js';
import { clusterConsultantRoleConfig } from './clusterConsultant.js';
import { divisionRoleConfig } from './division.js';
import { pendingRoleConfig } from './pending.js';
import { schoolRoleConfig } from './school.js';

export const ROLE_REGISTRY = {
  school: schoolRoleConfig,
  division: divisionRoleConfig,
  ces: cesRoleConfig,
  clusterConsultant: clusterConsultantRoleConfig,
  admin: adminRoleConfig,
  pending: pendingRoleConfig,
};
