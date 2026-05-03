import { adminRoleConfig } from './admin.js';
import { cesRoleConfig } from './ces.js';
import { divisionRoleConfig } from './division.js';
import { observerRoleConfig } from './observer.js';
import { pendingRoleConfig } from './pending.js';
import { schoolRoleConfig } from './school.js';

export const ROLE_REGISTRY = {
  school: schoolRoleConfig,
  division: divisionRoleConfig,
  ces: cesRoleConfig,
  admin: adminRoleConfig,
  pending: pendingRoleConfig,
  observer: observerRoleConfig,
};
