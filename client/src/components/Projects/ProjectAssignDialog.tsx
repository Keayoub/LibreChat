import React, { memo, useCallback } from 'react';
import { OGDialog, OGDialogContent, OGDialogHeader, OGDialogTitle, useToastContext } from '@librechat/client';
import { useProjectsQuery, useAssignConversationToProjectMutation } from '~/data-provider';
import { useLocalize } from '~/hooks';

interface ProjectAssignDialogProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectAssignDialog = memo(
  ({ conversationId, open, onOpenChange }: ProjectAssignDialogProps) => {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const { data } = useProjectsQuery(undefined, { enabled: open });

    const assignMutation = useAssignConversationToProjectMutation({
      onSuccess: () => {
        showToast({ message: localize('com_ui_project_updated'), status: 'success' });
        onOpenChange(false);
      },
      onError: () => {
        showToast({ message: localize('com_ui_project_update_error'), status: 'error' });
      },
    });

    const handleAssign = useCallback(
      (projectId: string) => {
        assignMutation.mutate({ projectId, conversationId });
      },
      [assignMutation, conversationId],
    );

    const projects = data?.projects ?? [];

    return (
      <OGDialog open={open} onOpenChange={onOpenChange}>
        <OGDialogContent className="w-80">
          <OGDialogHeader>
            <OGDialogTitle>{localize('com_ui_move_to_project')}</OGDialogTitle>
          </OGDialogHeader>
          <div className="mt-2 space-y-1">
            {projects.length === 0 && (
              <p className="px-1 text-sm text-text-tertiary">{localize('com_ui_no_projects')}</p>
            )}
            {projects.map((project) => (
              <button
                key={project._id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-primary hover:bg-surface-active-alt disabled:opacity-50"
                disabled={assignMutation.isLoading}
                onClick={() => handleAssign(project._id)}
              >
                <span className="text-base">{project.icon || '📁'}</span>
                <span className="flex-1 truncate text-left">{project.name}</span>
              </button>
            ))}
          </div>
        </OGDialogContent>
      </OGDialog>
    );
  },
);

ProjectAssignDialog.displayName = 'ProjectAssignDialog';

export default ProjectAssignDialog;
