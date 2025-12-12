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
// - Prerequisites at top with their LCs clustered around them
// - Standard (3.NF.A.1) in center with its LCs
// - Future standards at bottom with their LCs
function getInitialPosition(nodeId: string, width: number, height: number): { x: number; y: number } {
  const centerX = width / 2
  const centerY = height / 2

  // Prerequisites - top area
  if (nodeId === 'prereq1') return { x: centerX - 200, y: centerY - 200 }
  if (nodeId === 'prereq2') return { x: centerX, y: centerY - 250 }
  if (nodeId === 'prereq3') return { x: centerX + 200, y: centerY - 200 }

  // Prerequisite LCs - cluster around their parent
  if (nodeId.startsWith('prereq1-lc')) {
    const lcNum = parseInt(nodeId.replace('prereq1-lc', '')) || 1
    const angle = (lcNum - 1) * (Math.PI / 3) - Math.PI / 2
    const radius = 80
    return {
      x: centerX - 200 + Math.cos(angle) * radius,
      y: centerY - 200 + Math.sin(angle) * radius
    }
  }
  if (nodeId.startsWith('prereq2-lc')) {
    const lcNum = parseInt(nodeId.replace('prereq2-lc', '')) || 1
    const angle = (lcNum - 1) * (Math.PI / 3) - Math.PI / 2
    const radius = 80
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY - 250 + Math.sin(angle) * radius
    }
  }
  if (nodeId.startsWith('prereq3-lc')) {
    const lcNum = parseInt(nodeId.replace('prereq3-lc', '')) || 1
    const angle = (lcNum - 1) * (Math.PI / 3) - Math.PI / 2
    const radius = 80
    return {
      x: centerX + 200 + Math.cos(angle) * radius,
      y: centerY - 200 + Math.sin(angle) * radius
    }
  }

  // Main standard - center
  if (nodeId === 'standard') return { x: centerX, y: centerY }

  // Main standard LCs - to left and right
  if (nodeId === 'standard-lc1') return { x: centerX - 150, y: centerY + 30 }
  if (nodeId === 'standard-lc2') return { x: centerX + 150, y: centerY + 30 }

  // Future standards - bottom area
  if (nodeId === 'future1') return { x: centerX - 150, y: centerY + 200 }
  if (nodeId === 'future2') return { x: centerX + 150, y: centerY + 200 }

  // Future LCs - cluster around their parent
  if (nodeId.startsWith('future1-lc')) {
    const lcNum = parseInt(nodeId.replace('future1-lc', '')) || 1
    const angle = (lcNum - 1) * (Math.PI / 2) + Math.PI / 4
    const radius = 70
    return {
      x: centerX - 150 + Math.cos(angle) * radius,
      y: centerY + 200 + Math.sin(angle) * radius
    }
  }
  if (nodeId.startsWith('future2-lc')) {
    const lcNum = parseInt(nodeId.replace('future2-lc', '')) || 1
    const angle = (lcNum - 1) * (Math.PI / 2) + Math.PI / 4
    const radius = 70
    return {
      x: centerX + 150 + Math.cos(angle) * radius,
      y: centerY + 200 + Math.sin(angle) * radius
    }
  }

  // Default fallback
  return { x: centerX, y: centerY }
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const width = 900
  const height = 700

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
      .distance(80)       // shorter distance for LC clusters
      .strength(0.15))    // moderate link strength
    .force('charge', forceManyBody<SimNode>().strength(-200))  // gentler repulsion
    .force('collide', forceCollide<SimNode>(40))  // smaller collision radius for compact clusters
    // No center force - let initial positions define the layout

  // Run fewer iterations since we have good initial positions
  for (let i = 0; i < 80; i++) {
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
