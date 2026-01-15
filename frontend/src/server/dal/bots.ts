/**
 * Data Access Layer - Bots
 *
 * Server-side operations for bot documents.
 */

/**
 * Get bots for a tenant
 */
export async function getTenantBots(_tenantId: string): Promise<never[]> {
    // Implementation will query tenants/{tenantId}/bots collection
    return [];
}

/**
 * Get bot by ID
 */
export async function getBotById(
    _tenantId: string,
    _botId: string
): Promise<null> {
    // Implementation will fetch specific bot document
    return null;
}
