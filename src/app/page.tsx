'use client'

import React, { useState } from 'react'
import demoData from '../data/demo-data.json'

// Transform the imported data to match our component's expected structure
const standardData = {
  current: {
    code: demoData.currentStandard.code,
    description: demoData.currentStandard.description,
    grade: demoData.currentStandard.grade
  },
  learningComponents: demoData.learningComponents.map(lc => ({
    id: lc.id,
    description: lc.description,
    isGap: lc.isGap
  })),
  prerequisites: demoData.prerequisites.map(p => ({
    code: p.code,
    description: p.description,
    grade: p.grade,
    isRoot: p.isRoot
  })),
  buildsTo: demoData.buildsTo.slice(0, 2).map(b => ({
    code: b.code,
    description: b.description,
    grade: b.grade
  }))
}

const steps = [
  { title: "Assessment Question", description: "Student encounters a fraction problem" },
  { title: "Student Response", description: "Student provides an incorrect answer" },
  { title: "Standard Identification", description: "System identifies the relevant standard" },
  { title: "Learning Components", description: "Standard breaks into specific skills" },
  { title: "Gap Analysis", description: "System pinpoints the specific gap" },
  { title: "Prerequisite Trace", description: "System finds the root cause" },
  { title: "Targeted Intervention", description: "System generates focused follow-up" }
]

interface GraphNodeProps {
  x: number
  y: number
  label: string
  sublabel?: string
  type: 'standard' | 'component' | 'prerequisite' | 'future'
  isActive: boolean
  isGap?: boolean
  isAnimating?: boolean
  onClick?: () => void
}

const GraphNode: React.FC<GraphNodeProps> = ({
  x,
  y,
  label,
  sublabel,
  type,
  isActive,
  isGap = false,
  isAnimating = false,
  onClick
}) => {
  const colors = {
    standard: { bg: '#6366f1', border: '#4f46e5' },
    component: { bg: '#a78bfa', border: '#8b5cf6' },
    prerequisite: { bg: '#fbbf24', border: '#f59e0b' },
    future: { bg: '#34d399', border: '#10b981' },
    gap: { bg: '#f87171', border: '#ef4444' }
  }

  const color = isGap ? colors.gap : colors[type]
  const bgOpacity = isActive ? 1 : 0.4
  const textOpacity = isActive ? 1 : 0.7
  const scale = isAnimating ? 1.1 : 1

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
      onClick={onClick}
    >
      <rect
        x="-60"
        y="-25"
        width="120"
        height="50"
        rx="8"
        fill={color.bg}
        stroke={isAnimating ? '#fff' : color.border}
        strokeWidth={isAnimating ? 3 : 2}
        opacity={bgOpacity}
      />
      <text
        textAnchor="middle"
        y="-5"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        opacity={textOpacity}
      >
        {label}
      </text>
      {sublabel && (
        <text
          textAnchor="middle"
          y="12"
          fill="white"
          fontSize="9"
          opacity={textOpacity * 0.9}
        >
          {sublabel}
        </text>
      )}
    </g>
  )
}

interface GraphEdgeProps {
  x1: number
  y1: number
  x2: number
  y2: number
  isActive: boolean
  isAnimating?: boolean
  label?: string
  showArrow?: boolean
}

const GraphEdge: React.FC<GraphEdgeProps> = ({
  x1,
  y1,
  x2,
  y2,
  isActive,
  isAnimating = false,
  label,
  showArrow = false
}) => {
  const stroke = isAnimating ? '#f87171' : '#94a3b8'
  const opacity = isActive ? 0.8 : 0.2

  // Calculate midpoint for label
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // Calculate angle for arrow
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)

  // Shorten line to not overlap with nodes (offset by ~25px from end)
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const offsetRatio = 25 / length
  const adjustedX2 = x2 - (x2 - x1) * offsetRatio
  const adjustedY2 = y2 - (y2 - y1) * offsetRatio

  // Generate unique ID for this edge's marker
  const markerId = `arrow-${x1}-${y1}-${x2}-${y2}`.replace(/\./g, '-')

  return (
    <g style={{ transition: 'all 0.3s ease' }}>
      {/* Arrow marker definition */}
      {showArrow && (
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={stroke}
              opacity={opacity}
            />
          </marker>
        </defs>
      )}

      {/* Line */}
      <line
        x1={x1}
        y1={y1}
        x2={showArrow ? adjustedX2 : x2}
        y2={showArrow ? adjustedY2 : y2}
        stroke={stroke}
        strokeWidth={isAnimating ? 3 : 2}
        opacity={opacity}
        strokeDasharray={isAnimating ? '5,5' : 'none'}
        markerEnd={showArrow ? `url(#${markerId})` : undefined}
      />

      {/* Label */}
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-label.length * 3 - 4}
            y={-8}
            width={label.length * 6 + 8}
            height={14}
            rx={3}
            fill="white"
            opacity={isActive ? 0.95 : 0.5}
          />
          <text
            textAnchor="middle"
            y={3}
            fill={isAnimating ? '#ef4444' : '#64748b'}
            fontSize="8"
            fontWeight="500"
            opacity={isActive ? 1 : 0.5}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

