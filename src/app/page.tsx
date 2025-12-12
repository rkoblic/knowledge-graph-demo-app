'use client'

import React, { useState } from 'react'

// Real data from CZI Learning Commons Knowledge Graph
const standardData = {
  current: {
    code: "3.NF.A.1",
    description: "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts; understand a fraction a/b as the quantity formed by a parts of size 1/b.",
    grade: "3"
  },
  learningComponents: [
    {
      id: "LC1",
      description: "Identify a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into equal parts (where b is 2, 3, 4, 6, or 8)",
      isGap: true
    },
    {
      id: "LC2",
      description: "Identify a fraction a/b as the quantity formed by a parts of size 1/b (where b is 2, 3, 4, 6, or 8)",
      isGap: false
    }
  ],
  prerequisites: [
    {
      code: "2.G.A.3",
      description: "Partition circles and rectangles into two, three, or four equal shares, describe the shares using the words halves, thirds, half of, a third of, etc.",
      grade: "2",
      isRoot: true
    },
    {
      code: "2.MD.A.2",
      description: "Measure the length of an object twice, using length units of different lengths; describe how the two measurements relate to the size of the unit chosen.",
      grade: "2",
      isRoot: false
    }
  ],
  buildsTo: [
    {
      code: "3.NF.A.3",
      description: "Explain equivalence of fractions and compare fractions by reasoning about their size.",
      grade: "3"
    },
    {
      code: "4.NF.B.3.a",
      description: "Understand addition and subtraction of fractions as joining and separating parts referring to the same whole.",
      grade: "4"
    }
  ]
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
  const opacity = isActive ? 1 : 0.3
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
        opacity={opacity}
      />
      <text
        textAnchor="middle"
        y="-5"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        opacity={opacity}
      >
        {label}
      </text>
      {sublabel && (
        <text
          textAnchor="middle"
          y="12"
          fill="white"
          fontSize="9"
          opacity={opacity * 0.9}
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
}

const GraphEdge: React.FC<GraphEdgeProps> = ({
  x1,
  y1,
  x2,
  y2,
  isActive,
  isAnimating = false
}) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={isAnimating ? '#f87171' : '#cbd5e1'}
    strokeWidth={isAnimating ? 3 : 2}
    opacity={isActive ? 0.8 : 0.2}
    strokeDasharray={isAnimating ? '5,5' : 'none'}
    style={{ transition: 'all 0.3s ease' }}
  />
)

type NodeKey = 'standard' | 'lc1' | 'lc2' | 'prereq1' | 'prereq2' | 'future1' | 'future2'

export default function KnowledgeGraphDemo() {
  const [step, setStep] = useState(0)
  const [selectedNode, setSelectedNode] = useState<NodeKey | null>(null)
  const [animatingNode, setAnimatingNode] = useState<string | null>(null)

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
        title: 'Prerequisite 2.G.A.3 (Grade 2)',
        description: standardData.prerequisites[0].description
      },
      prereq2: {
        title: 'Prerequisite 2.MD.A.2 (Grade 2)',
        description: standardData.prerequisites[1].description
      },
      future1: {
        title: 'Builds To: 3.NF.A.3 (Grade 3)',
        description: standardData.buildsTo[0].description
      },
      future2: {
        title: 'Builds To: 4.NF.B.3.a (Grade 4)',
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
                        opt === '3'
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-500">Knowledge Graph View</span>
            </div>

            <svg viewBox="0 0 400 380" className="w-full h-auto">
              {/* Edges */}
              {/* Prerequisites to Standard */}
              <GraphEdge
                x1={100}
                y1={90}
                x2={200}
                y2={150}
                isActive={step >= 5}
                isAnimating={step === 5}
              />
              <GraphEdge x1={300} y1={90} x2={200} y2={150} isActive={step >= 5} />

              {/* Standard to Learning Components */}
              <GraphEdge
                x1={200}
                y1={190}
                x2={120}
                y2={240}
                isActive={step >= 3}
                isAnimating={step === 3 || step === 4}
              />
              <GraphEdge x1={200} y1={190} x2={280} y2={240} isActive={step >= 3} />

              {/* Standard to Future */}
              <GraphEdge x1={200} y1={190} x2={100} y2={330} isActive={step >= 2} />
              <GraphEdge x1={200} y1={190} x2={300} y2={330} isActive={step >= 2} />

              {/* Prerequisite Nodes */}
              <GraphNode
                x={100}
                y={65}
                label="2.G.A.3"
                sublabel="Partitioning shapes"
                type="prerequisite"
                isActive={step >= 5}
                isAnimating={animatingNode === 'prereq'}
                onClick={() => setSelectedNode('prereq1')}
              />
              <GraphNode
                x={300}
                y={65}
                label="2.MD.A.2"
                sublabel="Measurement units"
                type="prerequisite"
                isActive={step >= 5}
                onClick={() => setSelectedNode('prereq2')}
              />

              {/* Main Standard Node */}
              <GraphNode
                x={200}
                y={165}
                label="3.NF.A.1"
                sublabel="Fractions as parts"
                type="standard"
                isActive={step >= 2}
                isAnimating={animatingNode === 'standard'}
                onClick={() => setSelectedNode('standard')}
              />

              {/* Learning Component Nodes */}
              <GraphNode
                x={120}
                y={265}
                label="LC1"
                sublabel="Unit fractions (1/b)"
                type="component"
                isActive={step >= 3}
                isGap={step >= 4}
                isAnimating={animatingNode === 'lc1' || animatingNode === 'lc1-gap'}
                onClick={() => setSelectedNode('lc1')}
              />
              <GraphNode
                x={280}
                y={265}
                label="LC2"
                sublabel="Non-unit fractions (a/b)"
                type="component"
                isActive={step >= 3}
                isAnimating={animatingNode === 'lc2'}
                onClick={() => setSelectedNode('lc2')}
              />

              {/* Future Standards */}
              <GraphNode
                x={100}
                y={355}
                label="3.NF.A.3"
                sublabel="Equivalent fractions"
                type="future"
                isActive={step >= 2}
                onClick={() => setSelectedNode('future1')}
              />
              <GraphNode
                x={300}
                y={355}
                label="4.NF.B.3.a"
                sublabel="Fraction operations"
                type="future"
                isActive={step >= 2}
                onClick={() => setSelectedNode('future2')}
              />

              {/* Legend */}
              <g transform="translate(10, 380)">
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

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm border border-slate-200">
                <p className="text-slate-500 mb-1">{getNodeDescription(selectedNode).title}</p>
                <p className="text-slate-700">{getNodeDescription(selectedNode).description}</p>
              </div>
            )}
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
          <p>This demo uses real data from the CZI Learning Commons Knowledge Graph</p>
          <p className="text-xs mt-1 text-slate-400">
            Standards, learning components, and progressions are from the Common Core State
            Standards for Mathematics
          </p>
        </div>
      </div>
    </div>
  )
}
