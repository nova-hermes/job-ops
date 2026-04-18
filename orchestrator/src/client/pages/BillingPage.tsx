import * as api from "@client/api";
import { PageHeader } from "@client/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Bitcoin, Sparkles, Zap } from "lucide-react";

const PLANS = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

function PaymentDialog({
  open,
  onClose,
  planId,
  planName,
  price,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: number;
  onSuccess: () => void;
}) {
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const handlePay = async (method: "stripe" | "crypto") => {
    setProcessing(true);
    try {
      if (method === "stripe") {
        await api.createCheckout(planId);
      } else {
        await api.createCryptoCheckout(planId);
      }
      toast.success("Plan upgraded successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--background, #0a0a0a)",
          border: "1px solid var(--border, #333)",
          borderRadius: 12,
          padding: 24,
          width: "100%",
          maxWidth: 420,
          margin: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Upgrade to {planName}
        </h2>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
          Choose your preferred payment method for ${price}.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => handlePay("stripe")}
            disabled={processing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              border: "1px solid var(--border, #333)",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              color: "inherit",
            }}
          >
            <CreditCard size={24} />
            <div>
              <div style={{ fontWeight: 500 }}>Credit Card</div>
              <div style={{ fontSize: 13, color: "#888" }}>Pay with Stripe</div>
            </div>
          </button>
          <button
            onClick={() => handlePay("crypto")}
            disabled={processing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              border: "1px solid var(--border, #333)",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              color: "inherit",
            }}
          >
            <Bitcoin size={24} />
            <div>
              <div style={{ fontWeight: 500 }}>Cryptocurrency</div>
              <div style={{ fontSize: 13, color: "#888" }}>BTC, ETH, USDC, USDT</div>
            </div>
          </button>
          {processing && (
            <p style={{ textAlign: "center", fontSize: 13, color: "#888" }}>
              Processing payment...
            </p>
          )}
          <button
            onClick={onClose}
            style={{
              padding: 8,
              border: "none",
              background: "transparent",
              color: "#888",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);

  const { data: planInfo, isLoading } = useQuery({
    queryKey: ["billing", "plan"],
    queryFn: api.getPlanInfo,
  });

  const downgrade = useMutation({
    mutationFn: api.downgradeToFree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "plan"] });
      toast.success("Downgraded to Free plan");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Downgrade failed");
    },
  });

  const currentPlanId = planInfo?.planId || "free";

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Billing" description="Manage your subscription and plan" />
        <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
          Loading plan info...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription and plan" />

      {/* Current Plan */}
      <div
        style={{
          border: "1px solid var(--border, #333)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Current Plan</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{planInfo?.planName || "Free"}</p>
            <p style={{ fontSize: 13, color: "#888" }}>
              {planInfo?.isPaid ? "Active subscription" : "No active subscription"}
            </p>
          </div>
          {planInfo?.isPaid && (
            <button
              onClick={() => downgrade.mutate()}
              disabled={downgrade.isPending}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--border, #333)",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              Downgrade to Free
            </button>
          )}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border, #333)", margin: "32px 0" }} />

      {/* Plan Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 24,
        }}
      >
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPro = plan.id === "pro_monthly" || plan.id === "pro_yearly";
          const isLifetime = plan.id === "lifetime";

          return (
            <div
              key={plan.id}
              style={{
                border: `1px solid ${isPro ? "var(--primary, #fff)" : "var(--border, #333)"}`,
                borderRadius: 12,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: isPro ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {isPro && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: "var(--primary, #fff)",
                    color: "var(--primary-foreground, #000)",
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Sparkles size={12} /> Popular
                </span>
              )}
              {isLifetime && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    background: "#333",
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Zap size={12} /> Best Value
                </span>
              )}

              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  {plan.name}
                  {plan.interval && (
                    <span
                      style={{
                        fontSize: 11,
                        border: "1px solid var(--border, #333)",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontWeight: 400,
                      }}
                    >
                      {plan.interval === "month" ? "Monthly" : plan.interval === "year" ? "Yearly" : "One-time"}
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: 13, color: "#888" }}>{plan.tagline}</p>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 700 }}>${plan.price}</span>
                  {plan.interval === "month" && <span style={{ color: "#888" }}>/month</span>}
                  {plan.interval === "year" && <span style={{ color: "#888" }}>/year</span>}
                  {plan.interval === "once" && <span style={{ color: "#888" }}> one-time</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 13,
                        marginBottom: 8,
                      }}
                    >
                      <Check size={16} style={{ marginTop: 2, flexShrink: 0, color: "var(--primary, #fff)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 24 }}>
                {isCurrent ? (
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 6,
                      border: "1px solid var(--border, #333)",
                      background: "transparent",
                      opacity: 0.5,
                      cursor: "not-allowed",
                      color: "inherit",
                    }}
                  >
                    Current Plan
                  </button>
                ) : plan.price === 0 ? (
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 6,
                      border: "1px solid var(--border, #333)",
                      background: "transparent",
                      opacity: 0.5,
                      cursor: "not-allowed",
                      color: "inherit",
                    }}
                  >
                    Free
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setDialogOpen(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 6,
                      border: isPro ? "none" : "1px solid var(--border, #333)",
                      background: isPro ? "var(--primary, #fff)" : "transparent",
                      color: isPro ? "var(--primary-foreground, #000)" : "inherit",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PaymentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        planId={selectedPlan.id}
        planName={selectedPlan.name}
        price={selectedPlan.price}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["billing", "plan"] })}
      />
    </div>
  );
}
