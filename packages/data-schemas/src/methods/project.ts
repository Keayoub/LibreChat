import type { Model } from 'mongoose';
import logger from '~/config/winston';
import type { IProject } from '~/types';

const MAX_PROJECTS_PER_USER = 200;
const DEFAULT_PAGE_LIMIT = 25;

export interface ProjectMethods {
  createProject(
    user: string,
    data: Partial<IProject>,
  ): Promise<IProject>;
  getProjectById(user: string, projectId: string): Promise<IProject | null>;
  getProjectsByUser(
    user: string,
    options?: { cursor?: string | null; limit?: number },
  ): Promise<{ projects: IProject[]; nextCursor: string | null }>;
  updateProject(
    user: string,
    projectId: string,
    data: Partial<IProject>,
  ): Promise<IProject | null>;
  deleteProject(user: string, projectId: string): Promise<IProject | null>;
  unsetConversationProject(projectId: string): Promise<void>;
}

export function createProjectMethods(mongoose: typeof import('mongoose')): ProjectMethods {
  async function createProject(user: string, data: Partial<IProject>): Promise<IProject> {
    try {
      const Project = mongoose.models.Project as Model<IProject>;
      const count = await Project.countDocuments({ user });
      if (count >= MAX_PROJECTS_PER_USER) {
        throw new Error(`Maximum of ${MAX_PROJECTS_PER_USER} projects per user reached`);
      }
      const project = await Project.create({ ...data, user });
      return project.toObject();
    } catch (error) {
      logger.error('[createProject] Error creating project', error);
      throw error;
    }
  }

  async function getProjectById(user: string, projectId: string): Promise<IProject | null> {
    try {
      const Project = mongoose.models.Project as Model<IProject>;
      return await Project.findOne({ _id: projectId, user }).lean();
    } catch (error) {
      logger.error('[getProjectById] Error fetching project', error);
      throw new Error('Error fetching project');
    }
  }

  async function getProjectsByUser(
    user: string,
    { cursor, limit = DEFAULT_PAGE_LIMIT }: { cursor?: string | null; limit?: number } = {},
  ): Promise<{ projects: IProject[]; nextCursor: string | null }> {
    try {
      const Project = mongoose.models.Project as Model<IProject>;
      const query: Record<string, unknown> = { user };

      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
          query._id = { $gt: decoded.id };
        } catch {
          logger.warn('[getProjectsByUser] Invalid cursor, starting from beginning');
        }
      }

      const projects = await Project.find(query)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean();

      let nextCursor: string | null = null;
      if (projects.length > limit) {
        projects.pop();
        const last = projects[projects.length - 1] as IProject & { _id: unknown };
        nextCursor = Buffer.from(JSON.stringify({ id: String(last._id) })).toString('base64');
      }

      return { projects, nextCursor };
    } catch (error) {
      logger.error('[getProjectsByUser] Error fetching projects', error);
      throw new Error('Error fetching projects');
    }
  }

  async function updateProject(
    user: string,
    projectId: string,
    data: Partial<IProject>,
  ): Promise<IProject | null> {
    try {
      const Project = mongoose.models.Project as Model<IProject>;
      const { user: _u, _id: _i, ...safeData } = data as IProject & { _id?: unknown };
      return await Project.findOneAndUpdate(
        { _id: projectId, user },
        { $set: safeData },
        { new: true },
      ).lean();
    } catch (error) {
      logger.error('[updateProject] Error updating project', error);
      throw new Error('Error updating project');
    }
  }

  async function deleteProject(user: string, projectId: string): Promise<IProject | null> {
    try {
      const Project = mongoose.models.Project as Model<IProject>;
      return await Project.findOneAndDelete({ _id: projectId, user }).lean();
    } catch (error) {
      logger.error('[deleteProject] Error deleting project', error);
      throw new Error('Error deleting project');
    }
  }

  async function unsetConversationProject(projectId: string): Promise<void> {
    try {
      const Conversation = mongoose.models.Conversation;
      if (!Conversation) return;
      await Conversation.updateMany({ projectId }, { $unset: { projectId: 1 } });
    } catch (error) {
      logger.error('[unsetConversationProject] Error unsetting project from conversations', error);
    }
  }

  return {
    createProject,
    getProjectById,
    getProjectsByUser,
    updateProject,
    deleteProject,
    unsetConversationProject,
  };
}
