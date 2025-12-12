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

type NodeKey = 'standard' | 'lc1' | 'lc2' | 'prereq1' | 'prereq2' | 'prereq3' | 'future1' | 'future2'

interface KnowledgeGraphProps {
  step: number
  selectedAnswer: '3' | '1/4' | '4/3' | null
  animatingNode: string | null
  onNodeClick: (nodeId: NodeKey) => void
  wrongAnswerScenarios: Record<string, {
    gapLC: 'LC1' | 'LC2'
    rootPrerequisite: {
      code: string
      lcId: string
      lcDescription: string
    }
  }>
}

// Base node and edge definitions
const initialNodes: Node[] = [
  // Prerequisites (top row)
  { id: 'prereq1', type: 'prerequisite', data: { label: '2.G.A.3', sublabel: 'Partitioning shapes' }, position: { x: 0, y: 0 } },
  { id: 'prereq2', type: 'prerequisite', data: { label: '1.G.A.3', sublabel: 'Halves & fourths' }, position: { x: 0, y: 0 } },
  { id: 'prereq3', type: 'prerequisite', data: { label: '2.MD.A.2', sublabel: 'Measurement units' }, position: { x: 0, y: 0 } },
  // Main standard (middle)
  { id: 'standard', type: 'standard', data: { label: '3.NF.A.1', sublabel: 'Fractions as parts' }, position: { x: 0, y: 0 } },
  // Learning components (below standard)
  { id: 'lc1', type: 'component', data: { label: 'LC1', sublabel: 'Unit fractions (1/b)' }, position: { x: 0, y: 0 } },
  { id: 'lc2', type: 'component', data: { label: 'LC2', sublabel: 'Non-unit fractions (a/b)' }, position: { x: 0, y: 0 } },
  // Future standards (bottom row)
  { id: 'future1', type: 'future', data: { label: '3.G.A.2', sublabel: 'Equivalent fractions' }, position: { x: 0, y: 0 } },
  { id: 'future2', type: 'future', data: { label: '3.NF.A.3', sublabel: 'Fraction operations' }, position: { x: 0, y: 0 } },
]

