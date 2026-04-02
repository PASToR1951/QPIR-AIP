import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { getCESRoleForDivisionPIR } from "../lib/routing.ts";
import { getUserFromToken, TokenPayload } from "../lib/auth.ts";

const dataRoutes = new Hono();

// ==========================================
// NORMALIZATION HELPERS
// ==========================================

function normalizeBudgetSource(amount: number, source: string | undefined): string {
  const empty = !source || ['none', 'n/a', '0', ''].includes(source.trim().toLowerCase());
  return (amount === 0 && empty) ? 'NONE' : (source?.trim() || 'NONE');
}

function normalizeIndicators(indicators: any[]): any[] {
  return (indicators || []).map((ind: any) => ({
    description: ind.description || '',
    target: ind.target?.toString().trim() || 'NONE'
  }));
}

// ==========================================
// DRAFTS (stored as AIP/PIR rows with status = "Draft")
// ==========================================

// POST /api/aips/draft — save or update an AIP draft
dataRoutes.post('/aips/draft', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const body = await c.req.json();
    const { program_title, year: rawYear, outcome, sip_title, project_coordinator,
            objectives, indicators, prepared_by_name, prepared_by_title,
            approved_by_name, approved_by_title, activities } = body;

    if (!program_title) return c.json({ error: 'program_title is required' }, 400);

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ error: `Program '${program_title}' not found` }, 404);

    const year = parseInt(rawYear) || new Date().getFullYear();
    const school_id = tokenUser.role === 'School' ? tokenUser.school_id : null;

    // Try to find an existing draft or submitted AIP to update
    let existing: any;
    if (school_id) {
      existing = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id, program_id: program.id, year } },
        include: { activities: true }
      });
    } else {
      existing = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year },
        include: { activities: true }
      });
    }

    // Only allow saving drafts over Draft status or creating new ones
    if (existing && existing.status !== 'Draft') {
      return c.json({ error: 'An AIP has already been submitted for this program and year' }, 409);
    }
    if (existing && (existing as any).archived) {
      return c.json({ error: 'This AIP has been archived and cannot be modified' }, 409);
    }

    const aipData = {
      outcome: outcome || '',
      sip_title: sip_title || '',
      project_coordinator: project_coordinator || '',
      objectives: objectives || [],
      indicators: normalizeIndicators(indicators),
      prepared_by_name: prepared_by_name || '',
      prepared_by_title: prepared_by_title || '',
      approved_by_name: approved_by_name || '',
      approved_by_title: approved_by_title || '',
      status: 'Draft',
    };

    const activityData = (activities || []).map((act: any) => {
      const amount = parseFloat(act.budgetAmount || 0);
      return {
        phase: act.phase || '',
        activity_name: act.name || '',
        implementation_period: act.period || '',
        period_start_month: act.periodStartMonth ? parseInt(act.periodStartMonth) : null,
        period_end_month: act.periodEndMonth ? parseInt(act.periodEndMonth) : null,
        persons_involved: act.persons || '',
        outputs: act.outputs || '',
        budget_amount: amount,
        budget_source: normalizeBudgetSource(amount, act.budgetSource)
      };
    });

    let aip;
    if (existing) {
      // Update existing draft: delete old activities and recreate
      await prisma.aIPActivity.deleteMany({ where: { aip_id: existing.id } });
      aip = await prisma.aIP.update({
        where: { id: existing.id },
        data: {
          ...aipData,
          activities: { create: activityData }
        },
        include: { activities: true }
      });
    } else {
      aip = await prisma.aIP.create({
        data: {
          school_id,
          program_id: program.id,
          created_by_user_id: tokenUser.id,
          year,
          ...aipData,
          activities: { create: activityData }
        },
        include: { activities: true }
      });
    }

    return c.json({ message: 'Draft saved successfully', aip });
  } catch (error) {
    console.error('Failed to save AIP draft:', error);
    return c.json({ error: 'Failed to save draft' }, 500);
  }
});

// GET /api/aips/draft — check if the current user has an AIP draft
dataRoutes.get('/aips/draft', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    let drafts: any[];
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      drafts = await prisma.aIP.findMany({
        where: { school_id: tokenUser.school_id, year, status: 'Draft' },
        include: { activities: true, program: true }
      });
    } else {
      drafts = await prisma.aIP.findMany({
        where: { created_by_user_id: tokenUser.id, school_id: null, year, status: 'Draft' },
        include: { activities: true, program: true }
      });
    }

    if (drafts.length === 0) {
      return c.json({ hasDraft: false });
    }

    // Return the first (and typically only) draft, mapped to the frontend's expected format
    const aip = drafts[0];
    const draftData = {
      outcome: aip.outcome,
      year: String(aip.year),
      depedProgram: aip.program.title,
      sipTitle: aip.sip_title,
      projectCoord: aip.project_coordinator,
      objectives: aip.objectives,
      indicators: aip.indicators,
      preparedByName: aip.prepared_by_name,
      preparedByTitle: aip.prepared_by_title,
      approvedByName: aip.approved_by_name,
      approvedByTitle: aip.approved_by_title,
      activities: aip.activities.map((a: any) => ({
        id: a.id,
        phase: a.phase,
        name: a.activity_name,
        period: a.implementation_period,
        periodStartMonth: a.period_start_month,
        periodEndMonth: a.period_end_month,
        persons: a.persons_involved,
        outputs: a.outputs,
        budgetAmount: a.budget_amount,
        budgetSource: a.budget_source,
      })),
    };

    return c.json({ hasDraft: true, draftData, lastSaved: aip.created_at });
  } catch (error) {
    console.error('Failed to load AIP draft:', error);
    return c.json({ error: 'Failed to load draft' }, 500);
  }
});

// DELETE /api/aips/draft — delete an AIP draft for the current user
dataRoutes.delete('/aips/draft', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title');
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    let where: any = { status: 'Draft', year };

    if (tokenUser.role === 'School' && tokenUser.school_id) {
      where.school_id = tokenUser.school_id;
    } else {
      where.created_by_user_id = tokenUser.id;
      where.school_id = null;
    }

    if (program_title) {
      const program = await prisma.program.findFirst({ where: { title: program_title } });
      if (program) where.program_id = program.id;
    }

    await prisma.aIP.deleteMany({ where });

    return c.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('Failed to delete AIP draft:', error);
    return c.json({ error: 'Failed to delete draft' }, 500);
  }
});

