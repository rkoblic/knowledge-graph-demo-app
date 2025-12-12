'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './CustomNodes'
import { getLayoutedElements } from '../utils/layoutGraph'
import demoData from '../data/demo-data.json'

interface KnowledgeGraphProps {
  step: number
  selectedAnswer: '3' | '1/4' | '4/3' | null
  animatingNode: string | null
  onNodeClick: (nodeId: string) => void
  wrongAnswerScenarios: Record<string, {
    gapLC: 'LC1' | 'LC2'
    rootPrerequisite: {
      code: string
      lcId: string
      lcDescription: string
    }
  }>
}

// Get prerequisite LCs from data
const prereqLCs = demoData.prerequisiteLearningComponents as Record<string, Array<{ id: string; description: string }>>

// Build nodes dynamically
function buildInitialNodes(): Node[] {
  const nodes: Node[] = []

  // Prerequisites (top)
  demoData.prerequisites.forEach((prereq, i) => {
    nodes.push({
      id: `prereq${i + 1}`,
      type: 'prerequisite',
      data: { label: prereq.code, sublabel: prereq.description.slice(0, 30) + '...' },
      position: { x: 0, y: 0 }
    })

    // Add LCs for this prerequisite
    const lcs = prereqLCs[prereq.code] || []
    lcs.forEach((lc) => {
      nodes.push({
        id: `prereq${i + 1}-${lc.id.toLowerCase()}`,
        type: 'component',
        data: {
          label: `${prereq.code}-${lc.id}`,
          sublabel: lc.description.slice(0, 25) + (lc.description.length > 25 ? '...' : ''),
          parentStandard: prereq.code
        },
        position: { x: 0, y: 0 }
      })
    })
  })

  // Main standard (center)
  nodes.push({
    id: 'standard',
    type: 'standard',
    data: { label: '3.NF.A.1', sublabel: 'Fractions as parts' },
    position: { x: 0, y: 0 }
  })

  // LCs for main standard
  const mainLCs = prereqLCs['3.NF.A.1'] || []
  mainLCs.forEach((lc) => {
    nodes.push({
      id: `standard-${lc.id.toLowerCase()}`,
      type: 'component',
      data: {
        label: lc.id,
        sublabel: lc.description.slice(0, 25) + (lc.description.length > 25 ? '...' : ''),
        parentStandard: '3.NF.A.1'
      },
      position: { x: 0, y: 0 }
    })
  })

  // Future standards (bottom)
  demoData.buildsTo.slice(0, 2).forEach((future, i) => {
    nodes.push({
      id: `future${i + 1}`,
      type: 'future',
      data: { label: future.code, sublabel: future.description.slice(0, 30) + '...' },
      position: { x: 0, y: 0 }
    })

    // Add LCs for future standards
    const lcs = prereqLCs[future.code] || []
    lcs.forEach((lc) => {
      nodes.push({
        id: `future${i + 1}-${lc.id.toLowerCase()}`,
        type: 'component',
        data: {
          label: `${future.code}-${lc.id}`,
          sublabel: lc.description.slice(0, 25) + (lc.description.length > 25 ? '...' : ''),
          parentStandard: future.code
        },
        position: { x: 0, y: 0 }
      })
    })
  })

  return nodes
}

// Build edges dynamically
function buildInitialEdges(): Edge[] {
  const edges: Edge[] = []

  // Prerequisites -> Standard
  demoData.prerequisites.forEach((prereq, i) => {
    edges.push({
      id: `e-prereq${i + 1}-standard`,
      source: `prereq${i + 1}`,
      target: 'standard',
      label: 'buildsTowards',
      type: 'smoothstep'
    })

    // LCs -> Prerequisite (supports)
    const lcs = prereqLCs[prereq.code] || []
    lcs.forEach((lc) => {
      edges.push({
        id: `e-prereq${i + 1}-${lc.id.toLowerCase()}-prereq${i + 1}`,
        source: `prereq${i + 1}-${lc.id.toLowerCase()}`,
        target: `prereq${i + 1}`,
        label: 'supports',
        type: 'smoothstep'
      })
    })
  })

  // Main standard LCs -> Standard
  const mainLCs = prereqLCs['3.NF.A.1'] || []
  mainLCs.forEach((lc) => {
    edges.push({
      id: `e-standard-${lc.id.toLowerCase()}-standard`,
      source: `standard-${lc.id.toLowerCase()}`,
      target: 'standard',
      label: 'supports',
      type: 'smoothstep'
    })
  })

  // Standard -> Future
  demoData.buildsTo.slice(0, 2).forEach((future, i) => {
    edges.push({
      id: `e-standard-future${i + 1}`,
      source: 'standard',
      target: `future${i + 1}`,
      label: 'buildsTowards',
      type: 'smoothstep'
    })

    // LCs -> Future standard
    const lcs = prereqLCs[future.code] || []
    lcs.forEach((lc) => {
      edges.push({
        id: `e-future${i + 1}-${lc.id.toLowerCase()}-future${i + 1}`,
        source: `future${i + 1}-${lc.id.toLowerCase()}`,
        target: `future${i + 1}`,
        label: 'supports',
        type: 'smoothstep'
      })
    })
  })

  return edges
}

