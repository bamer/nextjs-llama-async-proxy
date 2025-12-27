#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read coverage data
const coverageData = JSON.parse(
  fs.readFileSync('./coverage/coverage-final.json', 'utf8')
);

// Calculate overall coverage
function calculateCoverage(fileData) {
  const s = Object.values(fileData.s || {}).length;
  const sCovered = Object.values(fileData.s || {}).filter(v => v > 0).length;
  const b = Object.values(fileData.b || {}).reduce((acc, curr) => acc + curr.length, 0);
  const bCovered = Object.values(fileData.b || {}).reduce(
    (acc, curr) => acc + curr.filter(v => v > 0).length,
    0
  );
  const f = Object.keys(fileData.f || {}).length;
  const fCovered = Object.values(fileData.f || {}).filter(v => v > 0).length;
  const l = Object.values(fileData.s || {}).length;

  return {
    statements: s > 0 ? (sCovered / s) * 100 : 0,
    branches: b > 0 ? (bCovered / b) * 100 : 0,
    functions: f > 0 ? (fCovered / f) * 100 : 0,
    lines: l > 0 ? (sCovered / l) * 100 : 0,
    statementCounts: { total: s, covered: sCovered, uncovered: s - sCovered },
    branchCounts: { total: b, covered: bCovered, uncovered: b - bCovered },
    functionCounts: { total: f, covered: fCovered, uncovered: f - fCovered },
  };
}

// Get directory from path
function getDirectory(filePath) {
  const relativePath = filePath.replace(process.cwd() + '/', '');
  const parts = relativePath.split('/');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('/');
  }
  return 'root';
}

// Get filename from path
function getFilename(filePath) {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}

// Get relative path
function getRelativePath(filePath) {
  return filePath.replace(process.cwd() + '/', '');
}

// Group files by directory
const filesByDir = {};
const allFiles = [];

Object.entries(coverageData).forEach(([filePath, fileData]) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }

  const dir = getDirectory(filePath);
  const filename = getFilename(filePath);
  const relativePath = getRelativePath(filePath);
  const coverage = calculateCoverage(fileData);
  const avgCoverage = (coverage.statements + coverage.branches + coverage.functions) / 3;

  if (!filesByDir[dir]) {
    filesByDir[dir] = [];
  }

  filesByDir[dir].push({
    path: filePath,
    relativePath,
    filename,
    dir,
    ...coverage,
    avgCoverage,
  });

  allFiles.push({
    path: filePath,
    relativePath,
    filename,
    dir,
    ...coverage,
    avgCoverage,
  });
});

// Calculate overall coverage
let totalStatements = { total: 0, covered: 0 };
let totalBranches = { total: 0, covered: 0 };
let totalFunctions = { total: 0, covered: 0 };
let totalLines = { total: 0, covered: 0 };

allFiles.forEach(file => {
  totalStatements.total += file.statementCounts.total;
  totalStatements.covered += file.statementCounts.covered;
  totalBranches.total += file.branchCounts.total;
  totalBranches.covered += file.branchCounts.covered;
  totalFunctions.total += file.functionCounts.total;
  totalFunctions.covered += file.functionCounts.covered;
  totalLines.total += file.statementCounts.total;
  totalLines.covered += file.statementCounts.covered;
});

const overallCoverage = {
  statements: totalStatements.total > 0 ? (totalStatements.covered / totalStatements.total) * 100 : 0,
  branches: totalBranches.total > 0 ? (totalBranches.covered / totalBranches.total) * 100 : 0,
  functions: totalFunctions.total > 0 ? (totalFunctions.covered / totalFunctions.total) * 100 : 0,
  lines: totalLines.total > 0 ? (totalLines.covered / totalLines.total) * 100 : 0,
};

// Categorize files
const fullCoverage = [];
const highCoverage = [];
const mediumCoverage = [];
const lowCoverage = [];
const zeroCoverage = [];

allFiles.forEach(file => {
  if (file.avgCoverage >= 100) {
    fullCoverage.push(file);
  } else if (file.avgCoverage >= 75) {
    highCoverage.push(file);
  } else if (file.avgCoverage >= 50) {
    mediumCoverage.push(file);
  } else if (file.avgCoverage > 0) {
    lowCoverage.push(file);
  } else {
    zeroCoverage.push(file);
  }
});

// Sort each category by coverage (descending)
const sortByCoverage = (a, b) => b.avgCoverage - a.avgCoverage;
fullCoverage.sort(sortByCoverage);
highCoverage.sort(sortByCoverage);
mediumCoverage.sort(sortByCoverage);
lowCoverage.sort(sortByCoverage);

