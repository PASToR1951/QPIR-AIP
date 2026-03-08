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
    // Fallback to mock data if database is not available
    console.warn('Database unavailable, using mock data:', error);
    return c.json({ hasAIP: false, count: 0 });
  }
});

export default dataRoutes;
