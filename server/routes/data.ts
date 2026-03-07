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

export default dataRoutes;
