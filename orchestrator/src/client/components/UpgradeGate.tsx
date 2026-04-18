import * as api from "@client/api";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import type { PlanLimits } from "@shared/plans";

interface UpgradeGateProps {
  /** The feature key to check against plan limits */
  feature: keyof PlanLimits;
  /** Content to show when user has access */
  children: ReactNode;
  /** Optional custom fallback when access is denied */
  fallback?: ReactNode;
  /** Optional: show inline instead of blocking */
  inline?: boolean;
}

/**
 * Wraps content that requires a paid plan.
 * Shows an upgrade prompt if the user is on the free plan.
 */
export function UpgradeGate({
  feature,
  children,
  fallback,
  inline = false,
}: UpgradeGateProps) {
  const { data: planInfo, isLoading } = useQuery({
    queryKey: ["billing", "plan"],
    queryFn: api.getPlanInfo,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  if (isLoading) return null;

  const limits = planInfo?.limits;
  if (!limits) return null;

  const value = limits[feature];
  // If the limit is null (unlimited) or true, the user has access
  const hasAccess = value === null || value === true;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Lock className="h-3 w-3" />
        <Link to="/billing" className="text-primary hover:underline text-sm">
          Upgrade
        </Link>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Pro Feature</h3>
      <p className="mb-4 text-sm text-muted-foreground max-w-sm">
        This feature requires a Pro plan. Upgrade to unlock unlimited access.
      </p>
      <Button asChild>
        <Link to="/billing">
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade to Pro
        </Link>
      </Button>
    </div>
  );
}

/**
 * Simple badge showing usage vs limit.
 * Example: <UsageBadge used={2} limit={3} label="generations" />
 */
export function UsageBadge({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number | null;
  label: string;
}) {
  if (limit === null) return null; // unlimited = no badge

  const remaining = Math.max(0, limit - used);
  const isLow = remaining <= 1;
  const isExhausted = remaining === 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isExhausted
          ? "bg-destructive/10 text-destructive"
          : isLow
            ? "bg-yellow-500/10 text-yellow-600"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {used}/{limit} {label}
      {isExhausted && (
        <Link to="/billing" className="ml-1 text-primary hover:underline">
          Upgrade
        </Link>
      )}
    </span>
  );
}
