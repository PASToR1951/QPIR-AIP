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
    const { user_id, form_type, draft_data } = await c.req.json();

    if (!user_id || !form_type || !draft_data) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    await ensureDir(DRAFTS_DIR);

    // Check if a draft already exists to reuse its file path
    let existingDraft = await prisma.draft.findUnique({
      where: {
        user_id_form_type: {
          user_id: parseInt(user_id),
          form_type: form_type.toUpperCase()
        }
      }
    });

    let filePath;
    if (existingDraft && existingDraft.file_path) {
        filePath = existingDraft.file_path;
    } else {
        const uniqueId = crypto.randomUUID();
        const fileName = `draft_${user_id}_${form_type.toLowerCase()}_${uniqueId}.json`;
        filePath = path.join(DRAFTS_DIR, fileName);
    }

    // Save JSON to file
    await Deno.writeTextFile(filePath, JSON.stringify(draft_data, null, 2));

    // Update database
    const draft = await prisma.draft.upsert({
      where: {
        user_id_form_type: {
          user_id: parseInt(user_id),
          form_type: form_type.toUpperCase()
        }
      },
      update: {
        file_path: filePath
      },
      create: {
        user_id: parseInt(user_id),
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
    const formType = c.req.param('formType').toUpperCase();
    const userId = parseInt(c.req.param('userId'));

    const draft = await prisma.draft.findUnique({
      where: {
        user_id_form_type: {
          user_id: userId,
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
    const formType = c.req.param('formType').toUpperCase();
    const userId = parseInt(c.req.param('userId'));

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

// GET AIP status for a school
dataRoutes.get('/schools/:id/aip-status', async (c) => {
  const school_id = parseInt(c.req.param('id'));
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  try {
    const aipCount = await prisma.aIP.count({
      where: {
        school_id,
        year
      }
    });
    return c.json({ hasAIP: aipCount > 0, count: aipCount });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP status' }, 500);
  }
});

// GET AIP status for a Division Personnel user
dataRoutes.get('/users/:id/aip-status', async (c) => {
  const user_id = parseInt(c.req.param('id'));
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  try {
    const aipCount = await prisma.aIP.count({
      where: {
        created_by_user_id: user_id,
        school_id: null,
        year
      }
    });
    return c.json({ hasAIP: aipCount > 0, count: aipCount });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP status' }, 500);
  }
});

// GET AIP activities for PIR pre-population
// Supports both school-based (school_id + program_title + year)
// and user-based (user_id + program_title + year) for Division Personnel
dataRoutes.get('/aips/activities', async (c) => {
  try {
    const program_title = c.req.query('program_title') || '';
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

    if (!program_title) {
      return c.json({ error: 'program_title is required' }, 400);
    }

    const program = await prisma.program.findUnique({
      where: { title: program_title }
    });

    if (!program) {
      return c.json({ error: `Program '${program_title}' not found` }, 404);
    }

    let aip: any;

    const school_id_str = c.req.query('school_id');
    const user_id_str = c.req.query('user_id');

    if (school_id_str) {
      // School User path
      const school_id = parseInt(school_id_str);
      aip = await prisma.aIP.findUnique({
        where: {
          school_id_program_id_year: { school_id, program_id: program.id, year }
        },
        include: { activities: true }
      });
    } else if (user_id_str) {
      // Division Personnel path — find by created_by_user_id with null school
      const user_id = parseInt(user_id_str);
      aip = await prisma.aIP.findFirst({
        where: {
          created_by_user_id: user_id,
          school_id: null,
          program_id: program.id,
          year
        },
        include: { activities: true }
      });
    } else {
      return c.json({ error: 'school_id or user_id is required' }, 400);
    }

    if (!aip) {
      return c.json({ error: 'No AIP found for this program and year' }, 404);
    }

    return c.json({
      aip_id: aip.id,
      activities: aip.activities.map(a => ({
        id: a.id,
        activity_name: a.activity_name,
        implementation_period: a.implementation_period,
        phase: a.phase,
        budget_amount: a.budget_amount
      }))
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch AIP activities' }, 500);
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

    const pir = await prisma.pir.create({
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

export default dataRoutes;
