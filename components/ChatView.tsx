import { useChatStore } from '@/store/chatStore';
import { useMemo, useEffect, useRef, memo, useState } from 'react';
import { GitMerge, ArrowUpToLine, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default memo(function ChatView() {
    const { turns, activeTurnId, setActiveTurn, projects, chats, setSidebarOpen, setSidebarEditContext, requestConfirm } = useChatStore();
    const endRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

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

    if (thread.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full h-full">
            <div 
                className="w-full h-full overflow-y-auto p-4 md:p-8 bg-transparent flex flex-col items-center scroll-smooth"
                onScroll={(e) => setShowScrollButton(e.currentTarget.scrollHeight - e.currentTarget.scrollTop > e.currentTarget.clientHeight + 150)}
            >
            <div className="w-full max-w-3xl space-y-10 pb-10 mt-4">
                {thread.map((turn) => (
                    <div key={turn.id} className="space-y-6 flex flex-col w-full">

                        {/* User Query (Right aligned, rounded square) */}
                        <div className="flex w-full justify-end">
                            <div className="max-w-[85%] px-5 py-4 rounded-2xl bg-neutral-800 text-neutral-200 text-[15px] shadow-sm">
                                <div className="leading-relaxed whitespace-pre-wrap">{turn.userQuery}</div>
                            </div>
                        </div>

                        {/* AI Response (Left aligned, no border, flat on page) */}
                        <div className="flex flex-col w-full items-start group px-2 text-[15px] text-neutral-200">
                            {turn.aiResponse ? (
                                <div className="w-full prose prose-invert max-w-none prose-p:leading-relaxed prose-p:my-3 prose-pre:bg-neutral-800 prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-3 prose-code:text-sm prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-a:text-blue-400 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                        {turn.aiResponse}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex gap-1 items-center h-5">
                                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-150"></span>
                                </div>
                            )}

                            {/* Action Buttons (Left side under AI response) */}
                            {turn.aiResponse && (
                                <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {activeTurnId !== turn.id && (
                                        <button
                                            onClick={() => setActiveTurn(turn.id)}
                                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                                        >
                                            <GitMerge size={14} /> Branch from here
                                        </button>
                                    )}
                                    <button
                                        onClick={() => requestConfirm(
                                            'Delete & Merge',
                                            'Are you sure? This node will be removed and its child branches will be attached to its parent.',
                                            { type: 'deleteTurnMerge', id: turn.id }
                                        )}
                                        title="Delete & Merge Up"
                                        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors"
                                    >
                                        <ArrowUpToLine size={14} /> Delete & Merge
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                ))}
                <div ref={endRef} />
            </div>
            </div>
            
            {showScrollButton && (
                <button
                    onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="absolute bottom-6 right-6 p-2 bg-neutral-800 text-neutral-300 rounded-full shadow-lg border border-neutral-700/50 hover:text-white hover:bg-neutral-700 transition-all z-50"
                    title="Scroll to bottom"
                >
                    <ArrowDown size={16} />
                </button>
            )}
        </div>
    );
})