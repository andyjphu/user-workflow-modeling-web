'use client'
// FSMGraph.tsx
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { states, transitions } from "./fsm";

const FSMGraph: React.FC = () => {
  const initialNodes: Node[] = useMemo(
    () =>
      states.map((id, idx) => ({
        id,
        data: { label: id },
        position: {
          x: (idx % 5) * 220,              // very dumb grid layout
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
      })),
    []
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="bg-white text-black" style={{ width: "50%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FSMGraph;
