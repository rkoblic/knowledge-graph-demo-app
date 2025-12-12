const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dataDir = path.join(__dirname, '..', 'data');
const outputDir = path.join(__dirname, '..', 'src', 'data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processJsonLines(filename, filter) {
  const filepath = path.join(dataDir, filename);
  const results = [];

  const fileStream = fs.createReadStream(filepath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const obj = JSON.parse(line);
        if (filter(obj)) {
          results.push(obj);
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  return results;
}

async function main() {
  console.log('Extracting math standards data for demo...\n');

  // CCSS 3.NF.A.1 UUID
  const ccss3NFA1UUID = '6b9bf846-d7cc-11e8-824f-0242ac160002';

  // Find the main standard
  console.log('Finding CCSS 3.NF.A.1 standard...');
  const standards = await processJsonLines(
    'StandardsFrameworkItem.json',
    (item) => item.caseIdentifierUUID === ccss3NFA1UUID
  );
  const currentStandard = standards[0];
  console.log(`Found: ${currentStandard.statementCode} - ${currentStandard.description.slice(0, 50)}...`);

  // Find relationships for this standard
  console.log('\nFinding relationships...');
  const allRelationships = await processJsonLines(
    'Relationships.json',
    (item) =>
      item.sourceEntityValue === ccss3NFA1UUID ||
      item.targetEntityValue === ccss3NFA1UUID
  );
  console.log(`Found ${allRelationships.length} relationships`);

  // Categorize relationships
  const supportsRelationships = allRelationships.filter(r =>
    r.relationshipType === 'supports' && r.targetEntityValue === ccss3NFA1UUID
  );
  const prerequisiteRelationships = allRelationships.filter(r =>
    r.relationshipType === 'buildsTowards' && r.targetEntityValue === ccss3NFA1UUID
  );
  const buildsToRelationships = allRelationships.filter(r =>
    r.relationshipType === 'buildsTowards' && r.sourceEntityValue === ccss3NFA1UUID
  );

  console.log(`  - supports (LC -> Standard): ${supportsRelationships.length}`);
  console.log(`  - prerequisite (Standard -> 3.NF.A.1): ${prerequisiteRelationships.length}`);
  console.log(`  - buildsTo (3.NF.A.1 -> Standard): ${buildsToRelationships.length}`);

  // Get learning component IDs
  const lcIds = new Set(supportsRelationships.map(r => r.sourceEntityValue));

  // Get prerequisite and buildsTo standard IDs
  const prereqIds = new Set(prerequisiteRelationships.map(r => r.sourceEntityValue));
  const buildsToIds = new Set(buildsToRelationships.map(r => r.targetEntityValue));

  // Find learning components
  console.log('\nFinding learning components...');
  const learningComponents = await processJsonLines(
    'LearningComponent.json',
    (item) => lcIds.has(item.identifier)
  );
  console.log(`Found ${learningComponents.length} learning components:`);
  learningComponents.forEach(lc => console.log(`  - ${lc.description.slice(0, 60)}...`));

  // Find prerequisite standards
  console.log('\nFinding prerequisite standards...');
  const prereqStandards = await processJsonLines(
    'StandardsFrameworkItem.json',
    (item) => prereqIds.has(item.caseIdentifierUUID) && item.jurisdiction === 'Multi-State'
  );
  console.log(`Found ${prereqStandards.length} prerequisites:`);
  prereqStandards.forEach(s => console.log(`  - ${s.statementCode}: ${s.description.slice(0, 50)}...`));

  // Find buildsTo standards
  console.log('\nFinding buildsTo standards...');
  const buildsToStandards = await processJsonLines(
    'StandardsFrameworkItem.json',
    (item) => buildsToIds.has(item.caseIdentifierUUID) && item.jurisdiction === 'Multi-State'
  );
  console.log(`Found ${buildsToStandards.length} buildsTo standards:`);
  buildsToStandards.forEach(s => console.log(`  - ${s.statementCode}: ${s.description.slice(0, 50)}...`));

  // Create demo data
  const demoData = {
    currentStandard: {
      code: currentStandard.statementCode,
      description: cleanDescription(currentStandard.description),
      grade: currentStandard.gradeLevel[0],
      jurisdiction: currentStandard.jurisdiction,
      identifier: currentStandard.identifier,
      caseIdentifierUUID: currentStandard.caseIdentifierUUID
    },
    learningComponents: learningComponents.map((lc, index) => ({
      id: `LC${index + 1}`,
      identifier: lc.identifier,
      description: lc.description,
      // Mark LC1 as a potential gap for demo purposes
      isGap: index === 0
    })),
    prerequisites: prereqStandards.map(s => ({
      code: s.statementCode,
      description: cleanDescription(s.description),
      grade: s.gradeLevel[0],
      identifier: s.identifier,
      caseIdentifierUUID: s.caseIdentifierUUID,
      isRoot: s.statementCode === '2.G.A.3' // Mark 2.G.A.3 as root for demo
    })),
    buildsTo: buildsToStandards.slice(0, 4).map(s => ({
      code: s.statementCode,
      description: cleanDescription(s.description),
      grade: s.gradeLevel[0],
      identifier: s.identifier,
      caseIdentifierUUID: s.caseIdentifierUUID
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'CZI Learning Commons Knowledge Graph v1.2.0',
      license: 'CC BY-4.0',
      attribution: 'Knowledge Graph is provided by Learning Commons under the CC BY-4.0 license.'
    }
  };

  // Write demo data
  const demoOutputPath = path.join(outputDir, 'demo-data.json');
  fs.writeFileSync(demoOutputPath, JSON.stringify(demoData, null, 2));
  console.log(`\nDemo data written to ${demoOutputPath}`);
}

function cleanDescription(desc) {
  // Clean up LaTeX formatting for display
  return desc
    .replace(/\$\\frac\{(\d+)\}\{(\w+)\}\$/g, '$1/$2')
    .replace(/\$\\frac\{(\w+)\}\{(\w+)\}\$/g, '$1/$2')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/𝑏𝑏/g, 'b');
}

main().catch(console.error);
