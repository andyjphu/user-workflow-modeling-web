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
import { AnimatedNode } from "./AnimatedNode";
import { states, transitions } from "./fsm";
import { applyRepulsion } from "./repulsion";

const nodeTypes = { animated: AnimatedNode };

const FSMGraph: React.FC = () => {
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
      })),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
