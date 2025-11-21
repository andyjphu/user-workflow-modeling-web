# FSM Visualization

Interactive finite state machine visualization built with Next.js, TypeScript, and React Flow.

## Overview

This project renders user workflow states and transitions as an interactive graph. States and transitions are inferred from Python/VLM pipeline logs and visualized using React Flow.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **@xyflow/react** v12.9 (React Flow)
- **Tailwind CSS v4**

## Project Structure

```
/app
  page.tsx           # Main page that renders FSMGraph
  layout.tsx         # Root layout (imports React Flow CSS)
  FSMGraph.tsx       # Core graph component
  AnimatedNode.tsx   # Custom node component with CSS transitions
  fsm.ts             # FSM data (states + transitions)
  globals.css        # Global styles including animated-node class
```

## Key Files

### `fsm.ts`
Defines the FSM data structure:
- `states`: Array of state IDs
- `transitions`: Array of `{ trigger, source, dest }` objects
- Types: `FSMStateId`, `FSMTransition`

### `repulsion.ts`
Simple "fake physics" utility:
- `applyRepulsion(nodes)`: Pushes nodes apart if closer than 150px
- Runs up to 10 iterations until stable
- Called after node add and drag stop

### `FSMGraph.tsx`
Main graph component:
- Maps states → React Flow nodes (with `animated` type)
- Maps transitions → React Flow edges (with arrow markers)
- Provides "Add node" button for dynamic node creation
- Supports edge creation via UI (`onConnect`)
- Uses simple grid layout (no physics)

### `AnimatedNode.tsx`
Custom node component with:
- Top/bottom handles for connections
- CSS transition for smooth position changes

### `globals.css`
Contains `.animated-node` class with `transition: transform 0.25s ease-out` for slide animation.

## Running

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000` to see the FSM graph.

## Features

- **Interactive graph**: Drag nodes, zoom, pan
- **Directional arrows**: All edges show arrow markers
- **Smooth animations**: Nodes slide when positions change (CSS transitions)
- **Simple repulsion**: Nodes push apart if too close (150px min distance)
- **Dynamic nodes**: Click "Add node" to create new nodes (with auto-repulsion)
- **Edge creation**: Connect nodes by dragging from handles
- **MiniMap + Controls**: Built-in React Flow UI components

## Extending

### Add more states/transitions
Edit `app/fsm.ts` to add entries to `states` or `transitions` arrays.

### Custom node appearance
Modify `app/AnimatedNode.tsx` or `.animated-node` class in `globals.css`.

### Node click handlers
Add `onNodeClick` prop to `<ReactFlow />` in `FSMGraph.tsx`.

### Persist layout
Serialize `nodes` array positions and restore on load.

### Better layout
Replace grid positioning with a layout algorithm (e.g., dagre, ELK) in `initialNodes` calculation.

## Notes

- States are laid out in a simple 5-column grid
- No force-directed physics (intentional)
- Transitions are directional with arrow markers
- Custom nodes use CSS transitions for smooth movement
- React Flow CSS is imported globally in `layout.tsx`
