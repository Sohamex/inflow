'use client';
import { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import DiagramView from '@/components/DiagramView';
import ChatView from '@/components/ChatView';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { MessageSquare, GitMerge, Send, PanelLeft } from 'lucide-react';

export default function Home() {
    const { viewMode, setViewMode, toggleSidebar, activeTurnId, activeChatId, addTurn, updateAiResponse, isSidebarOpen, chats, turns, addChat } = useChatStore();
    const [input, setInput] = useState('');
    
    const hasChats = Object.keys(chats).length > 0;
    const hasTurns = useMemo(() => activeChatId ? Object.values(turns).some(t => t.chatId === activeChatId) : false, [turns, activeChatId]);
    const isCentered = !hasTurns && viewMode === 'chat';

    useEffect(() => {
        if (!hasTurns && viewMode === 'diagram') {
            setViewMode('chat');
        }
    }, [hasTurns, viewMode, setViewMode]);

    const handleSend = () => {
        if (!input.trim()) return;

        let currentActiveTurnId = activeTurnId;

        // Auto-create chat if there is no active chat
        if (!activeChatId) {
            const words = input.trim().split(/\s+/);
            const chatName = words.slice(0, 3).join(' ') || 'New Chat';
            addChat(chatName, null);
            currentActiveTurnId = null;
        }

        const turnId = `turn-${Date.now()}`;
        addTurn({ id: turnId, userQuery: input, aiResponse: '', parentId: currentActiveTurnId });
        setInput('');

        setTimeout(() => {
            updateAiResponse(turnId, `This is the AI response to: "${input}".`);
        }, 800);
    };

    return (
        <div className="flex h-screen w-full bg-neutral-900 overflow-hidden">
            <Sidebar />

            <main className="flex flex-col flex-1 h-screen overflow-hidden text-neutral-200">
                <header className="h-14 border-b border-neutral-800/50 flex items-center justify-between px-4 shrink-0 bg-neutral-900/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button onClick={toggleSidebar} className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-lg transition-colors -ml-1.5">
                                <PanelLeft size={18} />
                            </button>
                        )}
                        <h1 className="font-semibold text-sm tracking-wide text-neutral-200">InFlow</h1>
                    </div>

                    {hasTurns && (
                        <div className="flex bg-neutral-950/50 border border-neutral-800/50 p-1 rounded-full shadow-inner">
                            <button
                                onClick={() => setViewMode('chat')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${viewMode === 'chat' ? 'bg-neutral-700 text-neutral-100 shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <MessageSquare size={14} /> Chat
                            </button>
                            <button
                                onClick={() => setViewMode('diagram')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${viewMode === 'diagram' ? 'bg-neutral-700 text-neutral-100 shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <GitMerge size={14} /> Map
                            </button>
                        </div>
                    )}
                </header>

                {/* FIX: Added min-h-0 to constrain flex growth and keep input bar visible */}
                <div className="flex-1 relative min-h-0 flex flex-col">
                    <div className="flex-1 relative overflow-hidden">
                        {viewMode === 'chat' ? <ChatView /> : <DiagramView />}
                        
                        {isCentered && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent p-4 z-20">
                                <h2 className="text-2xl font-medium text-neutral-400 mb-6 tracking-tight">What do you want to build?</h2>
                                <div className="relative w-full max-w-2xl">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Start typing..."
                                        className="w-full pl-6 pr-14 py-3.5 bg-neutral-800/50 border border-neutral-700/50 text-neutral-200 rounded-full focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 placeholder-neutral-500 transition-all text-[15px] shadow-lg backdrop-blur-sm"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neutral-200 text-neutral-900 rounded-full hover:bg-white disabled:opacity-50 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {viewMode === 'chat' && !isCentered && (
                        <div className="p-4 bg-transparent border-t border-neutral-800/30 shrink-0 flex justify-center z-10 transition-all duration-300">
                            <div className="relative w-full max-w-3xl">
                                <input
                                    autoFocus
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Follow up or branch..."
                                    className="w-full pl-5 pr-12 py-3 bg-neutral-800/40 border border-neutral-700/50 text-neutral-200 rounded-full focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 placeholder-neutral-500 transition-all text-[14px] shadow-sm backdrop-blur-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-neutral-200 text-neutral-900 rounded-full hover:bg-white disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmDialog />
        </div>
    );
}