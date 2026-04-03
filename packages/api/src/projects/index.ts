import { isValidObjectIdString } from '@librechat/data-schemas';
import { logger } from '@librechat/data-schemas';
import type { IProject } from '@librechat/data-schemas';
import type { Response } from 'express';
import type { ServerRequest } from '~/types/http';

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_INSTRUCTIONS_LENGTH = 10000;
const MAX_COLOR_LENGTH = 50;
const MAX_ICON_LENGTH = 500;

export interface ProjectsDeps {
  createProject: (user: string, data: Partial<IProject>) => Promise<IProject>;
  getProjectById: (user: string, projectId: string) => Promise<IProject | null>;
  getProjectsByUser: (
    user: string,
    options?: { cursor?: string | null; limit?: number },
  ) => Promise<{ projects: IProject[]; nextCursor: string | null }>;
  updateProject: (
    user: string,
    projectId: string,
    data: Partial<IProject>,
  ) => Promise<IProject | null>;
  deleteProject: (user: string, projectId: string) => Promise<IProject | null>;
  unsetConversationProject: (projectId: string) => Promise<void>;
  saveConvo: (
    ctx: { userId: string },
    data: { conversationId: string; [key: string]: unknown },
    metadata?: { noUpsert?: boolean; unsetFields?: Record<string, number> },
  ) => Promise<unknown>;
  getConvo: (user: string, conversationId: string) => Promise<unknown>;
  getConvosByCursor: (
    user: string,
    options?: { cursor?: string | null; limit?: number; projectId?: string },
  ) => Promise<{ conversations: unknown[]; nextCursor: string | null }>;
}

function parseLimit(raw: unknown, defaultVal = 25): number {
  const n = Number(raw);
  if (Number.isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, 100);
}

export function createProjectsHandlers(deps: ProjectsDeps) {
  const {
    createProject,
    getProjectById,
    getProjectsByUser,
    updateProject,
    deleteProject,
    unsetConversationProject,
    saveConvo,
    getConvo,
    getConvosByCursor,
  } = deps;

  async function listProjects(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
      const limit = parseLimit(req.query.limit);
      const result = await getProjectsByUser(userId, { cursor, limit });
      res.status(200).json(result);
    } catch (error) {
      logger.error('[projects.listProjects]', error);
      res.status(500).json({ error: 'Failed to list projects' });
    }
  }

  async function getProject(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params as { id: string };
    if (!isValidObjectIdString(id)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }
    try {
      const project = await getProjectById(userId, id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.status(200).json(project);
    } catch (error) {
      logger.error('[projects.getProject]', error);
      res.status(500).json({ error: 'Failed to get project' });
    }
  }

  async function createProjectHandler(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { name, description, instructions, color, icon } = req.body as Partial<IProject>;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }
    if (name.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `Name cannot exceed ${MAX_NAME_LENGTH} characters` });
      return;
    }
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      res.status(400).json({ error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` });
      return;
    }
    if (instructions && instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      res.status(400).json({ error: `Instructions cannot exceed ${MAX_INSTRUCTIONS_LENGTH} characters` });
      return;
    }
    if (color && color.length > MAX_COLOR_LENGTH) {
      res.status(400).json({ error: `Color cannot exceed ${MAX_COLOR_LENGTH} characters` });
      return;
    }
    if (icon && icon.length > MAX_ICON_LENGTH) {
      res.status(400).json({ error: `Icon cannot exceed ${MAX_ICON_LENGTH} characters` });
      return;
    }
    try {
      const project = await createProject(userId, {
        name: name.trim(),
        description: description ?? '',
        instructions: instructions ?? '',
        color: color ?? '',
        icon: icon ?? '',
      });
      res.status(201).json(project);
    } catch (error) {
      logger.error('[projects.createProject]', error);
      const msg = error instanceof Error ? error.message : 'Failed to create project';
      res.status(500).json({ error: msg });
    }
  }

  async function updateProjectHandler(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params as { id: string };
    if (!isValidObjectIdString(id)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }
    const { name, description, instructions, color, icon } = req.body as Partial<IProject>;
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json({ error: 'Project name cannot be empty' });
      return;
    }
    if (name && name.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `Name cannot exceed ${MAX_NAME_LENGTH} characters` });
      return;
    }
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      res.status(400).json({ error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` });
      return;
    }
    if (instructions && instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      res.status(400).json({ error: `Instructions cannot exceed ${MAX_INSTRUCTIONS_LENGTH} characters` });
      return;
    }
    try {
      const data: Partial<IProject> = {};
      if (name !== undefined) data.name = name.trim();
      if (description !== undefined) data.description = description;
      if (instructions !== undefined) data.instructions = instructions;
      if (color !== undefined) data.color = color;
      if (icon !== undefined) data.icon = icon;

      const project = await updateProject(userId, id, data);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.status(200).json(project);
    } catch (error) {
      logger.error('[projects.updateProject]', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }

  async function deleteProjectHandler(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params as { id: string };
    if (!isValidObjectIdString(id)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }
    try {
      const project = await deleteProject(userId, id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      await unsetConversationProject(id);
      res.status(200).json({ message: 'Project deleted' });
    } catch (error) {
      logger.error('[projects.deleteProject]', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  async function listProjectConversations(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params as { id: string };
    if (!isValidObjectIdString(id)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }
    try {
      const project = await getProjectById(userId, id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
      const limit = parseLimit(req.query.limit);
      const result = await getConvosByCursor(userId, { cursor, limit, projectId: id });
      res.status(200).json(result);
    } catch (error) {
      logger.error('[projects.listProjectConversations]', error);
      res.status(500).json({ error: 'Failed to list project conversations' });
    }
  }

  async function assignConversation(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id, conversationId } = req.params as { id: string; conversationId: string };
    if (!isValidObjectIdString(id)) {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }
    try {
      const project = await getProjectById(userId, id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      const convo = await getConvo(userId, conversationId);
      if (!convo) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      await saveConvo({ userId }, { conversationId, projectId: id }, { noUpsert: true });
      res.status(200).json({ message: 'Conversation assigned to project' });
    } catch (error) {
      logger.error('[projects.assignConversation]', error);
      res.status(500).json({ error: 'Failed to assign conversation' });
    }
  }

  async function unassignConversation(req: ServerRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { conversationId } = req.params as { conversationId: string };
    try {
      const convo = await getConvo(userId, conversationId);
      if (!convo) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      await saveConvo(
        { userId },
        { conversationId },
        { noUpsert: true, unsetFields: { projectId: 1 } },
      );
      res.status(200).json({ message: 'Conversation removed from project' });
    } catch (error) {
      logger.error('[projects.unassignConversation]', error);
      res.status(500).json({ error: 'Failed to unassign conversation' });
    }
  }

  return {
    listProjects,
    getProject,
    createProject: createProjectHandler,
    updateProject: updateProjectHandler,
    deleteProject: deleteProjectHandler,
    listProjectConversations,
    assignConversation,
    unassignConversation,
  };
}
