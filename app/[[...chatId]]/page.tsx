'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import DiagramView from '@/components/DiagramView';
import ChatView from '@/components/ChatView';
import Sidebar from '@/components/Sidebar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { MessageSquare, GitMerge, Send, PanelLeft, Plus } from 'lucide-react';

export default function Home() {
    const params = useParams();
    const router = useRouter();
    const routeChatId = params.chatId?.[0] || null;

    const { 
        viewMode, setViewMode, toggleSidebar, activeTurnId, activeChatId, setActiveChat,
        addTurn, updateAiResponse, isSidebarOpen, chats, turns, addChat,
        initializeStore, isInitialized, isGenerating, setGenerating, renameChat
    } = useChatStore();
    
    const [input, setInput] = useState('');
    
    useEffect(() => {
        if (!isInitialized) {
            initializeStore();
        }
    }, [isInitialized, initializeStore]);

    useEffect(() => {
        if (isInitialized) {
            setActiveChat(routeChatId);
        }
    }, [routeChatId, isInitialized, setActiveChat]);

    useEffect(() => {
        if (isInitialized && routeChatId && !chats[routeChatId]) {
            router.push('/');
        }
    }, [isInitialized, routeChatId, chats, router]);

    const hasChats = Object.keys(chats).length > 0;
    const hasTurns = useMemo(() => activeChatId ? Object.values(turns).some(t => t.chatId === activeChatId) : false, [turns, activeChatId]);
    const isCentered = !hasTurns && viewMode === 'chat';

    useEffect(() => {
        if (!hasTurns && viewMode === 'diagram') {
            setViewMode('chat');
        }
    }, [hasTurns, viewMode, setViewMode]);

    const handleSend = async () => {
        if (!input.trim() || isGenerating) return;

        setGenerating(true);
        let currentActiveTurnId = activeTurnId;
        const currentInput = input;
        setInput(''); // Clear immediately

        let currentChatId = activeChatId;
        if (!currentChatId) {
            const words = currentInput.trim().split(/\s+/);
            const chatName = words.slice(0, 3).join(' ') || 'New Chat';
            currentChatId = addChat(chatName, null);
            router.push(`/${currentChatId}`);
            currentActiveTurnId = null;
        } else if (chats[currentChatId]?.name === 'New Chat') {
            const chatTurns = Object.values(turns).filter(t => t.chatId === currentChatId);
            if (chatTurns.length === 0) {
                const words = currentInput.trim().split(/\s+/);
                const chatName = words.slice(0, 3).join(' ') || 'New Chat';
                renameChat(currentChatId, chatName);
            }
        }

        const turnId = `turn-${Date.now()}`;
        addTurn({ id: turnId, userQuery: currentInput, aiResponse: '', parentId: currentActiveTurnId });

        // Build history for the API
        const messages = [];
        let currId = currentActiveTurnId;
        while (currId && turns[currId]) {
            const t = turns[currId];
            messages.unshift({ role: 'assistant', content: t.aiResponse });
            messages.unshift({ role: 'user', content: t.userQuery });
            currId = t.parentId;
        }
        messages.push({ role: 'user', content: currentInput });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, turnId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Network response was not ok');
            }
            
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            
            if (reader) {
                let aiText = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    if (value) {
                        aiText += decoder.decode(value, { stream: true });
                        updateAiResponse(turnId, aiText);
                    }
                }
                
                // If the stream closed cleanly but we received absolutely no text,
                // the AI SDK likely swallowed an upstream error (like a rate limit)
                // after sending the 200 OK headers.
                if (!aiText.trim()) {
                    throw new Error('The AI returned an empty response. The model may be rate-limited or temporarily unavailable.');
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch AI response:', error);
            updateAiResponse(turnId, `**Error:** ${error.message || 'Unable to connect to the AI service. Please verify your API key or network connection.'}`);
        } finally {
            setGenerating(false);
        }
    };

    if (!isInitialized) {
        return <div className="flex h-screen w-full bg-neutral-900 items-center justify-center text-neutral-400">Loading Non-Linear...</div>;
    }

    return (
        <div className="flex h-screen w-full bg-neutral-900 overflow-hidden">
            <Sidebar />

            <main className="flex flex-col flex-1 h-screen overflow-hidden text-neutral-200">
                <header className="h-14 border-b border-neutral-800/50 flex items-center justify-between px-4 shrink-0 bg-neutral-900/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <div className="flex items-center gap-1 -ml-1.5">
                                <button onClick={toggleSidebar} title="Open Sidebar" className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-lg transition-colors">
                                    <PanelLeft size={18} />
                                </button>
                                <button onClick={() => {
                                    const id = addChat('New Chat', null);
                                    router.push(`/${id}`);
                                }} title="New Chat" className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-lg transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>
                        )}
                        <h1 className="font-semibold text-sm tracking-wide text-neutral-200">Non-Linear</h1>
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

                <div className="flex-1 relative min-h-0 flex flex-col">
                    <div className="flex-1 relative overflow-hidden">
                        {viewMode === 'chat' ? <ChatView /> : <DiagramView />}
                        
                        {isCentered && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent p-4 z-20">
                                <h2 className="text-2xl font-medium text-neutral-400 mb-6 tracking-tight">What do you want to build?</h2>
                                <ChatInput input={input} setInput={setInput} handleSend={handleSend} isGenerating={isGenerating} isCentered={true} />
                            </div>
                        )}
                    </div>

                    {viewMode === 'chat' && !isCentered && (
                        <div className="p-4 bg-transparent border-t border-neutral-800/30 shrink-0 flex justify-center z-10 transition-all duration-300">
                            <ChatInput input={input} setInput={setInput} handleSend={handleSend} isGenerating={isGenerating} isCentered={false} />
                        </div>
                    )}
                </div>
            </main>

            <ConfirmDialog />
        </div>
    );
}

function ChatInput({ input, setInput, handleSend, isGenerating, isCentered }: {
    input: string;
    setInput: (val: string) => void;
    handleSend: () => void;
    isGenerating: boolean;
    isCentered: boolean;
}) {
    return (
        <div className={`relative w-full ${isCentered ? 'max-w-2xl' : 'max-w-3xl'}`}>
            <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isGenerating ? "Thinking..." : (isCentered ? "Start typing..." : "Follow up or branch...")}
                disabled={isGenerating}
                className={`w-full border border-neutral-700/50 text-neutral-200 rounded-full focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 placeholder-neutral-500 transition-all backdrop-blur-sm disabled:opacity-50 ${
                    isCentered ? 'pl-6 pr-14 py-3.5 bg-neutral-800/50 text-[15px] shadow-lg' : 'pl-5 pr-12 py-3 bg-neutral-800/40 text-[14px] shadow-sm'
                }`}
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className={`absolute top-1/2 -translate-y-1/2 p-2 bg-neutral-200 text-neutral-900 rounded-full hover:bg-white disabled:opacity-50 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center ${
                    isCentered ? 'right-2 shadow-sm' : 'right-1.5'
                }`}
            >
                <Send size={isCentered ? 16 : 14} />
            </button>
        </div>
    );
}