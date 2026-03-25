import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import jwt from "jsonwebtoken";
import {
  getSYBounds, getCurrentPeriod, getPeriodLabel,
  activityOverlapsPeriod, buildPeriodDeadline,
} from "../lib/termConfig.ts";
import { loadTermConfig } from "../lib/loadTermConfig.ts";
import { JWT_SECRET } from "../lib/config.ts";

const dataRoutes = new Hono();

// ==========================================
// AUTH HELPER
// ==========================================

interface TokenPayload {
  id: number;
  role: string;          // "School" | "Division Personnel"
  school_id: number | null;
  email: string;
  name: string | null;
}

function getUserFromToken(authHeader: string | undefined): TokenPayload | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
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

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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

    const aipData = {
      outcome: outcome || '',
      sip_title: sip_title || '',
      project_coordinator: project_coordinator || '',
      objectives: objectives || [],
      indicators: indicators || [],
      prepared_by_name: prepared_by_name || '',
      prepared_by_title: prepared_by_title || '',
      approved_by_name: approved_by_name || '',
      approved_by_title: approved_by_title || '',
      status: 'Draft',
    };

    const activityData = (activities || []).map((act: any) => ({
      phase: act.phase || '',
      activity_name: act.name || '',
      implementation_period: act.period || '',
      period_start_month: act.periodStartMonth ? parseInt(act.periodStartMonth) : null,
      period_end_month: act.periodEndMonth ? parseInt(act.periodEndMonth) : null,
      persons_involved: act.persons || '',
      outputs: act.outputs || '',
      budget_amount: parseFloat(act.budgetAmount || 0),
      budget_source: act.budgetSource || ''
    }));

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

    const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

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
    const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

    let where: any = { status: 'Draft', year };

    if (tokenUser.role === 'School' && tokenUser.school_id) {
      where.school_id = tokenUser.school_id;
    } else {
      where.created_by_user_id = tokenUser.id;
      where.school_id = null;
    }

    if (program_title) {
      const program = await prisma.program.findUnique({ where: { title: program_title } });
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
    const { program_title, quarter, program_owner, total_budget, fund_source,
            activity_reviews, factors } = body;

    if (!program_title || !quarter) return c.json({ error: 'program_title and quarter are required' }, 400);

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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
      total_budget: parseFloat(total_budget || 0),
      fund_source: fund_source || '',
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
              hindering_factors: data.hindering || ''
            })) : []
          },
          activity_reviews: {
            create: (activity_reviews || []).map((rev: any) => ({
              aip_activity_id: parseInt(rev.aip_activity_id) || aip!.activities[0]?.id,
              physical_target: parseFloat(rev.physTarget || 0),
              financial_target: parseFloat(rev.finTarget || 0),
              physical_accomplished: parseFloat(rev.physAcc || 0),
              financial_accomplished: parseFloat(rev.finAcc || 0),
              actions_to_address_gap: rev.actions || ''
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
              hindering_factors: data.hindering || ''
            })) : []
          },
          activity_reviews: {
            create: (activity_reviews || []).map((rev: any) => ({
              aip_activity_id: parseInt(rev.aip_activity_id) || aip!.activities[0]?.id,
              physical_target: parseFloat(rev.physTarget || 0),
              financial_target: parseFloat(rev.finTarget || 0),
              physical_accomplished: parseFloat(rev.physAcc || 0),
              financial_accomplished: parseFloat(rev.finAcc || 0),
              actions_to_address_gap: rev.actions || ''
            }))
          }
        }
      });
    }

    return c.json({ message: 'PIR draft saved successfully', pir });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return c.json({ error: 'A PIR already exists for this quarter' }, 409);
    }
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

    const yearMatch = quarter?.match(/SY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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
      factorsMap[f.factor_type] = { facilitating: f.facilitating_factors, hindering: f.hindering_factors };
    }

    return c.json({
      hasDraft: true,
      draftData: {
        program: program_title,
        quarter: pir.quarter,
        owner: pir.program_owner,
        fundSource: pir.fund_source,
        rawBudget: String(pir.total_budget),
        activities: pir.activity_reviews.map((r: any) => ({
          aip_activity_id: r.aip_activity_id,
          physTarget: r.physical_target,
          finTarget: r.financial_target,
          physAcc: r.physical_accomplished,
          finAcc: r.financial_accomplished,
          actions: r.actions_to_address_gap || ''
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

    const yearMatch = quarter.match(/SY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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
      // Division Personnel: only assigned programs
      const user = await prisma.user.findUnique({
        where: { id: tokenUser.id },
        include: { programs: { orderBy: { title: 'asc' } } }
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

    const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

    const db = prisma.aIP as any;
    // Only include AIPs that are Verified or Approved — Draft/Pending AIPs should not unlock PIR filing
    const statusFilter = { status: { notIn: ['Draft', 'Pending'] } };
    let aips: any[];
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aips = await db.findMany({
        where: { school_id: tokenUser.school_id, year, ...statusFilter },
        include: { program: true }
      });
    } else {
      aips = await db.findMany({
        where: { created_by_user_id: tokenUser.id, school_id: null, year, ...statusFilter },
        include: { program: true }
      });
    }

    const programs = aips.map((aip: any) => aip.program).sort((a: any, b: any) => a.title.localeCompare(b.title));
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

    const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

    let pirs: any[];
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      pirs = await prisma.pIR.findMany({
        where: { aip: { school_id: tokenUser.school_id, year } },
        include: { aip: { include: { program: true } } }
      });
    } else {
      pirs = await prisma.pIR.findMany({
        where: { aip: { created_by_user_id: tokenUser.id, school_id: null, year } },
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
  const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

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

// GET AIP status for a Division Personnel user
dataRoutes.get('/users/:id/aip-status', async (c) => {
  const tokenUser = getUserFromToken(c.req.header('Authorization'));
  if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

  const user_id = parseInt(c.req.param('id'));
  const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

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
    const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

    if (!program_title) {
      return c.json({ error: 'program_title is required' }, 400);
    }

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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

    if (aip.status === 'Pending') {
      return c.json({ error: 'This AIP is pending verification and cannot be used for PIR yet.' }, 403);
    }

    const totalBudget = aip.activities.reduce((sum: number, a: any) => sum + (parseFloat(a.budget_amount) || 0), 0);
    const fundSources = [...new Set(aip.activities.map((a: any) => a.budget_source).filter(Boolean))].join(' / ');

    return c.json({
      aip_id: aip.id,
      project_coordinator: aip.project_coordinator || '',
      total_budget: totalBudget,
      fund_source: fundSources,
      activities: aip.activities.map((a: any) => ({
        id: a.id,
        activity_name: a.activity_name,
        implementation_period: a.implementation_period,
        period_start_month: a.period_start_month,
        period_end_month: a.period_end_month,
        phase: a.phase,
        budget_amount: a.budget_amount
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
    const year = parseInt(c.req.query('year') || String(getSYBounds(new Date()).start));

    if (!program_title) return c.json({ error: 'program_title is required' }, 400);

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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

// GET full PIR record for read-only view (submitted form)
dataRoutes.get('/pirs', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const program_title = c.req.query('program_title') || '';
    const quarter = c.req.query('quarter') || '';

    if (!program_title || !quarter) return c.json({ error: 'program_title and quarter are required' }, 400);

    const yearMatch = quarter.match(/SY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const program = await prisma.program.findUnique({ where: { title: program_title } });
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

    const factorsMap: Record<string, { facilitating: string; hindering: string }> = {};
    for (const f of pir.factors) {
      factorsMap[f.factor_type] = {
        facilitating: f.facilitating_factors,
        hindering: f.hindering_factors,
      };
    }

    return c.json({
      quarter: pir.quarter,
      program: aip.program.title,
      school: aip.school?.name ?? '',
      owner: pir.program_owner,
      budget: pir.total_budget,
      fundSource: pir.fund_source,
      activities: pir.activity_reviews.map((r: any) => ({
        id: r.id,
        name: r.aip_activity.activity_name,
        implementation_period: r.aip_activity.implementation_period,
        period_start_month: r.aip_activity.period_start_month,
        period_end_month: r.aip_activity.period_end_month,
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

const AIP_DOCS_DIR = Deno.env.get("UPLOAD_DIR") || "/var/lib/qpir-aip/uploads/pdfs";
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

// POST a new AIP
// Accepts both JSON (wizard/full mode) and multipart/form-data (beta mode with PDF upload)
dataRoutes.post('/aips', async (c) => {
  try {
    // Get the requesting user from JWT
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    let program_title: string, year: string, outcome: string, sip_title: string,
        project_coordinator: string, objectives: any, indicators: any,
        prepared_by_name: string, prepared_by_title: string,
        approved_by_name: string, approved_by_title: string,
        activities: any[], isBetaSubmission = false;
    let verificationDocPath: string | null = null;

    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Beta fast-entry submission with optional PDF
      const formData = await c.req.formData();
      program_title = formData.get('program_title') as string;
      year = formData.get('year') as string;
      outcome = formData.get('outcome') as string;
      sip_title = formData.get('sip_title') as string;
      project_coordinator = formData.get('project_coordinator') as string;
      objectives = JSON.parse(formData.get('objectives') as string || '[]');
      indicators = JSON.parse(formData.get('indicators') as string || '[]');
      prepared_by_name = formData.get('prepared_by_name') as string || '';
      prepared_by_title = formData.get('prepared_by_title') as string || '';
      approved_by_name = formData.get('approved_by_name') as string || '';
      approved_by_title = formData.get('approved_by_title') as string || '';
      activities = JSON.parse(formData.get('activities') as string || '[]');
      isBetaSubmission = true;

      const pdfFile = formData.get('verification_document') as File | null;
      if (pdfFile) {
        // Validate PDF
        if (!pdfFile.name.toLowerCase().endsWith('.pdf') && pdfFile.type !== 'application/pdf') {
          return c.json({ error: 'Only PDF files are accepted for the verification document.' }, 400);
        }
        if (pdfFile.size > MAX_PDF_SIZE) {
          return c.json({ error: 'Verification document exceeds 5 MB limit.' }, 400);
        }

        // Build organized directory path:
        //   School users:    {base}/{cluster_number}/{level}/{school_name}/{program_name}/
        //   Division Personnel: {base}/sdo/{program_name}/
        const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_\-. ]/g, '').replace(/\s+/g, '_').toLowerCase();
        let pdfSubDir: string;

        if (tokenUser.role === 'School' && tokenUser.school_id) {
          const school = await prisma.school.findUnique({
            where: { id: tokenUser.school_id },
            include: { cluster: true }
          });
          if (!school) return c.json({ error: 'School not found' }, 404);
          pdfSubDir = path.join(
            AIP_DOCS_DIR,
            String(school.cluster.cluster_number),
            sanitize(school.level),
            sanitize(school.name),
            sanitize(program_title)
          );
        } else {
          pdfSubDir = path.join(AIP_DOCS_DIR, 'sdo', sanitize(program_title));
        }

        await ensureDir(pdfSubDir);
        const uniqueId = crypto.randomUUID();
        const fileName = `aip_doc_${uniqueId}.pdf`;
        const filePath = path.join(pdfSubDir, fileName);
        const buffer = await pdfFile.arrayBuffer();
        await Deno.writeFile(filePath, new Uint8Array(buffer));
        verificationDocPath = filePath;
      }
    } else {
      // Standard JSON submission (wizard / full form)
      const body = await c.req.json();
      ({ program_title, year, outcome, sip_title, project_coordinator,
         objectives, indicators, prepared_by_name, prepared_by_title,
         approved_by_name, approved_by_title, activities } = body);
    }

    // Look up program_id
    const program = await prisma.program.findUnique({
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
    const newStatus = isBetaSubmission ? 'Pending' : 'Submitted';

    const aipFields = {
      outcome,
      sip_title,
      project_coordinator,
      objectives,
      indicators,
      prepared_by_name: prepared_by_name || '',
      prepared_by_title: prepared_by_title || '',
      approved_by_name: approved_by_name || '',
      approved_by_title: approved_by_title || '',
      status: newStatus,
      verification_document_path: verificationDocPath,
    };

    const activityFields = activities.map((act: any) => ({
      phase: act.phase,
      activity_name: act.name,
      implementation_period: act.period,
      period_start_month: act.periodStartMonth ? parseInt(act.periodStartMonth) : null,
      period_end_month: act.periodEndMonth ? parseInt(act.periodEndMonth) : null,
      persons_involved: act.persons,
      outputs: act.outputs,
      budget_amount: parseFloat(act.budgetAmount || 0),
      budget_source: act.budgetSource
    }));

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
    if (existingDraft && existingDraft.status === 'Draft') {
      // Promote draft to submitted: delete old activities and replace
      await prisma.aIPActivity.deleteMany({ where: { aip_id: existingDraft.id } });
      aip = await prisma.aIP.update({
        where: { id: existingDraft.id },
        data: {
          ...aipFields,
          activities: { create: activityFields }
        },
        include: { activities: true }
      });
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
          title: 'New AIP Submitted',
          message: `${schoolLabel} submitted an AIP for ${program_title} (FY ${year}).`,
          type: 'aip_submitted',
        })),
      });
    }

    return c.json({ message: 'AIP created successfully', aip });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to create AIP' }, 500);
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
      total_budget,
      fund_source,
      activity_reviews,
      factors
    } = body;

    // Get the requesting user from JWT
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Look up program
    const program = await prisma.program.findUnique({
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
        include: { activities: true }
      });
    } else {
      // Division Personnel: find AIP by user + program + year (school is null)
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
      return c.json({ error: 'Associated AIP not found for this program and year' }, 404);
    }

    // Verify the user can access this AIP
    if (tokenUser.role === 'Division Personnel' && aip.created_by_user_id !== tokenUser.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Block PIR submission if the AIP is still Pending verification
    if (aip.status === 'Pending') {
      return c.json({ error: 'This AIP is pending verification by Division Personnel. PIR submission is not allowed until the AIP is verified.' }, 403);
    }

    const factorData = Object.entries(factors).map(([type, data]: [string, any]) => ({
      factor_type: type,
      facilitating_factors: data.facilitating,
      hindering_factors: data.hindering
    }));

    const reviewData = activity_reviews.map((rev: any) => {
      const aipActivityId = rev.aip_activity_id
        ? parseInt(rev.aip_activity_id)
        : aip!.activities.find(a => a.activity_name === rev.name)?.id || aip!.activities[0].id;
      return {
        aip_activity_id: aipActivityId,
        physical_target: parseFloat(rev.physTarget || 0),
        financial_target: parseFloat(rev.finTarget || 0),
        physical_accomplished: parseFloat(rev.physAcc || 0),
        financial_accomplished: parseFloat(rev.finAcc || 0),
        actions_to_address_gap: rev.actions
      };
    });

    // Check if a Draft PIR exists — promote it instead of creating a new one
    const existingDraft = await prisma.pIR.findUnique({
      where: { aip_id_quarter: { aip_id: aip.id, quarter } }
    });

    let pir;
    if (existingDraft && existingDraft.status === 'Draft') {
      await prisma.pIRActivityReview.deleteMany({ where: { pir_id: existingDraft.id } });
      await prisma.pIRFactor.deleteMany({ where: { pir_id: existingDraft.id } });
      pir = await prisma.pIR.update({
        where: { id: existingDraft.id },
        data: {
          program_owner,
          total_budget: parseFloat(total_budget || 0),
          fund_source,
          status: 'Submitted',
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
          total_budget: parseFloat(total_budget || 0),
          fund_source,
          factors: { create: factorData },
          activity_reviews: { create: reviewData }
        }
      });
    }

    // Notify all admins that a new PIR was submitted
    const pirSchoolLabel = aip.school_id
      ? (await prisma.school.findUnique({ where: { id: aip.school_id }, select: { name: true } }))?.name ?? 'A school'
      : (tokenUser.name ?? tokenUser.email ?? 'Division Personnel');
    const pirAdmins = await prisma.user.findMany({ where: { role: 'Admin' }, select: { id: true } });
    if (pirAdmins.length > 0) {
      await prisma.notification.createMany({
        data: pirAdmins.map(admin => ({
          user_id: admin.id,
          title: 'New PIR Submitted',
          message: `${pirSchoolLabel} submitted a PIR for ${program_title} (${quarter}).`,
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

// ==========================================
// TRIMESTER / DEADLINE HELPERS
// ==========================================
// Helpers are now imported from server/lib/termConfig.ts and loaded from DB
// via loadTermConfig(). The helpers below are retained as thin wrappers for
// any call sites that use the old signatures within this file.

// ==========================================
// DASHBOARD
// ==========================================

// GET /api/dashboard — aggregated stats for the authenticated user
dataRoutes.get('/dashboard', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const today = new Date();
    const termCfg = await loadTermConfig();
    const sy = getSYBounds(today);
    // Allow override via ?year= (interpreted as SY start year)
    const syStartParam = c.req.query('year');
    const syStart = syStartParam ? parseInt(syStartParam) : sy.start;
    const syEnd = syStart + 1;

    const currentTrimester = getCurrentPeriod(termCfg, today);

    // Load any admin-set deadlines for this SY start year
    const customDeadlines = await prisma.deadline.findMany({ where: { year: syStart } });
    const getDeadline = (t: number) =>
      buildPeriodDeadline(termCfg, syStart, t, customDeadlines.find(d => d.quarter === t)?.date);

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
          school_level_requirement: { in: levelFilter as string[] }
        }
      });
    }

    // ── AIP Completion ───────────────────────────────────
    let aipCompleted = 0;
    if (tokenUser.role === 'Division Personnel') {
      aipCompleted = await prisma.aIP.count({
        where: { created_by_user_id: tokenUser.id, school_id: null, year: syStart }
      });
    } else if (tokenUser.school_id) {
      aipCompleted = await prisma.aIP.count({
        where: { school_id: tokenUser.school_id, year: syStart }
      });
    }
    const aipTotal = activePrograms;
    const aipPercentage = aipTotal > 0 ? Math.round((aipCompleted / aipTotal) * 100) : 0;

    // ── PIR Submitted (timeline-aware) ──────────────────
    const userAIPsWithActivities = await (prisma.aIP as any).findMany({
      where: tokenUser.role === 'Division Personnel'
        ? { created_by_user_id: tokenUser.id, school_id: null, year: syStart }
        : { school_id: tokenUser.school_id, year: syStart },
      select: {
        id: true,
        activities: { select: { period_start_month: true, period_end_month: true, budget_amount: true } }
      }
    });
    const allAipIds: number[] = userAIPsWithActivities.map((a: any) => a.id);

    // Helper: check if an AIP has activities in a given period
    const aipHasActivitiesInTrimester = (aip: any, t: number) =>
      aip.activities.some((a: any) =>
        a.period_start_month && a.period_end_month
          ? activityOverlapsPeriod(termCfg, a.period_start_month, a.period_end_month, t)
          : true // Legacy data without structured months — assume relevant
      );

    // Current period: only count AIPs with activities this period
    const aipsRelevantThisTrimester = userAIPsWithActivities.filter(
      (aip: any) => aipHasActivitiesInTrimester(aip, currentTrimester)
    );
    const pirTotal = aipsRelevantThisTrimester.length;
    const relevantAipIds: number[] = aipsRelevantThisTrimester.map((a: any) => a.id);

    const currentTrimesterLabel = getPeriodLabel(termCfg, currentTrimester, syStart);
    const pirSubmittedCount = relevantAipIds.length > 0
      ? await prisma.pIR.count({
          where: { aip_id: { in: relevantAipIds }, quarter: currentTrimesterLabel }
        })
      : 0;

    // ── Total Planned Budget ──────────────────────────────
    const totalPlannedBudget = userAIPsWithActivities.reduce((sum: number, aip: any) =>
      sum + aip.activities.reduce((s: number, a: any) => s + (parseFloat(a.budget_amount) || 0), 0)
    , 0);

    // ── Periods (timeline-aware, config-driven) ─────────────
    const quarters = await Promise.all(termCfg.periods.map(async (pd) => {
      const t = pd.number;
      const deadline = getDeadline(t);
      const label = getPeriodLabel(termCfg, t, syStart);

      // Check if any AIPs have activities in this period
      const hasActivities = userAIPsWithActivities.some(
        (aip: any) => aipHasActivitiesInTrimester(aip, t)
      );

      // Count relevant AIPs and submitted PIRs for this period
      const relevantIds = userAIPsWithActivities
        .filter((aip: any) => aipHasActivitiesInTrimester(aip, t))
        .map((a: any) => a.id);
      const tTotal = relevantIds.length;
      const tSubmitted = tTotal > 0
        ? await prisma.pIR.count({ where: { aip_id: { in: relevantIds }, quarter: label } })
        : 0;

      let status: string;
      if (!hasActivities && allAipIds.length > 0) {
        status = 'No Activities';
      } else if (t > currentTrimester) {
        status = 'Locked';
      } else if (t === currentTrimester && today <= deadline) {
        status = 'In Progress';
      } else {
        status = tSubmitted >= tTotal && tTotal > 0 ? 'Submitted' : (tTotal > 0 ? 'Missed' : 'No Activities');
      }

      return {
        name: `${pd.prefix}${t}`,
        status,
        deadline: deadline.toISOString(),
        submitted: tSubmitted,
        total: tTotal
      };
    }));

    const currentDeadline = getDeadline(currentTrimester);

    return c.json({
      activePrograms,
      aipCompletion: { completed: aipCompleted, total: aipTotal, percentage: aipPercentage },
      pirSubmitted: { submitted: pirSubmittedCount, total: pirTotal },
      totalPlannedBudget,
      currentQuarter: currentTrimester,
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
// AIP VERIFICATION (Division Personnel)
// ==========================================

// GET /api/aips/pending — returns all Pending AIPs for Division Personnel to verify
dataRoutes.get('/aips/pending', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);
    if (tokenUser.role !== 'Division Personnel') {
      return c.json({ error: 'Division Personnel access required' }, 403);
    }

    // Return Pending AIPs for programs assigned to this Division Personnel user
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      include: { programs: true }
    });
    const programIds = user?.programs.map(p => p.id) ?? [];

    const aips = await prisma.aIP.findMany({
      where: {
        status: 'Pending',
        program_id: { in: programIds }
      },
      include: {
        school: { select: { name: true } },
        program: { select: { title: true } },
        activities: true
      },
      orderBy: { created_at: 'asc' }
    });

    return c.json(aips);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch pending AIPs' }, 500);
  }
});

// GET /api/aips/:id/document — serve the uploaded PDF for verification
dataRoutes.get('/aips/:id/document', async (c) => {
  try {
    // Support both Authorization header and ?token= query param (for iframe embeds)
    const authHeader = c.req.header('Authorization') || (c.req.query('token') ? `Bearer ${c.req.query('token')}` : undefined);
    const tokenUser = getUserFromToken(authHeader);
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);
    if (tokenUser.role !== 'Division Personnel') {
      return c.json({ error: 'Division Personnel access required' }, 403);
    }

    const aipId = parseInt(c.req.param('id'));
    const aip = await prisma.aIP.findUnique({ where: { id: aipId } });
    if (!aip) return c.json({ error: 'AIP not found' }, 404);
    if (!aip.verification_document_path) {
      return c.json({ error: 'No verification document for this AIP' }, 404);
    }

    const fileData = await Deno.readFile(aip.verification_document_path);
    return new Response(fileData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="aip_document_${aipId}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to serve document' }, 500);
  }
});

// POST /api/aips/:id/verify — mark an AIP as Verified
dataRoutes.post('/aips/:id/verify', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);
    if (tokenUser.role !== 'Division Personnel') {
      return c.json({ error: 'Division Personnel access required' }, 403);
    }

    const aipId = parseInt(c.req.param('id'));
    const aip = await prisma.aIP.findUnique({
      where: { id: aipId },
      include: { program: { include: { personnel: true } } }
    });
    if (!aip) return c.json({ error: 'AIP not found' }, 404);
    if (aip.status !== 'Pending') {
      return c.json({ error: 'Only Pending AIPs can be verified' }, 400);
    }
    // Ensure this Division Personnel is assigned to the AIP's program
    const isAssigned = aip.program.personnel.some(p => p.id === tokenUser.id);
    if (!isAssigned) {
      return c.json({ error: 'You are not assigned to this program' }, 403);
    }

    const updated = await prisma.aIP.update({
      where: { id: aipId },
      data: { status: 'Verified' }
    });
    return c.json({ message: 'AIP verified successfully', aip: updated });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to verify AIP' }, 500);
  }
});

// POST /api/aips/:id/return — return an AIP for correction
dataRoutes.post('/aips/:id/return', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);
    if (tokenUser.role !== 'Division Personnel') {
      return c.json({ error: 'Division Personnel access required' }, 403);
    }

    const aipId = parseInt(c.req.param('id'));
    const aip = await prisma.aIP.findUnique({
      where: { id: aipId },
      include: { program: { include: { personnel: true } } }
    });
    if (!aip) return c.json({ error: 'AIP not found' }, 404);
    if (aip.status !== 'Pending') {
      return c.json({ error: 'Only Pending AIPs can be returned' }, 400);
    }
    const isAssigned = aip.program.personnel.some(p => p.id === tokenUser.id);
    if (!isAssigned) {
      return c.json({ error: 'You are not assigned to this program' }, 403);
    }

    const updated = await prisma.aIP.update({
      where: { id: aipId },
      data: { status: 'Returned' }
    });
    return c.json({ message: 'AIP returned for correction', aip: updated });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to return AIP' }, 500);
  }
});

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
