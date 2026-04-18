# Job-Ops Payment Gates — Implementation Plan

> **Goal:** Cosmetic payment gates for learning/practice. No real selling.
> **Reference:** NovaCV's billing implementation (Stripe + NOWPayments).

---

## Phase 1: Billing Foundation

### 1.1 Plan Definitions
Create `orchestrator/src/shared/plans.ts`:

```ts
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      jobsPerSearch: 10,
      resumeGenerations: 3,
      ghostwriterUses: 3,
      applicationsPerDay: 5,
    },
  },
  pro_monthly: {
    name: "Pro",
    price: 9,
    interval: "month",
    stripePriceId: "price_JOBOPS_MONTHLY",  // test mode placeholder
  },
  pro_yearly: {
    name: "Pro",
    price: 79,
    interval: "year",
    stripePriceId: "price_JOBOPS_YEARLY",
  },
  lifetime: {
    name: "Lifetime",
    price: 149,
    stripePriceId: "price_JOBOPS_LIFETIME",
  },
};
```

### 1.2 Database Migration
Add `user_plans` table to SQLite:

```sql
CREATE TABLE IF NOT EXISTS user_plans (
  id INTEGER PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  nowpayments_payment_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

Add to drizzle schema: `orchestrator/src/server/db/schema.ts`

### 1.3 Plan Service
Create `orchestrator/src/server/services/plans.ts`:
- `getCurrentPlan()` — reads from DB
- `setPlan(plan, metadata)` — updates DB
- `isFeatureAllowed(feature)` — checks limits
- `getUsageStats()` — returns current usage vs limits

---

## Phase 2: Stripe Integration (Cosmetic)

### 2.1 Stripe Config
Create `orchestrator/src/client/lib/stripe.ts`:
- Lazy-loaded Stripe publishable key
- Plan → Price ID mapping

### 2.2 Server API Routes
Create `orchestrator/src/server/api/routes/billing.ts`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/billing/plan` | GET | Current plan + usage |
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Create Stripe customer portal session |
| `/api/billing/webhook` | POST | Handle Stripe webhooks |
| `/api/billing/crypto/checkout` | POST | Create NOWPayments invoice |
| `/api/billing/crypto/webhook` | POST | Handle NOWPayments IPN |

### 2.3 Stripe Checkout Flow
```
User clicks "Upgrade" 
  → POST /api/billing/checkout (plan ID)
  → Server creates Stripe Checkout Session
  → Client redirects to Stripe
  → User pays (or Stripe test mode auto-succeeds)
  → Webhook: checkout.session.completed
  → Server updates user_plans table
  → User redirected back to /billing?success=true
```

### 2.4 Stripe Webhook Handler
- Verify webhook signature
- Handle events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Update plan in DB accordingly

---

## Phase 3: NOWPayments Crypto (Cosmetic)

### 3.1 Crypto Checkout Flow
```
User clicks "Pay with Crypto"
  → PaymentMethodDialog opens (Stripe vs Crypto)
  → User selects crypto
  → POST /api/billing/crypto/checkout
  → Server creates NOWPayments invoice
  → Client shows payment address + QR
  → IPN webhook confirms payment
  → Server updates user_plans table
```

### 3.2 NOWPayments Config
- API Key: reuse from NovaCV or create new
- Supported: BTC, ETH, USDC, USDT
- IPN webhook endpoint for payment confirmation

---

## Phase 4: UI Components

### 4.1 Billing Page (`/billing`)
Create `orchestrator/src/client/pages/BillingPage.tsx`:

Sections:
1. **Current Plan** — shows active plan, usage stats
2. **Plan Cards** — Free / Pro Monthly / Pro Yearly / Lifetime
3. **Payment History** — table of past transactions (cosmetic)
4. **Manage Subscription** — Stripe portal link (for Pro subscribers)

### 4.2 PaymentMethodDialog
Create `orchestrator/src/client/components/PaymentMethodDialog.tsx`:

- Modal with two options: Credit Card (Stripe) vs Crypto (NOWPayments)
- Opens when user clicks "Upgrade" on any plan card
- Shows plan details, price, features

### 4.3 UpgradeGate Component
Create `orchestrator/src/client/components/UpgradeGate.tsx`:

```tsx
<UpgradeGate feature="ghostwriter">
  {/* Pro-only content */}
</UpgradeGate>
```

- Checks current plan against feature requirements
- Shows upgrade prompt if user is on Free plan
- Renders children if user has Pro/Lifetime

### 4.4 UsageLimitBadge
Create `orchestrator/src/client/components/UsageLimitBadge.tsx`:

