import { Router, type Request, type Response, type NextFunction } from 'express';
import type { ApiResponse, SystemStats } from '@zima-host/shared';
import * as monitorService from '../services/monitor.service.js';

export const systemRouter = Router();

// GET /api/system/stats - system resource stats
systemRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await monitorService.getSystemStats();
    const response: ApiResponse<SystemStats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/system/info - basic system info (hostname, OS, etc.)
systemRouter.get('/info', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const info = monitorService.getSystemInfo();
    const response: ApiResponse<Record<string, string | number>> = {
      success: true,
      data: info,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});
