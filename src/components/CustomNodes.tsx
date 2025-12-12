'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface CustomNodeData {
  label: string
  sublabel?: string
  isActive: boolean
  isGap?: boolean
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
  const color = data.isGap ? nodeColors.gap : nodeColors[type]
  const isActive = data.isActive
  const isAnimating = data.isAnimating

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

      {/* Small circle node */}
      <div
        className={`
          w-3 h-3 rounded-full
          transition-all duration-300 ease-out
          ${isAnimating ? 'scale-150' : 'scale-100'}
        `}
        style={{
          backgroundColor: color,
          opacity: isActive ? 1 : 0.4,
          boxShadow: isActive
            ? `0 0 ${isAnimating ? '12px' : '8px'} ${color}`
            : 'none',
        }}
      />

      {/* External label */}
      <div
        className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
        style={{ opacity: isActive ? 1 : 0.5 }}
      >
        <div className="text-xs font-medium text-slate-700">
          {data.label}
        </div>
        {data.sublabel && (
          <div className="text-[10px] text-slate-500">
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
