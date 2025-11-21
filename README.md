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
  page.tsx                      # Main page that renders FSMGraph and VideoFlow
  layout.tsx                    # Root layout (imports React Flow CSS)
  globals.css                   # Global styles including React Flow animations
  /components
    FSMGraph.tsx                # Core FSM graph component
    VideoFlow.tsx               # Video-synced graph component
    AnimatedNode.tsx            # Custom node component
  /lib
    fsm.ts                      # FSM data (states + transitions)
    repulsion.ts                # Node repulsion utility
```

## Key Files

### `app/lib/fsm.ts`
Defines the FSM data structure:
- `states`: Array of state IDs
- `transitions`: Array of `{ trigger, source, dest }` objects
- Types: `FSMStateId`, `FSMTransition`

### `app/lib/repulsion.ts`
Simple "fake physics" utility:
- `applyRepulsion(nodes)`: Pushes nodes apart if closer than 250px
- Runs up to 64 iterations until stable
- Called after node add and drag stop

### `app/components/FSMGraph.tsx`
Main graph component:
- Maps states → React Flow nodes (with `animated` type)
- Maps transitions → React Flow edges (with arrow markers)
- Provides "Add node" button for dynamic node creation
- Supports edge creation via UI (`onConnect`)
- Uses simple grid layout with repulsion physics

### `app/components/AnimatedNode.tsx`
Custom node component with:
- Top/bottom handles for connections
- Styled with `.animated-node` class

### `app/components/VideoFlow.tsx`
Main layout component with draggable divider:
- Left pane: FSMGraph with full interactivity
- Right pane: Video player with timeline markers
- Draggable divider to resize panes
- Video markers trigger node additions at specific timestamps

### `app/globals.css`
Contains `.react-flow__node` with `transition: transform 0.15s ease-out` for smooth slide animations.

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
Edit `app/lib/fsm.ts` to add entries to `states` or `transitions` arrays.

### Custom node appearance
Modify `app/components/AnimatedNode.tsx` or `.animated-node` class in `globals.css`.

### Node click handlers
Add `onNodeClick` prop to `<ReactFlow />` in `app/components/FSMGraph.tsx`.

### Persist layout
Serialize `nodes` array positions and restore on load.

### Better layout
Replace grid positioning with a layout algorithm (e.g., dagre, ELK) in `initialNodes` calculation.

### Adjust repulsion parameters
Modify `MIN_DIST` and `MAX_ITERS` constants in `app/lib/repulsion.ts`.

## Notes

- States are laid out in a simple 5-column grid
- No force-directed physics (intentional)
- Transitions are directional with arrow markers
- Custom nodes use CSS transitions for smooth movement
- React Flow CSS is imported globally in `layout.tsx`
