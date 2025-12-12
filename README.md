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

## Data Source

This demo uses real data from the **CZI Learning Commons Knowledge Graph**, including:
- Common Core State Standards for Mathematics
- Learning components that break standards into precise skills
- Learning progressions showing prerequisite relationships

Learn more: [learningcommons.org](https://learningcommons.org)

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
│   └── app/
│       ├── globals.css      # Tailwind + custom animations
│       ├── layout.tsx       # Root layout with metadata
│       └── page.tsx         # Main demo component
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Customization Ideas

- Add more misconception scenarios (different math topics)
- Connect to live Learning Commons API for real-time data
- Add presenter notes / narration mode
- Create printable handout version
- Add state/jurisdiction selector to show different standards

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel** - Deployment

## Credits

- Knowledge graph data: [CZI Learning Commons](https://learningcommons.org)
- Standards: Common Core State Standards for Mathematics
- Built for Matter & Space / The Design Lab

## License

MIT