type NodeKey = 'standard' | 'lc1' | 'lc2' | 'prereq1' | 'prereq2' | 'future1' | 'future2'

// Glossary definitions for knowledge graph elements
const glossaryData = {
  nodeTypes: [
    {
      name: 'Standard',
      color: '#6366f1',
      definition: 'Official learning objectives defined by states and governing bodies. In the CCSS (Common Core State Standards), these are the numbered codes like 3.NF.A.1 that specify what students should know and be able to do at each grade level.'
    },
    {
      name: 'Learning Component',
      color: '#a78bfa',
      definition: 'Granular, measurable skills that break down a standard into specific competencies. These represent the discrete knowledge and abilities a student needs to master the broader standard.'
    },
    {
      name: 'Prerequisite',
      color: '#fbbf24',
      definition: 'Earlier standards that provide foundational knowledge needed for the current standard. These represent prior learning that students should have mastered before tackling new content.'
    },
    {
      name: 'Builds To',
      color: '#34d399',
      definition: 'Future standards that build upon the current standard. These show the learning progression and where mastery of the current standard will lead students next.'
    },
    {
      name: 'Gap',
      color: '#f87171',
      definition: 'A learning component where the student has demonstrated a knowledge gap. This indicates a specific skill or concept that needs targeted intervention.'
    }
  ],
  relationshipTypes: [
    {
      name: 'buildsTowards',
      definition: 'Indicates that proficiency in one standard supports the likelihood of success in another. This relationship captures a directional progression in learning without requiring strict prerequisite order.'
    },
    {
      name: 'supports',
      definition: 'Links a learning component to the standard it helps achieve. This relationship shows which specific skills contribute to mastering a broader learning objective.'
    }
  ]
}

// Node detail information pulled from Learning Commons data
const nodeDetails: Record<NodeKey, {
  type: 'standard' | 'component' | 'prerequisite' | 'future'
  code?: string
  id?: string
  grade?: string
  subject: string
  description: string
  jurisdiction?: string
  identifier: string
}> = {
  standard: {
    type: 'standard',
    code: demoData.currentStandard.code,
    grade: demoData.currentStandard.grade,
    subject: 'Mathematics',
    description: demoData.currentStandard.description,
    jurisdiction: 'Multi-State (CCSS), but also mapped to all 50 states',
    identifier: demoData.currentStandard.identifier
  },
  lc1: {
    type: 'component',
    id: demoData.learningComponents[0].id,
    subject: 'Mathematics',
    description: demoData.learningComponents[0].description,
    identifier: demoData.learningComponents[0].identifier
  },
  lc2: {
    type: 'component',
    id: demoData.learningComponents[1].id,
    subject: 'Mathematics',
    description: demoData.learningComponents[1].description,
    identifier: demoData.learningComponents[1].identifier
  },
  prereq1: {
    type: 'prerequisite',
    code: demoData.prerequisites.find(p => p.isRoot)?.code || demoData.prerequisites[0].code,
    grade: demoData.prerequisites.find(p => p.isRoot)?.grade || demoData.prerequisites[0].grade,
    subject: 'Mathematics',
    description: demoData.prerequisites.find(p => p.isRoot)?.description || demoData.prerequisites[0].description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.prerequisites.find(p => p.isRoot)?.identifier || demoData.prerequisites[0].identifier
  },
  prereq2: {
    type: 'prerequisite',
    code: demoData.prerequisites.find(p => !p.isRoot)?.code || demoData.prerequisites[1]?.code,
    grade: demoData.prerequisites.find(p => !p.isRoot)?.grade || demoData.prerequisites[1]?.grade,
    subject: 'Mathematics',
    description: demoData.prerequisites.find(p => !p.isRoot)?.description || demoData.prerequisites[1]?.description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.prerequisites.find(p => !p.isRoot)?.identifier || demoData.prerequisites[1]?.identifier
  },
  future1: {
    type: 'future',
    code: demoData.buildsTo[0].code,
    grade: demoData.buildsTo[0].grade,
    subject: 'Mathematics',
    description: demoData.buildsTo[0].description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.buildsTo[0].identifier
  },
  future2: {
    type: 'future',
    code: demoData.buildsTo[1].code,
    grade: demoData.buildsTo[1].grade,
    subject: 'Mathematics',
    description: demoData.buildsTo[1].description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.buildsTo[1].identifier
  }
}

