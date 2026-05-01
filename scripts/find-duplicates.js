const fs = require('fs');
const path = require('path');

function extractTests(dir) {
  const tests = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.test.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        let currentDescribe = '';
        lines.forEach((line, idx) => {
          const describeMatch = line.match(/describe\(['"]([^'"]+)['"]/);
          if (describeMatch) currentDescribe = describeMatch[1];

          const itMatch = line.match(/it\(['"]([^'"]+)['"]/);
          if (itMatch) {
            const testName = itMatch[1];
            let codeBlock = '';
            for (let i = idx; i < Math.min(idx + 20, lines.length); i++) {
              if (lines[i].includes('expect(')) {
                codeBlock += lines[i].trim().replace(/\s+/g, ' ').slice(0, 80);
              }
            }
            tests.push({
              file: path.basename(fullPath),
              fullPath,
              line: idx + 1,
              describe: currentDescribe,
              test: testName,
              code: codeBlock,
            });
          }
        });
      }
    }
  }

  walk(dir);
  return tests;
}

const testsDir = path.join(process.cwd(), 'test');
const allTests = extractTests(testsDir);

const codeHashes = {};
allTests.forEach((t) => {
  const hash = t.code.slice(0, 60);
  if (!codeHashes[hash]) codeHashes[hash] = [];
  codeHashes[hash].push(t);
});

console.log('=== TESTS WITH IDENTICAL EXPECT CODE ===\n');
let dupCount = 0;
for (const [hash, group] of Object.entries(codeHashes)) {
  if (group.length > 1) {
    console.log(`${group.length}x identical (${hash.slice(0, 40)}...):`);
    group.forEach((t) => {
      console.log(`  ${t.file}:${t.line} [${t.describe} > ${t.test}]`);
    });
    console.log('');
    dupCount += group.length;
  }
}

console.log(`Total duplicate code tests: ${dupCount}`);
console.log(
  `Unique duplicate groups: ${Object.values(codeHashes).filter((g) => g.length > 1).length}`
);
