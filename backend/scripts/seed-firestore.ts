/* eslint-disable no-console */
import { db } from '../src/lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PLANS = [
  {
    code: 'STARTER',
    name: 'Starter',
    description: 'Perfect for hobbyists and small projects.',
    monthlyPrice: 999,
    yearlyPrice: 9900,
    maxBots: 1,
    maxBroadcasts: 500,
    aiType: 'basic',
    features: ['1 Bot Account', 'Basic AI Integration', '500 Broadcasts / mo', 'Standard Backups'],
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Advanced features for power users and growing businesses.',
    monthlyPrice: 1999,
    yearlyPrice: 19900,
    maxBots: 3,
    maxBroadcasts: 5000,
    aiType: 'advanced',
    features: ['3 Bot Accounts', 'Advanced Gemini AI', '5,000 Broadcasts / mo', 'Priority Backups', 'Advanced Analytics'],
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Unlimited power for agencies and organizations.',
    monthlyPrice: 4999,
    yearlyPrice: 49900,
    maxBots: 10,
    maxBroadcasts: 1000000, // Infinity-ish
    aiType: 'advanced',
    features: ['10 Bot Accounts', 'Advanced Gemini AI', 'Unlimited Broadcasts', 'Enterprise-Grade Backups', 'White-label Options'],
  },
];

async function seedFirestore() {
  console.log('🚀 Starting Firestore plans seeding...');

  try {
    const batch = db.batch();
    const plansCol = db.collection('plans');

    for (const plan of PLANS) {
      console.log(`📦 Processing plan: ${plan.code}...`);
      
      // We use the code as ID for easy lookup if needed, or search by code
      const query = await plansCol.where('code', '==', plan.code).limit(1).get();
      
      const planData = {
        ...plan,
        updatedAt: Timestamp.now(),
      };

      if (query.empty) {
        const newDocRef = plansCol.doc();
        batch.set(newDocRef, {
          ...planData,
          createdAt: Timestamp.now(),
        });
        console.log(`✅ Created plan: ${plan.code}`);
      } else {
        batch.update(query.docs[0].ref, planData);
        console.log(`ℹ️ Updated plan: ${plan.code}`);
      }
    }

    await batch.commit();
    console.log('\n✨ Firestore plans seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Firestore seeding failed:', error);
    process.exit(1);
  }
}

seedFirestore();
