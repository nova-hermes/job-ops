/**
 * Plan service — manages user plan state and feature access.
 */

import { db } from "@server/db";
import { userPlans } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { PlanId, PlanLimits } from "@shared/plans";
import { PLANS, isPaidPlan } from "@shared/plans";

/** Get the current user plan (single-user instance). */
export async function getCurrentPlan(): Promise<{
  planId: PlanId;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}> {
  const rows = db.select().from(userPlans).limit(1).all();
  if (rows.length === 0) {
    // No plan row yet — create default free plan
    db.insert(userPlans).values({ plan: "free" }).run();
    return { planId: "free", stripeCustomerId: null, stripeSubscriptionId: null };
  }
  const row = rows[0];
  return {
    planId: (row.plan as PlanId) || "free",
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
  };
}

/** Set the current user plan. */
export async function setPlan(
  planId: PlanId,
  metadata?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    nowpaymentsPaymentId?: string;
  }
): Promise<void> {
  const rows = db.select().from(userPlans).limit(1).all();
  if (rows.length === 0) {
    db.insert(userPlans)
      .values({
        plan: planId,
        stripeCustomerId: metadata?.stripeCustomerId ?? null,
        stripeSubscriptionId: metadata?.stripeSubscriptionId ?? null,
        nowpaymentsPaymentId: metadata?.nowpaymentsPaymentId ?? null,
      })
      .run();
  } else {
    db.update(userPlans)
      .set({
        plan: planId,
        stripeCustomerId: metadata?.stripeCustomerId ?? rows[0].stripeCustomerId,
        stripeSubscriptionId: metadata?.stripeSubscriptionId ?? rows[0].stripeSubscriptionId,
        nowpaymentsPaymentId: metadata?.nowpaymentsPaymentId ?? rows[0].nowpaymentsPaymentId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userPlans.id, rows[0].id))
      .run();
  }
}

/** Get the limits for the current plan. */
export async function getCurrentLimits(): Promise<PlanLimits> {
  const { planId } = await getCurrentPlan();
  return PLANS[planId].limits;
}

/** Check if a specific feature is allowed on the current plan. */
export async function isFeatureAllowed(
  feature: keyof PlanLimits
): Promise<boolean> {
  const limits = await getCurrentLimits();
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  return value !== null; // null = unlimited = allowed
}

/** Check if a usage-based limit has been reached. */
export async function isLimitReached(
  feature: keyof PlanLimits,
  currentUsage: number
): Promise<boolean> {
  const limits = await getCurrentLimits();
  const limit = limits[feature];
  if (limit === null) return false; // unlimited
  if (typeof limit === "boolean") return !limit;
  return currentUsage >= limit;
}

/** Get plan info for API response. */
export async function getPlanInfo() {
  const { planId, stripeCustomerId, stripeSubscriptionId } = await getCurrentPlan();
  const plan = PLANS[planId];
  return {
    planId,
    planName: plan.name,
    isPaid: isPaidPlan(planId),
    limits: plan.limits,
    features: plan.features,
    stripeCustomerId,
    stripeSubscriptionId,
  };
}
