import { getValidationFlags, pct } from './pirReviewUtils.js';

export function buildPirReviewDerived({ pir, sub }) {
  const reviews = sub?.activity_reviews ?? [];
  const allAipActivities = sub?.aip?.activities ?? [];

  const metCount = reviews.filter((review) => (pct(review.physical_accomplished, review.physical_target) ?? 0) >= 80).length;
  const partialCount = reviews.filter((review) => {
    const value = pct(review.physical_accomplished, review.physical_target);
    return value !== null && value >= 50 && value < 80;
  }).length;
  const lowCount = reviews.filter((review) => {
    const value = pct(review.physical_accomplished, review.physical_target);
    return value !== null && value < 50;
  }).length;

  const totalPhysTarget = reviews.reduce((sum, review) => sum + Number(review.physical_target), 0);
  const totalPhysAcc = reviews.reduce((sum, review) => sum + Number(review.physical_accomplished), 0);
  const totalFinTarget = reviews.reduce((sum, review) => sum + Number(review.financial_target), 0);
  const totalFinAcc = reviews.reduce((sum, review) => sum + Number(review.financial_accomplished), 0);
  const overallPhysPct = totalPhysTarget === 0 ? 0 : pct(totalPhysAcc, totalPhysTarget);
  const overallFinPct = totalFinTarget === 0 ? 0 : pct(totalFinAcc, totalFinTarget);

  const flaggedCount = reviews.filter((review) => getValidationFlags(review).length > 0).length;
  const totalFlags = reviews.flatMap((review) => getValidationFlags(review));

  const school = pir?.school ?? '—';
  const schoolMeta = sub?.aip?.school ?? null;
  const clusterMeta = schoolMeta?.cluster ?? null;
  const schoolLogo = schoolMeta?.logo ?? pir?.schoolLogo ?? null;
  const clusterLogo = clusterMeta?.logo ?? pir?.clusterLogo ?? null;
  const clusterNumber = clusterMeta?.cluster_number ?? pir?.clusterNumber ?? null;
  const program = pir?.program ?? '—';
  const quarter = pir?.quarter ?? '—';
  const status = pir?.status ?? '—';
  const factors = pir?.factors ?? {};

  const createdBy = sub?.created_by;
  let submittedBy = '—';
  if (createdBy) {
    if (createdBy.first_name && createdBy.last_name) {
      const mi = createdBy.middle_initial ? ` ${createdBy.middle_initial}.` : '';
      submittedBy = `${createdBy.first_name}${mi} ${createdBy.last_name}`;
    } else {
      submittedBy = createdBy.name ?? createdBy.email ?? '—';
    }
  }

  return {
    allAipActivities,
    clusterLogo,
    clusterNumber,
    factors,
    flaggedCount,
    lowCount,
    metCount,
    overallFinPct,
    overallPhysPct,
    partialCount,
    program,
    quarter,
    reviews,
    school,
    schoolLogo,
    status,
    submittedBy,
    totalFinAcc,
    totalFinTarget,
    totalFlags,
    totalPhysAcc,
    totalPhysTarget,
  };
}
