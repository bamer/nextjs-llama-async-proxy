#!/usr/bin/env node

const fs = require('fs');

// Read LlamaService.ts file
const filePath = '/home/bamer/nextjs-llama-async-proxy/src/server/services/LlamaService.ts';
const content = fs.readFileSync(filePath, 'utf-8');

console.log('=== LlamaService.ts File Analysis ===\n');

// Check for duplicate functions
const functionMatches = content.matchAll(/private\s+(\w+)\(/g);
const functionCounts = {};

for (const match of functionMatches) {
  const funcName = match[1];
  functionCounts[funcName] = (functionCounts[funcName] || 0) + 1;
}

console.log('Function count analysis:');
const duplicates = Object.entries(functionCounts).filter(([name, count]) => count > 1);
if (duplicates.length > 0) {
  console.log('❌ DUPLICATE FUNCTIONS FOUND:');
  duplicates.forEach(([name, count]) => {
    console.log(`   - ${name}: ${count} occurrences`);
  });
  process.exit(1);
} else {
  console.log('✅ No duplicate functions found');
}

// Check for proper function structure
const privateFunctions = Array.from(content.matchAll(/private\s+\w+\([^)]*\):\s*(?:async\s+)?(?:void|Promise<\w+>|boolean|string|number)/g));
console.log(`\nFound ${privateFunctions.length} private functions with proper signatures`);

// Check for LlamaModel interface
const llamaModelInterface = content.match(/export interface LlamaModel \{[^}]+\}/s);
if (llamaModelInterface) {
  console.log('\n✅ LlamaModel interface found');
  
  // Check for required fields
  const requiredFields = ['path', 'availableTemplates', 'template'];
  const hasAllFields = requiredFields.every(field => llamaModelInterface[0].includes(field));
  
  if (hasAllFields) {
    console.log('✅ All required fields (path, availableTemplates, template) are present');
  } else {
    const missing = requiredFields.filter(f => !llamaModelInterface[0].includes(f));
    console.log(`❌ Missing fields: ${missing.join(', ')}`);
    process.exit(1);
  }
} else {
  console.log('❌ LlamaModel interface not found');
  process.exit(1);
}

// Check for loadModelsFromFilesystem function
const loadModelsFunc = content.match(/private loadModelsFromFilesystem\(\): void \{[\s\S]+?\n  \}/);
if (loadModelsFunc) {
  console.log('\n✅ loadModelsFromFilesystem() function found');
  
  // Check for built-in templates
  const hasBuiltinTemplates = loadModelsFunc[0].includes('builtinTemplates') && loadModelsFunc[0].includes('["chatml"');
  const scansJinjaFiles = loadModelsFunc[0].includes('.jinja');
  const scansGgufBin = loadModelsFunc[0].includes('.gguf') && loadModelsFunc[0].includes('.bin');
  const logsTemplates = loadModelsFunc[0].includes('template(s)');
  
  console.log('Features:');
  console.log(`   ${hasBuiltinTemplates ? '✅' : '❌'} Built-in templates array`);
  console.log(`   ${scansJinjaFiles ? '✅' : '❌'} Scans .jinja files`);
  console.log(`   ${scansGgufBin ? '✅' : '❌'} Scans .gguf/.bin files`);
  console.log(`   ${logsTemplates ? '✅' : '❌'} Logs template count`);
  
  if (!hasBuiltinTemplates || !scansJinjaFiles || !scansGgufBin || !logsTemplates) {
    console.log('\n❌ loadModelsFromFilesystem() is missing required features');
    process.exit(1);
  }
} else {
  console.log('❌ loadModelsFromFilesystem() function not found');
  process.exit(1);
}

// Check for orphaned code (code outside functions after class definition)
const classEndMatch = content.match(/\n\}\s*$/);
if (classEndMatch) {
  const afterClass = content.substring(content.lastIndexOf('}') + 1).trim();
  if (afterClass && afterClass !== '') {
    console.log('\n❌ Orphaned code found after class definition');
    console.log(afterClass);
    process.exit(1);
  } else {
    console.log('\n✅ No orphaned code after class definition');
  }
}

// Check line length (max 100 chars per AGENTS.md)
const lines = content.split('\n');
const longLines = lines.filter((line, idx) => line.length > 100);
if (longLines.length > 0) {
  console.log(`\n⚠️  ${longLines.length} lines exceed 100 characters (first 5):`);
  longLines.slice(0, 5).forEach((line, idx) => {
    console.log(`   Line ${lines.indexOf(line) + 1}: ${line.length} chars`);
  });
} else {
  console.log('\n✅ All lines are within 100 character limit');
}

console.log('\n=== All checks passed! ===');
