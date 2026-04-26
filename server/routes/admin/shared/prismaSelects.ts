export const PIR_LIST_INCLUDE = {
  aip: { include: { program: true, school: true } },
  created_by: {
    select: { name: true, first_name: true, last_name: true, email: true },
  },
} as const;

export const PIR_DETAIL_INCLUDE = {
  aip: {
    include: { program: true, school: { include: { cluster: true } } },
  },
  activity_reviews: { include: { aip_activity: true } },
  factors: true,
  ces_reviewer: { select: { name: true, role: true } },
} as const;

export const REVIEW_QUEUE_INCLUDE = {
  aip: {
    include: { program: true, school: { include: { cluster: true } } },
  },
  created_by: {
    select: { name: true, first_name: true, last_name: true, email: true },
  },
  active_reviewer: {
    select: { name: true, first_name: true, last_name: true, email: true },
  },
} as const;

const SCHOOL_HEAD_SELECT = {
  select: { first_name: true, last_name: true, middle_initial: true, name: true },
  where: { role: "School" },
  take: 1,
} as const;

export const AIP_SUBMISSION_INCLUDE = {
  school: { include: { cluster: true, users: SCHOOL_HEAD_SELECT } },
  program: true,
  created_by: true,
} as const;

export const PIR_SUBMISSION_INCLUDE = {
  aip: {
    include: {
      school: { include: { cluster: true, users: SCHOOL_HEAD_SELECT } },
      program: true,
    },
  },
  created_by: true,
} as const;

export const SUBMISSION_DETAIL_PIR_INCLUDE = {
  aip: {
    include: {
      school: { include: { cluster: true } },
      program: true,
      activities: true,
    },
  },
  activity_reviews: { include: { aip_activity: true } },
  factors: true,
  created_by: true,
} as const;

export const SUBMISSION_DETAIL_AIP_INCLUDE = {
  school: true,
  program: true,
  activities: true,
  created_by: true,
} as const;

export const REPORT_AIP_INCLUDE = {
  school: { include: { cluster: true } },
  program: true,
} as const;

export const REPORT_PIR_INCLUDE = {
  aip: {
    include: { school: { include: { cluster: true } }, program: true },
  },
} as const;

export const SCHOOL_CLUSTER_INCLUDE = {
  cluster: true,
} as const;

