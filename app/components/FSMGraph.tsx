'use client'
import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  addEdge,
  Connection,
  ReactFlowProps,
} from "@xyflow/react";
import { AnimatedNode } from "@/app/components/AnimatedNode";
import { states, transitions } from "@/app/lib/fsm";
import { applyRepulsion } from "@/app/lib/repulsion";

const nodeTypes = { animated: AnimatedNode };

interface FSMGraphProps {
  externalNodes?: Node[];
  externalEdges?: Edge[];
}

const FSMGraph: React.FC<FSMGraphProps> = ({ externalNodes = [], externalEdges = [] }) => {
  const initialNodes: Node[] = useMemo(
    () =>
      states.map((id, idx) => ({
        id,
        type: 'animated',
        data: { label: id },
        position: {
          x: (idx % 5) * 220,
          y: Math.floor(idx / 5) * 140,
        },
      })),
    []
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      transitions.map((t, i) => ({
        id: `e-${i}`,
        source: t.source,
        target: t.dest,
        label: t.trigger,
        animated: true,
        style: { strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed },
        type: "smoothstep",            // ⬅️ key line
      })),
    []
  );

  // Merge external nodes with internal nodes, converting external nodes to 'animated' type
  const mergedNodes = useMemo(() => {
    const animatedExternalNodes = externalNodes.map(node => ({
      ...node,
      type: 'animated',
    }));
    return [...initialNodes, ...animatedExternalNodes];
  }, [initialNodes, externalNodes]);

  // Merge external edges with internal edges
  const mergedEdges = useMemo(() => {
    return [...initialEdges, ...externalEdges];
  }, [initialEdges, externalEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(mergedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mergedEdges);

  // Update nodes when externalNodes change
  React.useEffect(() => {
    const animatedExternalNodes = externalNodes.map(node => ({
      ...node,
      type: 'animated',
    }));
    const merged = [...initialNodes, ...animatedExternalNodes];
    setNodes(applyRepulsion(merged));
  }, [externalNodes, initialNodes, setNodes]);

  // Update edges when externalEdges change
  React.useEffect(() => {
    setEdges([...initialEdges, ...externalEdges]);
  }, [externalEdges, initialEdges, setEdges]);

  const addNode = () => {
    setNodes((curr) => {
      const id = `state-${curr.length + 1}`;
      const next = [
        ...curr,
        {
          id,
          type: 'animated',
          data: { label: id },
          position: { x: 0, y: 0 },
        },
      ];
      return applyRepulsion(next);
    });
  };

  const onConnect = (connection: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          markerEnd: { type: MarkerType.ArrowClosed },
          type: "smoothstep",            // ⬅️ key line
        },
        eds,
      ),
    );
  };

  const onNodeDragStop: ReactFlowProps['onNodeDragStop'] = () => {
    setNodes((curr) => applyRepulsion(curr));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white text-black">
      <div className="p-4">
        <button 
          onClick={addNode}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add node
        </button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default FSMGraph;

