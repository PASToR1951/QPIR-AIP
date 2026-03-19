import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import jwt from "jsonwebtoken";

const dataRoutes = new Hono();
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "super-secret-default-key-change-me-in-production";

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
// DRAFTS (JSON file storage)
// ==========================================

const DRAFTS_DIR = path.join(Deno.cwd(), "data", "drafts");

dataRoutes.post('/drafts', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const { form_type, draft_data } = await c.req.json();

    if (!form_type || !draft_data) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Always use the authenticated user's ID — never trust a client-supplied user_id
    const userId = tokenUser.id;

    await ensureDir(DRAFTS_DIR);

    // Check if a draft already exists to reuse its file path
    let existingDraft = await prisma.draft.findUnique({
      where: {
        user_id_form_type: {
          user_id: userId,
          form_type: form_type.toUpperCase()
        }
      }
    });

    let filePath;
    if (existingDraft && existingDraft.file_path) {
        filePath = existingDraft.file_path;
    } else {
        const uniqueId = crypto.randomUUID();
        const fileName = `draft_${userId}_${form_type.toLowerCase()}_${uniqueId}.json`;
        filePath = path.join(DRAFTS_DIR, fileName);
    }

    await Deno.writeTextFile(filePath, JSON.stringify(draft_data, null, 2));

    const draft = await prisma.draft.upsert({
      where: {
        user_id_form_type: {
          user_id: userId,
          form_type: form_type.toUpperCase()
        }
      },
      update: { file_path: filePath },
      create: {
        user_id: userId,
        form_type: form_type.toUpperCase(),
        file_path: filePath
      }
    });

    return c.json({ message: 'Draft saved successfully', draft });
  } catch (error) {
    console.error('Failed to save draft:', error);
    return c.json({ error: 'Failed to save draft' }, 500);
  }
});

dataRoutes.get('/drafts/:formType/:userId', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const formType = c.req.param('formType').toUpperCase();
    const requestedId = parseInt(c.req.param('userId'));

    // Reject if the client is requesting a different user's draft
    if (tokenUser.id !== requestedId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const draft = await prisma.draft.findUnique({
      where: {
        user_id_form_type: {
          user_id: tokenUser.id,
          form_type: formType
        }
      }
    });

    if (!draft) {
      return c.json({ hasDraft: false });
    }

    try {
      const draftDataStr = await Deno.readTextFile(draft.file_path);
      const draftData = JSON.parse(draftDataStr);
      return c.json({ hasDraft: true, draftData, lastSaved: draft.updated_at });
    } catch (fsError) {
      console.error("Draft file not found, but DB entry exists:", fsError);
      return c.json({ hasDraft: false });
    }
  } catch (error) {
    console.error('Failed to load draft:', error);
    return c.json({ error: 'Failed to load draft' }, 500);
  }
});

dataRoutes.delete('/drafts/:formType/:userId', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);

    const formType = c.req.param('formType').toUpperCase();
    const requestedId = parseInt(c.req.param('userId'));

    if (tokenUser.id !== requestedId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const userId = tokenUser.id;

    const draft = await prisma.draft.findUnique({
      where: {
        user_id_form_type: {
          user_id: userId,
          form_type: formType
        }
      }
    });

    if (draft) {
      try {
        await Deno.remove(draft.file_path);
      } catch (e) {
        // Ignore file missing errors
      }
      await prisma.draft.delete({
        where: { id: draft.id }
      });
    }

    return c.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('Failed to delete draft:', error);
    return c.json({ error: 'Failed to delete draft' }, 500);
  }
});

// GET all Clusters
dataRoutes.get('/clusters', async (c) => {
  try {
    const clusters = await prisma.cluster.findMany({
      include: { schools: true }
    });
    return c.json(clusters);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch clusters' }, 500);
  }
});