// POST /api/pirs/draft — save or update a PIR draft
dataRoutes.post('/pirs/draft', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const body = await c.req.json();
    const { program_title, quarter, program_owner, budget_from_division, budget_from_co_psf,
            functional_division,
            indicator_quarterly_targets, action_items, activity_reviews, factors } = body;

    if (!program_title || !quarter) return c.json({ error: 'program_title and quarter are required' }, 400);

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ error: `Program '${program_title}' not found` }, 404);

    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    let aip: any;
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id: tokenUser.school_id, program_id: program.id, year } },
        include: { activities: true }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year },
        include: { activities: true }
      });
    }

    if (!aip) return c.json({ error: 'Associated AIP not found' }, 404);

    // Check for existing PIR draft
    const existing = await prisma.pIR.findUnique({
      where: { aip_id_quarter: { aip_id: aip.id, quarter } }
    });

    if (existing && existing.status !== 'Draft') {
      return c.json({ error: 'A PIR has already been submitted for this quarter' }, 409);
    }

    const pirData = {
      program_owner: program_owner || '',
      budget_from_division: parseFloat(budget_from_division) || 0,
      budget_from_co_psf: parseFloat(budget_from_co_psf) || 0,
      functional_division: functional_division ?? null,
      indicator_quarterly_targets: indicator_quarterly_targets ?? [],
      action_items: action_items ?? [],
      status: 'Draft',
    };

    let pir;
    if (existing) {
      // Delete old relations and recreate
      await prisma.pIRActivityReview.deleteMany({ where: { pir_id: existing.id } });
      await prisma.pIRFactor.deleteMany({ where: { pir_id: existing.id } });
      pir = await prisma.pIR.update({
        where: { id: existing.id },
        data: {
          ...pirData,
          factors: {
            create: factors ? Object.entries(factors).map(([type, data]: [string, any]) => ({
              factor_type: type,
              facilitating_factors: data.facilitating || '',
              hindering_factors: data.hindering || '',
              recommendations: data.recommendations || '',
            })) : []
          },
          activity_reviews: {
            create: (activity_reviews || []).map((rev: any) => ({
              aip_activity_id: rev.aip_activity_id ? parseInt(rev.aip_activity_id) : null,
              complied: rev.complied ?? null,
              actual_tasks_conducted: rev.actual_tasks_conducted ?? '',
              contributory_performance_indicators: rev.contributory_performance_indicators ?? '',
              movs_expected_outputs: rev.movs_expected_outputs ?? '',
              adjustments: rev.adjustments ?? '',
              is_unplanned: rev.is_unplanned ?? false,
              physical_target: parseFloat(rev.physTarget || 0),
              financial_target: parseFloat(rev.finTarget || 0),
              physical_accomplished: parseFloat(rev.physAcc || 0),
              financial_accomplished: parseFloat(rev.finAcc || 0),
              actions_to_address_gap: rev.actions || '',
            }))
          }
        }
      });
    } else {
      pir = await prisma.pIR.create({
        data: {
          aip_id: aip.id,
          created_by_user_id: tokenUser.id,
          quarter,
          ...pirData,
          factors: {
            create: factors ? Object.entries(factors).map(([type, data]: [string, any]) => ({
              factor_type: type,
              facilitating_factors: data.facilitating || '',
              hindering_factors: data.hindering || '',
              recommendations: data.recommendations || '',
            })) : []
          },
          activity_reviews: {
            create: (activity_reviews || []).map((rev: any) => ({
              aip_activity_id: rev.aip_activity_id ? parseInt(rev.aip_activity_id) : null,
              complied: rev.complied ?? null,
              actual_tasks_conducted: rev.actual_tasks_conducted ?? '',
              contributory_performance_indicators: rev.contributory_performance_indicators ?? '',
              movs_expected_outputs: rev.movs_expected_outputs ?? '',
              adjustments: rev.adjustments ?? '',
              is_unplanned: rev.is_unplanned ?? false,
              physical_target: parseFloat(rev.physTarget || 0),
              financial_target: parseFloat(rev.finTarget || 0),
              physical_accomplished: parseFloat(rev.physAcc || 0),
              financial_accomplished: parseFloat(rev.finAcc || 0),
              actions_to_address_gap: rev.actions || '',
            }))
          }
        }
      });
    }

    return c.json({ message: 'PIR draft saved successfully', pir });
  } catch (error) {
    console.error('Failed to save PIR draft:', error);
    return c.json({ error: 'Failed to save PIR draft' }, 500);
  }
});

// GET /api/pirs/draft — check if the current user has a PIR draft
dataRoutes.get('/pirs/draft', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title');
    const quarter = c.req.query('quarter');

    // When no program_title, return lightweight check for any draft owned by this user
    if (!program_title) {
      const aipWhere = tokenUser.role === 'School' && tokenUser.school_id
        ? { school_id: tokenUser.school_id }
        : { created_by_user_id: tokenUser.id, school_id: null };
      const anyDraft = await prisma.pIR.findFirst({
        where: { status: 'Draft', aip: aipWhere },
        include: { aip: { include: { program: true } } },
        orderBy: { created_at: 'desc' },
      });
      if (!anyDraft) return c.json({ hasDraft: false });
      return c.json({
        hasDraft: true,
        draftProgram: anyDraft.aip.program.title,
        lastSaved: anyDraft.created_at,
      });
    }

    const yearMatch = quarter?.match(/CY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ hasDraft: false });

    let aip: any;
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id: tokenUser.school_id, program_id: program.id, year } }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year }
      });
    }

    if (!aip) return c.json({ hasDraft: false });

    const pir = quarter
      ? await prisma.pIR.findUnique({
          where: { aip_id_quarter: { aip_id: aip.id, quarter } },
          include: { activity_reviews: true, factors: true }
        })
      : await prisma.pIR.findFirst({
          where: { aip_id: aip.id, status: 'Draft' },
          include: { activity_reviews: true, factors: true }
        });

    if (!pir || pir.status !== 'Draft') return c.json({ hasDraft: false });

    const factorsMap: Record<string, any> = {};
    for (const f of pir.factors) {
      factorsMap[f.factor_type] = {
        facilitating: f.facilitating_factors,
        hindering: f.hindering_factors,
        recommendations: (f as any).recommendations ?? '',
      };
    }

    return c.json({
      hasDraft: true,
      draftData: {
        program: program_title,
        quarter: pir.quarter,
        owner: pir.program_owner,
        budgetFromDivision: String((pir as any).budget_from_division ?? 0),
        budgetFromCoPSF: String((pir as any).budget_from_co_psf ?? 0),
        functionalDivision: (pir as any).functional_division ?? null,
        indicatorQuarterlyTargets: (pir as any).indicator_quarterly_targets as any[] ?? [],
        actionItems: (pir as any).action_items as any[] ?? [],
        activities: pir.activity_reviews.map((r: any) => ({
          aip_activity_id: r.aip_activity_id,
          complied: r.complied,
          actualTasksConducted: r.actual_tasks_conducted ?? '',
          contributoryIndicators: r.contributory_performance_indicators ?? '',
          movsExpectedOutputs: r.movs_expected_outputs ?? '',
          adjustments: r.adjustments ?? '',
          isUnplanned: r.is_unplanned ?? false,
          physTarget: String(r.physical_target),
          finTarget: String(r.financial_target),
          physAcc: String(r.physical_accomplished),
          finAcc: String(r.financial_accomplished),
          actions: r.actions_to_address_gap || '',
        })),
        factors: factorsMap
      },
      lastSaved: pir.created_at
    });
  } catch (error) {
    console.error('Failed to load PIR draft:', error);
    return c.json({ error: 'Failed to load PIR draft' }, 500);
  }
});

