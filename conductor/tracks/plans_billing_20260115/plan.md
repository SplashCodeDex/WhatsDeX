# Plan: Plans & Billing Integration

## Phase 1: Infrastructure & Stripe Seeding [checkpoint: ded29ea]
Focus on setting up the Stripe connection and ensuring our plan definitions are synced between the code and Stripe.

- [x] Task: Create `stripeService.ts` utility for Stripe initialization and basic API wrappers. (3e97b49)
- [x] Task: Implement `scripts/seed-stripe.ts` to programmatically create Starter, Pro, and Enterprise products/prices in Stripe. (combined with next task)
- [x] Task: Add 7-day trial configuration to the seeding script. (8cda33b)
- [x] Task: Conductor - User Manual Verification 'Infrastructure & Stripe Seeding' (Protocol in workflow.md) (ded29ea)

## Phase 2: Database Schema & Middleware [checkpoint: ded29ea]
Prepare the data layer to store subscription states and implement the logic to gate features.

- [x] Task: Update User schema/types to include `planTier`, `subscriptionStatus`, and `trialEndsAt`. (fbb2afa)
- [x] Task: Create `planMiddleware.ts` to enforce bot limits (1, 3, 10) based on user tier. (617e4d5)
- [x] Task: Implement `featureGating` utility to check for AI and Backup permissions in the backend. (8a92b60)
- [x] Task: Conductor - User Manual Verification 'Database Schema & Middleware' (Protocol in workflow.md) (ded29ea)

## Phase 3: Stripe Webhooks & Checkout Flow
Connect the backend to Stripe's lifecycle events to automate user upgrades.

- [x] Task: Implement `/api/billing/checkout` endpoint to create Stripe Checkout sessions (with trial support). (171dda2)
- [x] Task: Implement `/api/billing/webhook` endpoint with Zod validation and idempotency checks. (393f0ed)
- [~] Task: Handle `checkout.session.completed` to initialize subscription in Firestore.
- [ ] Task: Handle `customer.subscription.updated` and `deleted` to sync status changes.
- [ ] Task: Conductor - User Manual Verification 'Stripe Webhooks & Checkout Flow' (Protocol in workflow.md)

## Phase 4: Frontend UI Components
Build the user-facing parts of the billing system.

- [ ] Task: Create a responsive `PricingPage` with Monthly/Yearly toggle and "7-Day Free Trial" CTAs.
- [ ] Task: Implement `BillingSettings` component in the dashboard to show current plan and trial countdown.
- [ ] Task: Add "Upgrade Required" modal/toast for contextual upgrades (e.g., when adding too many bots).
- [ ] Task: Implement "Manage Subscription" button that redirects to the Stripe Customer Portal.
- [ ] Task: Conductor - User Manual Verification 'Frontend UI Components' (Protocol in workflow.md)

## Phase 5: Final Verification & Polishing
End-to-end testing of the trial-to-paid lifecycle and edge cases.

- [ ] Task: Write E2E tests for the full flow: Sign up -> Start Trial -> Upgrade to Pro.
- [ ] Task: Verify mobile responsiveness of the Pricing page and Billing settings.
- [ ] Task: Conductor - User Manual Verification 'Final Verification & Polishing' (Protocol in workflow.md)