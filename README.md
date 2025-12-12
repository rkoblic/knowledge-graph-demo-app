# Knowledge Graphs in Action

An interactive demo showing how knowledge graphs power adaptive learning and assessment. Built for presentations to higher ed faculty on the future of AI-enabled learning.

## What This Demonstrates

This demo walks through a realistic scenario where a student answers a fraction question incorrectly. Instead of just marking it wrong, the system uses the CZI Learning Commons Knowledge Graph to:

1. **Identify the standard** being assessed (3.NF.A.1)
2. **Break it into learning components** (granular skills)
3. **Pinpoint the specific gap** in the student's understanding
4. **Trace back to prerequisites** to find the root cause
5. **Generate a targeted follow-up** that addresses the actual gap

The contrast panel shows what a "dumb" AI would do — just re-explain the answer without diagnosing why the student got it wrong.

## Features

### Interactive Knowledge Graph Visualization
- **Draggable nodes** - Reposition nodes by dragging them around the canvas
- **Zoomable canvas** - Use mouse wheel or controls to zoom in/out
- **Clickable nodes** - Click any node to view detailed information from the Learning Commons data source
- **Learning Component nodes** - All standards display their associated LCs as connected nodes
- **Path tracing** - Visual trace from root prerequisite LC through standards to identified gap
- **Labeled relationships** - Edge labels show relationship types (`buildsTowards`, `supports`) with directional arrows
- **Color-coded elements**:
  - Indigo: Standards (current)
  - Violet: Learning Components
  - Amber: Prerequisites
  - Emerald: Future standards (builds to)
  - Red: Identified gaps and trace path
  - Orange: Nodes along the prerequisite trace path

### Glossary Modal
Click the (?) icon in the Knowledge Graph View to see definitions for:
- All node types (Standard, Learning Component, Prerequisite, etc.)
- Relationship types and what they mean

### Wrong Answer Diagnosis
The demo supports three different wrong answers, each revealing a different misconception:

| Answer | Misconception | Root Prerequisite |
|--------|--------------|-------------------|
| **3** | Counted parts but didn't form fraction | 2.G.A.3-LC4: Describing wholes by parts |
| **1/4** | Selected unshaded portion (figure-ground) | 3.NF.A.1-LC2: Identifying unit fractions |
| **4/3** | Inverted numerator/denominator | 1.G.A.3-LC4: Describing wholes as fourths |

Each scenario includes:
- Specific gap identification in the learning components
- Path trace back to the root prerequisite
- Targeted follow-up intervention (accessibility-aware visuals)

### Step-by-Step Demo Flow
Progress through 6 stages showing how AI reasoning works with knowledge graphs:
1. Assessment & Student Response
2. Standard Identification
3. Learning Components
4. Gap Analysis
5. Prerequisite Trace
6. Targeted Intervention

## Data Source

This demo uses **real data** from the **CZI Learning Commons Knowledge Graph v1.2.0**, including:
- Common Core State Standards for Mathematics (Multi-State)
- Learning components that break standards into precise skills
- Learning progressions showing prerequisite relationships (`buildsTowards`)
- Standard-to-component mappings (`supports`)

Data is extracted and stored locally in `src/data/demo-data.json`.

Learn more: [Learning Commons GitHub](https://github.com/learning-commons-org/knowledge-graph)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the demo.

### Regenerate Data from Learning Commons

To refresh the demo data from the Learning Commons Knowledge Graph:

```bash
# Download raw data files (requires ~450MB)
# Files are downloaded to /data directory

# Run extraction script
node scripts/extract-math-data.js
```

This generates `src/data/demo-data.json` with the relevant standards, learning components, and relationships.

### Deploy to Vercel

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Deploy (no configuration needed)

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind + custom animations
│   │   ├── layout.tsx       # Root layout with metadata
│   │   └── page.tsx         # Main demo component
│   ├── components/
│   │   ├── KnowledgeGraph.tsx   # React Flow graph visualization
│   │   └── CustomNodes.tsx      # Node components (Standard, LC, etc.)
│   ├── utils/
│   │   └── layoutGraph.ts       # d3-force layout algorithm
│   └── data/
│       └── demo-data.json   # Extracted Learning Commons data
├── scripts/
│   └── extract-math-data.js # Data extraction script
├── data/                    # Raw Knowledge Graph files (gitignored)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Customization Ideas

- Add more misconception scenarios (different math topics)
- Connect to live Learning Commons API (coming early 2026)
- Add presenter notes / narration mode
- Create printable handout version
- Add state/jurisdiction selector to show different standards
- Expand to other subjects (ELA, Science)

## Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Flow (@xyflow/react)** - Interactive graph visualization
- **d3-force** - Force-directed graph layout
- **Vercel** - Deployment

## Credits

- Knowledge graph data: [CZI Learning Commons](https://github.com/learning-commons-org/knowledge-graph) (CC BY-4.0)
- Standards: Common Core State Standards for Mathematics
- Learning Components: Achievement Network

## License

MIT
