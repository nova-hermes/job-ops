import { PageHeader } from "@client/components/layout";

export default function BillingPage() {
  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription and plan" />
      <div style={{ padding: "2rem" }}>
        <p>If you can see this, PageHeader works.</p>
      </div>
    </div>
  );
}