const initialEdges: Edge[] = [
  // Prerequisites -> Standard (buildsTowards)
  { id: 'e-prereq1-standard', source: 'prereq1', target: 'standard', label: 'buildsTowards', type: 'smoothstep' },
  { id: 'e-prereq2-standard', source: 'prereq2', target: 'standard', label: 'buildsTowards', type: 'smoothstep' },
  { id: 'e-prereq3-standard', source: 'prereq3', target: 'standard', label: 'buildsTowards', type: 'smoothstep' },
  // Learning Components -> Standard (supports)
  { id: 'e-lc1-standard', source: 'lc1', target: 'standard', label: 'supports', type: 'smoothstep' },
  { id: 'e-lc2-standard', source: 'lc2', target: 'standard', label: 'supports', type: 'smoothstep' },
  // Standard -> Future (buildsTowards)
  { id: 'e-standard-future1', source: 'standard', target: 'future1', label: 'buildsTowards', type: 'smoothstep' },
  { id: 'e-standard-future2', source: 'standard', target: 'future2', label: 'buildsTowards', type: 'smoothstep' },
]

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
  const getNodeActiveState = useCallback((nodeId: string): boolean => {
    // All nodes visible from start, but "active" based on step
    switch (nodeId) {
      case 'standard':
        return step >= 2
      case 'lc1':
      case 'lc2':
        return step >= 3
      case 'prereq1':
      case 'prereq2':
      case 'prereq3':
        return step >= 5
      case 'future1':
      case 'future2':
        return step >= 2
      default:
        return false
    }
  }, [step])

  const getEdgeActiveState = useCallback((edgeId: string): boolean => {
    if (edgeId.includes('prereq') && edgeId.includes('standard')) return step >= 5
    if (edgeId.includes('lc') && edgeId.includes('standard')) return step >= 3
    if (edgeId.includes('future')) return step >= 2
    return false
  }, [step])

  // Check if node is the gap
  const isNodeGap = useCallback((nodeId: string): boolean => {
    if (step < 4 || !selectedAnswer) return false
    const scenario = wrongAnswerScenarios[selectedAnswer]
    if (!scenario) return false

    if (nodeId === 'lc1' && scenario.gapLC === 'LC1') return true
    if (nodeId === 'lc2' && scenario.gapLC === 'LC2') return true
    return false
  }, [step, selectedAnswer, wrongAnswerScenarios])

  // Check if node is animating
  const isNodeAnimating = useCallback((nodeId: string): boolean => {
    if (!animatingNode) return false
    if (animatingNode === 'standard' && nodeId === 'standard') return true
    if (animatingNode === 'lc1' && nodeId === 'lc1') return true
    if (animatingNode === 'lc2' && nodeId === 'lc2') return true
    if (animatingNode === 'lc1-gap' && nodeId === 'lc1') return true
    if (animatingNode === 'lc2-gap' && nodeId === 'lc2') return true
    if (animatingNode === 'prereq' && selectedAnswer) {
      const scenario = wrongAnswerScenarios[selectedAnswer]
      if (scenario?.rootPrerequisite.code === '2.G.A.3' && nodeId === 'prereq1') return true
      if (scenario?.rootPrerequisite.code === '1.G.A.3' && nodeId === 'prereq2') return true
    }
    return false
  }, [animatingNode, selectedAnswer, wrongAnswerScenarios])

  // Get dynamic sublabel for prerequisites when they're the root cause
  const getPrereqSublabel = useCallback((nodeId: string, defaultSublabel: string): string => {
    if (step >= 5 && selectedAnswer) {
      const scenario = wrongAnswerScenarios[selectedAnswer]
      if (scenario) {
        if (nodeId === 'prereq1' && scenario.rootPrerequisite.code === '2.G.A.3') {
          return `LC4: Describe whole`
        }
        if (nodeId === 'prereq2' && scenario.rootPrerequisite.code === '1.G.A.3') {
          return `LC4: Four fourths`
        }
      }
    }
    return defaultSublabel
  }, [step, selectedAnswer, wrongAnswerScenarios])

  // Style nodes based on current state
  const styledNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        sublabel: node.id.startsWith('prereq')
          ? getPrereqSublabel(node.id, node.data.sublabel as string)
          : node.data.sublabel,
        isActive: getNodeActiveState(node.id),
        isGap: isNodeGap(node.id),
        isAnimating: isNodeAnimating(node.id),
        onClick: () => onNodeClick(node.id as NodeKey),
      },
    }))
  }, [nodes, getNodeActiveState, isNodeGap, isNodeAnimating, getPrereqSublabel, onNodeClick])

  // Style edges - thin lines with relationship labels
  const styledEdges = useMemo(() => {
    return layoutedEdges.map((edge) => {
      const isActive = getEdgeActiveState(edge.id)
      const isHighlighted = step >= 5 && selectedAnswer && edge.id.includes('prereq') && edge.id.includes('standard')
        ? wrongAnswerScenarios[selectedAnswer]?.rootPrerequisite.code === '2.G.A.3' && edge.id.includes('prereq1')
          || wrongAnswerScenarios[selectedAnswer]?.rootPrerequisite.code === '1.G.A.3' && edge.id.includes('prereq2')
        : false

      return {
        ...edge,
        type: 'straight',
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? '#f87171' : '#d1d5db',
          strokeWidth: isHighlighted ? 2 : 1,
          opacity: isActive ? 0.6 : 0.25,
        },
        labelStyle: {
          fill: isActive ? '#64748b' : '#94a3b8',
          fontSize: 9,
          fontWeight: 400,
        },
        labelBgStyle: {
          fill: '#fff',
          fillOpacity: isActive ? 0.85 : 0.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isHighlighted ? '#f87171' : isActive ? '#94a3b8' : '#d1d5db',
        },
      }
    })
  }, [step, selectedAnswer, wrongAnswerScenarios, getEdgeActiveState])

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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
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