- Shows "3/3" usage counters on gated features
- Changes color as limit approaches
- Links to billing page when limit reached

---

## Phase 5: Feature Gates

### 5.1 Gated Features (Free vs Pro)

| Feature | Free | Pro | Lifetime |
|---|---|---|---|
| Job searches | 10/search | Unlimited | Unlimited |
| Resume generations | 3 total | Unlimited | Unlimited |
| Ghostwriter uses | 3 total | Unlimited | Unlimited |
| Applications/day | 5 | Unlimited | Unlimited |
| Tracer links | 5 active | Unlimited | Unlimited |
| Visa sponsor filter | ❌ | ✅ | ✅ |
| Export to PDF | ❌ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ |

### 5.2 Gate Implementation
- Add middleware to gated API endpoints
- Check plan before executing feature
- Return 402 (Payment Required) with upgrade prompt
- Client shows UpgradeDialog on 402 responses

### 5.3 Intercept 402 Responses
Update `orchestrator/src/client/api/client.ts`:
- On 402 response, show UpgradeDialog
- Include feature name and current limits in error response

---

## Phase 6: Integration Points

### 6.1 Register Billing Routes
Add to `orchestrator/src/server/api/routes.ts`:
```ts
import { billingRouter } from "./routes/billing";
apiRouter.use("/billing", billingRouter);
```

### 6.2 Add Billing to Navigation
Update `orchestrator/src/client/components/navigation.ts`:
- Add "Billing" link with CreditCard icon
- Badge showing current plan

### 6.3 Register Billing Route
Add to `orchestrator/src/client/App.tsx`:
```tsx
<Route path="/billing" element={<BillingPage />} />
```

### 6.4 Add Plan to Settings Response
Include `currentPlan` and `usageStats` in the settings API response so the client always knows the plan state.

---

## Files to Create

| File | Purpose |
|---|---|
| `shared/src/plans.ts` | Plan definitions, limits, types |
| `orchestrator/src/server/db/migrations/XXX_add_user_plans.ts` | DB migration |
| `orchestrator/src/server/services/plans.ts` | Plan CRUD + feature checks |
| `orchestrator/src/server/api/routes/billing.ts` | All billing API endpoints |
| `orchestrator/src/client/lib/stripe.ts` | Stripe config + helpers |
| `orchestrator/src/client/pages/BillingPage.tsx` | Billing page |
| `orchestrator/src/client/components/PaymentMethodDialog.tsx` | Stripe vs Crypto picker |
| `orchestrator/src/client/components/UpgradeGate.tsx` | Feature gate wrapper |
| `orchestrator/src/client/components/UsageLimitBadge.tsx` | Usage counter badge |

## Files to Modify

| File | Change |
|---|---|
| `orchestrator/src/server/api/routes.ts` | Register billing router |
| `orchestrator/src/client/App.tsx` | Add /billing route |
| `orchestrator/src/client/components/navigation.ts` | Add Billing nav link |
| `orchestrator/src/client/api/client.ts` | Intercept 402 → UpgradeDialog |
| `orchestrator/src/server/db/schema.ts` | Add user_plans table |

---

## Stripe Test Mode Setup

Since this is cosmetic/practice:
1. Use Stripe test mode keys (`sk_test_...`, `pk_test_...`)
2. Test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Webhooks can be tested with Stripe CLI (`stripe listen`)
4. OR skip real Stripe entirely — just update the DB directly on "payment"

**For pure cosmetic (no Stripe account needed):**
- Simulate payment flow entirely client-side
- "Pay Now" button → loading spinner → "Payment successful!" → update DB
- Same UX, zero external dependencies

---

## Implementation Order

1. Plan definitions + types
2. DB migration (user_plans table)
3. Plan service (CRUD + feature checks)
4. Billing API routes (plan endpoint first)
5. Billing page (current plan + plan cards)
6. UpgradeGate component
7. Feature gates on existing features
8. PaymentMethodDialog
9. Stripe checkout flow (cosmetic)
10. NOWPayments crypto flow (cosmetic)
11. 402 interception in API client
12. Navigation link + route registration

---

## Verification

- [ ] `/billing` page loads with plan cards
- [ ] Clicking "Upgrade" opens PaymentMethodDialog
- [ ] Selecting a plan updates `user_plans` in DB
- [ ] Gated features show UpgradeGate for Free users
- [ ] Gated features are accessible after "upgrade"
- [ ] Usage counters increment and reset correctly
- [ ] 402 responses trigger UpgradeDialog
- [ ] Navigation shows current plan badge

---

*Plan created: April 18, 2026*
*For: job-ops hobby/practice deployment*