// GET all Schools
dataRoutes.get('/schools', async (c) => {
  try {
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

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    const db = prisma.aIP as any;
    let aips: any[];
    if (tokenUser.role === 'School' && tokenUser.school_id) {
      aips = await db.findMany({
        where: { school_id: tokenUser.school_id, year },
        include: { program: true }
      });
    } else {
      aips = await db.findMany({
        where: { created_by_user_id: tokenUser.id, school_id: null, year },
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

    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

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
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

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

    const yearMatch = quarter.match(/CY (\d{4})/);
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

// POST a new AIP
dataRoutes.post('/aips', async (c) => {
  try {
    const body = await c.req.json();
    const {
      program_title,
      year,
      outcome,
      sip_title,
      project_coordinator,
      objectives,
      indicators,
      prepared_by_name,
      prepared_by_title,
      approved_by_name,
      approved_by_title,
      activities
    } = body;

    // Get the requesting user from JWT
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) {
      return c.json({ error: 'Authentication required' }, 401);
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

    const aip = await prisma.aIP.create({
      data: {
        school_id,
        program_id: program.id,
        created_by_user_id: tokenUser.id,
        year: parseInt(year),
        outcome,
        sip_title,
        project_coordinator,
        objectives,
        indicators,
        prepared_by_name: prepared_by_name || '',
        prepared_by_title: prepared_by_title || '',
        approved_by_name: approved_by_name || '',
        approved_by_title: approved_by_title || '',
        activities: {
          create: activities.map((act: any) => ({
            phase: act.phase,
            activity_name: act.name,
            implementation_period: act.period,
            period_start_month: act.periodStartMonth ? parseInt(act.periodStartMonth) : null,
            period_end_month: act.periodEndMonth ? parseInt(act.periodEndMonth) : null,
            persons_involved: act.persons,
            outputs: act.outputs,
            budget_amount: parseFloat(act.budgetAmount || 0),
            budget_source: act.budgetSource
          }))
        }
      },
      include: { activities: true }
    });

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

    const pir = await prisma.pIR.create({
      data: {
        aip_id: aip.id,
        created_by_user_id: tokenUser.id,
        quarter,
        program_owner,
        total_budget: parseFloat(total_budget || 0),
        fund_source,
        factors: {
          create: Object.entries(factors).map(([type, data]: [string, any]) => ({
            factor_type: type,
            facilitating_factors: data.facilitating,
            hindering_factors: data.hindering
          }))
        },
        activity_reviews: {
          create: activity_reviews.map((rev: any) => {
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
          })
        }
      }
    });

    return c.json({ message: 'PIR created successfully', pir });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to create PIR' }, 500);
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
    let aipCompleted = 0;
    if (tokenUser.role === 'Division Personnel') {
      aipCompleted = await prisma.aIP.count({
        where: { created_by_user_id: tokenUser.id, school_id: null, year }
      });
    } else if (tokenUser.school_id) {
      aipCompleted = await prisma.aIP.count({
        where: { school_id: tokenUser.school_id, year }
      });
    }
    const aipTotal = activePrograms;
    const aipPercentage = aipTotal > 0 ? Math.round((aipCompleted / aipTotal) * 100) : 0;

    // ── PIR Submitted (timeline-aware) ──────────────────
    const userAIPsWithActivities = await (prisma.aIP as any).findMany({
      where: tokenUser.role === 'Division Personnel'
        ? { created_by_user_id: tokenUser.id, school_id: null, year }
        : { school_id: tokenUser.school_id, year },
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

// GET /api/deadlines?year=YYYY — returns all 4 quarters with custom or default dates
dataRoutes.get('/deadlines', async (c) => {
  try {
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const dbDeadlines = await prisma.deadline.findMany({ where: { year } });

    const result = [1, 2, 3, 4].map(q => {
      const custom = dbDeadlines.find(d => d.quarter === q);
      return {
        quarter: q,
        date: buildDeadline(year, q, custom?.date).toISOString(),
        isCustom: !!custom
      };
    });

    return c.json(result);
  } catch (error) {
    console.error('Deadlines GET error:', error);
    return c.json({ error: 'Failed to fetch deadlines' }, 500);
  }
});

// POST /api/deadlines — upsert a deadline for a given year + quarter (Division Personnel only)
dataRoutes.post('/deadlines', async (c) => {
  try {
    const tokenUser = getUserFromToken(c.req.header('Authorization'));
    if (!tokenUser) return c.json({ error: 'Authentication required' }, 401);
    if (tokenUser.role !== 'Division Personnel') return c.json({ error: 'Forbidden' }, 403);

    const { year, quarter, date } = await c.req.json();

    if (!year || !quarter || !date) {
      return c.json({ error: 'year, quarter, and date are required' }, 400);
    }

    const deadline = await prisma.deadline.upsert({
      where: {
        year_quarter: { year: parseInt(year), quarter: parseInt(quarter) }
      },
      update: { date: new Date(date) },
      create: {
        year: parseInt(year),
        quarter: parseInt(quarter),
        date: new Date(date)
      }
    });

    return c.json(deadline);
  } catch (error) {
    console.error('Deadlines POST error:', error);
    return c.json({ error: 'Failed to save deadline' }, 500);
  }
});

export default dataRoutes;
