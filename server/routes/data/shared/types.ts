import type { Context } from "hono";
import type { Prisma } from "@prisma/client";
import type { TokenPayload } from "../../../lib/auth.ts";

export interface DataRouteEnv {
  user: TokenPayload;
}

export type DataContext = Context<{ Variables: DataRouteEnv }>;

export interface IndicatorInput {
  description?: string | null;
  target?: string | number | null;
}

export interface ActivityInput {
  phase?: string | null;
  name?: string | null;
  period?: string | null;
  periodStartMonth?: string | number | null;
  periodEndMonth?: string | number | null;
  persons?: string | null;
  outputs?: string | null;
  budgetAmount?: string | number | null;
  budgetSource?: string | null;
}

export interface FactorInput {
  facilitating?: string | null;
  hindering?: string | null;
  recommendations?: string | null;
  [activityId: string]: unknown;
}

export type FactorMapInput = Record<string, FactorInput>;

export interface ActivityReviewInput {
  aip_activity_id?: string | number | null;
  complied?: boolean | null;
  actual_tasks_conducted?: string | null;
  contributory_performance_indicators?: string | null;
  movs_expected_outputs?: string | null;
  adjustments?: string | null;
  is_unplanned?: boolean | null;
  physTarget?: string | number | null;
  finTarget?: string | number | null;
  physAcc?: string | number | null;
  finAcc?: string | number | null;
  actions?: string | null;
}

export type AIPWithActivities = Prisma.AIPGetPayload<{
  include: { activities: true };
}>;

export type AIPWithProgram = Prisma.AIPGetPayload<{
  include: { program: true };
}>;

export type AIPWithProgramActivities = Prisma.AIPGetPayload<{
  include: { activities: true; program: true };
}>;

export type AIPWithProgramSchool = Prisma.AIPGetPayload<{
  include: { program: true; school: true };
}>;

export type AIPWithProgramSchoolClusterActivities = Prisma.AIPGetPayload<{
  include: {
    activities: true;
    program: true;
    school: { include: { cluster: true } };
  };
}>;

export type PIRWithFactorsAndReviews = Prisma.PIRGetPayload<{
  include: { activity_reviews: true; factors: true };
}>;

export type PIRWithReviewActivitiesAndFactors = Prisma.PIRGetPayload<{
  include: {
    activity_reviews: { include: { aip_activity: true } };
    factors: true;
  };
}>;