// DELETE /api/pirs/draft — delete a PIR draft
dataRoutes.delete('/pirs/draft', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title');
    const quarter = c.req.query('quarter');

    if (!program_title || !quarter) return c.json({ error: 'program_title and quarter required' }, 400);

    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ message: 'No draft found' });

    let aip: any;
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id: tokenUser.school_id, program_id: program.id, year } }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year }
      });
    }

    if (!aip) return c.json({ message: 'No draft found' });

    const pir = await prisma.pIR.findUnique({
      where: { aip_id_quarter: { aip_id: aip.id, quarter } }
    });

    if (pir && pir.status === 'Draft') {
      await prisma.pIR.delete({ where: { id: pir.id } });
    }

    return c.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('Failed to delete PIR draft:', error);
    return c.json({ error: 'Failed to delete PIR draft' }, 500);
  }
});

// GET all Schools (authenticated users only)
dataRoutes.get('/schools', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const schools = await prisma.school.findMany({
      include: { cluster: true }
    });
    return c.json(schools);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch schools' }, 500);
  }
});

// GET Programs — filtered by user type
// - School Users: all programs except those restricted for their school
// - Division Personnel: only programs assigned via UserPrograms
// - Unauthenticated (or no matching user in DB): all programs (fallback for dev/admin)
dataRoutes.get('/programs', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));

    if (!tokenUser) {
      // Fallback: return all programs (unauthenticated or dev use)
      const programs = await prisma.program.findMany({ orderBy: { title: 'asc' } });
      return c.json(programs);
    }

    if (tokenUser.role === 'Division Personnel') {
      // Division Personnel: only assigned Division-level programs
      const user = await prisma.user.findUnique({
        where: { id: tokenUser.id },
        include: {
          programs: {
            where: { school_level_requirement: 'Division' },
            orderBy: { title: 'asc' },
          },
        },
      });
      return c.json(user?.programs ?? []);
    }

    // School User: filter by school level and exclude restricted programs
    if (tokenUser.school_id) {
      const school = await prisma.school.findUnique({
        where: { id: tokenUser.school_id },
        select: { level: true }
      });

      const schoolLevel = school?.level ?? 'Both';
      const levelFilter = schoolLevel === 'Both'
        ? ['Elementary', 'Secondary', 'Both', 'Select Schools']
        : [schoolLevel, 'Both', 'Select Schools'];

      const restricted = await prisma.program.findMany({
        where: {
          restricted_schools: {
            some: { id: tokenUser.school_id }
          }
        },
        select: { id: true }
      });
      const restrictedIds = restricted.map(p => p.id);

      const programs = await prisma.program.findMany({
        where: {
          id: { notIn: restrictedIds },
          school_level_requirement: { in: levelFilter }
        },
        orderBy: { title: 'asc' }
      });
      return c.json(programs);
    }

    // Fallback
    const programs = await prisma.program.findMany({ orderBy: { title: 'asc' } });
    return c.json(programs);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch programs' }, 500);
  }
});

// GET Programs that have at least one AIP for the current user/school
dataRoutes.get('/programs/with-aips', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    const db = prisma.aIP as any;
    const SUBMITTED_AIP_STATUSES = ['Submitted', 'Verified', 'Under Review', 'Approved', 'Returned'];
    let aips: any[];
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aips = await db.findMany({
        where: { school_id: tokenUser.school_id, year, status: { in: SUBMITTED_AIP_STATUSES } },
        include: { program: true }
      });
    } else {
      aips = await db.findMany({
        where: { created_by_user_id: tokenUser.id, school_id: null, year, status: { in: SUBMITTED_AIP_STATUSES } },
        include: { program: true }
      });
    }

    const programs = aips.map((aip: any) => ({ ...aip.program, aip_status: aip.status })).sort((a: any, b: any) => a.title.localeCompare(b.title));
    return c.json(programs);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch programs with AIPs' }, 500);
  }
});

// GET Programs that have at least one PIR for the current user/school
dataRoutes.get('/programs/with-pirs', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    let pirs: any[];
    const FILED_STATUSES = ['Submitted', 'Under Review', 'Approved', 'Returned'];
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      pirs = await prisma.pIR.findMany({
        where: { status: { in: FILED_STATUSES }, aip: { school_id: tokenUser.school_id, year } },
        include: { aip: { include: { program: true } } }
      });
    } else {
      pirs = await prisma.pIR.findMany({
        where: { status: { in: FILED_STATUSES }, aip: { created_by_user_id: tokenUser.id, school_id: null, year } },
        include: { aip: { include: { program: true } } }
      });
    }

    // Deduplicate by program title (a program may have PIRs across multiple quarters)
    const seen = new Set<string>();
    const programs = pirs
      .map((pir: any) => pir.aip.program)
      .filter((p: any) => {
        if (seen.has(p.title)) return false;
        seen.add(p.title);
        return true;
      })
      .sort((a: any, b: any) => a.title.localeCompare(b.title));

    return c.json(programs);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch programs with PIRs' }, 500);
  }
});

// GET AIP status for a school
dataRoutes.get('/schools/:id/aip-status', async (c) => {
  const tokenUser = getUserFromToken(c.req.header('Authorization'));
  if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

  const school_id = parseInt(c.req.param('id'));
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  // School users may only query their own school's status
  if (tokenUser.role === 'School' && tokenUser.school_id !== school_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const aipCount = await prisma.aIP.count({ where: { school_id, year } });
    return c.json({ hasAIP: aipCount > 0, count: aipCount });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP status' }, 500);
  }
});

// GET /api/schools/:id/coordinators — distinct project coordinator names for autocomplete
dataRoutes.get('/schools/:id/coordinators', async (c) => {
  const tokenUser = getUserFromToken(c.req.header('Authorization'));
  if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

  const school_id = parseInt(c.req.param('id'));

  if (tokenUser.role === 'School' && tokenUser.school_id !== school_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    let where: any = {};
    if (tokenUser.role === 'School') {
      where.school_id = school_id;
    } else {
      where.created_by_user_id = tokenUser.id;
    }

    const aips = await prisma.aIP.findMany({
      where,
      select: { project_coordinator: true },
      distinct: ['project_coordinator'],
    });

    const coordinators = aips
      .map((a: any) => a.project_coordinator)
      .filter((v: any): v is string => typeof v === 'string' && v.trim() !== '');

    return c.json(coordinators);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch coordinators' }, 500);
  }
});

