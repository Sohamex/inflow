import { useMemo } from 'react';
import { ReactFlow, Background, Controls, Edge, Node, BackgroundVariant, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useChatStore } from '@/store/chatStore';
import MessageNode from './MessageNode';
import dagre from 'dagre';

const nodeTypes = { message: MessageNode };

// Initialize the directed graph engine
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// The layout algorithm
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    // nodesep: Horizontal space between nodes
    // ranksep: Vertical space between parent and child layers
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 120, ranksep: 100 });

    nodes.forEach((node) => {
        // We give dagre the approximate size of our dot nodes to calculate boundaries
        dagreGraph.setNode(node.id, { width: 40, height: 40 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate the layout
    dagre.layout(dagreGraph);

    // Apply the calculated positions back to the React Flow nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
                x: nodeWithPosition.x - 20, // Center X based on width
                y: nodeWithPosition.y - 20, // Center Y based on height
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export default function DiagramView() {
    const turns = useChatStore((state) => state.turns);
    const activeChatId = useChatStore((state) => state.activeChatId);

    const { nodes, edges } = useMemo(() => {
        const currentChatTurns = Object.values(turns).filter(t => t.chatId === activeChatId);

        const rawNodes: Node[] = currentChatTurns.map((turn) => ({
            id: turn.id,
            type: 'message',
            position: { x: 0, y: 0 },
            data: { userQuery: turn.userQuery },
        }));

        const rawEdges: Edge[] = currentChatTurns
            .filter((turn) => turn.parentId !== null)
            .map((turn) => ({
                id: `e-${turn.parentId}-${turn.id}`,
                source: turn.parentId!,
                target: turn.id,
                animated: true,
                style: { stroke: '#525252', strokeWidth: 2 }
            }));

        return getLayoutedElements(rawNodes, rawEdges);
    }, [turns, activeChatId]); // Ensure activeChatId is in dependencies

    return (
        <div className="w-full h-full bg-neutral-950">
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView colorMode="dark">
                {/* Changed to Lines for Grid effect */}
                <Background variant={BackgroundVariant.Lines} gap={30} color="#1f1f1f" />
                <Controls className="!bg-neutral-800 !fill-neutral-300 !border-neutral-700" />
            </ReactFlow>
        </div>
    );
}