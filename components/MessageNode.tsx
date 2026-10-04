import { Handle, Position } from '@xyflow/react';
import { useChatStore } from '@/store/chatStore';
import { Trash2, ArrowUpToLine, MessageSquare } from 'lucide-react';

export default function MessageNode({ id, data }: { id: string, data: any }) {
    const activeTurnId = useChatStore((state) => state.activeTurnId);
    const setActiveTurn = useChatStore((state) => state.setActiveTurn);
    const requestConfirm = useChatStore((state) => state.requestConfirm);
    const setViewMode = useChatStore((state) => state.setViewMode);
    const isActive = activeTurnId === id;

    return (
        <div
            onClick={() => setActiveTurn(id)}
            className="relative group flex items-center justify-center cursor-pointer"
        >
            <Handle type="target" position={Position.Top} className="!opacity-0" />

            <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 z-10
        ${isActive ? 'bg-neutral-300 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-125' : 'bg-neutral-800 border-neutral-600 group-hover:border-neutral-400 group-hover:scale-110'}
      `} />

            {/* Action Buttons Container */}
            <div className="absolute -right-24 top-[-2px] flex flex-row gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <button
                    title="Open in Chat"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveTurn(id);
                        setViewMode('chat');
                    }}
                    className="p-1.5 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-md hover:bg-neutral-700 shadow-sm"
                >
                    <MessageSquare size={12} />
                </button>

                <button
                    title="Delete Node & Merge Up"
                    onClick={(e) => {
                        e.stopPropagation();
                        requestConfirm(
                            'Delete & Merge',
                            'Are you sure? This node will be removed and its child branches will be attached to its parent.',
                            { type: 'deleteTurnMerge', id }
                        );
                    }}
                    className="p-1.5 bg-neutral-800 border border-neutral-700 text-yellow-500 rounded-md hover:bg-neutral-700 shadow-sm"
                >
                    <ArrowUpToLine size={12} />
                </button>

                <button
                    title="Delete Branch (Cascade)"
                    onClick={(e) => {
                        e.stopPropagation();
                        requestConfirm(
                            'Delete Branch',
                            'Are you sure? This will permanently delete this node AND all of its subsequent child nodes.',
                            { type: 'deleteTurnCascade', id }
                        );
                    }}
                    className="p-1.5 bg-neutral-800 border border-neutral-700 text-red-400 rounded-md hover:bg-neutral-700 shadow-sm"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            <div className="absolute top-8 w-48 p-2 bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 truncate">
                <span className="text-neutral-400 font-semibold mr-1">Q:</span>{data.userQuery}
            </div>

            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );
}