// GET /api/schools/:id/persons-terms — distinct persons_involved values for fuzzy autocomplete
dataRoutes.get('/schools/:id/persons-terms', async (c) => {
  const tokenUser = getUserFromToken(c.req.header('Authorization'));
  if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

  const school_id = parseInt(c.req.param('id'));

  if (tokenUser.role === 'School' && tokenUser.school_id !== school_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    let aipWhere: any = {};
    if (tokenUser.role === 'School') {
      aipWhere.school_id = school_id;
    } else {
      aipWhere.created_by_user_id = tokenUser.id;
    }

    const activities = await prisma.aIPActivity.findMany({
      where: { aip: aipWhere },
      select: { persons_involved: true },
      distinct: ['persons_involved'],
      take: 100,
    });

    const terms = activities
      .map((a: any) => a.persons_involved)
      .filter((v: any): v is string => typeof v === 'string' && v.trim() !== '');

    return c.json(terms);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch persons terms' }, 500);
  }
});

// GET AIP status for a Division Personnel user
dataRoutes.get('/users/:id/aip-status', async (c) => {
  const tokenUser = getUserFromToken(c.req.header('Authorization'));
  if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

  const user_id = parseInt(c.req.param('id'));
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  // Users may only query their own status
  if (tokenUser.id !== user_id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const aipCount = await prisma.aIP.count({
      where: { created_by_user_id: user_id, school_id: null, year }
    });
    return c.json({ hasAIP: aipCount > 0, count: aipCount });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP status' }, 500);
  }
});

// GET AIP activities for PIR pre-population — scoped to the authenticated user
dataRoutes.get('/aips/activities', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title') || '';
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    if (!program_title) {
      return c.json({ error: 'program_title is required' }, 400);
    }

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) {
      return c.json({ error: `Program '${program_title}' not found` }, 404);
    }

    let aip: any;

    // Scope entirely from the token — client-supplied school_id/user_id are ignored
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: {
          school_id_program_id_year: {
            school_id: tokenUser.school_id,
            program_id: program.id,
            year
          }
        },
        include: { activities: true }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: {
          created_by_user_id: tokenUser.id,
          school_id: null,
          program_id: program.id,
          year
        },
        include: { activities: true }
      });
    }

    if (!aip) {
      return c.json({ error: 'No AIP found for this program and year' }, 404);
    }

    const totalBudget = aip.activities.reduce((sum: number, a: any) => sum + (parseFloat(a.budget_amount) || 0), 0);
    const fundSources = [...new Set(aip.activities.map((a: any) => a.budget_source).filter(Boolean))].join(' / ');

    return c.json({
      aip_id: aip.id,
      project_coordinator: aip.project_coordinator || '',
      total_budget: totalBudget,
      fund_source: fundSources,
      indicators: aip.indicators as any[],
      activities: aip.activities.map((a: any) => ({
        id: a.id,
        activity_name: a.activity_name,
        implementation_period: a.implementation_period,
        period_start_month: a.period_start_month,
        period_end_month: a.period_end_month,
        phase: a.phase,
        budget_amount: a.budget_amount,
        outputs: a.outputs,
        persons_involved: a.persons_involved,
      }))
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP activities' }, 500);
  }
});

// GET full AIP record for read-only view (submitted form)
dataRoutes.get('/aips', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title') || '';
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    if (!program_title) return c.json({ error: 'program_title is required' }, 400);

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ error: `Program '${program_title}' not found` }, 404);

    let aip: any;
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id: tokenUser.school_id, program_id: program.id, year } },
        include: { activities: true, program: true }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year },
        include: { activities: true, program: true }
      });
    }

    if (!aip) return c.json({ error: 'No submitted AIP found' }, 404);

    return c.json({
      year: aip.year,
      status: aip.status,
      depedProgram: aip.program.title,
      outcome: aip.outcome,
      sipTitle: aip.sip_title,
      projectCoord: aip.project_coordinator,
      objectives: aip.objectives,
      indicators: aip.indicators,
      preparedByName: aip.prepared_by_name,
      preparedByTitle: aip.prepared_by_title,
      approvedByName: aip.approved_by_name,
      approvedByTitle: aip.approved_by_title,
      activities: aip.activities.map((a: any) => ({
        id: a.id,
        phase: a.phase,
        name: a.activity_name,
        period: a.implementation_period,
        periodStartMonth: a.period_start_month,
        periodEndMonth: a.period_end_month,
        persons: a.persons_involved,
        outputs: a.outputs,
        budgetAmount: a.budget_amount,
        budgetSource: a.budget_source,
      })),
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP' }, 500);
  }
});

// DELETE /api/aips — delete a submitted AIP (only allowed for Submitted or Returned status)
dataRoutes.delete('/aips', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title');
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    if (!program_title) return c.json({ error: 'program_title is required' }, 400);

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ error: `Program '${program_title}' not found` }, 404);

    let aip: any;
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id: tokenUser.school_id, program_id: program.id, year } }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year }
      });
    }

    if (!aip) return c.json({ error: 'AIP not found' }, 404);

    const deletableStatuses = ['Draft', 'Returned'];
    if (!deletableStatuses.includes(aip.status)) {
      return c.json({ error: `Cannot delete an AIP with status '${aip.status}'. Only Draft or Returned AIPs can be deleted.` }, 403);
    }

    await prisma.aIP.delete({ where: { id: aip.id } });

    return c.json({ message: 'AIP deleted successfully' });
  } catch (error) {
    console.error('Failed to delete AIP:', error);
    return c.json({ error: 'Failed to delete AIP' }, 500);
  }
});

// GET full PIR record for read-only view (submitted form)
dataRoutes.get('/pirs', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title') || '';
    const quarter = c.req.query('quarter') || '';

    if (!program_title || !quarter) return c.json({ error: 'program_title and quarter are required' }, 400);

    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const program = await prisma.program.findFirst({ where: { title: program_title } });
    if (!program) return c.json({ error: `Program '${program_title}' not found` }, 404);

    let aip: any;
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aip = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id: tokenUser.school_id, program_id: program.id, year } },
        include: { school: true, program: true }
      });
    } else {
      aip = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year },
        include: { school: true, program: true }
      });
    }

    if (!aip) return c.json({ error: 'No AIP found for this program' }, 404);

    const pir = await prisma.pIR.findUnique({
      where: { aip_id_quarter: { aip_id: aip.id, quarter } },
      include: {
        activity_reviews: { include: { aip_activity: true } },
        factors: true,
      },
    });

    if (!pir) return c.json({ error: 'No submitted PIR found for this quarter' }, 404);

    // Verify ownership — the PIR must belong to the requesting user
    if (pir.created_by_user_id !== null && pir.created_by_user_id !== tokenUser.id &&
        tokenUser.role !== 'Division Personnel') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const factorsMap: Record<string, any> = {};
    for (const f of pir.factors) {
      factorsMap[f.factor_type] = {
        facilitating: f.facilitating_factors,
        hindering: f.hindering_factors,
        recommendations: (f as any).recommendations ?? '',
      };
    }

    return c.json({
      id: pir.id,
      status: pir.status,
      quarter: pir.quarter,
      program: aip.program.title,
      school: aip.school?.name ?? '',
      owner: pir.program_owner,
      budgetFromDivision: (pir as any).budget_from_division,
      budgetFromCoPSF: (pir as any).budget_from_co_psf,
      functionalDivision: (pir as any).functional_division ?? null,
      indicatorQuarterlyTargets: (pir as any).indicator_quarterly_targets as any[] ?? [],
      actionItems: (pir as any).action_items as any[] ?? [],
      activities: pir.activity_reviews.map((r: any) => ({
        id: r.id,
        name: r.aip_activity?.activity_name ?? '',
        implementation_period: r.aip_activity?.implementation_period ?? '',
        period_start_month: r.aip_activity?.period_start_month ?? null,
        period_end_month: r.aip_activity?.period_end_month ?? null,
        complied: r.complied,
        actualTasksConducted: r.actual_tasks_conducted ?? '',
        contributoryIndicators: r.contributory_performance_indicators ?? '',
        movsExpectedOutputs: r.movs_expected_outputs ?? '',
        adjustments: r.adjustments ?? '',
        isUnplanned: r.is_unplanned ?? false,
        physTarget: r.physical_target,
        finTarget: r.financial_target,
        physAcc: r.physical_accomplished,
        finAcc: r.financial_accomplished,
        actions: r.actions_to_address_gap ?? '',
      })),
      factors: factorsMap,
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch PIR' }, 500);
  }
});

