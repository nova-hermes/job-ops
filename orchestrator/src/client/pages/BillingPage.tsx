import * as api from "@client/api";
import { PageHeader } from "@client/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Bitcoin, Sparkles, Zap } from "lucide-react";
import { PLANS, type PlanId } from "@shared/plans";

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
  planId: PlanId;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to {planName}</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method for ${price}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-16 justify-start gap-4"
            onClick={handleStripe}
            disabled={isProcessing}
          >
            <CreditCard className="h-6 w-6" />
            <div className="text-left">
              <div className="font-medium">Credit Card</div>
              <div className="text-sm text-muted-foreground">
                Pay with Stripe
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-16 justify-start gap-4"
            onClick={handleCrypto}
            disabled={isProcessing}
          >
            <Bitcoin className="h-6 w-6" />
            <div className="text-left">
              <div className="font-medium">Cryptocurrency</div>
              <div className="text-sm text-muted-foreground">
                BTC, ETH, USDC, USDT
              </div>
            </div>
          </Button>
          {isProcessing && (
            <p className="text-center text-sm text-muted-foreground">
              Processing payment...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  onUpgrade,
}: {
  plan: (typeof PLANS)[PlanId];
  isCurrentPlan: boolean;
  onUpgrade: (planId: PlanId) => void;
}) {
  const isPro = plan.id === "pro_monthly" || plan.id === "pro_yearly";
  const isLifetime = plan.id === "lifetime";

  return (
    <Card
      className={`relative flex flex-col ${
        isPro ? "border-primary shadow-md" : ""
      }`}
    >
      {isPro && (
        <Badge className="absolute -top-2 right-4" variant="default">
          <Sparkles className="mr-1 h-3 w-3" />
          Popular
        </Badge>
      )}
      {isLifetime && (
        <Badge className="absolute -top-2 right-4" variant="secondary">
          <Zap className="mr-1 h-3 w-3" />
          Best Value
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {plan.name}
          {plan.interval === "year" && (
            <Badge variant="outline">Yearly</Badge>
          )}
          {plan.interval === "month" && (
            <Badge variant="outline">Monthly</Badge>
          )}
        </CardTitle>
        <CardDescription>{plan.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          <span className="text-3xl font-bold">
            ${plan.price}
          </span>
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
      </CardContent>
      <CardFooter>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : plan.price === 0 ? (
          <Button variant="outline" className="w-full" disabled>
            Free
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isPro ? "default" : "outline"}
            onClick={() => onUpgrade(plan.id)}
          >
            Upgrade
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    planId: PlanId;
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

  const handleUpgrade = (planId: PlanId) => {
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

  const currentPlanId = (planInfo?.planId as PlanId) || "free";
  const selectedPlan = PLANS[paymentDialog.planId];

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your subscription and plan"
      />

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Button
                variant="outline"
                onClick={() => downgradeMutation.mutate()}
                disabled={downgradeMutation.isPending}
              >
                Downgrade to Free
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(Object.values(PLANS) as Array<(typeof PLANS)[PlanId]>).map(
          (plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentPlanId}
              onUpgrade={handleUpgrade}
            />
          )
        )}
      </div>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={paymentDialog.open}
        onOpenChange={(open) =>
          setPaymentDialog((prev) => ({ ...prev, open }))
        }
        planId={paymentDialog.planId}
        planName={selectedPlan.name}
        price={selectedPlan.price}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
