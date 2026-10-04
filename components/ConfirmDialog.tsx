import { useChatStore } from '@/store/chatStore';

export default function ConfirmDialog() {
    const { confirmState, closeConfirm, executeConfirm } = useChatStore();

    if (!confirmState.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h2 className="text-neutral-100 font-bold text-lg mb-2">{confirmState.title}</h2>
                <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                    {confirmState.message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={closeConfirm}
                        className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={executeConfirm}
                        className="px-4 py-2 text-sm font-medium bg-red-600/90 text-white rounded-lg hover:bg-red-500 transition-colors shadow-sm"
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
}