// POST a new AIP
dataRoutes.post('/aips', async (c) => {
  try {
    // Get the requesting user from JWT
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { program_title, year, outcome, sip_title, project_coordinator,
            objectives, indicators, prepared_by_name, prepared_by_title,
            approved_by_name, approved_by_title, activities } = body;

    // Look up program_id
    const program = await prisma.program.findFirst({
      where: { title: program_title }
    });
    if (!program) {
      return c.json({ error: `Program '${program_title}' not found` }, 404);
    }

    // Division Personnel: verify program is assigned to them
    if (tokenUser.role === 'Division Personnel') {
      const assigned = await prisma.user.findFirst({
        where: {
          id: tokenUser.id,
          programs: { some: { id: program.id } }
        }
      });
      if (!assigned) {
        return c.json({ error: 'You are not assigned to this program' }, 403);
      }
    }

    const school_id = tokenUser.role === 'School' ? tokenUser.school_id : null;
    const parsedYear = parseInt(year);

    const aipFields = {
      outcome,
      sip_title,
      project_coordinator,
      objectives,
      indicators: normalizeIndicators(indicators),
      prepared_by_name: prepared_by_name || '',
      prepared_by_title: prepared_by_title || '',
      approved_by_name: approved_by_name || '',
      approved_by_title: approved_by_title || '',
      status: 'Approved',
    };

    const activityFields = activities.map((act: any) => {
      const amount = parseFloat(act.budgetAmount || 0);
      return {
        phase: act.phase,
        activity_name: act.name,
        implementation_period: act.period,
        period_start_month: act.periodStartMonth ? parseInt(act.periodStartMonth) : null,
        period_end_month: act.periodEndMonth ? parseInt(act.periodEndMonth) : null,
        persons_involved: act.persons,
        outputs: act.outputs,
        budget_amount: amount,
        budget_source: normalizeBudgetSource(amount, act.budgetSource)
      };
    });

    // Check if a Draft AIP already exists — if so, update it instead of creating a new one
    let existingDraft: any = null;
    if (school_id) {
      existingDraft = await prisma.aIP.findUnique({
        where: { school_id_program_id_year: { school_id, program_id: program.id, year: parsedYear } }
      });
    } else {
      existingDraft = await prisma.aIP.findFirst({
        where: { created_by_user_id: tokenUser.id, school_id: null, program_id: program.id, year: parsedYear }
      });
    }

    let aip;
    if (existingDraft && (existingDraft.status === 'Draft' || existingDraft.status === 'Returned')) {
      // Promote draft or re-submit returned AIP: delete old activities and replace
      await prisma.aIPActivity.deleteMany({ where: { aip_id: existingDraft.id } });
      aip = await prisma.aIP.update({
        where: { id: existingDraft.id },
        data: {
          ...aipFields,
          activities: { create: activityFields }
        },
        include: { activities: true }
      });
    } else if (existingDraft) {
      // AIP already exists with a non-Draft status — cannot overwrite
      if ((existingDraft as any).archived) {
        return c.json({ error: 'This AIP has been archived and cannot be modified' }, 409);
      }
      return c.json(
        { error: `An AIP for this program and year already exists (status: ${existingDraft.status}).` },
        409
      );
    } else {
      aip = await prisma.aIP.create({
        data: {
          school_id,
          program_id: program.id,
          created_by_user_id: tokenUser.id,
          year: parsedYear,
          ...aipFields,
          activities: { create: activityFields }
        },
        include: { activities: true }
      });
    }

    // Notify all admins that a new AIP was submitted
    const schoolLabel = aip.school_id
      ? (await prisma.school.findUnique({ where: { id: aip.school_id }, select: { name: true } }))?.name ?? 'A school'
      : (tokenUser.name ?? tokenUser.email ?? 'Division Personnel');
    const admins = await prisma.user.findMany({ where: { role: 'Admin' }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          user_id: admin.id,
          title: 'New AIP Received (Pre-approved)',
          message: `${schoolLabel} submitted a pre-approved AIP for ${program_title} (FY ${year}).`,
          type: 'aip_submitted',
        })),
      });
    }

    // Notify the submitter that their AIP is pre-approved
    await prisma.notification.create({
      data: {
        user_id: tokenUser.id,
        title: 'AIP Approved',
        message: `Your AIP for ${program_title} (FY ${year}) has been received and is pre-approved.`,
        type: 'approved',
      },
    });

    return c.json({ message: 'AIP created successfully', aip });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to create AIP' }, 500);
  }
});

// POST request to edit an approved AIP (notifies admins)
dataRoutes.post('/aips/:id/request-edit', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const aipId = parseInt(c.req.param('id'));
    const aip = await prisma.aIP.findUnique({
      where: { id: aipId },
      include: { program: true, school: true },
    });

    if (!aip) {
      return c.json({ error: 'AIP not found' }, 404);
    }

    // Verify ownership
    const isOwner =
      aip.created_by_user_id === tokenUser.id ||
      (tokenUser.school_id != null && aip.school_id === tokenUser.school_id);
    if (!isOwner) {
      return c.json({ error: 'Not authorized to request edit for this AIP' }, 403);
    }

    if (aip.status !== 'Approved') {
      return c.json({ error: 'Edit requests can only be made for Approved AIPs' }, 409);
    }

    const requesterLabel = aip.school
      ? aip.school.name
      : (tokenUser.name ?? tokenUser.email ?? 'Division Personnel');

    const admins = await prisma.user.findMany({ where: { role: 'Admin' }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          user_id: admin.id,
          title: 'Edit Request — AIP',
          message: `${requesterLabel} is requesting permission to edit their AIP for ${aip.program.title} (FY ${aip.year}).`,
          type: 'aip_edit_requested',
        })),
      });
    }

    return c.json({ message: 'Edit request sent to admin' });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to send edit request' }, 500);
  }
});

