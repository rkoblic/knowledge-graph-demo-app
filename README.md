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
- **Clickable nodes** - Click any node to view detailed information from the Learning Commons data source
- **Labeled relationships** - Edge labels show relationship types (`buildsTowards`, `supports`) with directional arrows
- **Color-coded elements**:
  - Indigo: Standards
  - Purple: Learning Components
  - Yellow: Prerequisites
  - Green: Builds To (future standards)
  - Red: Identified gaps

### Glossary Modal
Click the (?) icon in the Knowledge Graph View to see definitions for:
- All node types (Standard, Learning Component, Prerequisite, etc.)
- Relationship types and what they mean

### Step-by-Step Demo Flow
Progress through 7 stages showing how AI reasoning works with knowledge graphs:
1. Assessment Question
2. Student Response
3. Standard Identification
4. Learning Components
5. Gap Analysis
6. Prerequisite Trace
7. Targeted Intervention

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
- **Vercel** - Deployment

## Credits

- Knowledge graph data: [CZI Learning Commons](https://github.com/learning-commons-org/knowledge-graph) (CC BY-4.0)
- Standards: Common Core State Standards for Mathematics
- Learning Components: Achievement Network

## License

MIT
