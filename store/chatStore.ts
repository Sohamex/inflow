import { create } from 'zustand';

export type Project = { id: string; name: string };
export type Chat = { id: string; name: string; projectId: string | null };

export type ChatTurn = {
    id: string;
    chatId: string;
    userQuery: string;
    aiResponse: string;
    parentId: string | null;
};

export type ConfirmAction =
    | { type: 'deleteProject'; id: string }
    | { type: 'deleteChat'; id: string }
    | { type: 'deleteTurnMerge'; id: string }
    | { type: 'deleteTurnCascade'; id: string };

interface ChatState {
    viewMode: 'chat' | 'diagram';
    isSidebarOpen: boolean;
    sidebarEditContext: string | null;
    projects: Record<string, Project>;
    chats: Record<string, Chat>;
    turns: Record<string, ChatTurn>;
    activeChatId: string | null;
    activeTurnId: string | null;

    setViewMode: (mode: 'chat' | 'diagram') => void;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setSidebarEditContext: (context: string | null) => void;
    setActiveChat: (chatId: string | null) => void;
    setActiveTurn: (turnId: string | null) => void;

    // Projects
    addProject: (name: string) => void;
    renameProject: (id: string, name: string) => void;
    deleteProject: (id: string) => void;

    // Chats
    addChat: (name: string, projectId: string | null) => string;
    renameChat: (id: string, name: string) => void;
    deleteChat: (id: string) => void;
    moveChatToProject: (chatId: string, projectId: string | null) => void;

    // Turns (Nodes)
    addTurn: (turn: Omit<ChatTurn, 'chatId'>) => void;
    updateAiResponse: (turnId: string, response: string) => void;
    deleteTurnMerge: (id: string) => void;
    deleteTurnCascade: (id: string) => void;

    // Dialog State
    confirmState: { isOpen: boolean; title: string; message: string; action: ConfirmAction | null };
    requestConfirm: (title: string, message: string, action: ConfirmAction) => void;
    closeConfirm: () => void;
    executeConfirm: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    viewMode: 'chat',
    isSidebarOpen: false,
    sidebarEditContext: null,
    projects: {},
    chats: {},
    turns: {},
    activeChatId: null,
    activeTurnId: null,
    confirmState: { isOpen: false, title: '', message: '', action: null },

    setViewMode: (mode) => set({ viewMode: mode }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setSidebarEditContext: (context) => set({ sidebarEditContext: context }),

    setActiveChat: (chatId) => {
        if (!chatId) return set({ activeChatId: null, activeTurnId: null });
        const { turns } = get();
        const chatTurns = Object.values(turns).filter(t => t.chatId === chatId);
        const lastTurnId = chatTurns.length > 0 ? chatTurns[chatTurns.length - 1].id : null;
        set({ activeChatId: chatId, activeTurnId: lastTurnId });
    },

    setActiveTurn: (turnId) => set({ activeTurnId: turnId }),

    addProject: (name) => set((state) => {
        const id = `proj-${Date.now()}`;
        return { projects: { ...state.projects, [id]: { id, name } } };
    }),
    renameProject: (id, name) => set((state) => ({
        projects: { ...state.projects, [id]: { ...state.projects[id], name } }
    })),
    deleteProject: (id) => set((state) => {
        const newProjects = { ...state.projects };
        delete newProjects[id];

        // Also delete all chats in this project
        const newChats = { ...state.chats };
        let chatActive = state.activeChatId;
        Object.values(newChats).forEach(chat => {
            if (chat.projectId === id) {
                delete newChats[chat.id];
                if (chatActive === chat.id) chatActive = null;
            }
        });

        return { projects: newProjects, chats: newChats, activeChatId: chatActive };
    }),

    addChat: (name, projectId) => {
        const id = `chat-${Date.now()}`;
        set((state) => ({
            chats: { ...state.chats, [id]: { id, name, projectId } },
            activeChatId: id,
            activeTurnId: null
        }));
        return id;
    },
    renameChat: (id, name) => set((state) => ({
        chats: { ...state.chats, [id]: { ...state.chats[id], name } }
    })),
    deleteChat: (id) => set((state) => {
        const newChats = { ...state.chats };
        delete newChats[id];
        return {
            chats: newChats,
            activeChatId: state.activeChatId === id ? null : state.activeChatId
        };
    }),
    moveChatToProject: (chatId, projectId) => set((state) => ({
        chats: { ...state.chats, [chatId]: { ...state.chats[chatId], projectId } }
    })),

    requestConfirm: (title, message, action) => set({
        confirmState: { isOpen: true, title, message, action }
    }),

    closeConfirm: () => set({
        confirmState: { isOpen: false, title: '', message: '', action: null }
    }),

    executeConfirm: () => {
        const { confirmState, deleteProject, deleteChat, deleteTurnMerge, deleteTurnCascade, closeConfirm } = get();
        if (!confirmState.action) return;

        switch (confirmState.action.type) {
            case 'deleteProject': deleteProject(confirmState.action.id); break;
            case 'deleteChat': deleteChat(confirmState.action.id); break;
            case 'deleteTurnMerge': deleteTurnMerge(confirmState.action.id); break;
            case 'deleteTurnCascade': deleteTurnCascade(confirmState.action.id); break;
        }
        closeConfirm();
    },

    addTurn: (turn) => set((state) => {
        if (!state.activeChatId) return state;
        return {
            turns: { ...state.turns, [turn.id]: { ...turn, chatId: state.activeChatId } },
            activeTurnId: turn.id,
        };
    }),
    updateAiResponse: (id, response) => set((state) => ({
        turns: { ...state.turns, [id]: { ...state.turns[id], aiResponse: response } }
    })),
    deleteTurnMerge: (id) => set((state) => {
        const nodeToDelete = state.turns[id];
        if (!nodeToDelete) return state;

        const grandparentId = nodeToDelete.parentId;
        const newTurns = { ...state.turns };

        Object.values(newTurns).forEach((turn) => {
            if (turn.parentId === id) {
                newTurns[turn.id] = { ...turn, parentId: grandparentId };
            }
        });

        delete newTurns[id];
        return {
            turns: newTurns,
            activeTurnId: state.activeTurnId === id ? grandparentId : state.activeTurnId
        };
    }),

    // 2. Delete Node & All Children (Cascade)
    deleteTurnCascade: (id) => set((state) => {
        const idsToDelete = new Set([id]);
        let size = 0;
        while (idsToDelete.size > size) {
            size = idsToDelete.size;
            Object.values(state.turns).forEach(t => {
                if (t.parentId && idsToDelete.has(t.parentId)) idsToDelete.add(t.id);
            });
        }

        const newTurns = { ...state.turns };
        idsToDelete.forEach(deleteId => delete newTurns[deleteId]);

        return {
            turns: newTurns,
            activeTurnId: idsToDelete.has(state.activeTurnId!) ? null : state.activeTurnId
        };
    }),
}));