/* eslint-disable no-console */
import { StripeService } from '../src/services/stripeService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for hobbyists and small projects.',
    monthlyPrice: 999, // In cents
    yearlyPrice: 9900,
    features: ['1 Bot Account', 'Basic AI Integration', '500 Broadcasts / mo', 'Backups Included'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for power users and growing businesses.',
    monthlyPrice: 1999,
    yearlyPrice: 19900,
    features: ['3 Bot Accounts', 'Advanced Gemini AI', '5,000 Broadcasts / mo', 'Backups Included', 'Advanced Analytics'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited power for agencies and large organizations.',
    monthlyPrice: 4999,
    yearlyPrice: 49900,
    features: ['10 Bot Accounts', 'Advanced Gemini AI', 'Unlimited Broadcasts', 'Backups Included', 'Enterprise-Grade Analytics'],
  },
];

async function seedStripe() {
  console.log('🚀 Starting Stripe seeding...');

  try {
    const stripeService = StripeService.getInstance();
    const stripe = stripeService.stripe;

    // Fetch existing products to avoid duplicates
    const existingProducts = await stripe.products.list({ active: true });

    for (const plan of PLANS) {
      console.log(`\n📦 Processing plan: ${plan.name}...`);

      let product = existingProducts.data.find(p => p.name === plan.name);

      if (product) {
        console.log(`ℹ️ Product already exists: ${product.id}. Updating...`);
        product = await stripe.products.update(product.id, {
          description: plan.description,
          metadata: {
            planId: plan.id,
            features: plan.features.join(','),
          },
        });
      } else {
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            planId: plan.id,
            features: plan.features.join(','),
          },
        });
        console.log(`✅ Product created: ${product.id}`);
      }

      // Check existing prices for this product
      const existingPrices = await stripe.prices.list({ product: product.id, active: true });

      // Monthly Price
      const hasMonthly = existingPrices.data.find(p => p.metadata.type === 'monthly' && p.unit_amount === plan.monthlyPrice);
      if (!hasMonthly) {
        const monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.monthlyPrice,
          currency: 'usd',
          recurring: {
            interval: 'month',
            trial_period_days: 7,
          },
          metadata: {
            planId: plan.id,
            type: 'monthly',
          },
        });
        console.log(`✅ Monthly price created: ${monthlyPrice.id} ($${plan.monthlyPrice / 100})`);
      } else {
        console.log(`ℹ️ Monthly price already exists: ${hasMonthly.id}`);
      }

      // Yearly Price
      const hasYearly = existingPrices.data.find(p => p.metadata.type === 'yearly' && p.unit_amount === plan.yearlyPrice);
      if (!hasYearly) {
        const yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.yearlyPrice,
          currency: 'usd',
          recurring: {
            interval: 'year',
            trial_period_days: 7,
          },
          metadata: {
            planId: plan.id,
            type: 'yearly',
          },
        });
        console.log(`✅ Yearly price created: ${yearlyPrice.id} ($${plan.yearlyPrice / 100})`);
      } else {
        console.log(`ℹ️ Yearly price already exists: ${hasYearly.id}`);
      }
    }

    console.log('\n✨ Stripe seeding completed successfully!');
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('STRIPE_SECRET_KEY')) {
      console.error('\n❌ Error: STRIPE_SECRET_KEY is missing in .env');
    } else {
      console.error('\n❌ Stripe seeding failed:', error);
    }
    process.exit(1);
  }
}

seedStripe();