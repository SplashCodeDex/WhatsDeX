import { db } from './lib/firebase.js';
import logger from './utils/logger.js';

/**
 * Migration Script: planTier -> plan
 *
 * Scans 'tenants' and 'tenants/{id}/users' to ensure 'plan' field exists.
 * This ensures zero-trust validation succeeds without relying solely on schema preprocessors.
 */
async function migratePlanField() {
    logger.info('Starting plan field migration...');

    try {
        const tenantsSnapshot = await db.collection('tenants').get();
        logger.info(`Found ${tenantsSnapshot.size} tenants to process.`);

        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantData = tenantDoc.data();
            const updates: any = {};

            // 1. Migrate Tenant root
            if (tenantData.planTier && !tenantData.plan) {
                updates.plan = tenantData.planTier;
                logger.info(`Migrating tenant ${tenantDoc.id}: ${tenantData.planTier}`);
            }

            if (Object.keys(updates).length > 0) {
                await tenantDoc.ref.update(updates);
            }

            // 2. Migrate Users subcollection
            const usersSnapshot = await tenantDoc.ref.collection('users').get();
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                if (userData.planTier && !userData.plan) {
                    await userDoc.ref.update({ plan: userData.planTier });
                    logger.info(`Migrating user ${userDoc.id} in tenant ${tenantDoc.id}`);
                }
            }
        }

        logger.info('Migration completed successfully.');
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url.endsWith('migratePlan.ts')) {
    migratePlanField().then(() => process.exit(0));
}

export { migratePlanField };
