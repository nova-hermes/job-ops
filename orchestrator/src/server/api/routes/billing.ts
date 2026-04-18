/**
 * Billing API routes — plan management, checkout, webhooks.
 * All payments are cosmetic (practice/hobby only).
 */

import { Router, type Request, type Response } from "express";
import { PLANS, type PlanId, PLAN_IDS } from "@shared/plans";
import { getCurrentPlan, setPlan, getPlanInfo } from "@server/services/plans";
import { logger } from "@infra/logger";

export const billingRouter = Router();

/** GET /api/billing/plan — current plan + usage */
billingRouter.get("/plan", async (_req: Request, res: Response) => {
  try {
    const info = await getPlanInfo();
    res.json({ ok: true, data: info });
  } catch (error) {
    logger.error("Failed to get plan info", { error });
    res.status(500).json({
      ok: false,
      error: { code: "PLAN_FETCH_FAILED", message: "Failed to fetch plan info" },
    });
  }
});

/** POST /api/billing/checkout — cosmetic Stripe checkout */
billingRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { planId } = req.body as { planId: string };

    if (!PLAN_IDS.includes(planId as PlanId)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_PLAN", message: "Invalid plan ID" },
      });
    }

    if (planId === "free") {
      return res.status(400).json({
        ok: false,
        error: { code: "FREE_PLAN", message: "Cannot checkout free plan" },
      });
    }

    // Cosmetic: simulate successful checkout
    // In production, this would create a Stripe checkout session
    await setPlan(planId as PlanId, {
      stripeCustomerId: "cosmetic_" + Date.now(),
      stripeSubscriptionId: planId === "lifetime" ? undefined : "cosmetic_sub_" + Date.now(),
    });

    logger.info("Cosmetic checkout completed", { planId });

    res.json({
      ok: true,
      data: {
        message: "Plan upgraded successfully",
        planId,
        simulated: true,
      },
    });
  } catch (error) {
    logger.error("Checkout failed", { error });
    res.status(500).json({
      ok: false,
      error: { code: "CHECKOUT_FAILED", message: "Checkout failed" },
    });
  }
});

/** POST /api/billing/crypto/checkout — cosmetic crypto checkout */
billingRouter.post("/crypto/checkout", async (req: Request, res: Response) => {
  try {
    const { planId } = req.body as { planId: string };

    if (!PLAN_IDS.includes(planId as PlanId)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_PLAN", message: "Invalid plan ID" },
      });
    }

    if (planId === "free") {
      return res.status(400).json({
        ok: false,
        error: { code: "FREE_PLAN", message: "Cannot checkout free plan" },
      });
    }

    // Cosmetic: simulate successful crypto payment
    await setPlan(planId as PlanId, {
      nowpaymentsPaymentId: "cosmetic_crypto_" + Date.now(),
    });

    logger.info("Cosmetic crypto checkout completed", { planId });

    res.json({
      ok: true,
      data: {
        message: "Crypto payment confirmed",
        planId,
        simulated: true,
      },
    });
  } catch (error) {
    logger.error("Crypto checkout failed", { error });
    res.status(500).json({
      ok: false,
      error: { code: "CRYPTO_CHECKOUT_FAILED", message: "Crypto checkout failed" },
    });
  }
});

/** POST /api/billing/portal — cosmetic Stripe portal */
billingRouter.post("/portal", async (_req: Request, res: Response) => {
  try {
    const { planId } = await getCurrentPlan();

    if (planId === "free") {
      return res.status(400).json({
        ok: false,
        error: { code: "NO_SUBSCRIPTION", message: "No active subscription" },
      });
    }

    // Cosmetic: simulate portal URL
    res.json({
      ok: true,
      data: {
        url: null,
        message: "Portal access simulated (cosmetic mode)",
        simulated: true,
      },
    });
  } catch (error) {
    logger.error("Portal creation failed", { error });
    res.status(500).json({
      ok: false,
      error: { code: "PORTAL_FAILED", message: "Failed to create portal session" },
    });
  }
});

/** POST /api/billing/webhook — cosmetic Stripe webhook */
billingRouter.post("/webhook", async (req: Request, res: Response) => {
  // Cosmetic: log webhook but don't process
  logger.info("Cosmetic Stripe webhook received", {
    type: req.body?.type,
    simulated: true,
  });
  res.json({ received: true, simulated: true });
});

/** POST /api/billing/crypto/webhook — cosmetic NOWPayments IPN */
billingRouter.post("/crypto/webhook", async (req: Request, res: Response) => {
  // Cosmetic: log webhook but don't process
  logger.info("Cosmetic NOWPayments IPN received", {
    paymentStatus: req.body?.payment_status,
    simulated: true,
  });
  res.json({ received: true, simulated: true });
});

/** POST /api/billing/downgrade — downgrade to free */
billingRouter.post("/downgrade", async (_req: Request, res: Response) => {
  try {
    await setPlan("free");
    logger.info("Plan downgraded to free");
    res.json({
      ok: true,
      data: { message: "Downgraded to Free plan", planId: "free" },
    });
  } catch (error) {
    logger.error("Downgrade failed", { error });
    res.status(500).json({
      ok: false,
      error: { code: "DOWNGRADE_FAILED", message: "Failed to downgrade" },
    });
  }
});
