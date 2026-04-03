import React, { useState, useRef, memo, useCallback } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useLocalize, useLocalStorage } from '~/hooks';
import { useProjectsQuery } from '~/data-provider';
import ProjectDialog from './ProjectDialog';
import ProjectItem from './ProjectItem';
import { cn } from '~/utils';

interface ProjectsListProps {
  toggleNav: () => void;
}

const ProjectsList = memo(({ toggleNav }: ProjectsListProps) => {
  const localize = useLocalize();
  const [isExpanded, setIsExpanded] = useLocalStorage('projectsExpanded', true);
  const [showCreate, setShowCreate] = useState(false);
  const createTriggerRef = useRef<HTMLButtonElement>(null);

  const { data } = useProjectsQuery(undefined, {
    staleTime: 30000,
    cacheTime: 300000,
  });

  const projects = data?.projects ?? [];

  const handleNewProjectClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCreate(true);
  }, []);

  return (
    <div className="mb-1">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        className="group flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-text-tertiary hover:bg-surface-active-alt hover:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-1">
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform duration-150',
              !isExpanded && '-rotate-90',
            )}
          />
          <span>{localize('com_ui_projects')}</span>
        </div>
        <button
          ref={createTriggerRef}
          type="button"
          className="rounded p-0.5 opacity-0 hover:bg-surface-tertiary group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          onClick={handleNewProjectClick}
          aria-label={localize('com_ui_new_project')}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-0.5 space-y-0.5 px-1">
          {projects.length === 0 && (
            <div className="px-2 py-1 text-xs text-text-tertiary">
              {localize('com_ui_no_projects')}
            </div>
          )}
          {projects.map((project) => (
            <ProjectItem key={project._id} project={project} toggleNav={toggleNav} />
          ))}
        </div>
      )}

      <ProjectDialog open={showCreate} onOpenChange={setShowCreate} triggerRef={createTriggerRef} />
    </div>
  );
});

ProjectsList.displayName = 'ProjectsList';

export default ProjectsList;
