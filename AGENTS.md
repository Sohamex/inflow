<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# InFlow Project Guidelines for AI Agents

When working on this codebase, please strictly adhere to the following rules and project conventions to maintain performance, aesthetic consistency, and architectural integrity.

## Architecture & State Management
- **Global State**: We use **Zustand** (`@/store/chatStore.ts`) for global state, managing the entire tree of chats, projects, node branches, and UI view modes. 
- **Performance**: Ensure heavy layout components (`Sidebar`, `ChatView`, `DiagramView`) are wrapped in `React.memo()`. This isolates them from frequent re-renders caused by keystroke updates in `page.tsx`.
- **UI Views**: The application seamlessly toggles between `ChatView.tsx` (conversational layout) and `DiagramView.tsx` (graph layout). Changing the core `turn` object shape must be done cautiously, as both views strictly depend on it.

## Graph & Visualization
- **React Flow**: The visual mind-map is built using `@xyflow/react` and `dagre` for automated layout calculations. 
- **Nodes**: Be careful when editing `MessageNode.tsx`. Always retain the exact existing node dimensions for `dagre` compatibility and respect the `requestConfirm` workflows for deletions.

## Design System & Styling
- **Color Palette**: The application employs a sleek, grayscale/monochrome aesthetic using Tailwind's `neutral` palette (`bg-neutral-900`, `bg-neutral-800`, etc.). 
- **Strictly No Blue**: **Do not introduce bright colors (like blues, greens, or purples)** for highlights or active states. Rely on crisp whites (`text-white`), light grays (`text-neutral-200`), and subtle opacity borders (e.g., `border-neutral-700/50`) to indicate interaction.
- **Components**: The UI relies on floating transparent styles and glassmorphism (`backdrop-blur`). Ensure custom scrollbars and container borders maintain this dark, cohesive look.

## Backend Integration
- The application uses Next.js App Router API endpoints (`app/api/`) and **Prisma** for database logic. When adding new features in `chatStore`, ensure they sync logically with the Prisma schema endpoints if persistence is required.
