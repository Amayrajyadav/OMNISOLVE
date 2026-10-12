import React, { useState } from 'react';
import { 
  FolderPlus, 
  Folder, 
  MessageSquare, 
  MoreVertical, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronRight,
  MoveRight,
  ShieldCheck,
  Terminal,
  Cpu,
  FileText
} from 'lucide-react';
import { Project, Conversation } from '../../types/project';
import { AnalysisMode } from '../../types/analysis';
import { ANALYSIS_MODES } from '../../config/supportedFiles';

interface AppSidebarProps {
  projects: Project[];
  conversations: Conversation[];
  activeProjectId: string | null;
  activeConversationId: string | null;
  activeMode: AnalysisMode;
  isOnline: boolean;
  isMockMode: boolean;
  onSelectProject: (projectId: string | null) => void;
  onSelectConversation: (conversationId: string) => void;
  onSelectMode: (mode: AnalysisMode) => void;
  onNewChat: () => void;
  onOpenCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onRenameConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  onMoveConversation: (conversation: Conversation, targetProjectId: string | null) => void;
  onToggleMockMode: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  projects,
  conversations,
  activeProjectId,
  activeConversationId,
  activeMode,
  isOnline,
  isMockMode,
  onSelectProject,
  onSelectConversation,
  onSelectMode,
  onNewChat,
  onOpenCreateProject,
  onEditProject,
  onDeleteProject,
  onRenameConversation,
  onDeleteConversation,
  onMoveConversation,
  onToggleMockMode,
}) => {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [openChatMenuId, setOpenChatMenuId] = useState<string | null>(null);
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleGlobalClick = () => {
      setOpenChatMenuId(null);
      setOpenProjectMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const visibleProjects = showAllProjects ? projects : projects.slice(0, 5);
  const visibleConversations = showAllChats ? conversations : conversations.slice(0, 8);

  const getModeIcon = (mode: AnalysisMode) => {
    switch (mode) {
      case 'code_debugger':
        return <Terminal className="w-3.5 h-3.5 text-[#21D2ED] shrink-0" />;
      case 'circuit_analyzer':
        return <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'document_explainer':
        return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <aside className="w-72 border-r border-white/[0.06] bg-[#080D15]/95 backdrop-blur-xl flex flex-col justify-between shrink-0 h-full select-none">
      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* A. BRANDING & NEW CHAT */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                <span className="font-mono text-xs font-semibold text-white">Ω</span>
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">OmniSolve AI</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/10">
              Gemma 4
            </span>
          </div>

          <button
            onClick={onNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer group shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#21D2ED] group-hover:rotate-90 transition-transform duration-200" />
            <span>New Chat</span>
          </button>
        </div>

        {/* B. ANALYSIS MODE */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider px-2 block">
            Analysis Mode
          </span>
          <div className="space-y-1">
            {(Object.keys(ANALYSIS_MODES) as AnalysisMode[]).map((modeKey) => {
              const conf = ANALYSIS_MODES[modeKey];
              const isSelected = activeMode === modeKey;
              return (
                <button
                  key={modeKey}
                  onClick={() => onSelectMode(modeKey)}
                  className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] text-white border border-white/20 font-medium'
                      : 'text-[#94A0B8] hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getModeIcon(modeKey)}
                    <span className="truncate">{conf.name}</span>
                  </div>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#21D2ED]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* C. PROJECTS SECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              Projects ({projects.length})
            </span>
            <button
              onClick={onOpenCreateProject}
              className="text-[#94A0B8] hover:text-[#21D2ED] p-1 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center space-x-1"
              title="Add Project"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.06] text-center">
                <p className="text-[11px] text-[#64748B]">No projects created yet.</p>
                <button
                  onClick={onOpenCreateProject}
                  className="mt-1.5 text-[11px] text-[#21D2ED] hover:underline cursor-pointer"
                >
                  + Add Project
                </button>
              </div>
            ) : (
              visibleProjects.map((project) => {
                const isSelected = activeProjectId === project.id;
                const projectChatsCount = conversations.filter((c) => c.projectId === project.id).length;

                return (
                  <div key={project.id} className="relative group">
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] text-white border border-white/20 font-medium'
                          : 'text-[#94A0B8] hover:text-white hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#21D2ED]' : 'text-[#64748B]'}`} />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="text-[10px] font-mono text-[#64748B] px-1.5 py-0.2 rounded bg-white/[0.04]">
                          {projectChatsCount}
                        </span>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenProjectMenuId(openProjectMenuId === project.id ? null : project.id);
                          }}
                          className="p-1 rounded text-[#64748B] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </div>
                      </div>
                    </button>

                    {/* Project Context Menu */}
                    {openProjectMenuId === project.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-8 z-30 w-36 py-1 bg-[#141B2B] border border-white/10 rounded-xl shadow-2xl text-xs space-y-0.5 animate-fade-in"
                      >
                        <button
                          onClick={() => {
                            setOpenProjectMenuId(null);
                            onEditProject(project);
                          }}
                          className="w-full px-3 py-1.5 text-left text-[#94A0B8] hover:text-white hover:bg-white/[0.06] flex items-center space-x-2"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Project</span>
                        </button>
                        <button
                          onClick={() => {
                            setOpenProjectMenuId(null);
                            onDeleteProject(project);
                          }}
                          className="w-full px-3 py-1.5 text-left text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 flex items-center space-x-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {projects.length > 5 && (
              <button
                onClick={() => setShowAllProjects(!showAllProjects)}
                className="w-full py-1 text-[11px] text-[#64748B] hover:text-[#94A0B8] flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>{showAllProjects ? 'Show Less' : `See All (${projects.length})`}</span>
                {showAllProjects ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* D. RECENT CHATS SECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              Recent Chats ({conversations.length})
            </span>
          </div>

          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <p className="text-[11px] text-[#64748B]">No recent conversations.</p>
              </div>
            ) : (
              visibleConversations.map((conv) => {
                const isSelected = activeConversationId === conv.id;
                const assignedProj = projects.find((p) => p.id === conv.projectId);

                return (
                  <div key={conv.id} className="relative group">
                    <button
                      onClick={() => onSelectConversation(conv.id)}
                      className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] text-white border border-white/20 font-medium'
                          : 'text-[#94A0B8] hover:text-white hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#21D2ED]' : 'text-[#64748B]'}`} />
                        <div className="truncate">
                          <span className="truncate block">{conv.title || 'Untitled Conversation'}</span>
                          {assignedProj && (
                            <span className="text-[9px] text-[#21D2ED]/80 font-mono block truncate">
                              ↳ {assignedProj.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenChatMenuId(openChatMenuId === conv.id ? null : conv.id);
                        }}
                        className="p-1 rounded text-[#64748B] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </div>
                    </button>

                    {/* Conversation Context Menu */}
                    {openChatMenuId === conv.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-8 z-30 w-44 py-1 bg-[#141B2B] border border-white/10 rounded-xl shadow-2xl text-xs space-y-0.5 animate-fade-in"
                      >
                        <button
                          onClick={() => {
                            setOpenChatMenuId(null);
                            onRenameConversation(conv);
                          }}
                          className="w-full px-3 py-1.5 text-left text-[#94A0B8] hover:text-white hover:bg-white/[0.06] flex items-center space-x-2"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>

                        {/* Move to project options */}
                        <div className="px-3 py-1 text-[10px] font-mono text-[#64748B] border-t border-white/[0.06]">
                          Assign Project:
                        </div>
                        {conv.projectId && (
                          <button
                            onClick={() => {
                              setOpenChatMenuId(null);
                              onMoveConversation(conv, null);
                            }}
                            className="w-full px-3 py-1 text-left text-[#94A0B8] hover:text-white hover:bg-white/[0.06] flex items-center space-x-1.5 text-[11px]"
                          >
                            <MoveRight className="w-2.5 h-2.5" />
                            <span>Remove from Project</span>
                          </button>
                        )}
                        {projects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setOpenChatMenuId(null);
                              onMoveConversation(conv, p.id);
                            }}
                            className={`w-full px-3 py-1 text-left hover:bg-white/[0.06] flex items-center space-x-1.5 text-[11px] truncate ${
                              conv.projectId === p.id ? 'text-[#21D2ED] font-medium' : 'text-[#94A0B8] hover:text-white'
                            }`}
                          >
                            <Folder className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}

                        <div className="border-t border-white/[0.06] pt-0.5">
                          <button
                            onClick={() => {
                              setOpenChatMenuId(null);
                              onDeleteConversation(conv);
                            }}
                            className="w-full px-3 py-1.5 text-left text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 flex items-center space-x-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Chat</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {conversations.length > 8 && (
              <button
                onClick={() => setShowAllChats(!showAllChats)}
                className="w-full py-1 text-[11px] text-[#64748B] hover:text-[#94A0B8] flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>{showAllChats ? 'Show Less' : `See All (${conversations.length})`}</span>
                {showAllChats ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* E. BOTTOM STATUS SECTION */}
      <div className="p-4 border-t border-white/[0.06] space-y-2.5 bg-[#0B0F17]">
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-[#64748B] font-mono">Backend</span>
          <span className="flex items-center space-x-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className={isOnline ? 'text-emerald-300' : 'text-amber-300'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </span>
        </div>

        <button
          onClick={onToggleMockMode}
          className={`w-full py-1.5 px-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
            isMockMode
              ? 'bg-white/[0.08] text-white border-white/20'
              : 'bg-transparent text-[#94A0B8] border-white/[0.08] hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#21D2ED]" />
            <span>{isMockMode ? 'Mock Mode' : 'Live API'}</span>
          </span>
          <span className="text-[10px] text-[#64748B]">{isMockMode ? 'Demo' : 'FastAPI'}</span>
        </button>
      </div>
    </aside>
  );
};