// POST a new PIR
dataRoutes.post('/pirs', async (c) => {
  try {
    const body = await c.req.json();
    const {
      program_title,
      quarter,
      program_owner,
      budget_from_division,
      budget_from_co_psf,
      functional_division,
      indicator_quarterly_targets,
      action_items,
      activity_reviews,
      factors
    } = body;

    // Get the requesting user from JWT
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Look up program
    const program = await prisma.program.findFirst({
      where: { title: program_title }
    });
    if (!program) {
      return c.json({ error: `Program '${program_title}' not found` }, 404);
    }

    // Extract year from "Xth Quarter CY 2026"
    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    let aip: any;

    if (tokenUser.role === 'School' && tokenUser.school_id) {
      // School User: find AIP by school + program + year
      aip = await prisma.aIP.findUnique({
        where: {
          school_id_program_id_year: {
            school_id: tokenUser.school_id,
            program_id: program.id,
            year
          }
        },
        include: { activities: true, program: true, school: { include: { cluster: true } } }
      });
    } else {
      // Division Personnel / Cluster Coordinator: find AIP by user + program + year (school is null)
      aip = await prisma.aIP.findFirst({
        where: {
          created_by_user_id: tokenUser.id,
          school_id: null,
          program_id: program.id,
          year
        },
        include: { activities: true, program: true, school: { include: { cluster: true } } }
      });
    }

    if (!aip) {
      return c.json({ error: 'Associated AIP not found for this program and year' }, 404);
    }

    // Verify the user can access this AIP
    if (tokenUser.role === 'Division Personnel' && aip.created_by_user_id !== tokenUser.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const factorData = Object.entries(factors).map(([type, data]: [string, any]) => ({
      factor_type: type,
      facilitating_factors: data.facilitating ?? '',
      hindering_factors: data.hindering ?? '',
      recommendations: data.recommendations ?? '',
    }));

    const reviewData = activity_reviews.map((rev: any) => ({
      aip_activity_id: rev.aip_activity_id ? parseInt(rev.aip_activity_id) : null,
      complied: rev.complied ?? null,
      actual_tasks_conducted: rev.actual_tasks_conducted ?? '',
      contributory_performance_indicators: rev.contributory_performance_indicators ?? '',
      movs_expected_outputs: rev.movs_expected_outputs ?? '',
      adjustments: rev.adjustments ?? '',
      is_unplanned: rev.is_unplanned ?? false,
      physical_target: parseFloat(rev.physTarget || 0),
      financial_target: parseFloat(rev.finTarget || 0),
      physical_accomplished: parseFloat(rev.physAcc || 0),
      financial_accomplished: parseFloat(rev.finAcc || 0),
      actions_to_address_gap: rev.actions ?? '',
    }));

    // Check if a PIR already exists for this aip + quarter
    const existingDraft = await prisma.pIR.findUnique({
      where: { aip_id_quarter: { aip_id: aip.id, quarter } }
    });

    const inProgressStatuses = ['For CES Review', 'For Cluster Head Review', 'Under Review'];
    if (existingDraft && inProgressStatuses.includes(existingDraft.status)) {
      return c.json({ error: 'A PIR has already been submitted for this program and quarter.' }, 409);
    }

    let pir;
    if (existingDraft && existingDraft.status === 'Draft') {
      await prisma.pIRActivityReview.deleteMany({ where: { pir_id: existingDraft.id } });
      await prisma.pIRFactor.deleteMany({ where: { pir_id: existingDraft.id } });
      pir = await prisma.pIR.update({
        where: { id: existingDraft.id },
        data: {
          program_owner,
          budget_from_division: parseFloat(budget_from_division) || 0,
          budget_from_co_psf: parseFloat(budget_from_co_psf) || 0,
          functional_division: functional_division ?? null,
          indicator_quarterly_targets: indicator_quarterly_targets ?? [],
          action_items: action_items ?? [],
          status: tokenUser.role === 'School' ? 'For Cluster Head Review' : 'For CES Review',
          factors: { create: factorData },
          activity_reviews: { create: reviewData }
        }
      });
    } else {
      pir = await prisma.pIR.create({
        data: {
          aip_id: aip.id,
          created_by_user_id: tokenUser.id,
          quarter,
          program_owner,
          budget_from_division: parseFloat(budget_from_division) || 0,
          budget_from_co_psf: parseFloat(budget_from_co_psf) || 0,
          functional_division: functional_division ?? null,
          indicator_quarterly_targets: indicator_quarterly_targets ?? [],
          action_items: action_items ?? [],
          status: tokenUser.role === 'School' ? 'For Cluster Head Review' : 'For CES Review',
          factors: { create: factorData },
          activity_reviews: { create: reviewData }
        }
      });
    }

    // Notify the appropriate reviewer(s) and all admins
    const submitterLabel = aip.school?.name ?? tokenUser.name ?? tokenUser.email ?? 'A user';
    const pirAdmins = await prisma.user.findMany({ where: { role: 'Admin' }, select: { id: true } });
    let reviewerIds: number[] = [];

    if (tokenUser.role === 'School') {
      // School PIR → notify Cluster Coordinator for this school's cluster
      const clusterCoords = await prisma.user.findMany({
        where: { role: 'Cluster Coordinator', cluster_id: aip.school?.cluster_id ?? null, is_active: true },
        select: { id: true }
      });
      reviewerIds = clusterCoords.map((u: any) => u.id);
    } else if (tokenUser.role === 'Cluster Coordinator') {
      // Cluster Coordinator's own PIR → notify CES-CID
      const cesCID = await prisma.user.findMany({ where: { role: 'CES-CID', is_active: true }, select: { id: true } });
      reviewerIds = cesCID.map((u: any) => u.id);
    } else {
      // Division Personnel → notify correct CES role by program division
      const cesRole = getCESRoleForDivisionPIR(aip.program?.division ?? null);
      const cesUsers = await prisma.user.findMany({ where: { role: cesRole, is_active: true }, select: { id: true } });
      reviewerIds = cesUsers.map((u: any) => u.id);
    }

    const notifyIds = [...new Set([...reviewerIds, ...pirAdmins.map((u: any) => u.id)])];
    if (notifyIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyIds.map((userId: number) => ({
          user_id: userId,
          title: 'New PIR Submitted',
          message: `${submitterLabel} submitted a PIR for ${program_title} (${quarter}).`,
          type: 'pir_submitted',
        })),
      });
    }

    return c.json({ message: 'PIR created successfully', pir });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to create PIR' }, 500);
  }
});

