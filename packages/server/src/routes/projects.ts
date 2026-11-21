import { Router, type Request, type Response, type NextFunction } from 'express';
import type {
  ApiResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@zima-host/shared';
import * as projectService from '../services/project.service.js';
import { AppError } from '../middleware/error.js';

export const projectsRouter = Router();

// GET /api/projects - list all projects
projectsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = projectService.getAllProjects();
    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - create new project
projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as CreateProjectRequest;
    if (!body.name || !body.type || !body.sourceType) {
      throw new AppError(400, 'name, type, and sourceType are required fields');
    }

    if (body.type !== 'static' && body.type !== 'node') {
      throw new AppError(400, 'Invalid project type. Must be "static" or "node"');
    }

    if (body.sourceType !== 'git' && body.sourceType !== 'upload') {
      throw new AppError(400, 'Invalid source type. Must be "git" or "upload"');
    }

    const project = await projectService.createProject(body);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - get one project
projectsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const project = projectService.getProjectById(id);
    if (!project) {
      throw new AppError(404, `Project with ID ${id} not found`);
    }

    const response: ApiResponse<Project> = {
      success: true,
      data: project,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id - update project
projectsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateProjectRequest;
    const project = projectService.updateProject(id, body);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id - delete project
projectsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await projectService.deleteProject(id);
    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/deploy - build & deploy
projectsRouter.post('/:id/deploy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const project = await projectService.deployProject(id);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project built and deployed successfully',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/start - start container
projectsRouter.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const project = await projectService.startProject(id);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project container started',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/stop - stop container
projectsRouter.post('/:id/stop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const project = await projectService.stopProject(id);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project container stopped',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/restart - restart container
projectsRouter.post('/:id/restart', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const project = await projectService.restartProject(id);
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project container restarted',
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/logs - get container logs
projectsRouter.get('/:id/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tailParam = req.query.tail ? parseInt(req.query.tail as string, 10) : undefined;
    const logs = await projectService.getProjectLogs(id, tailParam);
    const response: ApiResponse<string> = {
      success: true,
      data: logs,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});
