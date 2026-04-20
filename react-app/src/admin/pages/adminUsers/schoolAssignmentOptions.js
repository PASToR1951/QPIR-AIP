function sameId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

export function getAvailableSchoolRoleSchools({ schools = [], users = [], currentUserId = null }) {
  const assignedSchoolIds = new Set(
    users
      .filter(user => user.role === 'School' && user.school?.id != null && !sameId(user.id, currentUserId))
      .map(user => Number(user.school.id))
  );

  return schools.filter(school => !assignedSchoolIds.has(Number(school.id)));
}

export function getAvailableClusterCoordinatorOwnSchools({
  schools = [],
  users = [],
  clusterId = null,
  currentUserId = null,
}) {
  if (clusterId == null) return [];

  const normalizedClusterId = Number(clusterId);
  const assignedSchoolIds = new Set(
    users
      .filter(user => user.role === 'Cluster Coordinator' && user.school?.id != null && !sameId(user.id, currentUserId))
      .map(user => Number(user.school.id))
  );

  return schools.filter((school) => {
    if (Number(school.cluster_id) !== normalizedClusterId) return false;
    return !assignedSchoolIds.has(Number(school.id));
  });
}
