import { Router, type Request, type Response, type NextFunction } from 'express';
import { nanoid } from 'nanoid';
import type { ApiResponse, Domain, CreateDomainRequest } from '@zima-host/shared';
import * as caddyService from '../services/caddy.service.js';
import * as projectService from '../services/project.service.js';
import { AppError } from '../middleware/error.js';

export const domainsRouter = Router();

// GET /api/domains - list all domains
domainsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const domains = caddyService.getAllDomains();
    const response: ApiResponse<Domain[]> = {
      success: true,
      data: domains,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/domains - add domain to project
domainsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateDomainRequest;
    if (!body.projectId || !body.domain) {
      throw new AppError(400, 'projectId and domain are required fields');
    }

    const project = projectService.getProjectById(body.projectId);
    if (!project) {
      throw new AppError(404, `Project with ID ${body.projectId} not found`);
    }

    const id = nanoid();
    const sslEnabled = body.sslEnabled !== undefined ? body.sslEnabled : true;
    const domain = caddyService.addDomain(id, body.projectId, body.domain.trim().toLowerCase(), sslEnabled);

    // Update and reload Caddy
    await caddyService.updateCaddy().catch((err) => {
      console.warn('[caddy] failed to update after adding domain:', err);
    });

    const response: ApiResponse<Domain> = {
      success: true,
      data: domain,
      message: 'Domain added successfully',
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/domains/:id - remove domain
domainsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const domain = caddyService.getDomainById(id);
    if (!domain) {
      throw new AppError(404, `Domain with ID ${id} not found`);
    }

    const removed = caddyService.removeDomain(id);
    if (!removed) {
      throw new AppError(500, 'Failed to remove domain');
    }

    // Update and reload Caddy
    await caddyService.updateCaddy().catch((err) => {
      console.warn('[caddy] failed to update after removing domain:', err);
    });

    const response: ApiResponse = {
      success: true,
      message: 'Domain removed successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});
