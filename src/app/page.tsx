'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import demoData from '../data/demo-data.json'

// Dynamic import to avoid SSR issues with React Flow
const KnowledgeGraph = dynamic(() => import('../components/KnowledgeGraph'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50">
      <div className="text-slate-400">Loading graph...</div>
    </div>
  ),
})

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

type NodeKey = 'standard' | 'lc1' | 'lc2' | 'prereq1' | 'prereq2' | 'prereq3' | 'future1' | 'future2'
type WrongAnswer = '3' | '1/4' | '4/3'

// Wrong answer scenarios - each wrong answer reveals a different misconception
const wrongAnswerScenarios: Record<WrongAnswer, {
  gapLC: 'LC1' | 'LC2'
  gapDescription: string
  gapExplanation: string
  rootPrerequisite: {
    code: string
    lcId: string
    lcDescription: string
  }
  followUpPrompt: string
  followUpTargetSkill: string
}> = {
  '3': {
    gapLC: 'LC1',
    gapDescription: '3.NF.A.1-LC1 — Understanding unit fractions',
    gapExplanation: "Student counted shaded parts (3) but didn't express as fraction of whole",
    rootPrerequisite: {
      code: '2.G.A.3',
      lcId: 'LC4',
      lcDescription: 'Describe a whole based on its number of parts'
    },
    followUpPrompt: 'This rectangle is divided into equal parts. How many equal parts make up the whole rectangle?',
    followUpTargetSkill: 'Recognizing the whole as composed of equal parts'
  },
  '1/4': {
    gapLC: 'LC2',
    gapDescription: '3.NF.A.1-LC2 — Non-unit fractions (a/b)',
    gapExplanation: 'Student selected the fraction representing the unshaded part — possible misread or figure-ground confusion',
    rootPrerequisite: {
      code: '3.NF.A.1',
      lcId: 'LC2',
      lcDescription: 'Identify a fraction 1/b as one part of a partitioned whole'
    },
    followUpPrompt: 'Point to the part that shows 1/4. Now count: how many fourths are shaded in total?',
    followUpTargetSkill: 'Distinguishing unit vs non-unit fractions'
  },
  '4/3': {
    gapLC: 'LC1',
    gapDescription: '3.NF.A.1-LC1 — Weak grasp that denominator = "parts that make the whole"',
    gapExplanation: "Student knows it's a fraction but inverted numerator/denominator — doesn't connect 'fourths' to denominator",
    rootPrerequisite: {
      code: '1.G.A.3',
      lcId: 'LC4',
      lcDescription: 'Describe a whole as four quarters or four fourths'
    },
    followUpPrompt: "Let's name the parts. The rectangle is cut into 4 equal pieces. What do we call each piece? If I shade three pieces, how many fourths have I shaded?",
    followUpTargetSkill: 'Connecting "fourths" terminology to denominator'
  }
}

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
    code: demoData.prerequisites[0].code, // 2.G.A.3
    grade: demoData.prerequisites[0].grade,
    subject: 'Mathematics',
    description: demoData.prerequisites[0].description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.prerequisites[0].identifier
  },
  prereq2: {
    type: 'prerequisite',
    code: demoData.prerequisites[1].code, // 1.G.A.3
    grade: demoData.prerequisites[1].grade,
    subject: 'Mathematics',
    description: demoData.prerequisites[1].description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.prerequisites[1].identifier
  },
  prereq3: {
    type: 'prerequisite',
    code: demoData.prerequisites[2].code, // 2.MD.A.2
    grade: demoData.prerequisites[2].grade,
    subject: 'Mathematics',
    description: demoData.prerequisites[2].description,
    jurisdiction: 'Multi-State (CCSS)',
    identifier: demoData.prerequisites[2].identifier
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

// Follow-up visual component - shows different SVGs based on the misconception
const FollowUpVisual: React.FC<{ answerType: WrongAnswer }> = ({ answerType }) => {
  if (answerType === '3') {
    // Rectangle with dashed partitions - focuses on counting equal parts
    return (
      <svg width="200" height="60" viewBox="0 0 200 60">
        <rect x="10" y="10" width="180" height="40" fill="transparent" stroke="#34d399" strokeWidth="2" />
        <line x1="55" y1="10" x2="55" y2="50" stroke="#34d399" strokeWidth="2" strokeDasharray="4,2" />
        <line x1="100" y1="10" x2="100" y2="50" stroke="#34d399" strokeWidth="2" strokeDasharray="4,2" />
        <line x1="145" y1="10" x2="145" y2="50" stroke="#34d399" strokeWidth="2" strokeDasharray="4,2" />
      </svg>
    )
  }

  if (answerType === '1/4') {
    // Visual highlighting the 1/4 (unshaded) vs counting shaded fourths
    return (
      <svg width="200" height="100" viewBox="0 0 200 100">
        {/* Rectangles */}
        <rect x="10" y="20" width="40" height="40" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
        <rect x="55" y="20" width="40" height="40" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
        <rect x="100" y="20" width="40" height="40" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
        <rect x="145" y="20" width="40" height="40" fill="transparent" stroke="#ef4444" strokeWidth="3" strokeDasharray="4,2" />
        {/* Arrow pointing to unshaded part */}
        <text x="165" y="12" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">← This is 1/4</text>
        {/* Labels under shaded parts */}
        <text x="30" y="75" fill="#34d399" fontSize="9" textAnchor="middle">1/4</text>
        <text x="75" y="75" fill="#34d399" fontSize="9" textAnchor="middle">1/4</text>
        <text x="120" y="75" fill="#34d399" fontSize="9" textAnchor="middle">1/4</text>
        {/* Bottom instruction */}
        <text x="100" y="92" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">How many fourths are shaded?</text>
      </svg>
    )
  }

  if (answerType === '4/3') {
    // Visual emphasizing "fourths" terminology
    return (
      <svg width="220" height="110" viewBox="0 0 220 110">
        {/* Original shape with labels */}
        <rect x="10" y="10" width="40" height="35" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
        <rect x="55" y="10" width="40" height="35" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
        <rect x="100" y="10" width="40" height="35" fill="#818cf8" stroke="#6366f1" strokeWidth="2" />
        <rect x="145" y="10" width="40" height="35" fill="transparent" stroke="#6366f1" strokeWidth="2" />
        {/* Labels under each piece */}
        <text x="30" y="60" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">1 fourth</text>
        <text x="75" y="60" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">1 fourth</text>
        <text x="120" y="60" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">1 fourth</text>
        <text x="165" y="60" fill="#94a3b8" fontSize="9" textAnchor="middle">1 fourth</text>
        {/* Bottom text */}
        <text x="110" y="80" fill="#64748b" fontSize="10" textAnchor="middle">4 equal pieces = 4 fourths</text>
        <text x="110" y="95" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">3 shaded = 3 fourths = 3/4</text>
      </svg>
    )
  }

  return null
}

export default function KnowledgeGraphDemo() {
  const [step, setStep] = useState(0)
  const [selectedNode, setSelectedNode] = useState<NodeKey | null>(null)
  const [animatingNode, setAnimatingNode] = useState<string | null>(null)
  const [showGlossary, setShowGlossary] = useState(false)
  const [showNodeDetail, setShowNodeDetail] = useState<NodeKey | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<WrongAnswer | null>(null)

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
        // Animate the gap LC based on selected answer
        if (selectedAnswer && wrongAnswerScenarios[selectedAnswer].gapLC === 'LC2') {
          setAnimatingNode('lc2-gap')
        } else {
          setAnimatingNode('lc1-gap')
        }
      } else if (nextStep === 5) {
        setAnimatingNode('prereq')
      }
    }
  }

  const reset = () => {
    setStep(0)
    setSelectedNode(null)
    setAnimatingNode(null)
    setSelectedAnswer(null)
  }

  const getNodeDescription = (node: NodeKey): { title: string; description: string } => {
    const descriptions: Record<NodeKey, { title: string; description: string }> = {
      standard: {
        title: 'Standard 3.NF.A.1 (Grade 3)',
        description: standardData.current.description
      },
      lc1: {
        title: 'Learning Component 1',
        description: standardData.learningComponents[0].description
      },
      lc2: {
        title: 'Learning Component 2',
        description: standardData.learningComponents[1].description
      },
      prereq1: {
        title: `Prerequisite 2.G.A.3 (Grade 2)`,
        description: standardData.prerequisites[0].description
      },
      prereq2: {
        title: `Prerequisite 1.G.A.3 (Grade 1)`,
        description: standardData.prerequisites[1].description
      },
      prereq3: {
        title: `Prerequisite 2.MD.A.2 (Grade 2)`,
        description: standardData.prerequisites[2].description
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
                  {['1/4', '3/4', '3', '4/3'].map((opt) => {
                    const isCorrectAnswer = opt === '3/4'
                    const isWrongAnswer = opt !== '3/4'
                    const isSelected = selectedAnswer === opt
                    const canSelect = isWrongAnswer && step <= 1

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (canSelect) {
                            setSelectedAnswer(opt as WrongAnswer)
                            if (step === 0) {
                              setStep(1)
                            }
                          }
                        }}
                        disabled={!canSelect}
                        className={`p-2 rounded text-center text-sm transition-all ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-400 text-red-700 shadow-sm'
                            : isCorrectAnswer
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                            : canSelect
                            ? 'bg-white border border-slate-300 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
                            : 'bg-white border border-slate-300 text-slate-600'
                        }`}
                      >
                        {opt}
                        {isCorrectAnswer && (
                          <div className="text-xs text-emerald-500 mt-1">Correct</div>
                        )}
                        {isSelected && step >= 1 && (
                          <div className="text-xs text-red-500 mt-1">Student&apos;s answer</div>
                        )}
                      </button>
                    )
                  })}
                </div>
                {step === 0 && !selectedAnswer && (
                  <p className="text-xs text-indigo-500 mt-3 text-center animate-pulse">
                    Click a wrong answer to see how the knowledge graph diagnoses the misconception
                  </p>
                )}
              </div>
            </div>

            {/* AI Reasoning Panel */}
            {step >= 2 && selectedAnswer && (
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
                          <li className={wrongAnswerScenarios[selectedAnswer].gapLC === 'LC1' ? 'text-red-400 font-medium' : ''}>
                            • LC1: Identify 1/b as one part of b equal parts
                          </li>
                          <li className={wrongAnswerScenarios[selectedAnswer].gapLC === 'LC2' ? 'text-red-400 font-medium' : ''}>
                            • LC2: Identify a/b as a parts of size 1/b
                          </li>
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
                          <span className="text-red-500">{wrongAnswerScenarios[selectedAnswer].gapDescription}</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          {wrongAnswerScenarios[selectedAnswer].gapExplanation}
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
                          <span className="text-amber-600 font-mono">
                            {wrongAnswerScenarios[selectedAnswer].rootPrerequisite.code}-{wrongAnswerScenarios[selectedAnswer].rootPrerequisite.lcId}
                          </span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          {wrongAnswerScenarios[selectedAnswer].rootPrerequisite.lcDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Follow-up Question */}
            {step >= 6 && selectedAnswer && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-600">
                    Targeted Follow-up (addresses root gap)
                  </span>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <p className="text-lg mb-3 text-slate-700">Let&apos;s think about this together.</p>
                  <div className="flex justify-center mb-3">
                    <FollowUpVisual answerType={selectedAnswer} />
                  </div>
                  <p className="text-emerald-600 font-medium">
                    {wrongAnswerScenarios[selectedAnswer].followUpPrompt}
                  </p>
                  <p className="text-slate-400 text-xs mt-3 italic">
                    This question targets: {wrongAnswerScenarios[selectedAnswer].followUpTargetSkill}
                  </p>
                </div>
              </div>
            )}

            {/* Contrast Box */}
            {step >= 6 && selectedAnswer && (
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Compare: Without knowledge graph</p>
                <div className="bg-white rounded p-3 text-sm text-slate-500 border border-slate-200">
                  &quot;That&apos;s incorrect. The answer is 3/4. Remember, a fraction shows parts of a
                  whole. 3 parts are shaded out of 4 total parts, so the fraction is 3/4.&quot;
                </div>
                <p className="text-xs text-slate-400 mt-2 italic">
                  Generic re-explanation doesn&apos;t address why the student answered &quot;{selectedAnswer}&quot; instead of
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

            <KnowledgeGraph
              step={step}
              selectedAnswer={selectedAnswer}
              animatingNode={animatingNode}
              onNodeClick={(nodeId) => setShowNodeDetail(nodeId)}
              wrongAnswerScenarios={wrongAnswerScenarios}
            />

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#fbbf24]"></div>
                <span>Prerequisites</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#6366f1]"></div>
                <span>Standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#a78bfa]"></div>
                <span>Components</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#f87171]"></div>
                <span>Gap</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#34d399]"></div>
                <span>Builds to</span>
              </div>
            </div>

            {/* Hint */}
            <p className="mt-2 text-xs text-slate-400 text-center">
              Drag nodes to reposition. Scroll to zoom. Drag canvas to pan.
            </p>
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