// PUT /api/pirs/:id — update a submitted PIR (only allowed if status === "Submitted")
dataRoutes.put('/pirs/:id', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const pirId = parseInt(c.req.param('id'));
    if (isNaN(pirId)) return c.json({ error: 'Invalid PIR id' }, 400);

    const pir = await prisma.pIR.findUnique({ where: { id: pirId } });
    if (!pir) return c.json({ error: 'PIR not found' }, 404);

    // Ownership check
    if (pir.created_by_user_id !== null && pir.created_by_user_id !== tokenUser.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    // Only allow editing if awaiting review or returned to submitter
    if (pir.status !== 'For CES Review' && pir.status !== 'For Cluster Head Review' && pir.status !== 'Returned') {
      return c.json({ error: 'This PIR can no longer be edited — it is currently under review.' }, 409);
    }

    const body = await c.req.json();
    const {
      program_owner, budget_from_division, budget_from_co_psf, functional_division,
      indicator_quarterly_targets, action_items, activity_reviews, factors
    } = body;

    const factorData = Object.entries(factors).map(([type, data]: [string, any]) => ({
      factor_type: type,
      facilitating_factors: data.facilitating ?? '',
      hindering_factors: data.hindering ?? '',
      recommendations: data.recommendations ?? '',
    }));

    const reviewData = activity_reviews.map((rev: any) => ({
      aip_activity_id: rev.aip_activity_id ? parseInt(rev.aip_activity_id) : null,
      complied: rev.complied ?? null,
      actual_tasks_conducted: rev.actual_tasks_conducted ?? '',
      contributory_performance_indicators: rev.contributory_performance_indicators ?? '',
      movs_expected_outputs: rev.movs_expected_outputs ?? '',
      adjustments: rev.adjustments ?? '',
      is_unplanned: rev.is_unplanned ?? false,
      physical_target: parseFloat(rev.physTarget || 0),
      financial_target: parseFloat(rev.finTarget || 0),
      physical_accomplished: parseFloat(rev.physAcc || 0),
      financial_accomplished: parseFloat(rev.finAcc || 0),
      actions_to_address_gap: rev.actions ?? '',
    }));

    // Replace related records and update fields
    await prisma.pIRActivityReview.deleteMany({ where: { pir_id: pirId } });
    await prisma.pIRFactor.deleteMany({ where: { pir_id: pirId } });

    const updated = await prisma.pIR.update({
      where: { id: pirId },
      data: {
        program_owner,
        budget_from_division: parseFloat(budget_from_division) || 0,
        budget_from_co_psf: parseFloat(budget_from_co_psf) || 0,
        functional_division: functional_division ?? null,
        indicator_quarterly_targets: indicator_quarterly_targets ?? [],
        action_items: action_items ?? [],
        status: tokenUser.role === 'School' ? 'For Cluster Head Review' : 'For CES Review', // Re-enter queue on resubmission
        factors: { create: factorData },
        activity_reviews: { create: reviewData },
      },
    });

    return c.json({ message: 'PIR updated successfully', pir: updated });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to update PIR' }, 500);
  }
});

// DELETE /api/pirs/:id — delete a submitted PIR (only allowed if status === "Submitted")
dataRoutes.delete('/pirs/:id', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const pirId = parseInt(c.req.param('id'));
    if (isNaN(pirId)) return c.json({ error: 'Invalid PIR id' }, 400);

    const pir = await prisma.pIR.findUnique({ where: { id: pirId } });
    if (!pir) return c.json({ error: 'PIR not found' }, 404);

    // Ownership check
    if (pir.created_by_user_id !== null && pir.created_by_user_id !== tokenUser.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    // Only allow deletion if awaiting review or returned to submitter
    if (pir.status !== 'For CES Review' && pir.status !== 'For Cluster Head Review' && pir.status !== 'Returned') {
      return c.json({ error: 'This PIR can no longer be deleted — it is currently under review.' }, 409);
    }

    await prisma.pIR.delete({ where: { id: pirId } });

    return c.json({ message: 'PIR deleted successfully' });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to delete PIR' }, 500);
  }
});

// ==========================================
// QUARTER / DEADLINE HELPERS
// ==========================================

function activityOverlapsQuarter(startMonth: number, endMonth: number, quarter: number): boolean {
  const qStart = (quarter - 1) * 3 + 1; // Q1=1, Q2=4, Q3=7, Q4=10
  const qEnd = quarter * 3;              // Q1=3, Q2=6, Q3=9, Q4=12
  return startMonth <= qEnd && endMonth >= qStart;
}

function getQuarterLabel(quarter: number, year: number): string {
  const ordinals: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
  return `${ordinals[quarter]} Quarter CY ${year}`;
}

