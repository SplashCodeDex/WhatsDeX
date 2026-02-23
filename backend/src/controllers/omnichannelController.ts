import { Request, Response } from 'express';
import { OpenClawGateway } from '../services/openClawGateway.js';
import logger from '../utils/logger.js';

/**
 * OmnichannelController
 *
 * Proxies Omnichannel API requests to the OpenClaw gateway engine.
 * Handles: Cron Jobs, Usage/Sessions, Nodes/Devices, and Logs.
 */
export class OmnichannelController {
    // ─── Helpers ──────────────────────────────────────────
    private static getGateway(): OpenClawGateway {
        return OpenClawGateway.getInstance();
    }

    private static unavailable(res: Response, feature: string) {
        return res.status(503).json({
            success: false,
            error: `OpenClaw gateway is not initialized. ${feature} is unavailable.`,
        });
    }

    // ═══════════════════════════════════════════════════════
    //  CRON
    // ═══════════════════════════════════════════════════════

    /** GET /api/omnichannel/cron/status */
    static async getCronStatus(_req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const result = await gw.getCronStatus();
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getCronStatus', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/cron/jobs */
    static async listCronJobs(_req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const result = await gw.listCronJobs();
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.listCronJobs', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** POST /api/omnichannel/cron/jobs */
    static async createCronJob(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const result = await gw.addCronJob(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.createCronJob', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** PATCH /api/omnichannel/cron/jobs/:id/toggle */
    static async toggleCronJob(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const result = await gw.updateCronJob(id, { enabled: req.body.enabled });
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.toggleCronJob', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** POST /api/omnichannel/cron/jobs/:id/run */
    static async runCronJob(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const result = await gw.runCronJob(id);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.runCronJob', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** DELETE /api/omnichannel/cron/jobs/:id */
    static async deleteCronJob(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const result = await gw.removeCronJob(id);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.deleteCronJob', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/cron/jobs/:id/runs */
    static async getCronRuns(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const limit = parseInt(req.query.limit as string) || 50;
            const result = await gw.getCronRuns(id, limit);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getCronRuns', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  USAGE
    // ═══════════════════════════════════════════════════════

    /** GET /api/omnichannel/usage/totals */
    static async getUsageTotals(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const days = parseInt(req.query.days as string) || 30;
            const result = await gw.getUsageTotals(days);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getUsageTotals', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/usage/daily */
    static async getUsageDaily(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const days = parseInt(req.query.days as string) || 30;
            const result = await gw.getUsageDaily(days);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getUsageDaily', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/usage/sessions */
    static async getUsageSessions(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const days = parseInt(req.query.days as string) || 30;
            const result = await gw.getUsageSessions(days);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getUsageSessions', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/usage/sessions/:key/logs */
    static async getSessionLogs(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const key = String(req.params.key);
            const result = await gw.getSessionLogs(key);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getSessionLogs', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  SESSIONS
    // ═══════════════════════════════════════════════════════

    /** GET /api/omnichannel/sessions */
    static async listSessions(_req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const result = await gw.listSessions();
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.listSessions', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** DELETE /api/omnichannel/sessions/:key */
    static async deleteSession(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const key = String(req.params.key);
            const result = await gw.deleteSession(key);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.deleteSession', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** PATCH /api/omnichannel/sessions/:key */
    static async patchSession(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const key = String(req.params.key);
            const result = await gw.patchSession(key, req.body);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.patchSession', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  NODES & DEVICES
    // ═══════════════════════════════════════════════════════

    /** GET /api/omnichannel/nodes */
    static async listNodes(_req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const result = await gw.listNodes();
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.listNodes', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/devices */
    static async listDevices(_req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const result = await gw.listDevices();
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.listDevices', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** POST /api/omnichannel/devices/:id/approve */
    static async approveDevice(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const result = await gw.approveDevice(id);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.approveDevice', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** POST /api/omnichannel/devices/:id/reject */
    static async rejectDevice(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const result = await gw.rejectDevice(id);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.rejectDevice', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** POST /api/omnichannel/devices/:id/revoke */
    static async revokeDevice(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const id = String(req.params.id);
            const result = await gw.revokeDevice(id);
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.revokeDevice', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  LOGS
    // ═══════════════════════════════════════════════════════

    /** GET /api/omnichannel/logs */
    static async getLogs(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();
            const limit = parseInt(req.query.limit as string) || 100;
            const level = req.query.level as string | undefined;
            const result = await gw.getLogs({ limit, level });
            res.json({ success: true, data: result });
        } catch (error: any) {
            logger.error('OmnichannelController.getLogs', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /** GET /api/omnichannel/logs/stream (SSE) */
    static async streamLogs(req: Request, res: Response) {
        try {
            const gw = OmnichannelController.getGateway();

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            const cleanup = await gw.streamLogs((entry: any) => {
                res.write(`data: ${JSON.stringify(entry)}\n\n`);
            });

            req.on('close', () => {
                if (cleanup && typeof cleanup === 'function') cleanup();
            });
        } catch (error: any) {
            logger.error('OmnichannelController.streamLogs', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    }
}
