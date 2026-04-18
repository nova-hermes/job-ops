/**
 * Plan definitions, feature limits, and types for job-ops billing.
 * All payments are cosmetic — this is for practice/hobby only.
 */

export const PLAN_IDS = ["free", "pro_monthly", "pro_yearly", "lifetime"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  price: number; // USD, 0 for free
  interval: "month" | "year" | "once" | null;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  jobsPerSearch: number | null; // null = unlimited
  resumeGenerations: number | null;
  ghostwriterUses: number | null;
  applicationsPerDay: number | null;
  tracerLinks: number | null;
  visaSponsorFilter: boolean;
  exportToPdf: boolean;
  prioritySupport: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Get started with the basics",
    price: 0,
    interval: null,
    features: [
      "10 jobs per search",
      "3 resume generations",
      "3 ghostwriter uses",
      "5 applications per day",
      "5 active tracer links",
    ],
    limits: {
      jobsPerSearch: 10,
      resumeGenerations: 3,
      ghostwriterUses: 3,
      applicationsPerDay: 5,
      tracerLinks: 5,
      visaSponsorFilter: false,
      exportToPdf: false,
      prioritySupport: false,
    },
  },
  pro_monthly: {
    id: "pro_monthly",
    name: "Pro",
    tagline: "Unlimited everything",
    price: 9,
    interval: "month",
    features: [
      "Unlimited job searches",
      "Unlimited resume generations",
      "Unlimited ghostwriter uses",
      "Unlimited applications",
      "Unlimited tracer links",
      "Visa sponsor filter",
      "Export to PDF",
      "Priority support",
    ],
    limits: {
      jobsPerSearch: null,
      resumeGenerations: null,
      ghostwriterUses: null,
      applicationsPerDay: null,
      tracerLinks: null,
      visaSponsorFilter: true,
      exportToPdf: true,
      prioritySupport: true,
    },
  },
  pro_yearly: {
    id: "pro_yearly",
    name: "Pro",
    tagline: "Save 27% with annual billing",
    price: 79,
    interval: "year",
    features: [
      "Everything in Pro Monthly",
      "Save $29/year",
      "Priority support",
    ],
    limits: {
      jobsPerSearch: null,
      resumeGenerations: null,
      ghostwriterUses: null,
      applicationsPerDay: null,
      tracerLinks: null,
      visaSponsorFilter: true,
      exportToPdf: true,
      prioritySupport: true,
    },
  },
  lifetime: {
    id: "lifetime",
    name: "Lifetime",
    tagline: "One-time payment, forever access",
    price: 149,
    interval: "once",
    features: [
      "Everything in Pro",
      "One-time payment",
      "Lifetime updates",
      "Early access to new features",
    ],
    limits: {
      jobsPerSearch: null,
      resumeGenerations: null,
      ghostwriterUses: null,
      applicationsPerDay: null,
      tracerLinks: null,
      visaSponsorFilter: true,
      exportToPdf: true,
      prioritySupport: true,
    },
  },
};

/** Check if a plan is a paid plan (not free). */
export function isPaidPlan(planId: PlanId): boolean {
  return planId !== "free";
}

/** Get the plan definition for a given plan ID. */
export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId];
}

/** Get all plans as an array, sorted by price. */
export function getAllPlans(): PlanDefinition[] {
  return Object.values(PLANS).sort((a, b) => a.price - b.price);
}
