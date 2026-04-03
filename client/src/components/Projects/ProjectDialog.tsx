import React, { useState, useEffect } from 'react';
import {
  OGDialog,
  OGDialogTemplate,
  Button,
  Label,
  Input,
  Spinner,
  useToastContext,
} from '@librechat/client';
import type { TProject, CreateProjectRequest, UpdateProjectRequest } from 'librechat-data-provider';
import { useCreateProjectMutation, useUpdateProjectMutation } from '~/data-provider';
import { useLocalize } from '~/hooks';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#0ea5e9', '#64748b', '#a1a1aa',
];

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  triggerRef?: React.MutableRefObject<HTMLButtonElement | null>;
  project?: TProject;
}

export default function ProjectDialog({
  open,
  onOpenChange,
  children,
  triggerRef,
  project,
}: ProjectDialogProps) {
  const localize = useLocalize();
  const { showToast } = useToastContext();

  const isEdit = !!project;

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [instructions, setInstructions] = useState(project?.instructions ?? '');
  const [color, setColor] = useState(project?.color ?? PRESET_COLORS[0]);
  const [icon, setIcon] = useState(project?.icon ?? '');

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '');
      setDescription(project?.description ?? '');
      setInstructions(project?.instructions ?? '');
      setColor(project?.color ?? PRESET_COLORS[0]);
      setIcon(project?.icon ?? '');
    }
  }, [open, project]);

  const createMutation = useCreateProjectMutation({
    onSuccess: () => {
      showToast({ message: localize('com_ui_project_created'), status: 'success' });
      onOpenChange(false);
      resetForm();
      setTimeout(() => triggerRef?.current?.focus(), 0);
    },
    onError: () => showToast({ message: localize('com_ui_project_create_error'), status: 'error' }),
  });

  const updateMutation = useUpdateProjectMutation({
    onSuccess: () => {
      showToast({ message: localize('com_ui_project_updated'), status: 'success' });
      onOpenChange(false);
    },
    onError: () => showToast({ message: localize('com_ui_project_update_error'), status: 'error' }),
  });

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstructions('');
    setColor(PRESET_COLORS[0]);
    setIcon('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast({ message: localize('com_ui_project_name_required'), status: 'error' });
      return;
    }

    if (isEdit && project) {
      const data: UpdateProjectRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        color,
        icon: icon.trim() || undefined,
      };
      updateMutation.mutate({ id: project._id, data });
    } else {
      const data: CreateProjectRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        color,
        icon: icon.trim() || undefined,
      };
      createMutation.mutate(data);
    }
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange} triggerRef={triggerRef}>
      {children}
      <OGDialogTemplate
        title={localize(isEdit ? 'com_ui_edit_project' : 'com_ui_create_project')}
        showCloseButton={false}
        className="w-11/12 md:max-w-lg"
        main={
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-sm font-medium text-text-primary">
                {localize('com_ui_project_name')}
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={localize('com_ui_project_name')}
                className="w-full"
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-sm font-medium text-text-primary">
                {localize('com_ui_project_description')}
              </Label>
              <Input
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={localize('com_ui_project_description')}
                className="w-full"
                maxLength={500}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-instructions" className="text-sm font-medium text-text-primary">
                {localize('com_ui_project_instructions')}
              </Label>
              <textarea
                id="project-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={localize('com_ui_project_instructions')}
                className="w-full rounded-md border border-border-medium bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-heavy disabled:opacity-50"
                rows={3}
                maxLength={2000}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-primary">
                  {localize('com_ui_project_color')}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={{
                        backgroundColor: c,
                        borderColor: color === c ? '#ffffff' : 'transparent',
                        boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                      }}
                      onClick={() => setColor(c)}
                      aria-label={c}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-icon" className="text-sm font-medium text-text-primary">
                  {localize('com_ui_project_icon')}
                </Label>
                <Input
                  id="project-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📁"
                  className="w-20 text-center text-lg"
                  maxLength={4}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        }
        buttons={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {localize('com_ui_cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {localize('com_ui_save')}
            </Button>
          </div>
        }
      />
    </OGDialog>
  );
}