// Generate report
let report = '# Coverage Gaps Analysis Report\n\n';
report += 'Generated: ' + new Date().toISOString() + '\n\n';

report += '## Coverage Summary\n\n';
report += `| Metric | Coverage |\n`;
report += `|--------|----------|\n`;
report += `| Statements | ${overallCoverage.statements.toFixed(2)}% |\n`;
report += `| Branches | ${overallCoverage.branches.toFixed(2)}% |\n`;
report += `| Functions | ${overallCoverage.functions.toFixed(2)}% |\n`;
report += `| Lines | ${overallCoverage.lines.toFixed(2)}% |\n`;
report += `| Average | ${((overallCoverage.statements + overallCoverage.branches + overallCoverage.functions + overallCoverage.lines) / 4).toFixed(2)}% |\n\n`;

report += '## Files by Coverage Level\n\n';

// 100% Coverage
report += '### 100% Coverage (✅)\n\n';
if (fullCoverage.length > 0) {
  report += '| File | Statements | Branches | Functions | Lines |\n';
  report += '|------|------------|----------|-----------|-------|\n';
  fullCoverage.forEach(file => {
    report += `| ${file.relativePath} | ${file.statements.toFixed(1)}% | ${file.branches.toFixed(1)}% | ${file.functions.toFixed(1)}% | ${file.lines.toFixed(1)}% |\n`;
  });
} else {
  report += 'No files with 100% coverage.\n';
}
report += '\n';

// 75-99% Coverage
report += '### 75-99% Coverage (⚠️)\n\n';
if (highCoverage.length > 0) {
  report += '| File | Avg | Statements | Branches | Functions | Lines | Needs Coverage |\n';
  report += '|------|-----|------------|----------|-----------|-------|----------------|\n';
  highCoverage.forEach(file => {
    const needs = [
      file.statements < 100 ? `${file.statements.toFixed(0)}% stmts` : '',
      file.branches < 100 ? `${file.branches.toFixed(0)}% branches` : '',
      file.functions < 100 ? `${file.functions.toFixed(0)}% funcs` : '',
    ].filter(Boolean).join(', ');
    report += `| ${file.relativePath} | ${file.avgCoverage.toFixed(1)}% | ${file.statements.toFixed(1)}% | ${file.branches.toFixed(1)}% | ${file.functions.toFixed(1)}% | ${file.lines.toFixed(1)}% | ${needs || '-'} |\n`;
  });
} else {
  report += 'No files with 75-99% coverage.\n';
}
report += '\n';

// 50-74% Coverage
report += '### 50-74% Coverage (⚠️⚠️)\n\n';
if (mediumCoverage.length > 0) {
  report += '| File | Avg | Statements | Branches | Functions | Lines | Needs Coverage |\n';
  report += '|------|-----|------------|----------|-----------|-------|----------------|\n';
  mediumCoverage.forEach(file => {
    const needs = [
      file.statements < 75 ? `${file.statements.toFixed(0)}% stmts` : '',
      file.branches < 75 ? `${file.branches.toFixed(0)}% branches` : '',
      file.functions < 75 ? `${file.functions.toFixed(0)}% funcs` : '',
    ].filter(Boolean).join(', ');
    report += `| ${file.relativePath} | ${file.avgCoverage.toFixed(1)}% | ${file.statements.toFixed(1)}% | ${file.branches.toFixed(1)}% | ${file.functions.toFixed(1)}% | ${file.lines.toFixed(1)}% | ${needs || '-'} |\n`;
  });
} else {
  report += 'No files with 50-74% coverage.\n';
}
report += '\n';

// 0-49% Coverage
report += '### 0-49% Coverage (❌)\n\n';
if (lowCoverage.length > 0) {
  report += '| File | Avg | Statements | Branches | Functions | Lines | Uncovered |\n';
  report += '|------|-----|------------|----------|-----------|-------|-----------|\n';
  lowCoverage.forEach(file => {
    const uncovered = [
      file.statementCounts.uncovered > 0 ? `${file.statementCounts.uncovered} stmts` : '',
      file.branchCounts.uncovered > 0 ? `${file.branchCounts.uncovered} branches` : '',
      file.functionCounts.uncovered > 0 ? `${file.functionCounts.uncovered} funcs` : '',
    ].filter(Boolean).join(', ');
    report += `| ${file.relativePath} | ${file.avgCoverage.toFixed(1)}% | ${file.statements.toFixed(1)}% | ${file.branches.toFixed(1)}% | ${file.functions.toFixed(1)}% | ${file.lines.toFixed(1)}% | ${uncovered} |\n`;
  });
} else {
  report += 'No files with 0-49% coverage.\n';
}
report += '\n';

