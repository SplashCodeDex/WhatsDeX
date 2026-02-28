# Specification: Plans & Billing Integration

## Overview
Implement a comprehensive, enterprise-grade subscription and billing system for WhatsDeX using Stripe. This system will manage three affordable tiers (Starter, Pro, Enterprise) with both monthly and yearly billing options. Crucially, **all plans will offer a 7-day free trial** to maximize customer acquisition, replacing the permanent free tier.

## Functional Requirements

### 1. Stripe Infrastructure
- **Product Seeding:** Update backend script to create "Starter", "Pro", and "Enterprise" products with **7-day trial periods** configured by default.
- **Hosted Checkout:** Stripe Checkout configured to allow users to start their trial without immediate charge (requires card).
- **Customer Portal:** Self-service management for upgrades/downgrades and cancellations.
- **Webhooks:** A robust backend endpoint to process Stripe events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) to maintain real-time sync with the database.

### 2. Plan Definitions & Enforcement (Affordable & Attractive)
| Feature | Starter | Pro | Enterprise |
| :--- | :--- | :--- | :--- |
| **Trial** | **7 Days Free** | **7 Days Free** | **7 Days Free** |
| **Price (Monthly)** | ~$9.99 | ~$19.99 | ~$49.99 |
| **Price (Yearly)** | ~$99 (2 Months Off) | ~$199 (2 Months Off) | ~$499 (2 Months Off) |
| **Bot Limit** | 1 Account | 3 Accounts | 10 Accounts |
| **AI Integration** | Basic | Advanced (Gemini) | Advanced (Gemini) |
| **Backups** | Yes | Yes | Yes |
| **Broadcasts** | 500 / mo | 5,000 / mo | Unlimited |

### 3. Database Schema (Firestore Hybrid)
- **User Document (`users/{userId}`):** Store cached fields for fast access: `planTier`, `subscriptionStatus`, and `trialEndsAt`.
- **Subscription Collection (`subscriptions/{subId}`):** Store the master record including `stripeSubscriptionId`, `currentPeriodEnd`, `cancelAtPeriodEnd`, and `stripeCustomerId`.

### 4. User Interface
- **Pricing Page:** Highlight "Start Your 7-Day Free Trial" calls to action. Display "Annual" savings clearly (e.g., "Save 20%").
- **Billing Dashboard:** A dedicated section in the sidebar/dashboard settings for users to view their current plan and launch the Stripe Portal.
- **Contextual Upgrades:** Triggered upgrade prompts (e.g., when a Starter user attempts to add a second bot).

## Non-Functional Requirements
- **Security:** Strict Zod validation for all Stripe webhook payloads.
- **Reliability:** Idempotency handling for Stripe webhooks to prevent duplicate processing.
- **Scalability:** Plan enforcement logic implemented as middleware to easily gate any future features.

## Acceptance Criteria
- [ ] Running the seeding script creates all 3 products with Monthly/Yearly prices in Stripe.
- [ ] A user can successfully subscribe to a plan via the UI and have their status updated in Firestore.
- [ ] A user is blocked from adding more bots than their plan allows.
- [ ] Canceling a subscription in the Stripe Portal updates the user's access in WhatsDeX at the end of the billing period.
- [ ] AI and Backup features are only accessible to Pro and Enterprise users.
- [ ] Users start with a 7-day free trial and are not charged until it expires.

## Out of Scope
- Custom invoice generation (handled by Stripe).
- Support for payment methods other than Stripe (e.g., PayPal) in this specific track.
