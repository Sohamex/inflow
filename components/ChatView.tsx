import { useChatStore } from '@/store/chatStore';
import { useMemo, useEffect, useRef } from 'react';
import { GitMerge } from 'lucide-react';

export default function ChatView() {
    const { turns, activeTurnId, setActiveTurn, projects, chats, setSidebarOpen, setSidebarEditContext } = useChatStore();
    const endRef = useRef<HTMLDivElement>(null);

    const hasProjects = Object.keys(projects).length > 0;
    const hasChats = Object.keys(chats).length > 0;

    const thread = useMemo(() => {
        const path = [];
        let currentId = activeTurnId;
        while (currentId && turns[currentId]) {
            path.unshift(turns[currentId]);
            currentId = turns[currentId].parentId;
        }
        return path;
    }, [turns, activeTurnId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread.length]);

    if (!hasChats) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 gap-4">
                {!hasProjects ? (
                    <>
                        <p>Welcome to InFlow. Let's get started.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setSidebarOpen(true); setSidebarEditContext('new-project'); }}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
                            >
                                Create a Project
                            </button>
                            <button
                                onClick={() => { setSidebarOpen(true); setSidebarEditContext('new-chat-standalone'); }}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
                            >
                                Create a Chat
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p>Projects available. Now create your first chat.</p>
                        <button
                            onClick={() => { setSidebarOpen(true); setSidebarEditContext('new-chat-standalone'); }}
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
                        >
                            Create a Chat
                        </button>
                    </>
                )}
            </div>
        );
    }

    if (!activeTurnId) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-neutral-950 text-neutral-500">
                Select a chat to continue.
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto p-4 md:p-8 bg-neutral-950 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8 pb-10">
                {thread.map((turn) => (
                    <div key={turn.id} className="space-y-4">

                        {/* User Bubble */}
                        <div className="flex w-full justify-end">
                            <div className="p-4 max-w-[80%] rounded-2xl bg-blue-600 text-neutral-50 rounded-br-sm shadow-sm">
                                <div className="leading-relaxed whitespace-pre-wrap">{turn.userQuery}</div>
                            </div>
                        </div>

                        {/* AI Bubble & Branch Option */}
                        <div className="flex flex-col w-full items-start group">
                            <div className="p-4 max-w-[80%] rounded-2xl bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-sm shadow-sm">
                                {turn.aiResponse ? (
                                    <div className="leading-relaxed whitespace-pre-wrap">{turn.aiResponse}</div>
                                ) : (
                                    <div className="flex gap-1 items-center h-6">
                                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                )}
                            </div>

                            {/* Branch Button (Hover Reveal) */}
                            {turn.aiResponse && activeTurnId !== turn.id && (
                                <button
                                    onClick={() => setActiveTurn(turn.id)}
                                    className="mt-1.5 ml-2 flex items-center gap-1.5 text-xs text-neutral-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <GitMerge size={12} /> Branch from here
                                </button>
                            )}
                        </div>

                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}