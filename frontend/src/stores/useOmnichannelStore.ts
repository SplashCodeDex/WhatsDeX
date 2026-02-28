'use client';

import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
    Channel,
    ActivityEvent,
    BotProgressUpdate,
    CronJob,
    CronStatus,
    CronRunLogEntry,
    SkillStatusReport,
    AgentsListResult,
    AgentIdentityResult,
    AgentsFilesListResult,
    UsageSessionEntry,
    UsageTotals,
    CostDailyEntry,
    SessionLogEntry,
    GatewaySessionRow,
    SessionsListResult,
    NodeRegistryEntry,
    DevicePairingList,
    LogEntry,
    ApiResponse,
    isApiSuccess
} from '@/types';

interface OmnichannelState {
    // Data
    channels: Channel[];
    activity: ActivityEvent[];
    cronJobs: CronJob[];
    cronStatus: CronStatus | null;
    cronRuns: Record<string, CronRunLogEntry[]>;
    skillReport: SkillStatusReport | null;
    agentsResult: AgentsListResult | null;
    agentIdentities: Record<string, AgentIdentityResult>;
    usageTotals: UsageTotals | null;
    usageDaily: CostDailyEntry[];
    usageSessions: UsageSessionEntry[];
    sessionsList: SessionsListResult | null;
    nodes: NodeRegistryEntry[];
    devices: DevicePairingList | null;
    logs: LogEntry[];
    gatewayHealth: any | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchChannels: (agentId?: string) => Promise<void>;
    fetchAllChannels: () => Promise<void>;
    updateChannelStatus: (botId: string, status: Channel['status']) => void;
    addActivityEvent: (event: Omit<ActivityEvent, 'id'>) => void;
    handleProgressUpdate: (update: BotProgressUpdate) => void;

    // Cron Actions
    fetchCronJobs: () => Promise<void>;
    fetchCronStatus: () => Promise<void>;
    fetchCronRuns: (jobId: string) => Promise<void>;
    createCronJob: (job: Partial<CronJob>) => Promise<boolean>;
    toggleCronJob: (id: string, enabled: boolean) => Promise<boolean>;
    runCronJob: (id: string) => Promise<boolean>;
    removeCronJob: (id: string) => Promise<boolean>;

    // Skill Actions
    fetchSkillReport: () => Promise<void>;
    toggleSkill: (key: string, enabled: boolean) => Promise<boolean>;
    saveSkillKey: (key: string, apiKey: string) => Promise<boolean>;
    installSkill: (key: string, installId: string) => Promise<boolean>;

    // Agent Actions
    fetchAgents: () => Promise<void>;
    fetchAgentIdentity: (id: string) => Promise<void>;

    // Usage & Session Actions
    fetchUsageTotals: () => Promise<void>;
    fetchUsageDaily: () => Promise<void>;
    fetchUsageSessions: () => Promise<void>;
    fetchSessionsList: () => Promise<void>;

    // Nodes & Logs Actions
    fetchNodes: () => Promise<void>;
    fetchDevices: () => Promise<void>;
    fetchLogs: () => Promise<void>;
    approveDevice: (id: string) => Promise<boolean>;
    rejectDevice: (id: string) => Promise<boolean>;

    // Gateway Actions
    fetchGatewayHealth: () => Promise<void>;
}

const MAX_ACTIVITY_LOGS = 100;

/**
 * Omnichannel Store
 *
 * Manages the state for all communication channels (WhatsApp, Telegram, etc.)
 * and the real-time activity feed.
 */
