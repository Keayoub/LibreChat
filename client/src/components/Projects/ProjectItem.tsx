import React, { useState, useRef, memo, useCallback } from 'react';
import { ChevronRight, Pen, Trash, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '@librechat/client';
import type { TProject } from 'librechat-data-provider';
import { useProjectConversationsQuery, useDeleteProjectMutation } from '~/data-provider';
import { useLocalize, useLocalStorage } from '~/hooks';
import ProjectDialog from './ProjectDialog';
import { cn } from '~/utils';

interface ProjectItemProps {
  project: TProject;
  toggleNav: () => void;
}

const ProjectItem = memo(({ project, toggleNav }: ProjectItemProps) => {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [isExpanded, setIsExpanded] = useLocalStorage(`project-expanded-${project._id}`, false);
  const [showEdit, setShowEdit] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const editTriggerRef = useRef<HTMLButtonElement>(null);

  const { data: convoData } = useProjectConversationsQuery(project._id, undefined, {
    enabled: isExpanded,
  });

  const deleteMutation = useDeleteProjectMutation({
    onSuccess: () => showToast({ message: localize('com_ui_project_deleted'), status: 'success' }),
    onError: () => showToast({ message: localize('com_ui_project_delete_error'), status: 'error' }),
  });

  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteMutation.mutate(project._id);
    },
    [deleteMutation, project._id],
  );

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEdit(true);
  }, []);

  const projectIcon = project.icon || '';
  const projectColor = project.color || '#6366f1';

  return (
    <div className="group/project">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-active-alt hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-150',
            isExpanded && 'rotate-90',
          )}
        />
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs"
          style={projectIcon ? {} : { color: projectColor }}
          aria-hidden="true"
        >
          {projectIcon || <FolderOpen className="h-3.5 w-3.5" style={{ color: projectColor }} />}
        </span>
        <span className="flex-1 truncate">{project.name}</span>

        {isHovered && (
          <span className="ml-auto flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              ref={editTriggerRef}
              type="button"
              className="rounded p-0.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary focus:outline-none"
              onClick={handleEditClick}
              aria-label={localize('com_ui_edit_project')}
            >
              <Pen className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-text-tertiary hover:bg-surface-tertiary hover:text-red-500 focus:outline-none"
              onClick={handleDelete}
              aria-label={localize('com_ui_delete_project')}
            >
              <Trash className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border-light pl-2">
          {!convoData && (
            <div className="py-1 text-xs text-text-tertiary">{localize('com_ui_loading')}</div>
          )}
          {convoData?.conversations.length === 0 && (
            <div className="py-1 text-xs text-text-tertiary">
              {localize('com_ui_no_projects')}
            </div>
          )}
          {convoData?.conversations.map((convo) => (
            <div
              key={convo.conversationId}
              role="button"
              tabIndex={0}
              className="cursor-pointer truncate rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-active-alt hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
              onClick={() => {
                navigate(`/c/${convo.conversationId}`);
                toggleNav();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/c/${convo.conversationId}`);
                  toggleNav();
                }
              }}
            >
              {convo.title || localize('com_ui_new_chat')}
            </div>
          ))}
        </div>
      )}

      <ProjectDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        project={project}
        triggerRef={editTriggerRef}
      />
    </div>
  );
});

ProjectItem.displayName = 'ProjectItem';

export default ProjectItem;
