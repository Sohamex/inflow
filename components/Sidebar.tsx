import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Folder, MessageSquare, Plus, ChevronDown, ChevronRight, Hash, Edit2, Trash2, PanelLeft } from 'lucide-react';

// Reusable Inline Input Component
function InlineEdit({ initialValue, onSubmit, onCancel }: { initialValue: string, onSubmit: (val: string) => void, onCancel: () => void }) {
    const [value, setValue] = useState(initialValue);

    const handleComplete = () => {
        if (value.trim()) onSubmit(value.trim());
        else onCancel();
    };

    return (
        <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleComplete}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleComplete();
                if (e.key === 'Escape') onCancel();
            }}
            className="w-full bg-neutral-900 border border-neutral-500 rounded px-2 py-1 text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-500"
            onClick={(e) => e.stopPropagation()}
        />
    );
}

export default function Sidebar() {
    const {
        isSidebarOpen, projects, chats, activeChatId, setActiveChat,
        addProject, renameProject, requestConfirm,
        addChat, renameChat, toggleSidebar,
        sidebarEditContext: editContext, setSidebarEditContext: setEditContext,
        moveChatToProject
    } = useChatStore();

    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

    const toggleProject = (id: string) => setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className={`${isSidebarOpen ? 'w-64 border-neutral-800/50' : 'w-0 border-transparent'} h-full bg-neutral-800 border-r flex flex-col text-[13px] text-neutral-400 shrink-0 overflow-hidden transition-all duration-300 ease-in-out`}>
            <div className="w-64 h-full flex flex-col">
            <div className="h-14 px-4 border-b border-neutral-700/50 flex items-center justify-between shrink-0">
                <button onClick={toggleSidebar} title="Close Sidebar" className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 rounded-lg transition-colors -ml-1.5">
                    <PanelLeft size={18} />
                </button>
                <div className="flex gap-2 items-center">
                    <button onClick={() => setEditContext('new-project')} title="New Project" className="p-1.5 hover:text-neutral-200 text-neutral-500 hover:bg-neutral-700/50 rounded-lg transition-colors"><Folder size={15} /></button>
                    <button onClick={() => setEditContext('new-chat-standalone')} title="New Chat" className="p-1.5 hover:text-neutral-200 text-neutral-500 hover:bg-neutral-700/50 rounded-lg transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            <div 
                className="flex-1 overflow-y-auto p-2 space-y-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    const chatId = e.dataTransfer.getData('chatId');
                    if (chatId) moveChatToProject(chatId, null);
                }}
            >

                {/* NEW STANDALONE CHAT INPUT */}
                {editContext === 'new-chat-standalone' && (
                    <div className="px-2 py-1">
                        <InlineEdit initialValue="New Chat" onSubmit={(v) => { addChat(v, null); setEditContext(null); }} onCancel={() => setEditContext(null)} />
                    </div>
                )}

                {/* STANDALONE CHATS */}
                {Object.values(chats).filter(c => !c.projectId).map(chat => (
                    <div 
                        key={chat.id} 
                        draggable 
                        onDragStart={(e) => { e.dataTransfer.setData('chatId', chat.id); }}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${activeChatId === chat.id ? 'bg-neutral-700/50 text-neutral-200 shadow-sm' : 'hover:bg-neutral-700/30 hover:text-neutral-300'}`} 
                        onClick={() => setActiveChat(chat.id)}
                    >
                        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                            <MessageSquare size={14} className={`shrink-0 ${activeChatId === chat.id ? 'text-neutral-300' : 'text-neutral-500'}`} />
                            {editContext === `rename-chat-${chat.id}` ? (
                                <InlineEdit initialValue={chat.name} onSubmit={(v) => { renameChat(chat.id, v); setEditContext(null); }} onCancel={() => setEditContext(null)} />
                            ) : (
                                <span className="truncate">{chat.name}</span>
                            )}
                        </div>
                        {editContext !== `rename-chat-${chat.id}` && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); setEditContext(`rename-chat-${chat.id}`); }} className="hover:text-white"><Edit2 size={12} /></button>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    requestConfirm('Delete Chat', `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`, { type: 'deleteChat', id: chat.id });
                                }} className="hover:text-red-400"><Trash2 size={12} /></button>
                            </div>
                        )}
                    </div>
                ))}

                {/* NEW PROJECT INPUT */}
                {editContext === 'new-project' && (
                    <div className="px-2 py-1.5 mt-2">
                        <InlineEdit initialValue="New Project" onSubmit={(v) => { addProject(v); setEditContext(null); }} onCancel={() => setEditContext(null)} />
                    </div>
                )}

                {/* PROJECTS */}
                {Object.values(projects).map(project => {
                    const projectChats = Object.values(chats).filter(c => c.projectId === project.id);
                    const isExpanded = expandedProjects[project.id];

                    return (
                        <div 
                            key={project.id} 
                            className="pt-2"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.stopPropagation();
                                const chatId = e.dataTransfer.getData('chatId');
                                if (chatId) moveChatToProject(chatId, project.id);
                                setExpandedProjects(p => ({ ...p, [project.id]: true }));
                            }}
                        >
                            <div className="flex items-center justify-between group px-2 py-1.5 hover:bg-neutral-700/30 rounded-lg cursor-pointer transition-colors" onClick={() => toggleProject(project.id)}>
                                <div className="flex items-center gap-2 flex-1 overflow-hidden mr-2">
                                    {isExpanded ? <ChevronDown size={14} className="shrink-0 text-neutral-500" /> : <ChevronRight size={14} className="shrink-0 text-neutral-500" />}
                                    <Folder size={14} className="text-neutral-500 shrink-0" />
                                    {editContext === `rename-project-${project.id}` ? (
                                        <InlineEdit initialValue={project.name} onSubmit={(v) => { renameProject(project.id, v); setEditContext(null); }} onCancel={() => setEditContext(null)} />
                                    ) : (
                                        <span className="font-medium text-neutral-300 truncate">{project.name}</span>
                                    )}
                                </div>
                                {editContext !== `rename-project-${project.id}` && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); setExpandedProjects(p => ({ ...p, [project.id]: true })); setEditContext(`new-chat-project-${project.id}`); }} className="hover:text-white"><Plus size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditContext(`rename-project-${project.id}`); }} className="hover:text-white"><Edit2 size={12} /></button>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            requestConfirm('Delete Project', `Are you sure you want to delete "${project.name}"? ALL chats inside this project will also be deleted.`, { type: 'deleteProject', id: project.id });
                                        }} className="hover:text-red-400"><Trash2 size={12} /></button>
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="pl-6 pr-2 mt-1 space-y-1">

                                    {/* NEW PROJECT CHAT INPUT */}
                                    {editContext === `new-chat-project-${project.id}` && (
                                        <div className="px-2 py-1">
                                            <InlineEdit initialValue="New Chat" onSubmit={(v) => { addChat(v, project.id); setEditContext(null); }} onCancel={() => setEditContext(null)} />
                                        </div>
                                    )}

                                    {/* PROJECT CHATS */}
                                    {projectChats.map(chat => (
                                        <div 
                                            key={chat.id} 
                                            draggable 
                                            onDragStart={(e) => { e.dataTransfer.setData('chatId', chat.id); }}
                                            className={`group flex items-center justify-between px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeChatId === chat.id ? 'bg-neutral-700/50 text-neutral-200 shadow-sm' : 'hover:bg-neutral-700/30 hover:text-neutral-300'}`} 
                                            onClick={() => setActiveChat(chat.id)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                                                <Hash size={14} className={`shrink-0 ${activeChatId === chat.id ? 'text-neutral-300' : 'text-neutral-500'}`} />
                                                {editContext === `rename-chat-${chat.id}` ? (
                                                    <InlineEdit initialValue={chat.name} onSubmit={(v) => { renameChat(chat.id, v); setEditContext(null); }} onCancel={() => setEditContext(null)} />
                                                ) : (
                                                    <span className="truncate">{chat.name}</span>
                                                )}
                                            </div>
                                            {editContext !== `rename-chat-${chat.id}` && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditContext(`rename-chat-${chat.id}`); }} className="hover:text-white"><Edit2 size={12} /></button>
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        requestConfirm('Delete Chat', `Are you sure you want to delete "${chat.name}"? This action cannot be undone.`, { type: 'deleteChat', id: chat.id });
                                                    }} className="hover:text-red-400"><Trash2 size={12} /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
    );
}