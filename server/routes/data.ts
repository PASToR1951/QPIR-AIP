import { Hono } from "hono";
import { prisma } from "../db/client.ts";

const dataRoutes = new Hono();

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
