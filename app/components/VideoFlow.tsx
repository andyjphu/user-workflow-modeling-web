'use client'
import React, { useState, useRef } from "react";
import { ReactFlow, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FSMGraph from "./FSMGraph";

const markers: { time: number; node: Node }[] = [
  {
    time: 3, // seconds
    node: {
      id: "n1",
      position: { x: 100, y: 100 },
      data: { label: "First event" },
      type: "default",
    },
  },
  {
    time: 8,
    node: {
      id: "n2",
      position: { x: 250, y: 150 },
      data: { label: "Second event" },
      type: "default",
    },
  },
];

export function VideoFlow() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [fired, setFired] = useState<Set<number>>(new Set());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleTimeUpdate = () => {
    const t = videoRef.current?.currentTime ?? 0;

    // trigger markers whose time has passed and not yet fired
    markers.forEach((m, idx) => {
      if (t >= m.time && !fired.has(idx)) {
        setNodes((nds) => [...nds, m.node]);
        setFired((prev) => {
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
      }
    });
  };

  return (
    <div style={{ display: "flex", gap: 16 }}>
      
      <FSMGraph/>
      
      <video
        ref={videoRef}
        src="/my-video.mp4"
        controls
        onTimeUpdate={handleTimeUpdate}
        style={{ width: 400 }}
      />
    </div>
  );
}

