import { Hono } from "hono";
import { prisma } from "../../db/client.ts";
import { safeParseInt } from "../../lib/safeParseInt.ts";
import { buildSubmittedBy } from "./shared/display.ts";
import {
  buildDefaultDeadline,
  endOfDeadlineDay,
  getQuarterNumbers,
} from "./shared/dates.ts";
import { adminOrObserverOnly } from "./shared/guards.ts";

const overviewRoutes = new Hono();

overviewRoutes.use("/overview", adminOrObserverOnly);
overviewRoutes.use("/onboarding-overview", adminOrObserverOnly);
overviewRoutes.use("/layout-info", adminOrObserverOnly);

overviewRoutes.get("/overview", async (c) => {
  const year = safeParseInt(
    c.req.query("year"),
    new Date().getFullYear(),
    2020,
    2100,
  );

  const month = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3);
  const quarterPrefixes: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
    4: "4th",
  };

  // All DB queries run in parallel — no sequential awaits
  const [
    totalSchools,
    totalUsers,
    totalPrograms,
    totalProgramOwners,
    aipCount,
    pirCount,
    pirsByQuarter,
    schoolsWithAIP,
    pirActivityReviews,
    deadlineRow,
    recentAIPs,
    recentPIRs,
    clusters,
    allPrograms,
    programsByDivision,
    divisionProgramCounts,
    divisionAips,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({ where: { is_active: true } }),
    prisma.program.count(),
    prisma.user.count({
      where: { is_active: true, role: "Division Personnel" },
    }),
    prisma.aIP.count({ where: { year, status: { not: "Draft" } } }),
    prisma.pIR.count({ where: { status: { not: "Draft" } } }),
    prisma.pIR.findMany({
      where: { aip: { year }, status: { not: "Draft" } },
      select: {
        quarter: true,
        status: true,
        functional_division: true,
        ces_reviewer: { select: { role: true } },
        aip: { select: { program: { select: { division: true } } } },
      },
    }),
    prisma.aIP.findMany({
      where: { year, school_id: { not: null }, status: { not: "Draft" } },
      select: { school_id: true },
      distinct: ["school_id"],
    }),
    prisma.pIRActivityReview.findMany({
      where: { pir: { aip: { year } } },
      select: {
        physical_target: true,
        physical_accomplished: true,
        financial_target: true,
        financial_accomplished: true,
      },
    }),
    prisma.deadline.findUnique({
      where: { year_quarter: { year, quarter: currentQuarter } },
    }),
    prisma.aIP.findMany({
      where: { status: { not: "Draft" } },
      take: 10,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        public_id: true,
        status: true,
        year: true,
        created_at: true,
        school: { select: { name: true } },
        program: { select: { title: true } },
        created_by: {
          select: {
            role: true,
            name: true,
            email: true,
            first_name: true,
            middle_initial: true,
            last_name: true,
          },
        },
      },
    }),
    prisma.pIR.findMany({
      where: { status: { not: "Draft" } },
      take: 15,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        public_id: true,
        quarter: true,
        status: true,
        created_at: true,
        aip: {
          select: {
            school: { select: { name: true } },
            program: { select: { title: true } },
            year: true,
          },
        },
        created_by: {
          select: {
            role: true,
            name: true,
            email: true,
            first_name: true,
            middle_initial: true,
            last_name: true,
          },
        },
      },
    }),
    prisma.cluster.findMany({
      include: {
        schools: {
          include: {
            aips: {
              where: { year, status: { not: "Draft" } },
              select: {
                id: true,
                pirs: {
                  where: { status: { not: "Draft" } },
                  select: { id: true, status: true, quarter: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.program.findMany({
      where: { school_level_requirement: { not: "Division" } },
      select: {
        id: true,
        school_level_requirement: true,
        restricted_schools: { select: { id: true } },
      },
    }),
    prisma.program.groupBy({
      by: ["division"],
      where: { division: { not: null } },
      _count: { id: true },
    }),
    prisma.program.groupBy({
      by: ["division"],
      where: { school_level_requirement: "Division", division: { not: null } },
      _count: { id: true },
    }),
    prisma.aIP.findMany({
      where: { year, school_id: null, status: { not: "Draft" } },
      select: { status: true, program: { select: { division: true } } },
    }),
  ]);

  // --- Pure JS computations (no DB calls below this line) ---

  type SectionKey = "SGOD" | "CID" | "OSDS";
  const resolvePirSection = (pir: typeof pirsByQuarter[number]): SectionKey => {
    const reviewerRole = pir.ces_reviewer?.role;
    if (reviewerRole === "CES-SGOD") return "SGOD";
    if (reviewerRole === "CES-ASDS") return "OSDS";
    if (reviewerRole === "CES-CID") return "CID";
    const fd = pir.functional_division;
    if (fd === "SGOD") return "SGOD";
    if (fd === "OSDS" || fd === "ASDS") return "OSDS";
    if (fd === "CID") return "CID";
    const programDiv = pir.aip?.program?.division as string | null | undefined;
    if (programDiv === "SGOD") return "SGOD";
    if (programDiv === "OSDS" || programDiv === "ASDS") return "OSDS";
    return "CID";
  };

  const aipCompliantCount = schoolsWithAIP.length;
  const pirQuarterly = getQuarterNumbers().map((quarter) => {
    const prefix = quarterPrefixes[quarter];
    const quarterPirs = pirsByQuarter.filter((pir) =>
      pir.quarter.startsWith(prefix)
    );
    return {
      quarter: `Q${quarter}`,
      submitted: quarterPirs.filter((pir) => pir.status === "Submitted").length,
      forCESReview: quarterPirs.filter((pir) =>
        pir.status === "For CES Review"
      ).length,
      forClusterHeadReview: quarterPirs.filter((pir) =>
        pir.status === "For Cluster Head Review"
      ).length,
      approved: quarterPirs.filter((pir) => pir.status === "Approved").length,
      underReview: quarterPirs.filter((pir) =>
        ["Under Review", "For CES Review", "For Cluster Head Review"].includes(
          pir.status,
        )
      ).length,
      returned: quarterPirs.filter((pir) =>
        pir.status === "Returned"
      ).length,
      SGOD: quarterPirs.filter((pir) =>
        resolvePirSection(pir) === "SGOD"
      ).length,
      CID: quarterPirs.filter((pir) => resolvePirSection(pir) === "CID").length,
      OSDS:
        quarterPirs.filter((pir) => resolvePirSection(pir) === "OSDS").length,
    };
  });

  const currentQuarterPirs = pirsByQuarter.filter((pir) =>
    pir.quarter.startsWith(quarterPrefixes[currentQuarter])
  );
  const pirSubmittedThisQ = currentQuarterPirs.length;
  const pirApprovedThisQ =
    currentQuarterPirs.filter((pir) => pir.status === "Approved").length;
  const pirReturnedThisQ =
    currentQuarterPirs.filter((pir) => pir.status === "Returned").length;

  const pirTotalThisYear = pirsByQuarter.length;
  const pirApprovedThisYear =
    pirsByQuarter.filter((pir) => pir.status === "Approved").length;
  const pirApprovalRate = pirTotalThisYear > 0
    ? Math.round((pirApprovedThisYear / pirTotalThisYear) * 100)
    : 0;

  let avgPhysicalRate = 0;
  let avgFinancialRate = 0;
  const reviewsWithPhysicalTarget = pirActivityReviews.filter((review) =>
    Number(review.physical_target) > 0
  );
  const reviewsWithFinancialTarget = pirActivityReviews.filter((review) =>
    Number(review.financial_target) > 0
  );
  if (reviewsWithPhysicalTarget.length > 0) {
    const totalPhysicalRate = reviewsWithPhysicalTarget.reduce(
      (sum, review) =>
        sum +
        (Number(review.physical_accomplished) /
            Number(review.physical_target)) *
          100,
      0,
    );
    avgPhysicalRate = Math.round(
      totalPhysicalRate / reviewsWithPhysicalTarget.length,
    );
  }
  if (reviewsWithFinancialTarget.length > 0) {
    const totalFinancialRate = reviewsWithFinancialTarget.reduce(
      (sum, review) =>
        sum +
        (Number(review.financial_accomplished) /
            Number(review.financial_target)) *
          100,
      0,
    );
    avgFinancialRate = Math.round(
      totalFinancialRate / reviewsWithFinancialTarget.length,
    );
  }

  const deadlineDate = deadlineRow
    ? endOfDeadlineDay(deadlineRow.date)
    : buildDefaultDeadline(year, currentQuarter);
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const recentSubmissions = [
    ...recentAIPs.map((aip) => ({
      id: aip.public_id,
      ref: aip.public_id,
      type: "AIP",
      school: aip.school?.name ?? "Division",
      program: aip.program.title,
      quarter: null,
      year: aip.year,
      submitted: aip.created_at,
      status: aip.status,
      submittedBy: buildSubmittedBy(aip.created_by),
    })),
    ...recentPIRs.map((pir) => ({
      id: pir.public_id,
      ref: pir.public_id,
      type: "PIR",
      school: pir.aip.school?.name ?? "Division",
      program: pir.aip.program.title,
      quarter: pir.quarter,
      year: pir.aip.year,
      submitted: pir.created_at,
      status: pir.status,
      submittedBy: buildSubmittedBy(pir.created_by),
    })),
  ]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "PIR" ? -1 : 1;
      return new Date(b.submitted).getTime() - new Date(a.submitted).getTime();
    })
    .slice(0, 20);

  const currentQuarterPrefix = quarterPrefixes[currentQuarter];

  const clusterCompliance = clusters.map((cluster) => {
    const total = cluster.schools.length;
    const compliant = cluster.schools.filter((school) => school.aips.length > 0)
      .length;
    return {
      id: cluster.id,
      name: cluster.name,
      cluster_number: cluster.cluster_number,
      logo: cluster.logo ?? null,
      total,
      compliant,
      pct: total > 0 ? Math.round((compliant / total) * 100) : 0,
    };
  });

  const getExpectedProgramCount = (schoolId: number, schoolLevel: string) =>
    allPrograms.filter((program) => {
      if (program.school_level_requirement === "Select Schools") {
        return program.restricted_schools.some((school) =>
          school.id === schoolId
        );
      }
      const levelMatch = program.school_level_requirement === "Both" ||
        program.school_level_requirement === schoolLevel ||
        (schoolLevel === "Both" &&
          ["Elementary", "Secondary"].includes(
            program.school_level_requirement,
          ));
      if (!levelMatch) return false;
      if (program.restricted_schools.length > 0) {
        return program.restricted_schools.some((school) =>
          school.id === schoolId
        );
      }
      return true;
    }).length;

  const pirClusterStatus = clusters.map((cluster) => {
    const schools = cluster.schools.map((school) => {
      const expectedPrograms = getExpectedProgramCount(school.id, school.level);
      const schoolPirs = school.aips.flatMap((aip) =>
        aip.pirs.filter((pir) => pir.quarter.startsWith(currentQuarterPrefix))
      );
      return {
        id: school.id,
        name: school.name,
        abbreviation: school.abbreviation ?? null,
        logo: school.logo ?? null,
        totalAips: expectedPrograms,
        submitted: schoolPirs.length,
        approved: schoolPirs.filter((pir) => pir.status === "Approved").length,
        pct: expectedPrograms > 0
          ? Math.round((schoolPirs.length / expectedPrograms) * 100)
          : 0,
      };
    }).sort((a, b) => a.pct - b.pct);

    const totalAips = schools.reduce(
      (sum, school) => sum + school.totalAips,
      0,
    );
    const submittedAips = schools.reduce(
      (sum, school) => sum + school.submitted,
      0,
    );
    const approvedAips = schools.reduce(
      (sum, school) => sum + school.approved,
      0,
    );

    return {
      id: cluster.id,
      name: cluster.name,
      cluster_number: cluster.cluster_number,
      logo: cluster.logo ?? null,
      totalSchools: cluster.schools.length,
      totalAips,
      submittedAips,
      approvedAips,
      pct: totalAips > 0 ? Math.round((submittedAips / totalAips) * 100) : 0,
      schools,
    };
  });

  const sectionMeta: Array<{ key: SectionKey; label: string; full: string }> = [
    {
      key: "SGOD",
      label: "SGOD",
      full: "School Governance & Operations Division",
    },
    { key: "CID", label: "CID", full: "Curriculum Implementation Division" },
    {
      key: "OSDS",
      label: "OSDS",
      full: "Office of the Schools Division Superintendent",
    },
  ];

  const programCountByDivision = Object.fromEntries(
    programsByDivision.map((row) => [row.division, row._count.id]),
  );

  const divisionSections = sectionMeta.map(({ key, label, full }) => {
    const sectionPirs = pirsByQuarter.filter((pir) =>
      resolvePirSection(pir) === key
    );
    const currentQuarterSection = sectionPirs.filter((pir) =>
      pir.quarter.startsWith(quarterPrefixes[currentQuarter])
    );
    return {
      key,
      label,
      full,
      programCount: programCountByDivision[key] ?? 0,
      total: sectionPirs.length,
      thisQuarter: currentQuarterSection.length,
      pending: sectionPirs.filter((pir) =>
        pir.status === "For CES Review"
      ).length,
      inReview:
        sectionPirs.filter((pir) =>
          ["For Cluster Head Review", "Under Review"].includes(pir.status)
        ).length,
      approved: sectionPirs.filter((pir) => pir.status === "Approved").length,
      returned: sectionPirs.filter((pir) => pir.status === "Returned").length,
    };
  });

  const divisionAipCompliance = sectionMeta.map(({ key, label, full }) => {
    const totalPrograms = divisionProgramCounts.find((r) =>
      r.division === key
    )?._count.id ?? 0;
    const sectionAips = divisionAips.filter((a) => a.program?.division === key);
    const withAip = sectionAips.length;
    const approved = sectionAips.filter((a) => a.status === "Approved").length;
    return {
      key,
      label,
      full,
      totalPrograms,
      withAip,
      approved,
      pct: totalPrograms > 0 ? Math.round((withAip / totalPrograms) * 100) : 0,
    };
  });

  return c.json({
    stats: {
      totalSchools,
      totalUsers,
      totalPrograms,
      totalProgramOwners,
      aipCount,
      aipCompliantCount,
      aipCompliancePct: totalSchools > 0
        ? Math.round((aipCompliantCount / totalSchools) * 100)
        : 0,
      pirCount,
      pirSubmittedThisQ,
      pirApprovedThisQ,
      pirReturnedThisQ,
      pirApprovalRate,
      pirTotalThisYear,
      pirApprovedThisYear,
      avgPhysicalRate,
      avgFinancialRate,
      totalActivitiesReviewed: pirActivityReviews.length,
      currentQuarter,
      deadlineDate,
      daysLeft,
      year,
    },
    recentSubmissions,
    clusterCompliance,
    pirQuarterly,
    pirClusterStatus,
    divisionSections,
    divisionAipCompliance,
  });
});

overviewRoutes.get("/onboarding-overview", async (c) => {
  const daysRaw = c.req.query("days") ?? "30";
  const days = daysRaw === "all" ? "all" : safeParseInt(daysRaw, 30, 1, 365);
  const since = days === "all"
    ? null
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const supportedRoles = [
    "School",
    "Division Personnel",
    "CES-SGOD",
    "CES-ASDS",
    "CES-CID",
    "Cluster Coordinator",
    "Admin",
  ];

  const users = await prisma.user.findMany({
    where: {
      is_active: true,
      role: { in: supportedRoles },
    },
    select: {
      id: true,
      role: true,
      created_at: true,
      onboarding_dismissed_at: true,
      onboarding_completed_at: true,
      checklist_progress: true,
    } as any,
  } as any);

  const rows = users.filter((row) => {
    if (!since) return true;
    const relevantDate = row.onboarding_completed_at ??
      row.onboarding_dismissed_at ??
      row.created_at;
    return relevantDate >= since;
  }).map((row) => {
    const progress = row.checklist_progress &&
        typeof row.checklist_progress === "object" &&
        !Array.isArray(row.checklist_progress)
      ? row.checklist_progress as Record<string, unknown>
      : {};
    const completedTaskIds = Array.isArray(progress.completed_task_ids)
      ? progress.completed_task_ids.filter((item) => typeof item === "string")
      : [];

    let status: "completed" | "in_progress" | "dismissed" | "not_started" =
      "not_started";
    if (row.onboarding_completed_at) {
      status = "completed";
    } else if (completedTaskIds.length > 0) {
      status = "in_progress";
    } else if (row.onboarding_dismissed_at) {
      status = "dismissed";
    }

    return {
      role: row.role,
      status,
    };
  });

  const emptyCounts = {
    completed: 0,
    in_progress: 0,
    dismissed: 0,
    not_started: 0,
    total: 0,
  };

  const summary = rows.reduce((acc, row) => {
    acc[row.status] += 1;
    acc.total += 1;
    return acc;
  }, { ...emptyCounts });

  const byRole = supportedRoles.map((role) => {
    const counts = rows
      .filter((row) => row.role === role)
      .reduce((acc, row) => {
        acc[row.status] += 1;
        acc.total += 1;
        return acc;
      }, { ...emptyCounts });

    return {
      role,
      ...counts,
    };
  }).filter((row) => row.total > 0);

  return c.json({
    days,
    summary,
    byRole,
    range: {
      mode: days === "all" ? "all" : "rolling",
      start: since?.toISOString() ?? null,
      end: new Date().toISOString(),
    },
  });
});

overviewRoutes.get("/layout-info", async (c) => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(month / 3);

  const deadline = await prisma.deadline.findUnique({
    where: { year_quarter: { year, quarter: currentQuarter } },
  });
  const deadlineDate = deadline
    ? endOfDeadlineDay(deadline.date)
    : buildDefaultDeadline(year, currentQuarter);
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return c.json({ daysLeft, currentQuarter, deadlineDate });
});

export default overviewRoutes;
