import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force'
import type { Node, Edge } from '@xyflow/react'

const nodeWidth = 140
const nodeHeight = 60

interface SimNode extends SimulationNodeDatum {
  id: string
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode
  target: string | SimNode
}

// Initial positions based on logical layout:
// - Prerequisites at top
// - Standard (3.NF.A.1) in center
// - Learning components to left/right of standard
// - Future standards at bottom
function getInitialPosition(nodeId: string, width: number, height: number): { x: number; y: number } {
  const centerX = width / 2
  const centerY = height / 2

  switch (nodeId) {
    // Prerequisites - top row, spread horizontally
    case 'prereq1': return { x: centerX - 150, y: centerY - 150 }
    case 'prereq2': return { x: centerX, y: centerY - 180 }
    case 'prereq3': return { x: centerX + 150, y: centerY - 150 }

    // Main standard - center
    case 'standard': return { x: centerX, y: centerY }

    // Learning components - left and right of standard
    case 'lc1': return { x: centerX - 180, y: centerY + 20 }
    case 'lc2': return { x: centerX + 180, y: centerY + 20 }

    // Future standards - bottom row
    case 'future1': return { x: centerX - 100, y: centerY + 180 }
    case 'future2': return { x: centerX + 100, y: centerY + 180 }

    default: return { x: centerX, y: centerY }
  }
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const width = 600
  const height = 500

  // Create simulation nodes with logical initial positions
  const simNodes: SimNode[] = nodes.map(n => {
    const pos = getInitialPosition(n.id, width, height)
    return { id: n.id, x: pos.x, y: pos.y }
  })
  const simLinks: SimLink[] = edges.map(e => ({ source: e.source, target: e.target }))

  // Create force simulation - gentle forces to refine positions while keeping structure
  const simulation = forceSimulation<SimNode>(simNodes)
    .force('link', forceLink<SimNode, SimLink>(simLinks)
      .id(d => d.id)
      .distance(150)
      .strength(0.1))     // weak links to maintain structure
    .force('charge', forceManyBody<SimNode>().strength(-300))  // moderate repulsion
    .force('collide', forceCollide<SimNode>(60))
    // No center force - let initial positions define the layout

  // Run fewer iterations since we have good initial positions
  for (let i = 0; i < 100; i++) {
    simulation.tick()
  }

  // Map positions back to nodes
  const nodePositions = new Map(simNodes.map(n => [n.id, { x: n.x || 0, y: n.y || 0 }]))

  const layoutedNodes = nodes.map(node => ({
    ...node,
    position: {
      x: (nodePositions.get(node.id)?.x || 0) - nodeWidth / 2,
      y: (nodePositions.get(node.id)?.y || 0) - nodeHeight / 2,
    },
  }))

  return { nodes: layoutedNodes, edges }
}
