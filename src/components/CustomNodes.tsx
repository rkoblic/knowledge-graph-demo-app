'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface CustomNodeData {
  label: string
  sublabel?: string
  isActive: boolean
  isGap?: boolean
  isOnPath?: boolean
  isRootLC?: boolean
  isAnimating?: boolean
  onClick?: () => void
}

const nodeColors = {
  standard: '#6366f1',     // indigo
  component: '#a78bfa',    // violet
  prerequisite: '#f59e0b', // amber
  future: '#34d399',       // emerald
  gap: '#f87171'           // red
}

function BaseNode({
  data,
  type
}: {
  data: CustomNodeData
  type: 'standard' | 'component' | 'prerequisite' | 'future'
}) {
  // Determine node color: gap/root LC are red, path nodes are orange, else default
  const isHighlighted = data.isGap || data.isRootLC
  const isOnPath = data.isOnPath && !isHighlighted
  const color = isHighlighted ? nodeColors.gap : isOnPath ? '#fb923c' : nodeColors[type]
  const isActive = data.isActive
  const isAnimating = data.isAnimating

  // Path nodes get a ring effect
  const ringColor = isHighlighted ? '#fecaca' : isOnPath ? '#fed7aa' : 'transparent'

  return (
    <div
      onClick={data.onClick}
      className="relative cursor-pointer"
    >
      {/* Invisible handles for edge connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-1 !h-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-0 !w-1 !h-1"
      />

      {/* Outer ring for path nodes */}
      {(isHighlighted || isOnPath) && (
        <div
          className="absolute -inset-1 rounded-full transition-all duration-300"
          style={{
            backgroundColor: ringColor,
            opacity: 0.5,
          }}
        />
      )}

      {/* Small circle node */}
      <div
        className={`
          relative w-3 h-3 rounded-full
          transition-all duration-300 ease-out
          ${isAnimating ? 'scale-150' : 'scale-100'}
        `}
        style={{
          backgroundColor: color,
          opacity: isActive ? 1 : 0.4,
          boxShadow: isActive
            ? `0 0 ${isAnimating ? '12px' : isHighlighted || isOnPath ? '10px' : '8px'} ${color}`
            : 'none',
        }}
      />

      {/* External label */}
      <div
        className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
        style={{ opacity: isActive ? 1 : 0.5 }}
      >
        <div
          className="text-xs font-medium"
          style={{ color: isHighlighted ? '#dc2626' : isOnPath ? '#ea580c' : '#334155' }}
        >
          {data.label}
        </div>
        {data.sublabel && (
          <div
            className="text-[10px]"
            style={{ color: isHighlighted ? '#f87171' : isOnPath ? '#fb923c' : '#64748b' }}
          >
            {data.sublabel}
          </div>
        )}
      </div>
    </div>
  )
}

export const StandardNode = memo(({ data }: NodeProps) => (
  <BaseNode data={data as unknown as CustomNodeData} type="standard" />
))
StandardNode.displayName = 'StandardNode'

export const ComponentNode = memo(({ data }: NodeProps) => (
  <BaseNode data={data as unknown as CustomNodeData} type="component" />
))
ComponentNode.displayName = 'ComponentNode'

export const PrerequisiteNode = memo(({ data }: NodeProps) => (
  <BaseNode data={data as unknown as CustomNodeData} type="prerequisite" />
))
PrerequisiteNode.displayName = 'PrerequisiteNode'

export const FutureNode = memo(({ data }: NodeProps) => (
  <BaseNode data={data as unknown as CustomNodeData} type="future" />
))
FutureNode.displayName = 'FutureNode'

export const nodeTypes = {
  standard: StandardNode,
  component: ComponentNode,
  prerequisite: PrerequisiteNode,
  future: FutureNode,
}
