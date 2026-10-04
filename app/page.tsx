'use client';
import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import DiagramView from '@/components/DiagramView';
import ChatView from '@/components/ChatView';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { MessageSquare, GitMerge, Send, PanelLeft } from 'lucide-react';

export default function Home() {
    const { viewMode, setViewMode, toggleSidebar, activeTurnId, activeChatId, addTurn, updateAiResponse, isSidebarOpen, chats, turns } = useChatStore();
    const [input, setInput] = useState('');
    
    const hasChats = Object.keys(chats).length > 0;
    const hasTurns = activeChatId ? Object.values(turns).some(t => t.chatId === activeChatId) : false;

    useEffect(() => {
        if (!hasTurns && viewMode === 'diagram') {
            setViewMode('chat');
        }
    }, [hasTurns, viewMode, setViewMode]);

    const handleSend = () => {
        if (!input.trim() || !activeChatId) return;

        const turnId = `turn-${Date.now()}`;
        addTurn({ id: turnId, userQuery: input, aiResponse: '', parentId: activeTurnId });
        setInput('');

        setTimeout(() => {
            updateAiResponse(turnId, `This is the AI response to: "${input}".`);
        }, 800);
    };

    return (
        <div className="flex h-screen w-full bg-neutral-950 overflow-hidden">
            <Sidebar />

            <main className="flex flex-col flex-1 h-screen overflow-hidden text-neutral-200">
                <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 bg-neutral-900/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button onClick={toggleSidebar} className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors">
                                <PanelLeft size={18} />
                            </button>
                        )}
                        <h1 className="font-bold text-md tracking-wide text-white">InFlow</h1>
                    </div>

                    {hasTurns && (
                        <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('chat')}
                                title="Chat View"
                                className={`flex items-center justify-center w-8 h-7 rounded-md transition-colors ${viewMode === 'chat' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <MessageSquare size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode('diagram')}
                                title="Diagram View"
                                className={`flex items-center justify-center w-8 h-7 rounded-md transition-colors ${viewMode === 'diagram' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <GitMerge size={14} />
                            </button>
                        </div>
                    )}
                </header>

                {/* FIX: Added min-h-0 to constrain flex growth and keep input bar visible */}
                <div className="flex-1 relative min-h-0">
                    {viewMode === 'chat' ? <ChatView /> : <DiagramView />}
                </div>

                {viewMode === 'chat' && hasChats && (
                    <div className="p-4 bg-neutral-900 border-t border-neutral-800 shrink-0 flex justify-center z-10">
                        <div className="w-full max-w-3xl flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!activeChatId}
                                placeholder={!activeChatId ? "Create or select a chat first..." : "Follow up or branch..."}
                                className="flex-1 p-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || !activeChatId}
                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-12"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <ConfirmDialog />
        </div>
    );
}