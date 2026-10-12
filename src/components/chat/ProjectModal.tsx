import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { Project } from '../../types/project';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: { name: string; description: string; instructions: string }) => void;
  initialProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [instructions, setInstructions] = useState(initialProject?.instructions || '');
  const [error, setError] = useState<string | null>(null);

  const [prevProject, setPrevProject] = useState(initialProject);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (initialProject !== prevProject || isOpen !== prevIsOpen) {
    setPrevProject(initialProject);
    setPrevIsOpen(isOpen);
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
      setInstructions(initialProject.instructions || '');
    } else {
      setName('');
      setDescription('');
      setInstructions('');
    }
    setError(null);
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name is required.');
      return;
    }

    onSave({
      name: trimmedName,
      description: description.trim(),
      instructions: instructions.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md verity-card bg-[#0E131F] border border-white/[0.12] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#21D2ED]/10 border border-[#21D2ED]/30 flex items-center justify-center text-[#21D2ED]">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {initialProject ? 'Edit Project' : 'Create New Project'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A0B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-white/90">
              Project Name <span className="text-[#21D2ED]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. ESP32 Smart Home, Power Converter Debug..."
              className="w-full bg-[#080C12] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-[#64748B] focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-white/90">
              Description <span className="text-[#64748B] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Firmware and circuit schematic troubleshooting..."
              className="w-full bg-[#080C12] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-[#64748B] focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-white/90">
              Project Instructions <span className="text-[#64748B] font-normal">(Optional context)</span>
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Developing an ESP32 system in embedded C. Focus on MQTT connectivity and GPIO pull-ups..."
              className="w-full bg-[#080C12] border border-white/[0.08] rounded-xl p-3 text-white placeholder-[#64748B] focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="verity-btn-secondary px-4 py-2 cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="verity-btn-primary px-5 py-2 cursor-pointer font-medium"
            >
              {initialProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
