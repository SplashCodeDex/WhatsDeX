import { authService } from '@/services/authService';
import { botService } from '@/services/botService';
import { userService } from '@/services/userService';
import { subscriptionService } from '@/services/subscriptionService';
import { analyticsService } from '@/services/analyticsService';

/**
 * @deprecated Use specific services from '@/services' instead.
 */
const apiClient = {
    ...authService,
    ...botService,
    ...userService,
    ...subscriptionService,
    ...analyticsService
};

export default apiClient;