export default function KnowledgeGraphDemo() {
  const [step, setStep] = useState(0)
  const [selectedNode, setSelectedNode] = useState<NodeKey | null>(null)
  const [animatingNode, setAnimatingNode] = useState<string | null>(null)
  const [showGlossary, setShowGlossary] = useState(false)
  const [showNodeDetail, setShowNodeDetail] = useState<NodeKey | null>(null)

  const advanceStep = () => {
    if (step < steps.length - 1) {
      const nextStep = step + 1
      setStep(nextStep)

      // Trigger animations based on step
      if (nextStep === 2) {
        setAnimatingNode('standard')
        setTimeout(() => setAnimatingNode(null), 1000)
      } else if (nextStep === 3) {
        setAnimatingNode('lc1')
        setTimeout(() => {
          setAnimatingNode('lc2')
          setTimeout(() => setAnimatingNode(null), 500)
        }, 500)
      } else if (nextStep === 4) {
        setAnimatingNode('lc1-gap')
      } else if (nextStep === 5) {
        setAnimatingNode('prereq')
      }
    }
  }

  const reset = () => {
    setStep(0)
    setSelectedNode(null)
    setAnimatingNode(null)
  }

  const getNodeDescription = (node: NodeKey): { title: string; description: string } => {
    const descriptions: Record<NodeKey, { title: string; description: string }> = {
      standard: {
        title: 'Standard 3.NF.A.1 (Grade 3)',
        description: standardData.current.description
      },
      lc1: {
        title: 'Learning Component 1',
        description: standardData.learningComponents[1].description
      },
      lc2: {
        title: 'Learning Component 2',
        description: standardData.learningComponents[0].description
      },
      prereq1: {
        title: `Prerequisite ${standardData.prerequisites.find(p => p.isRoot)?.code || standardData.prerequisites[0].code} (Grade ${standardData.prerequisites.find(p => p.isRoot)?.grade || standardData.prerequisites[0].grade})`,
        description: standardData.prerequisites.find(p => p.isRoot)?.description || standardData.prerequisites[0].description
      },
      prereq2: {
        title: `Prerequisite ${standardData.prerequisites.find(p => !p.isRoot)?.code || standardData.prerequisites[1]?.code} (Grade ${standardData.prerequisites.find(p => !p.isRoot)?.grade || standardData.prerequisites[1]?.grade})`,
        description: standardData.prerequisites.find(p => !p.isRoot)?.description || standardData.prerequisites[1]?.description
      },
      future1: {
        title: `Builds To: ${standardData.buildsTo[0].code} (Grade ${standardData.buildsTo[0].grade})`,
        description: standardData.buildsTo[0].description
      },
      future2: {
        title: `Builds To: ${standardData.buildsTo[1].code} (Grade ${standardData.buildsTo[1].grade})`,
        description: standardData.buildsTo[1].description
      }
    }
    return descriptions[node]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Knowledge Graphs in Action</h1>
          <p className="text-slate-500">How structured knowledge enables intelligent diagnosis</p>
          <p className="text-xs text-slate-400 mt-1">
            Powered by CZI Learning Commons Knowledge Graph
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                i === step
                  ? 'bg-indigo-500 text-white shadow-md'
                  : i < step
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {i + 1}. {s.title}
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Assessment */}
          <div className="space-y-4">
            {/* Question Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-sm font-medium text-slate-500">Assessment Question</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-lg mb-4">Look at the shape below. What fraction is shaded?</p>
                <div className="flex justify-center mb-4">
                  <svg width="200" height="60" viewBox="0 0 200 60">
                    {/* Rectangle divided into 4 parts, 3 shaded */}
                    <rect x="10" y="10" width="40" height="40" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
                    <rect x="55" y="10" width="40" height="40" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
                    <rect x="100" y="10" width="40" height="40" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
                    <rect x="145" y="10" width="40" height="40" fill="transparent" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['1/4', '3/4', '3', '4/3'].map((opt) => (
                    <div
                      key={opt}
                      className={`p-2 rounded text-center text-sm ${
                        opt === '3' && step >= 1
                          ? 'bg-red-50 border-2 border-red-400 text-red-700'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {opt}
                      {opt === '3' && step >= 1 && (
                        <div className="text-xs text-red-500 mt-1">Student&apos;s answer</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Reasoning Panel */}
            {step >= 2 && (
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <span className="text-sm font-medium text-slate-500">
                    AI Reasoning (using Knowledge Graph)
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  {step >= 2 && (
                    <div className="flex gap-3 items-start animate-fadeIn">
                      <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
                        1
                      </div>
                      <div>
                        <p className="text-slate-700">
                          Standard identified:{' '}
                          <span className="text-indigo-600 font-mono">3.NF.A.1</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Understanding fractions as parts of a whole
                        </p>
                      </div>
                    </div>
                  )}
                  {step >= 3 && (
                    <div className="flex gap-3 items-start animate-fadeIn">
                      <div className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <div>
                        <p className="text-slate-700">Breaking into learning components...</p>
                        <ul className="text-slate-400 text-xs mt-1 space-y-1">
                          <li>• LC1: Identify 1/b as one part of b equal parts</li>
                          <li>• LC2: Identify a/b as a parts of size 1/b</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {step >= 4 && (
                    <div className="flex gap-3 items-start animate-fadeIn">
                      <div className="w-5 h-5 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-medium">
                        3
                      </div>
                      <div>
                        <p className="text-slate-700">
                          Gap identified:{' '}
                          <span className="text-red-500">LC1 - Understanding unit fractions</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Student counted shaded parts (3) but didn&apos;t express as fraction of whole
                        </p>
                      </div>
                    </div>
                  )}
                  {step >= 5 && (
                    <div className="flex gap-3 items-start animate-fadeIn">
                      <div className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-medium">
                        4
                      </div>
                      <div>
                        <p className="text-slate-700">
                          Root prerequisite:{' '}
                          <span className="text-amber-600 font-mono">2.G.A.3</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Partitioning shapes into equal shares and using fraction language
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Follow-up Question */}
            {step >= 6 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-600">
                    Targeted Follow-up (addresses root gap)
                  </span>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <p className="text-lg mb-3 text-slate-700">Let&apos;s think about this rectangle together.</p>
                  <div className="flex justify-center mb-3">
                    <svg width="200" height="60" viewBox="0 0 200 60">
                      <rect
                        x="10"
                        y="10"
                        width="180"
                        height="40"
                        fill="transparent"
                        stroke="#34d399"
                        strokeWidth="2"
                      />
                      <line
                        x1="55"
                        y1="10"
                        x2="55"
                        y2="50"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                      <line
                        x1="100"
                        y1="10"
                        x2="100"
                        y2="50"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                      <line
                        x1="145"
                        y1="10"
                        x2="145"
                        y2="50"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600 mb-2">This rectangle is divided into equal parts.</p>
                  <p className="text-emerald-600 font-medium">
                    How many equal parts make up the whole rectangle?
                  </p>
                  <p className="text-slate-400 text-xs mt-3 italic">
                    This question targets the prerequisite understanding: seeing the whole as
                    composed of equal parts before naming the fraction.
                  </p>
                </div>
              </div>
            )}

            {/* Contrast Box */}
            {step >= 6 && (
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Compare: Without knowledge graph</p>
                <div className="bg-white rounded p-3 text-sm text-slate-500 border border-slate-200">
                  &quot;That&apos;s incorrect. The answer is 3/4. Remember, a fraction shows parts of a
                  whole. 3 parts are shaded out of 4 total parts, so the fraction is 3/4.&quot;
                </div>
                <p className="text-xs text-slate-400 mt-2 italic">
                  Generic re-explanation doesn&apos;t address why the student answered &quot;3&quot; instead of
                  &quot;3/4&quot;
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Knowledge Graph Visualization */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium text-slate-500">Knowledge Graph View</span>
              </div>
              <button
                onClick={() => setShowGlossary(true)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                title="View glossary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </button>
            </div>

            <svg viewBox="0 0 400 420" className="w-full h-auto">
              {/* Edges */}
              {/* Prerequisites to Standard (buildsTowards) */}
              <GraphEdge
                x1={100}
                y1={90}
                x2={200}
                y2={150}
                isActive={step >= 5}
                isAnimating={step === 5}
                label="buildsTowards"
                showArrow={true}
              />
              <GraphEdge
                x1={300}
                y1={90}
                x2={200}
                y2={150}
                isActive={step >= 5}
                label="buildsTowards"
                showArrow={true}
              />

              {/* Standard to Learning Components (supports) */}
              <GraphEdge
                x1={60}
                y1={240}
                x2={200}
                y2={190}
                isActive={step >= 3}
                isAnimating={step === 3 || step === 4}
                label="supports"
                showArrow={true}
              />
              <GraphEdge
                x1={340}
                y1={240}
                x2={200}
                y2={190}
                isActive={step >= 3}
                label="supports"
                showArrow={true}
              />

              {/* Standard to Future (buildsTowards) */}
              <GraphEdge
                x1={200}
                y1={190}
                x2={100}
                y2={330}
                isActive={step >= 2}
                label="buildsTowards"
                showArrow={true}
              />
              <GraphEdge
                x1={200}
                y1={190}
                x2={300}
                y2={330}
                isActive={step >= 2}
                label="buildsTowards"
                showArrow={true}
              />

              {/* Prerequisite Nodes */}
              <GraphNode
                x={100}
                y={65}
                label={standardData.prerequisites.find(p => p.isRoot)?.code || standardData.prerequisites[0].code}
                sublabel="Partitioning shapes"
                type="prerequisite"
                isActive={step >= 5}
                isAnimating={animatingNode === 'prereq'}
                onClick={() => setShowNodeDetail('prereq1')}
              />
              <GraphNode
                x={300}
                y={65}
                label={standardData.prerequisites.find(p => !p.isRoot)?.code || standardData.prerequisites[1]?.code}
                sublabel="Measurement units"
                type="prerequisite"
                isActive={step >= 5}
                onClick={() => setShowNodeDetail('prereq2')}
              />

              {/* Main Standard Node */}
              <GraphNode
                x={200}
                y={165}
                label={standardData.current.code}
                sublabel="Fractions as parts"
                type="standard"
                isActive={step >= 2}
                isAnimating={animatingNode === 'standard'}
                onClick={() => setShowNodeDetail('standard')}
              />

              {/* Learning Component Nodes */}
              <GraphNode
                x={60}
                y={265}
                label={standardData.learningComponents[0]?.id || 'LC1'}
                sublabel="Unit fractions (1/b)"
                type="component"
                isActive={step >= 3}
                isGap={step >= 4}
                isAnimating={animatingNode === 'lc1' || animatingNode === 'lc1-gap'}
                onClick={() => setShowNodeDetail('lc1')}
              />
              <GraphNode
                x={340}
                y={265}
                label={standardData.learningComponents[1]?.id || 'LC2'}
                sublabel="Non-unit fractions (a/b)"
                type="component"
                isActive={step >= 3}
                isAnimating={animatingNode === 'lc2'}
                onClick={() => setShowNodeDetail('lc2')}
              />

              {/* Future Standards */}
              <GraphNode
                x={100}
                y={355}
                label={standardData.buildsTo[0].code}
                sublabel="Equivalent fractions"
                type="future"
                isActive={step >= 2}
                onClick={() => setShowNodeDetail('future1')}
              />
              <GraphNode
                x={300}
                y={355}
                label={standardData.buildsTo[1].code}
                sublabel="Fraction operations"
                type="future"
                isActive={step >= 2}
                onClick={() => setShowNodeDetail('future2')}
              />

              {/* Legend */}
              <g transform="translate(10, 410)">
                <rect x="0" y="-15" width="12" height="12" rx="2" fill="#fbbf24" />
                <text x="18" y="-5" fill="#64748b" fontSize="9">
                  Prerequisites
                </text>
                <rect x="85" y="-15" width="12" height="12" rx="2" fill="#6366f1" />
                <text x="103" y="-5" fill="#64748b" fontSize="9">
                  Standard
                </text>
                <rect x="155" y="-15" width="12" height="12" rx="2" fill="#a78bfa" />
                <text x="173" y="-5" fill="#64748b" fontSize="9">
                  Components
                </text>
                <rect x="245" y="-15" width="12" height="12" rx="2" fill="#f87171" />
                <text x="263" y="-5" fill="#64748b" fontSize="9">
                  Gap
                </text>
                <rect x="295" y="-15" width="12" height="12" rx="2" fill="#34d399" />
                <text x="313" y="-5" fill="#64748b" fontSize="9">
                  Builds to
                </text>
              </g>
            </svg>

            {/* Hint to click nodes */}
            <p className="mt-3 text-xs text-slate-400 text-center">Click any node to view details</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={reset}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            Reset Demo
          </button>
          <button
            onClick={advanceStep}
            disabled={step >= steps.length - 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              step >= steps.length - 1
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md'
            }`}
          >
            {step >= steps.length - 1 ? 'Demo Complete' : 'Next Step →'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>This demo uses real data from the <a href="https://github.com/learning-commons-org/knowledge-graph" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline">CZI Learning Commons Knowledge Graph</a> v1.2.0</p>
          <p className="text-xs mt-1 text-slate-400">
            {demoData.metadata.attribution}
          </p>
        </div>
      </div>

      {/* Glossary Modal */}
      {showGlossary && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowGlossary(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Knowledge Graph Glossary</h2>
              <button
                onClick={() => setShowGlossary(false)}
                className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Node Types */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Node Types</h3>
                <div className="space-y-4">
                  {glossaryData.nodeTypes.map((item) => (
                    <div key={item.name} className="flex gap-3">
                      <div
                        className="w-3 h-3 rounded mt-1 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <p className="font-medium text-slate-700">{item.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{item.definition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationship Types */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Relationship Types</h3>
                <div className="space-y-4">
                  {glossaryData.relationshipTypes.map((item) => (
                    <div key={item.name} className="flex gap-3">
                      <div className="text-slate-400 mt-0.5 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 font-mono text-sm">{item.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{item.definition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-400 text-center">
                Data from <a href="https://github.com/learning-commons-org/knowledge-graph" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600">CZI Learning Commons</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Node Detail Modal */}
      {showNodeDetail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowNodeDetail(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor:
                      nodeDetails[showNodeDetail].type === 'standard' ? '#6366f1' :
                      nodeDetails[showNodeDetail].type === 'component' ? '#a78bfa' :
                      nodeDetails[showNodeDetail].type === 'prerequisite' ? '#fbbf24' :
                      '#34d399'
                  }}
                ></div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {nodeDetails[showNodeDetail].type === 'component'
                    ? `Learning Component ${nodeDetails[showNodeDetail].id}`
                    : nodeDetails[showNodeDetail].code}
                </h2>
              </div>
              <button
                onClick={() => setShowNodeDetail(null)}
                className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  {nodeDetails[showNodeDetail].code && (
                    <tr>
                      <td className="py-3 pr-4 text-sm font-medium text-slate-600 w-28">Code</td>
                      <td className="py-3 text-sm text-slate-800">{nodeDetails[showNodeDetail].code}</td>
                    </tr>
                  )}
                  {nodeDetails[showNodeDetail].id && (
                    <tr>
                      <td className="py-3 pr-4 text-sm font-medium text-slate-600 w-28">ID</td>
                      <td className="py-3 text-sm text-slate-800">{nodeDetails[showNodeDetail].id}</td>
                    </tr>
                  )}
                  {nodeDetails[showNodeDetail].grade && (
                    <tr>
                      <td className="py-3 pr-4 text-sm font-medium text-slate-600 w-28">Grade</td>
                      <td className="py-3 text-sm text-slate-800">{nodeDetails[showNodeDetail].grade}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 pr-4 text-sm font-medium text-slate-600 w-28">Subject</td>
                    <td className="py-3 text-sm text-slate-800">{nodeDetails[showNodeDetail].subject}</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-medium text-slate-600 w-28 align-top">Description</td>
                    <td className="py-3 text-sm text-slate-800">{nodeDetails[showNodeDetail].description}</td>
                  </tr>
                  {nodeDetails[showNodeDetail].jurisdiction && (
                    <tr>
                      <td className="py-3 pr-4 text-sm font-medium text-slate-600 w-28">Jurisdiction</td>
                      <td className="py-3 text-sm text-slate-800">{nodeDetails[showNodeDetail].jurisdiction}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-400 text-center">
                Source: <a href="https://github.com/learning-commons-org/knowledge-graph" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600">CZI Learning Commons Knowledge Graph</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
