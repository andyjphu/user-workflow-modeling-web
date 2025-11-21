import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export function AnimatedNode({ data }: NodeProps) {
  return (
    <div className="animated-node">
      {data.label}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