const initialNodes = buildInitialNodes()
const initialEdges = buildInitialEdges()

// Apply layout once
const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)

export default function KnowledgeGraph({
  step,
  selectedAnswer,
  animatingNode,
  onNodeClick,
  wrongAnswerScenarios,
}: KnowledgeGraphProps) {
  // Use React Flow's state hooks for draggable nodes
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Determine which nodes/edges are active based on step
  // Steps: 0=Assessment, 1=Standard ID, 2=Learning Components, 3=Gap Analysis, 4=Prerequisite Trace, 5=Intervention
  const getNodeActiveState = useCallback((nodeId: string): boolean => {
    // Step 0: All nodes fully visible to show the full graph
    if (step === 0) return true

    // Standard and its LCs
    if (nodeId === 'standard' || nodeId.startsWith('standard-')) {
      return step >= 1
    }

    // Main standard LCs specifically
    if (nodeId === 'standard-lc1' || nodeId === 'standard-lc2') {
      return step >= 2
    }

    // Future standards and their LCs
    if (nodeId.startsWith('future')) {
      return step >= 1
    }

    // Prerequisites and their LCs
    if (nodeId.startsWith('prereq')) {
      return step >= 4
    }

    return false
  }, [step])

  const getEdgeActiveState = useCallback((edgeId: string): boolean => {
    // Step 0: All edges fully visible
    if (step === 0) return true

    // Edges to/from prerequisites
    if (edgeId.includes('prereq')) {
      return step >= 4
    }

    // Edges for main standard LCs
    if (edgeId.includes('standard-lc')) {
      return step >= 2
    }

    // Edges to future standards
    if (edgeId.includes('future')) {
      return step >= 1
    }

    return false
  }, [step])

  // Check if node is the gap
  const isNodeGap = useCallback((nodeId: string): boolean => {
    if (step < 3 || !selectedAnswer) return false
    const scenario = wrongAnswerScenarios[selectedAnswer]
    if (!scenario) return false

    // Check main standard LCs
    if (nodeId === 'standard-lc1' && scenario.gapLC === 'LC1') return true
    if (nodeId === 'standard-lc2' && scenario.gapLC === 'LC2') return true

    return false
  }, [step, selectedAnswer, wrongAnswerScenarios])

  // Build the complete trace path from root prerequisite LC to gap LC
  const getTracePath = useCallback((): { nodes: string[], edges: string[] } => {
    if (step < 4 || !selectedAnswer) return { nodes: [], edges: [] }
    const scenario = wrongAnswerScenarios[selectedAnswer]
    if (!scenario) return { nodes: [], edges: [] }

    const rootCode = scenario.rootPrerequisite.code
    const rootLcId = scenario.rootPrerequisite.lcId.toLowerCase()
    const gapLcId = scenario.gapLC.toLowerCase()

    const pathNodes: string[] = []
    const pathEdges: string[] = []

    // Determine the root LC node and its parent standard
    let rootLcNode: string
    let rootStandardNode: string

    if (rootCode === '2.G.A.3') {
      rootLcNode = `prereq1-${rootLcId}`
      rootStandardNode = 'prereq1'
    } else if (rootCode === '1.G.A.3') {
      rootLcNode = `prereq2-${rootLcId}`
      rootStandardNode = 'prereq2'
    } else if (rootCode === '3.NF.A.1') {
      // Root is in the same standard as the gap - shorter path
      rootLcNode = `standard-${rootLcId}`
      rootStandardNode = 'standard'
    } else {
      return { nodes: [], edges: [] }
    }

    // Build path: rootLC -> rootStandard -> mainStandard -> gapLC
    pathNodes.push(rootLcNode)
    pathEdges.push(`e-${rootLcNode}-${rootStandardNode}`) // LC supports its standard

    if (rootStandardNode !== 'standard') {
      // Path goes through a prerequisite standard
      pathNodes.push(rootStandardNode)
      pathEdges.push(`e-${rootStandardNode}-standard`) // prereq buildsTowards standard
      pathNodes.push('standard')
    } else {
      pathNodes.push('standard')
    }

    // Add gap LC
    const gapLcNode = `standard-${gapLcId}`
    pathEdges.push(`e-${gapLcNode}-standard`) // gap LC supports standard
    pathNodes.push(gapLcNode)

    return { nodes: pathNodes, edges: pathEdges }
  }, [step, selectedAnswer, wrongAnswerScenarios])

  // Check if node is on the trace path
  const isNodeOnPath = useCallback((nodeId: string): boolean => {
    const { nodes: pathNodes } = getTracePath()
    return pathNodes.includes(nodeId)
  }, [getTracePath])

  // Check if edge is on the trace path
  const isEdgeOnPath = useCallback((edgeId: string): boolean => {
    const { edges: pathEdges } = getTracePath()
    return pathEdges.includes(edgeId)
  }, [getTracePath])

  // Check if node is the root prerequisite LC (start of path)
  const isRootPrereqLC = useCallback((nodeId: string): boolean => {
    if (step < 4 || !selectedAnswer) return false
    const { nodes: pathNodes } = getTracePath()
    return pathNodes.length > 0 && pathNodes[0] === nodeId
  }, [step, selectedAnswer, getTracePath])

  // Check if node is animating
  const isNodeAnimating = useCallback((nodeId: string): boolean => {
    if (!animatingNode) return false
    if (animatingNode === 'standard' && nodeId === 'standard') return true
    if (animatingNode === 'lc1' && nodeId === 'standard-lc1') return true
    if (animatingNode === 'lc2' && nodeId === 'standard-lc2') return true
    if (animatingNode === 'lc1-gap' && nodeId === 'standard-lc1') return true
    if (animatingNode === 'lc2-gap' && nodeId === 'standard-lc2') return true
    if (animatingNode === 'prereq' && selectedAnswer) {
      const scenario = wrongAnswerScenarios[selectedAnswer]
      if (scenario?.rootPrerequisite.code === '2.G.A.3' && nodeId === 'prereq1') return true
      if (scenario?.rootPrerequisite.code === '1.G.A.3' && nodeId === 'prereq2') return true
    }
    return false
  }, [animatingNode, selectedAnswer, wrongAnswerScenarios])

  // Style nodes based on current state
  const styledNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isActive: getNodeActiveState(node.id),
        isGap: isNodeGap(node.id),
        isOnPath: isNodeOnPath(node.id),
        isRootLC: isRootPrereqLC(node.id),
        isAnimating: isNodeAnimating(node.id),
        onClick: () => onNodeClick(node.id),
      },
    }))
  }, [nodes, getNodeActiveState, isNodeGap, isNodeOnPath, isRootPrereqLC, isNodeAnimating, onNodeClick])

  // Style edges - thin lines with relationship labels
  const styledEdges = useMemo(() => {
    return layoutedEdges.map((edge) => {
      const isActive = getEdgeActiveState(edge.id)
      const isHighlighted = isEdgeOnPath(edge.id)

      return {
        ...edge,
        type: 'straight',
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? '#f87171' : '#d1d5db',
          strokeWidth: isHighlighted ? 2.5 : 1,
          opacity: isHighlighted ? 1 : isActive ? 0.6 : 0.25,
        },
        labelStyle: {
          fill: isHighlighted ? '#dc2626' : isActive ? '#64748b' : '#94a3b8',
          fontSize: 9,
          fontWeight: isHighlighted ? 500 : 400,
        },
        labelBgStyle: {
          fill: '#fff',
          fillOpacity: isHighlighted ? 0.95 : isActive ? 0.85 : 0.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isHighlighted ? '#f87171' : isActive ? '#94a3b8' : '#d1d5db',
        },
      }
    })
  }, [getEdgeActiveState, isEdgeOnPath])

  const onNodeClickHandler: NodeMouseHandler = useCallback((_, node) => {
    if (node.data.onClick) {
      (node.data.onClick as () => void)()
    }
  }, [])

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-slate-200">
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClickHandler}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#e2e8f0" gap={20} size={1} />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  )
}
