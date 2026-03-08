import { Hono } from "hono";
import { prisma } from "../db/client.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";

const dataRoutes = new Hono();

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

// GET all Programs
dataRoutes.get('/programs', async (c) => {
  try {
    const programs = await prisma.program.findMany();
    return c.json(programs);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Failed to fetch programs' }, 500);
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

// POST a new AIP
dataRoutes.post('/aips', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      school_id, 
      program_title, // We'll look up the program_id by title
      year, 
      pillar, 
      sip_title, 
      project_coordinator, 
      objectives, 
      indicators, 
      annual_target,
      activities 
    } = body;

    // Look up program_id
    const program = await prisma.program.findUnique({
      where: { title: program_title }
    });

    if (!program) {
      return c.json({ error: `Program '${program_title}' not found` }, 404);
    }

    const aip = await prisma.aIP.create({
      data: {
        school_id: parseInt(school_id),
        program_id: program.id,
        year: parseInt(year),
        pillar,
        sip_title,
        project_coordinator,
        objectives,
        indicators,
        annual_target,
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
      include: {
        activities: true
      }
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
      school_name,
      program_title,
      quarter,
      program_owner,
      total_budget,
      fund_source,
      activity_reviews,
      factors
    } = body;

    // Look up school
    const school = await prisma.school.findFirst({
      where: { name: school_name }
    });

    if (!school) {
        return c.json({ error: `School '${school_name}' not found` }, 404);
    }

    // Look up program
    const program = await prisma.program.findUnique({
      where: { title: program_title }
    });

    if (!program) {
      return c.json({ error: `Program '${program_title}' not found` }, 404);
    }

    // Find the AIP for this school, program, and year (derived from quarter string)
    // Extract year from "Xth Quarter CY 2026"
    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const aip = await prisma.aIP.findUnique({
      where: {
        school_id_program_id_year: {
          school_id: school.id,
          program_id: program.id,
          year
        }
      },
      include: {
        activities: true
      }
    });

    if (!aip) {
      return c.json({ error: 'Associated AIP not found for this school, program, and year' }, 404);
    }

    const pir = await prisma.pir.create({
      data: {
        aip_id: aip.id,
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
            // Find the AIP activity by name
            const aipActivity = aip.activities.find(a => a.activity_name === rev.name);
            return {
              aip_activity_id: aipActivity?.id || aip.activities[0].id, // Fallback if name mismatch
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