// 0% Coverage
report += '### 0% Coverage (🚨) - Critical\n\n';
if (zeroCoverage.length > 0) {
  report += 'These files have NO test coverage and need immediate attention:\n\n';
  zeroCoverage.forEach(file => {
    report += `- **${file.relativePath}**\n`;
  });
} else {
  report += 'No files with 0% coverage.\n';
}
report += '\n';

// Directory Summary
report += '## Coverage by Directory\n\n';
report += '| Directory | Files | Avg Coverage | Min | Max |\n';
report += '|-----------|-------|--------------|-----|-----|\n';

Object.entries(filesByDir).forEach(([dir, files]) => {
  const avg = files.reduce((sum, f) => sum + f.avgCoverage, 0) / files.length;
  const min = Math.min(...files.map(f => f.avgCoverage));
  const max = Math.max(...files.map(f => f.avgCoverage));
  report += `| ${dir} | ${files.length} | ${avg.toFixed(1)}% | ${min.toFixed(1)}% | ${max.toFixed(1)}% |\n`;
});
report += '\n';

// Uncovered Functions
report += '## Specific Coverage Gaps\n\n';
report += '### Files with Uncovered Functions\n\n';
allFiles.filter(f => f.functionCounts.uncovered > 0).forEach(file => {
  report += `**${file.relativePath}**\n`;
  report += `- ${file.functionCounts.uncovered} functions uncovered (${file.functions.toFixed(1)}% covered)\n\n`;
});

// Files with Uncovered Branches
report += '### Files with Uncovered Branches\n\n';
allFiles.filter(f => f.branchCounts.uncovered > 0).forEach(file => {
  report += `**${file.relativePath}**\n`;
  report += `- ${file.branchCounts.uncovered} branches uncovered (${file.branches.toFixed(1)}% covered)\n\n`;
});

// Files with Uncovered Statements
report += '### Files with Uncovered Statements\n\n';
allFiles.filter(f => f.statementCounts.uncovered > 0).forEach(file => {
  report += `**${file.relativePath}**\n`;
  report += `- ${file.statementCounts.uncovered} statements uncovered (${file.statements.toFixed(1)}% covered)\n\n`;
});

// Recommendations
report += '## Recommendations\n\n';
report += '### Priority 1: Files with 0% Coverage (🚨)\n\n';
if (zeroCoverage.length > 0) {
  zeroCoverage.forEach(file => {
    report += `- [ ] **${file.relativePath}** - Create initial test suite\n`;
  });
  report += '\n';
} else {
  report += 'No files with 0% coverage. ✅\n\n';
}

report += '### Priority 2: Files with <50% Coverage (❌)\n\n';
if (lowCoverage.length > 0) {
  lowCoverage.forEach(file => {
    report += `- [ ] **${file.relativePath}** (${file.avgCoverage.toFixed(1)}% avg) - Expand test coverage\n`;
    if (file.functionCounts.uncovered > 0) {
      report += `  - Add tests for ${file.functionCounts.uncovered} uncovered functions\n`;
    }
    if (file.branchCounts.uncovered > 0) {
      report += `  - Add tests for ${file.branchCounts.uncovered} uncovered branches\n`;
    }
  });
  report += '\n';
} else {
  report += 'No files with <50% coverage. ✅\n\n';
}

report += '### Priority 3: Files with <75% Coverage (⚠️⚠️)\n\n';
if (mediumCoverage.length > 0) {
  mediumCoverage.forEach(file => {
    const gaps = [];
    if (file.functionCounts.uncovered > 0) gaps.push(`${file.functionCounts.uncovered} functions`);
    if (file.branchCounts.uncovered > 0) gaps.push(`${file.branchCounts.uncovered} branches`);
    if (gaps.length > 0) {
      report += `- [ ] **${file.relativePath}** (${file.avgCoverage.toFixed(1)}% avg) - Cover ${gaps.join(', ')}\n`;
    }
  });
  report += '\n';
} else {
  report += 'No files with 50-74% coverage. ✅\n\n';
}

