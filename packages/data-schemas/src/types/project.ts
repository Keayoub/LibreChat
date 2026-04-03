import type { Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  instructions?: string;
  color?: string;
  icon?: string;
  user: string;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  instructions?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  instructions?: string;
  color?: string;
  icon?: string;
}

export interface ProjectResponse {
  _id: string;
  name: string;
  description?: string;
  instructions?: string;
  color?: string;
  icon?: string;
  user: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
  nextCursor: string | null;
}

export interface ProjectConversation {
  conversationId: string;
  title?: string;
  updatedAt?: string;
}
