# InFlow

InFlow is a modern, non-linear AI chat interface designed to help you explore ideas without constraints. Instead of traditional, single-threaded chat logs, InFlow allows you to branch conversations, visualize your chat history as an interactive map, and cleanly organize everything into projects.

## Features

- **Non-Linear Conversations**: Branch off from any previous AI response to explore alternative ideas, answers, or tangents without losing your original context.
- **Interactive Map View**: Toggle between a standard conversational chat interface and a node-based Diagram View. Visually track how your conversation branches out, delete specific nodes, and merge threads back up intuitively.
- **Project Organization**: Keep your workspace tidy. Create standalone chats or group related conversations into collapsible Project folders.
- **Drag & Drop**: Seamlessly organize your sidebar by dragging chats into or out of project folders natively.
- **Sleek, Aesthetic UI**: A highly polished, dark-themed, grayscale interface built with Tailwind CSS, featuring smooth transitions, glassmorphic headers, and a minimal, distraction-free design.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React App Router)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for robust, efficient global state handling.
- **Graph/Diagrams**: [@xyflow/react (React Flow)](https://reactflow.dev/) combined with [Dagre](https://github.com/dagrejs/dagre) for complex, auto-layout node visualization.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

First, ensure you have your dependencies installed:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

## Project Structure

- `app/` - Next.js App Router entry points, layouts, and global styles (`page.tsx`, `globals.css`).
- `components/` - UI Building blocks:
  - `ChatView.tsx`: The primary conversational interface.
  - `DiagramView.tsx` & `MessageNode.tsx`: The interactive React Flow map interface.
  - `Sidebar.tsx`: Project and chat management with drag-and-drop.
- `store/` - Zustand state store (`chatStore.ts`) managing the entire tree structure of chats, turns, branches, and workspaces.