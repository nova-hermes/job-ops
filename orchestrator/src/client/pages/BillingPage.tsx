import * as api from "@client/api";
import { PageHeader } from "@client/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Bitcoin, Sparkles, Zap, Lock } from "lucide-react";

// Inline plan data to avoid import issues
const PLANS: Record<string, {
  id: string;
  name: string;
  tagline: string;
  price: number;
  interval: string | null;
  features: string[];
}> = {
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
  },
};

function PaymentMethodDialog({
  open,
  onOpenChange,
  planId,
  planName,
  price,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  price: number;
  onSuccess: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripe = async () => {
    setIsProcessing(true);
    try {
      await api.createCheckout(planId);
      toast.success("Plan upgraded successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Checkout failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrypto = async () => {
    setIsProcessing(true);
    try {
      await api.createCryptoCheckout(planId);
      toast.success("Crypto payment confirmed!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Crypto checkout failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-2">Upgrade to {planName}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose your preferred payment method for ${price}.
        </p>
        <div className="grid gap-4">
          <button
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors text-left"
            onClick={handleStripe}
            disabled={isProcessing}
          >
            <CreditCard className="h-6 w-6" />
            <div>
              <div className="font-medium">Credit Card</div>
              <div className="text-sm text-muted-foreground">
                Pay with Stripe
              </div>
            </div>
          </button>
          <button
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors text-left"
            onClick={handleCrypto}
            disabled={isProcessing}
          >
            <Bitcoin className="h-6 w-6" />
            <div>
              <div className="font-medium">Cryptocurrency</div>
              <div className="text-sm text-muted-foreground">
                BTC, ETH, USDC, USDT
              </div>
            </div>
          </button>
          {isProcessing && (
            <p className="text-center text-sm text-muted-foreground">
              Processing payment...
            </p>
          )}
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  onUpgrade,
}: {
  plan: typeof PLANS[string];
  isCurrentPlan: boolean;
  onUpgrade: (planId: string) => void;
}) {
  const isPro = plan.id === "pro_monthly" || plan.id === "pro_yearly";
  const isLifetime = plan.id === "lifetime";

  return (
    <div className={`relative flex flex-col rounded-lg border p-6 ${isPro ? "border-primary shadow-md" : ""}`}>
      {isPro && (
        <span className="absolute -top-2 right-4 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          <Sparkles className="mr-1 h-3 w-3" />
          Popular
        </span>
      )}
      {isLifetime && (
        <span className="absolute -top-2 right-4 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          <Zap className="mr-1 h-3 w-3" />
          Best Value
        </span>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {plan.name}
          {plan.interval === "year" && (
            <span className="text-xs border rounded px-1.5 py-0.5">Yearly</span>
          )}
          {plan.interval === "month" && (
            <span className="text-xs border rounded px-1.5 py-0.5">Monthly</span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
      </div>
      <div className="flex-1">
        <div className="mb-4">
          <span className="text-3xl font-bold">${plan.price}</span>
          {plan.interval === "month" && (
            <span className="text-muted-foreground">/month</span>
          )}
          {plan.interval === "year" && (
            <span className="text-muted-foreground">/year</span>
          )}
          {plan.interval === "once" && (
            <span className="text-muted-foreground"> one-time</span>
          )}
        </div>
        <ul className="space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        {isCurrentPlan ? (
          <button className="w-full rounded-md border px-4 py-2 text-sm opacity-50 cursor-not-allowed" disabled>
            Current Plan
          </button>
        ) : plan.price === 0 ? (
          <button className="w-full rounded-md border px-4 py-2 text-sm opacity-50 cursor-not-allowed" disabled>
            Free
          </button>
        ) : (
          <button
            className={`w-full rounded-md px-4 py-2 text-sm font-medium ${
              isPro
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border hover:bg-accent"
            }`}
            onClick={() => onUpgrade(plan.id)}
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    planId: string;
  }>({ open: false, planId: "pro_monthly" });

  const { data: planInfo, isLoading } = useQuery({
    queryKey: ["billing", "plan"],
    queryFn: api.getPlanInfo,
  });

  const downgradeMutation = useMutation({
    mutationFn: api.downgradeToFree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "plan"] });
      toast.success("Downgraded to Free plan");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Downgrade failed"
      );
    },
  });

  const handleUpgrade = (planId: string) => {
    setPaymentDialog({ open: true, planId });
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["billing", "plan"] });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Billing"
          description="Manage your subscription and plan"
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading plan info...</p>
        </div>
      </div>
    );
  }

  const currentPlanId = planInfo?.planId || "free";
  const selectedPlan = PLANS[paymentDialog.planId];

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your subscription and plan"
      />

      {/* Current Plan */}
      <div className="rounded-lg border mb-8 p-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">
              {planInfo?.planName || "Free"}
            </p>
            <p className="text-sm text-muted-foreground">
              {planInfo?.isPaid
                ? "Active subscription"
                : "No active subscription"}
            </p>
          </div>
          {planInfo?.isPaid && (
            <button
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
              onClick={() => downgradeMutation.mutate()}
              disabled={downgradeMutation.isPending}
            >
              Downgrade to Free
            </button>
          )}
        </div>
      </div>

      <hr className="my-8" />

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.values(PLANS).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlanId}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={paymentDialog.open}
        onOpenChange={(open) =>
          setPaymentDialog((prev) => ({ ...prev, open }))
        }
        planId={paymentDialog.planId}
        planName={selectedPlan?.name || "Pro"}
        price={selectedPlan?.price || 9}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
