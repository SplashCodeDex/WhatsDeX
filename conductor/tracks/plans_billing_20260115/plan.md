# Plan: Plans & Billing Integration

## Phase 1: Infrastructure & Stripe Seeding
Focus on setting up the Stripe connection and ensuring our plan definitions are synced between the code and Stripe.

- [x] Task: Create `stripeService.ts` utility for Stripe initialization and basic API wrappers. (3e97b49)
- [~] Task: Implement `scripts/seed-stripe.ts` to programmatically create Starter, Pro, and Enterprise products/prices in Stripe.
- [ ] Task: Add 7-day trial configuration to the seeding script.
- [ ] Task: Conductor - User Manual Verification 'Infrastructure & Stripe Seeding' (Protocol in workflow.md)

## Phase 2: Database Schema & Middleware
Prepare the data layer to store subscription states and implement the logic to gate features.

- [ ] Task: Update User schema/types to include `planTier`, `subscriptionStatus`, and `trialEndsAt`.
- [ ] Task: Create `planMiddleware.ts` to enforce bot limits (1, 3, 10) based on user tier.
- [ ] Task: Implement `featureGating` utility to check for AI and Backup permissions in the backend.
- [ ] Task: Conductor - User Manual Verification 'Database Schema & Middleware' (Protocol in workflow.md)

## Phase 3: Stripe Webhooks & Checkout Flow
Connect the backend to Stripe's lifecycle events to automate user upgrades.

- [ ] Task: Implement `/api/billing/checkout` endpoint to create Stripe Checkout sessions (with trial support).
- [ ] Task: Implement `/api/billing/webhook` endpoint with Zod validation and idempotency checks.
- [ ] Task: Handle `checkout.session.completed` to initialize subscription in Firestore.
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
