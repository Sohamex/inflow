import { create } from 'zustand';
import { 
    fetchAllData, 
    createProjectAction, 
    renameProjectAction, 
    deleteProjectAction, 
    createChatAction, 
    renameChatAction, 
    deleteChatAction, 
    moveChatAction, 
    createTurnAction, 
    updateTurnAiResponseAction, 
    deleteTurnsAction, 
    reassignTurnParentsAction 
} from '@/app/actions';

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
    isInitialized: boolean;
    isGenerating: boolean;
    viewMode: 'chat' | 'diagram';
    isSidebarOpen: boolean;
    sidebarEditContext: string | null;
    projects: Record<string, Project>;
    chats: Record<string, Chat>;
    turns: Record<string, ChatTurn>;
    activeChatId: string | null;
    activeTurnId: string | null;

    initializeStore: () => Promise<void>;
    setGenerating: (isGenerating: boolean) => void;

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
    isInitialized: false,
    isGenerating: false,
    viewMode: 'chat',
    isSidebarOpen: false,
    sidebarEditContext: null,
    projects: {},
    chats: {},
    turns: {},
    activeChatId: null,
    activeTurnId: null,
    confirmState: { isOpen: false, title: '', message: '', action: null },

    initializeStore: async () => {
        if (get().isInitialized) return;
        const data = await fetchAllData();
        
        const projects: Record<string, Project> = {};
        data.projects.forEach(p => projects[p.id] = p);
        
        const chats: Record<string, Chat> = {};
        data.chats.forEach(c => chats[c.id] = c);
        
        const turns: Record<string, ChatTurn> = {};
        data.turns.forEach(t => turns[t.id] = t);

        set({ projects, chats, turns, isInitialized: true });
    },
    
    setGenerating: (isGenerating) => set({ isGenerating }),
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

    addProject: (name) => {
        const id = `proj-${Date.now()}`;
        const newProject = { id, name };
        set((state) => ({ projects: { ...state.projects, [id]: newProject } }));
        createProjectAction(newProject).catch(console.error);
    },
    renameProject: (id, name) => {
        set((state) => ({
            projects: { ...state.projects, [id]: { ...state.projects[id], name } }
        }));
        renameProjectAction(id, name).catch(console.error);
    },
    deleteProject: (id) => {
        set((state) => {
            const newProjects = { ...state.projects };
            delete newProjects[id];

            const newChats = { ...state.chats };
            let chatActive = state.activeChatId;
            Object.values(newChats).forEach(chat => {
                if (chat.projectId === id) {
                    delete newChats[chat.id];
                    if (chatActive === chat.id) chatActive = null;
                }
            });

            return { projects: newProjects, chats: newChats, activeChatId: chatActive };
        });
        deleteProjectAction(id).catch(console.error);
    },

    addChat: (name, projectId) => {
        const id = `chat-${Date.now()}`;
        const newChat = { id, name, projectId };
        set((state) => ({
            chats: { ...state.chats, [id]: newChat },
            activeChatId: id,
            activeTurnId: null
        }));
        createChatAction(newChat).catch(console.error);
        return id;
    },
    renameChat: (id, name) => {
        set((state) => ({
            chats: { ...state.chats, [id]: { ...state.chats[id], name } }
        }));
        renameChatAction(id, name).catch(console.error);
    },
    deleteChat: (id) => {
        set((state) => {
            const newChats = { ...state.chats };
            delete newChats[id];
            return {
                chats: newChats,
                activeChatId: state.activeChatId === id ? null : state.activeChatId
            };
        });
        deleteChatAction(id).catch(console.error);
    },
    moveChatToProject: (chatId, projectId) => {
        set((state) => ({
            chats: { ...state.chats, [chatId]: { ...state.chats[chatId], projectId } }
        }));
        moveChatAction(chatId, projectId).catch(console.error);
    },

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

    addTurn: (turn) => {
        const state = get();
        if (!state.activeChatId) return;
        const newTurn = { ...turn, chatId: state.activeChatId };
        set((state) => ({
            turns: { ...state.turns, [turn.id]: newTurn },
            activeTurnId: turn.id,
        }));
        createTurnAction(newTurn).catch(console.error);
    },
    updateAiResponse: (id, response) => {
        set((state) => ({
            turns: { ...state.turns, [id]: { ...state.turns[id], aiResponse: response } }
        }));
        // Note: For streaming, we might update this many times. It's better to let the AI route update the DB onFinish,
        // or we debounced DB updates. We can skip calling server action here if we assume the AI route handles it on completion.
        // updateTurnAiResponseAction(id, response).catch(console.error);
    },
    
    deleteTurnMerge: (id) => {
        const state = get();
        const nodeToDelete = state.turns[id];
        if (!nodeToDelete) return;

        const grandparentId = nodeToDelete.parentId;
        const newTurns = { ...state.turns };
        
        const updates: {id: string, parentId: string | null}[] = [];

        Object.values(newTurns).forEach((turn) => {
            if (turn.parentId === id) {
                newTurns[turn.id] = { ...turn, parentId: grandparentId };
                updates.push({ id: turn.id, parentId: grandparentId });
            }
        });

        delete newTurns[id];
        set({
            turns: newTurns,
            activeTurnId: state.activeTurnId === id ? grandparentId : state.activeTurnId
        });

        // DB updates
        reassignTurnParentsAction(updates).then(() => {
            deleteTurnsAction([id]);
        }).catch(console.error);
    },

    deleteTurnCascade: (id) => {
        const state = get();
        const idsToDelete = new Set([id]);
        let size = 0;
        while (idsToDelete.size > size) {
            size = idsToDelete.size;
            Object.values(state.turns).forEach(t => {
                if (t.parentId && idsToDelete.has(t.parentId)) idsToDelete.add(t.id);
            });
        }

        const newTurns = { ...state.turns };
        const idsArray = Array.from(idsToDelete);
        idsArray.forEach(deleteId => delete newTurns[deleteId]);

        set({
            turns: newTurns,
            activeTurnId: idsToDelete.has(state.activeTurnId!) ? null : state.activeTurnId
        });

        deleteTurnsAction(idsArray).catch(console.error);
    },
}));