function buildDeadline(year: number, quarter: number, customDate?: Date): Date {
  if (customDate) {
    const d = new Date(customDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  const defaults: Record<number, Date> = {
    1: new Date(year, 2,  31, 23, 59, 59, 999), // Mar 31
    2: new Date(year, 5,  30, 23, 59, 59, 999), // Jun 30
    3: new Date(year, 8,  30, 23, 59, 59, 999), // Sep 30
    4: new Date(year, 11, 31, 23, 59, 59, 999), // Dec 31
  };
  return defaults[quarter];
}

// ==========================================
// SUBMISSION HISTORY
// ==========================================

// GET /api/history — all non-draft AIPs for the authenticated user, grouped by year (desc),
// each AIP includes its non-draft PIRs.
dataRoutes.get('/history', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const aipWhere = tokenUser.role === 'School' && tokenUser.school_id
      ? { school_id: tokenUser.school_id, status: { not: 'Draft' } }
      : { created_by_user_id: tokenUser.id, school_id: null, status: { not: 'Draft' } };

    const aips = await (prisma.aIP as any).findMany({
      where: aipWhere,
      include: {
        program: { select: { title: true, abbreviation: true } },
        pirs: {
          where: { status: { not: 'Draft' } },
          select: { id: true, quarter: true, status: true, created_at: true },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: [{ year: 'desc' }, { created_at: 'asc' }],
    });

    // Group by year
    const yearMap = new Map<number, any[]>();
    for (const aip of aips) {
      if (!yearMap.has(aip.year)) yearMap.set(aip.year, []);
      yearMap.get(aip.year)!.push({
        id: aip.id,
        program: aip.program.title,
        abbreviation: aip.program.abbreviation ?? null,
        status: aip.status,
        archived: (aip as any).archived ?? false,
        created_at: aip.created_at,
        pirs: aip.pirs.map((p: any) => ({
          id: p.id,
          quarter: p.quarter,
          status: p.status,
        })),
      });
    }

    // Sort programs within each year alphabetically
    for (const list of yearMap.values()) {
      list.sort((a: any, b: any) => a.program.localeCompare(b.program));
    }

    const result = Array.from(yearMap.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, aips]) => ({ year, aips }));

    return c.json(result);
  } catch (err) {
    console.error('Failed to fetch history:', err);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// ==========================================
// DASHBOARD
// ==========================================

// GET /api/dashboard — aggregated stats for the authenticated user
dataRoutes.get('/dashboard', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const today = new Date();
    const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);

    // Load any admin-set deadlines for this year
    const customDeadlines = await prisma.deadline.findMany({ where: { year } });
    const getDeadline = (q: number) =>
      buildDeadline(year, q, customDeadlines.find(d => d.quarter === q)?.date);

    // ── Active Programs ──────────────────────────────────
    let activePrograms = 0;
    if (tokenUser.role === 'Division Personnel') {
      const user = await prisma.user.findUnique({
        where: { id: tokenUser.id },
        include: { programs: true }
      });
      activePrograms = user?.programs.length ?? 0;
    } else if (tokenUser.school_id) {
      const school = await prisma.school.findUnique({
        where: { id: tokenUser.school_id },
        select: { level: true }
      });
      const schoolLevel = school?.level ?? 'Both';
      const levelFilter = schoolLevel === 'Both'
        ? ['Elementary', 'Secondary', 'Both', 'Select Schools']
        : [schoolLevel, 'Both', 'Select Schools'];
      const restricted = await prisma.program.findMany({
        where: { restricted_schools: { some: { id: tokenUser.school_id } } },
        select: { id: true }
      });
      const restrictedIds = restricted.map(p => p.id);
      activePrograms = await prisma.program.count({
        where: {
          id: { notIn: restrictedIds },
          school_level_requirement: { in: levelFilter }
        }
      });
    }

    // ── AIP Completion ───────────────────────────────────
    const SUBMITTED_AIP_STATUSES = ['Submitted', 'Verified', 'Under Review', 'Approved', 'Returned'];
    let aipCompleted = 0;
    if (tokenUser.role === 'Division Personnel') {
      aipCompleted = await prisma.aIP.count({
        where: { created_by_user_id: tokenUser.id, school_id: null, year, status: { in: SUBMITTED_AIP_STATUSES } }
      });
    } else if (tokenUser.school_id) {
      aipCompleted = await prisma.aIP.count({
        where: { school_id: tokenUser.school_id, year, status: { in: SUBMITTED_AIP_STATUSES } }
      });
    }
    const aipTotal = activePrograms;
    const aipPercentage = aipTotal > 0 ? Math.round((aipCompleted / aipTotal) * 100) : 0;

    // ── PIR Submitted (timeline-aware) ──────────────────
    const userAIPsWithActivities = await (prisma.aIP as any).findMany({
      where: tokenUser.role === 'Division Personnel'
        ? { created_by_user_id: tokenUser.id, school_id: null, year, status: { in: SUBMITTED_AIP_STATUSES } }
        : { school_id: tokenUser.school_id, year, status: { in: SUBMITTED_AIP_STATUSES } },
      select: {
        id: true,
        activities: { select: { period_start_month: true, period_end_month: true, budget_amount: true } }
      }
    });
    const allAipIds: number[] = userAIPsWithActivities.map((a: any) => a.id);

    // Helper: check if an AIP has activities in a given quarter
    const aipHasActivitiesInQuarter = (aip: any, q: number) =>
      aip.activities.some((a: any) =>
        a.period_start_month && a.period_end_month
          ? activityOverlapsQuarter(a.period_start_month, a.period_end_month, q)
          : true // Legacy data without structured months — assume relevant
      );

    // Current quarter: only count AIPs with activities this quarter
    const aipsRelevantThisQuarter = userAIPsWithActivities.filter(
      (aip: any) => aipHasActivitiesInQuarter(aip, currentQuarter)
    );
    const pirTotal = aipsRelevantThisQuarter.length;
    const relevantAipIds: number[] = aipsRelevantThisQuarter.map((a: any) => a.id);

    const currentQuarterLabel = getQuarterLabel(currentQuarter, year);
    const pirSubmittedCount = relevantAipIds.length > 0
      ? await prisma.pIR.count({
          where: { aip_id: { in: relevantAipIds }, quarter: currentQuarterLabel }
        })
      : 0;

    // ── Total Planned Budget ──────────────────────────────
    const totalPlannedBudget = userAIPsWithActivities.reduce((sum: number, aip: any) =>
      sum + aip.activities.reduce((s: number, a: any) => s + (parseFloat(a.budget_amount) || 0), 0)
    , 0);

    // ── Quarters (timeline-aware) ─────────────────────────
    const quarters = await Promise.all([1, 2, 3, 4].map(async (q) => {
      const deadline = getDeadline(q);
      const label = getQuarterLabel(q, year);

      // Check if any AIPs have activities in this quarter
      const hasActivities = userAIPsWithActivities.some(
        (aip: any) => aipHasActivitiesInQuarter(aip, q)
      );

      // Count relevant AIPs and submitted PIRs for this quarter
      const relevantIds = userAIPsWithActivities
        .filter((aip: any) => aipHasActivitiesInQuarter(aip, q))
        .map((a: any) => a.id);
      const qTotal = relevantIds.length;
      const qSubmitted = qTotal > 0
        ? await prisma.pIR.count({ where: { aip_id: { in: relevantIds }, quarter: label } })
        : 0;

      let status: string;
      if (!hasActivities && allAipIds.length > 0) {
        status = 'No Activities';
      } else if (q > currentQuarter) {
        status = 'Locked';
      } else if (q === currentQuarter && today <= deadline) {
        status = 'In Progress';
      } else {
        // Past quarter or deadline has passed
        status = qSubmitted >= qTotal && qTotal > 0 ? 'Submitted' : (qTotal > 0 ? 'Missed' : 'No Activities');
      }

      return {
        name: `Q${q}`,
        status,
        deadline: deadline.toISOString(),
        submitted: qSubmitted,
        total: qTotal
      };
    }));

    const currentDeadline = getDeadline(currentQuarter);

    return c.json({
      activePrograms,
      aipCompletion: { completed: aipCompleted, total: aipTotal, percentage: aipPercentage },
      pirSubmitted: { submitted: pirSubmittedCount, total: pirTotal },
      totalPlannedBudget,
      currentQuarter,
      deadline: currentDeadline.toISOString(),
      quarters
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// ==========================================
// DEADLINES
// ==========================================
// NOTE: Legacy /api/deadlines GET and POST routes removed (SYS-15).
// Deadline management is handled exclusively via /api/admin/deadlines (admin.ts).

// ==========================================
// NOTIFICATIONS
// ==========================================

dataRoutes.get("/notifications", async (c) => {
  const tokenUser = getUserFromToken(c.req.header("Authorization"));
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  const notifications = await prisma.notification.findMany({
    where: { user_id: tokenUser.id },
    orderBy: [{ read: "asc" }, { created_at: "desc" }],
    take: 20,
  });

  return c.json(notifications);
});

dataRoutes.patch("/notifications/:id/read", async (c) => {
  const tokenUser = getUserFromToken(c.req.header("Authorization"));
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  const id = parseInt(c.req.param("id"));
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.user_id !== tokenUser.id) return c.json({ error: "Not found" }, 404);

  await prisma.notification.update({ where: { id }, data: { read: true } });
  return c.json({ success: true });
});

dataRoutes.patch("/notifications/read-all", async (c) => {
  const tokenUser = getUserFromToken(c.req.header("Authorization"));
  if (!tokenUser) return c.json({ error: "Unauthorized" }, 401);

  await prisma.notification.updateMany({
    where: { user_id: tokenUser.id, read: false },
    data: { read: true },
  });

  return c.json({ success: true });
});

export default dataRoutes;