export const useOmnichannelStore = create<OmnichannelState>((set, get) => ({
    channels: [],
    activity: [],
    cronJobs: [],
    cronStatus: null,
    cronRuns: {},
    skillReport: null,
    agentsResult: null,
    agentIdentities: {},
    usageTotals: null,
    usageDaily: [],
    usageSessions: [],
    sessionsList: null,
    nodes: [],
    devices: null,
    logs: [],
    gatewayHealth: null,
    isLoading: false,
    error: null,

    fetchChannels: async (agentId: string = 'system_default') => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get<any[]>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.LIST(agentId));

            if (response.success) {
                // Map the backend BotListItem shape to the frontend Channel shape
                const data = response.data || [];
                const mappedChannels: Channel[] = data.map(bot => ({
                    id: bot.id,
                    name: bot.name,
                    type: bot.type || 'whatsapp',
                    status: bot.status as any,
                    account: bot.phoneNumber || bot.account || null,
                    lastActiveAt: bot.lastActiveAt,
                    assignedAgentId: bot.assignedAgentId
                }));
                set({ channels: mappedChannels, isLoading: false });
            } else {
                set({ error: response.error.message || 'Failed to fetch channels', isLoading: false });
            }
        } catch (err) {
            set({
                error: 'Failed to connect to the server',
                isLoading: false
            });
        }
    },

    fetchAllChannels: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get<any[]>(API_ENDPOINTS.OMNICHANNEL.CHANNELS.ALL);

            if (response.success) {
                const data = response.data || [];
                const mappedChannels: Channel[] = data.map(bot => ({
                    id: bot.id,
                    name: bot.name,
                    type: bot.type || 'whatsapp',
                    status: bot.status as any,
                    account: bot.account || bot.phoneNumber || null,
                    lastActiveAt: bot.lastActiveAt,
                    assignedAgentId: bot.assignedAgentId
                }));
                set({ channels: mappedChannels, isLoading: false });
            } else {
                set({ error: response.error.message || 'Failed to fetch all channels', isLoading: false });
            }
        } catch (err) {
            set({
                error: 'Failed to connect to the server',
                isLoading: false
            });
        }
    },

    updateChannelStatus: (botId, status) => {
        set((state) => ({
            channels: state.channels.map((c) =>
                c.id === botId ? { ...c, status } : c
            )
        }));
    },

    addActivityEvent: (event) => {
        const newEvent: ActivityEvent = {
            ...event,
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
            activity: [newEvent, ...state.activity].slice(0, MAX_ACTIVITY_LOGS)
        }));
    },

    handleProgressUpdate: (update) => {
        const { botId, step, status: progressStatus } = update;

        // Map progress status to channel status
        let channelStatus: Channel['status'] = 'connecting';

        if (progressStatus === 'complete') channelStatus = 'connected';
        else if (progressStatus === 'error') channelStatus = 'error';

        set((state) => ({
            channels: state.channels.map((c) =>
                c.id === botId ? {
                    ...c,
                    status: channelStatus,
                    lastProgress: { step, status: progressStatus }
                } : c
            )
        }));

        // Also log progress as a system activity event
        get().addActivityEvent({
            botId,
            channel: 'system',
            type: 'system',
            message: `${step}: ${progressStatus}`,
            timestamp: new Date().toISOString()
        });
    },

    // --- Cron Actions ---

    fetchCronJobs: async () => {
        try {
            const response = await api.get<CronJob[]>(API_ENDPOINTS.OMNICHANNEL.CRON.LIST);
            if (response.success) {
                set({ cronJobs: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch cron jobs:', err);
        }
    },

    fetchCronStatus: async () => {
        try {
            const response = await api.get<CronStatus>(API_ENDPOINTS.OMNICHANNEL.CRON.STATUS);
            if (response.success) {
                set({ cronStatus: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch cron status:', err);
        }
    },

    fetchCronRuns: async (jobId) => {
        try {
            const response = await api.get<CronRunLogEntry[]>(API_ENDPOINTS.OMNICHANNEL.CRON.RUNS(jobId));
            if (response.success) {
                set((state) => ({
                    cronRuns: { ...state.cronRuns, [jobId]: response.data }
                }));
            }
        } catch (err) {
            console.error(`Failed to fetch runs for job ${jobId}:`, err);
        }
    },

    createCronJob: async (job) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.CRON.CREATE, job);
            if (response.success) {
                await get().fetchCronJobs();
                await get().fetchCronStatus();
                return true;
            }
        } catch (err) {
            console.error('Failed to create cron job:', err);
        }
        return false;
    },

    toggleCronJob: async (id, enabled) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.CRON.TOGGLE(id), { enabled });
            if (response.success) {
                await get().fetchCronJobs();
                return true;
            }
        } catch (err) {
            console.error(`Failed to toggle cron job ${id}:`, err);
        }
        return false;
    },

    runCronJob: async (id) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.CRON.RUN(id), {});
            return response.success;
        } catch (err) {
            console.error(`Failed to run cron job ${id}:`, err);
        }
        return false;
    },

    removeCronJob: async (id) => {
        try {
            const response = await api.delete(API_ENDPOINTS.OMNICHANNEL.CRON.DELETE(id));
            if (response.success) {
                await get().fetchCronJobs();
                await get().fetchCronStatus();
                return true;
            }
        } catch (err) {
            console.error(`Failed to remove cron job ${id}:`, err);
        }
        return false;
    },

    // --- Skill Actions ---

    fetchSkillReport: async () => {
        try {
            const response = await api.get<SkillStatusReport>(API_ENDPOINTS.OMNICHANNEL.SKILLS.REPORT);
            if (response.success) {
                set({ skillReport: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch skill report:', err);
        }
    },

    toggleSkill: async (key, enabled) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.SKILLS.TOGGLE(key), { enabled });
            if (response.success) {
                await get().fetchSkillReport();
                return true;
            }
        } catch (err) {
            console.error(`Failed to toggle skill ${key}:`, err);
        }
        return false;
    },

    saveSkillKey: async (key, apiKey) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.SKILLS.SAVE_KEY(key), { apiKey });
            return response.success;
        } catch (err) {
            console.error(`Failed to save key for skill ${key}:`, err);
        }
        return false;
    },

    installSkill: async (key, installId) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.SKILLS.INSTALL(key), { installId });
            if (response.success) {
                await get().fetchSkillReport();
                return true;
            }
        } catch (err) {
            console.error(`Failed to install skill ${key}:`, err);
        }
        return false;
    },

    // --- Agent Actions ---

    fetchAgents: async () => {
        try {
            const response = await api.get<AgentsListResult>(API_ENDPOINTS.OMNICHANNEL.AGENTS.LIST);
            if (response.success) {
                set({ agentsResult: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch agents:', err);
        }
    },

    fetchAgentIdentity: async (id) => {
        try {
            const response = await api.get<AgentIdentityResult>(API_ENDPOINTS.OMNICHANNEL.AGENTS.IDENTITY(id));
            if (response.success) {
                set((state) => ({
                    agentIdentities: { ...state.agentIdentities, [id]: response.data }
                }));
            }
        } catch (err) {
            console.error(`Failed to fetch identity for agent ${id}:`, err);
        }
    },

    // --- Usage & Session Actions ---

    fetchUsageTotals: async () => {
        try {
            const response = await api.get<UsageTotals>(API_ENDPOINTS.OMNICHANNEL.USAGE.TOTALS);
            if (response.success) {
                set({ usageTotals: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch usage totals:', err);
        }
    },

    fetchUsageDaily: async () => {
        try {
            const response = await api.get<CostDailyEntry[]>(API_ENDPOINTS.OMNICHANNEL.USAGE.DAILY);
            if (response.success) {
                set({ usageDaily: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch daily usage:', err);
        }
    },

    fetchUsageSessions: async () => {
        try {
            const response = await api.get<UsageSessionEntry[]>(API_ENDPOINTS.OMNICHANNEL.USAGE.SESSIONS);
            if (response.success) {
                set({ usageSessions: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch usage sessions:', err);
        }
    },

    fetchSessionsList: async () => {
        try {
            const response = await api.get<SessionsListResult>(API_ENDPOINTS.OMNICHANNEL.SESSIONS.LIST);
            if (response.success) {
                set({ sessionsList: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch sessions list:', err);
        }
    },

    // --- Nodes & Logs Actions ---

    fetchNodes: async () => {
        try {
            const response = await api.get<NodeRegistryEntry[]>(API_ENDPOINTS.OMNICHANNEL.NODES.LIST);
            if (response.success) {
                set({ nodes: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch nodes:', err);
        }
    },

    fetchDevices: async () => {
        try {
            const response = await api.get<DevicePairingList>(API_ENDPOINTS.OMNICHANNEL.NODES.DEVICES);
            if (response.success) {
                set({ devices: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch devices:', err);
        }
    },

    fetchLogs: async () => {
        try {
            const response = await api.get<LogEntry[]>(API_ENDPOINTS.OMNICHANNEL.LOGS.LIST);
            if (response.success) {
                set({ logs: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    },

    approveDevice: async (id) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.NODES.APPROVE(id), {});
            if (response.success) {
                await get().fetchDevices();
                return true;
            }
        } catch (err) {
            console.error(`Failed to approve device ${id}:`, err);
        }
        return false;
    },

    rejectDevice: async (id) => {
        try {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.NODES.REJECT(id), {});
            if (response.success) {
                await get().fetchDevices();
                return true;
            }
        } catch (err) {
            console.error(`Failed to reject device ${id}:`, err);
        }
        return false;
    },

    // --- Gateway Actions ---

    fetchGatewayHealth: async () => {
        try {
            const response = await api.get<any>(API_ENDPOINTS.OMNICHANNEL.GATEWAY.HEALTH);
            if (response.success) {
                set({ gatewayHealth: response.data });
            }
        } catch (err) {
            console.error('Failed to fetch gateway health:', err);
        }
    }
}));
