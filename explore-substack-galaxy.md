# Substack Galaxy Explorer - Implementation Plan (2D Canvas)

## Vision
Transform the newsletter recommendation network into an explorable galaxy where users can search, discover, and journey through connected newsletters like navigating through a constellation of content in the 2D canvas visualization.

## Core User Flow
1. User sees galaxy-like 3D network on load
2. Types newsletter name in search bar (galaxy-themed)
3. Matching nodes highlight with visual feedback
4. Selection triggers focus sequence:
   - Brief highlight pause
   - Other nodes fade to lower opacity
   - Connected nodes and edges illuminate
   - Camera smoothly travels to selected node
5. Click behavior mirrors search selection

## Implementation Phases

### Phase 1: Search Component Architecture

**Current Assets Available:**
- Map2d component with canvas rendering at `$lib/components/3d-networks/map2d.svelte`
- Existing `focusNode()` function for smooth camera transitions
- Node data includes: id, name, category, subscriber_count, is_bestseller
- Hover tooltip system already implemented
- Click-to-focus behavior in place

**Key Decisions:**
- Search bar positioning (fixed top overlay)
- Create searchable node index from graphData.nodes
- Debounce search input (300ms)
- Galaxy-themed styling with Skeleton UI components

### Phase 2: Node Highlighting System

**Map2d Canvas Capabilities:**
- Nodes rendered as circles with `ctx.arc()`
- Node colors accessible via `n.color`
- Already has hover ring rendering
- Canvas globalAlpha for opacity control
- Link rendering with variable opacity based on zoom

**Implementation Steps:**
- Add `highlightedNodes` Set to component state
- Modify draw() to render non-highlighted nodes with reduced opacity
- Enhance connected node detection using link data
- Add glow/pulse effect for selected node

### Phase 3: Search-to-Focus Integration

**Existing Focus System:**
- `focusNode(node, duration, targetK)` already implemented
- Smooth easing animations in place
- Transform state managed properly
- Click handler already calls focusNode

**Enhancement Steps:**
- Export focusNode method from Map2d
- Add node search/filter methods
- Implement highlight-delay-focus sequence
- Sync search selection with map focus

### Phase 4: Galaxy Visual Enhancements

**Visual Effects to Add:**
- Starfield background effect
- Node glow/pulse animations
- Connection line shimmer during focus
- Particle effects during transitions
- Galaxy-themed gradients for UI

## Technical Architecture

### State Management (Svelte 5 Runes)
```
// In +page.svelte
let searchQuery = $state('');
let searchResults = $state<Node[]>([]);
let selectedNode = $state<Node | null>(null);

// In Map2d component
let highlightedNodes = $state<Set<string>>(new Set());
let focusTarget = $state<Node | null>(null);
```

### Event Flow
1. Search Input → Debounced Query
2. Query → Node Matching
3. Match → Highlight State Update
4. Selection → Focus Sequence
5. Focus → Camera Animation + State Update

## UI/UX Considerations

### Galaxy Theme Elements
- Search bar with cosmic gradient or glow
- Stellar particle effects during transitions
- Constellation-like connection patterns
- Nebula-style background for depth
- Pulsing/breathing effects for living feel

### Performance Optimizations
- Virtual scrolling for autocomplete results
- LOD (Level of Detail) for distant nodes
- Frustum culling for off-screen elements
- Staged rendering for smooth transitions
- Request animation frame for animations

## Dependencies & Tools

### Currently Available
- Svelte 5 with runes
- Skeleton UI for components
- D3-force for physics simulation
- Canvas 2D for rendering
- D3-zoom for pan/zoom controls

### To Implement
- Fuzzy search algorithm (simple implementation, no library needed)
- Debounce utility
- Galaxy visual effects (pure canvas)

## Implementation Steps

### Step 1: Add Search Component
1. Create galaxy-themed search bar with Skeleton UI
2. Position at top of viewport with glass morphism effect
3. Implement fuzzy search on node names
4. Show autocomplete dropdown with results

### Step 2: Enhance Map2d Component
1. Add `highlightNodes(nodeIds)` method
2. Add `getConnectedNodes(nodeId)` method  
3. Modify draw() for opacity effects
4. Add pulse/glow animation for selected nodes

### Step 3: Connect Search to Map
1. Pass search results to Map2d
2. Trigger highlight sequence on selection
3. Add 500ms delay before focus animation
4. Clear highlights on new search

### Step 4: Polish & Effects
1. Add starfield background to canvas
2. Implement connection glow during focus
3. Add smooth transitions between states
4. Test performance with full dataset

## Questions Resolved

Based on the Map2d component review:
- Node structure: `{id, name, category, subscriber_count, color, x, y}`
- Typically thousands of nodes (component handles LOD)
- Camera control via `focusNode()` and transform state
- Canvas-based rendering with d3-force physics
- Svelte 5 runes for state management
- No existing search implementation found
- Performance optimized with LOD and sampling

## Success Metrics
- Search-to-focus < 2 seconds
- Smooth 60fps animations
- Intuitive navigation without instructions
- Discoverable connections leading to exploration
- Shareable/bookmarkable states