import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions, QueryObserverResult } from '@tanstack/react-query';
import type {
  TProject,
  ProjectListParams,
  ProjectListResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectConversationsResponse,
} from 'librechat-data-provider';

/* Queries */

export const useProjectsQuery = (
  params?: ProjectListParams,
  config?: UseQueryOptions<ProjectListResponse>,
): QueryObserverResult<ProjectListResponse> => {
  return useQuery<ProjectListResponse>(
    [QueryKeys.projects, params],
    () => dataService.listProjects(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
    },
  );
};

export const useProjectQuery = (
  id: string,
  config?: UseQueryOptions<TProject>,
): QueryObserverResult<TProject> => {
  return useQuery<TProject>(
    [QueryKeys.project, id],
    () => dataService.getProjectById(id),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!id,
      ...config,
    },
  );
};

export const useProjectConversationsQuery = (
  projectId: string,
  params?: { cursor?: string; limit?: number },
  config?: UseQueryOptions<ProjectConversationsResponse>,
): QueryObserverResult<ProjectConversationsResponse> => {
  return useQuery<ProjectConversationsResponse>(
    [QueryKeys.projectConversations, projectId, params],
    () => dataService.listProjectConversations(projectId, params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!projectId,
      ...config,
    },
  );
};

/* Mutations */

export const useCreateProjectMutation = (
  options?: UseMutationOptions<TProject, Error, CreateProjectRequest>,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    (data: CreateProjectRequest) => dataService.createProject(data),
    {
      ...options,
      onSuccess: (...params) => {
        queryClient.invalidateQueries([QueryKeys.projects]);
        options?.onSuccess?.(...params);
      },
    },
  );
};

export const useUpdateProjectMutation = (
  options?: UseMutationOptions<TProject, Error, { id: string; data: UpdateProjectRequest }>,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      dataService.updateProject(id, data),
    {
      ...options,
      onSuccess: (result, vars, ctx) => {
        queryClient.setQueryData([QueryKeys.project, vars.id], result);
        queryClient.invalidateQueries([QueryKeys.projects]);
        options?.onSuccess?.(result, vars, ctx);
      },
    },
  );
};

export const useDeleteProjectMutation = (
  options?: UseMutationOptions<{ message: string }, Error, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    (id: string) => dataService.deleteProject(id),
    {
      ...options,
      onSuccess: (result, id, ctx) => {
        queryClient.invalidateQueries([QueryKeys.projects]);
        queryClient.removeQueries([QueryKeys.project, id]);
        queryClient.removeQueries([QueryKeys.projectConversations, id]);
        options?.onSuccess?.(result, id, ctx);
      },
    },
  );
};

export const useAssignConversationToProjectMutation = (
  options?: UseMutationOptions<
    { message: string },
    Error,
    { projectId: string; conversationId: string }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ projectId, conversationId }: { projectId: string; conversationId: string }) =>
      dataService.assignConversationToProject(projectId, conversationId),
    {
      ...options,
      onSuccess: (result, vars, ctx) => {
        queryClient.invalidateQueries([QueryKeys.projectConversations, vars.projectId]);
        options?.onSuccess?.(result, vars, ctx);
      },
    },
  );
};

export const useUnassignConversationFromProjectMutation = (
  options?: UseMutationOptions<
    { message: string },
    Error,
    { conversationId: string; projectId?: string }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ conversationId }: { conversationId: string; projectId?: string }) =>
      dataService.unassignConversationFromProject(conversationId),
    {
      ...options,
      onSuccess: (result, vars, ctx) => {
        if (vars.projectId) {
          queryClient.invalidateQueries([QueryKeys.projectConversations, vars.projectId]);
        }
        options?.onSuccess?.(result, vars, ctx);
      },
    },
  );
};