report += '### Priority 4: Files with 75-99% Coverage (⚠️)\n\n';
if (highCoverage.length > 0) {
  highCoverage.forEach(file => {
    const gaps = [];
    if (file.functionCounts.uncovered > 0) gaps.push(`${file.functionCounts.uncovered} functions`);
    if (file.branchCounts.uncovered > 0) gaps.push(`${file.branchCounts.uncovered} branches`);
    if (gaps.length > 0) {
      report += `- [ ] **${file.relativePath}** (${file.avgCoverage.toFixed(1)}% avg) - Polish: ${gaps.join(', ')}\n`;
    }
  });
  report += '\n';
} else {
  report += 'No files with 75-99% coverage. ✅\n\n';
}

// Quick Wins
report += '## Quick Wins\n\n';
report += 'Files with 50-90% coverage that can be brought to 100% with targeted tests:\n\n';
const quickWins = [...mediumCoverage, ...highCoverage]
  .filter(f => f.avgCoverage >= 50 && f.avgCoverage < 90)
  .sort((a, b) => b.avgCoverage - a.avgCoverage);

if (quickWins.length > 0) {
  report += '| File | Current | Target | Gap |\n';
  report += '|------|---------|--------|-----|\n';
  quickWins.forEach(file => {
    report += `| ${file.relativePath} | ${file.avgCoverage.toFixed(1)}% | 100% | ${(100 - file.avgCoverage).toFixed(1)}% |\n`;
  });
} else {
  report += 'No quick wins identified.\n';
}
report += '\n';

// Stats Summary
report += '## Statistics Summary\n\n';
report += `- **Total Files Tested**: ${allFiles.length}\n`;
report += `- **100% Coverage**: ${fullCoverage.length} files\n`;
report += `- **75-99% Coverage**: ${highCoverage.length} files\n`;
report += `- **50-74% Coverage**: ${mediumCoverage.length} files\n`;
report += `- **1-49% Coverage**: ${lowCoverage.length} files\n`;
report += `- **0% Coverage**: ${zeroCoverage.length} files\n`;
report += `- **Files Needing Tests**: ${lowCoverage.length + zeroCoverage.length}\n`;
report += `- **Files Needing Polish**: ${mediumCoverage.length + highCoverage.length}\n\n`;

// Calculate work to reach 98%
const currentAvg = allFiles.reduce((sum, f) => sum + f.avgCoverage, 0) / allFiles.length;
const target = 98;
const needed = target - currentAvg;
const totalCoverageNeeded = (needed / 100) * allFiles.length;

report += '## Work Required to Reach 98% Coverage\n\n';
report += `- **Current Average**: ${currentAvg.toFixed(2)}%\n`;
report += `- **Target**: ${target}%\n`;
report += `- **Gap**: ${needed.toFixed(2)}% (across ${allFiles.length} files)\n`;
report += `- **Equivalent to improving**: ${totalCoverageNeeded.toFixed(0)} files by 100%\n\n`;

if (lowCoverage.length > 0 || zeroCoverage.length > 0) {
  report += '### Minimum Viable Test Set\n\n';
  report += 'To maximize impact with minimum effort:\n\n';
  const highImpactFiles = [...lowCoverage, ...zeroCoverage]
    .sort((a, b) => (100 - a.avgCoverage) - (100 - b.avgCoverage))
    .slice(0, 10);

  highImpactFiles.forEach(file => {
    const potentialGain = 100 - file.avgCoverage;
    report += `- **${file.relativePath}** (${file.avgCoverage.toFixed(1)}% → 100% = +${potentialGain.toFixed(1)}% gain)\n`;
  });
}

// Write report
fs.writeFileSync('COVERAGE_GAPS_REPORT.md', report);
console.log('✅ Coverage gaps report generated: COVERAGE_GAPS_REPORT.md');
console.log('');
console.log('Summary:');
console.log(`  Total Files: ${allFiles.length}`);
console.log(`  100% Coverage: ${fullCoverage.length}`);
console.log(`  75-99% Coverage: ${highCoverage.length}`);
console.log(`  50-74% Coverage: ${mediumCoverage.length}`);
console.log(`  1-49% Coverage: ${lowCoverage.length}`);
console.log(`  0% Coverage: ${zeroCoverage.length}`);
console.log('');
console.log(`Overall Coverage:`);
console.log(`  Statements: ${overallCoverage.statements.toFixed(2)}%`);
console.log(`  Branches: ${overallCoverage.branches.toFixed(2)}%`);
console.log(`  Functions: ${overallCoverage.functions.toFixed(2)}%`);
console.log(`  Lines: ${overallCoverage.lines.toFixed(2)}%`);
