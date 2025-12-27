#!/usr/bin/env node

const fs = require('fs');

const filePath = '/home/bamer/nextjs-llama-async-proxy/src/server/services/LlamaService.ts';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('=== LlamaService.ts Structure Verification ===\n');

console.log(`Total lines: ${lines.length}`);

// Find key line numbers
const findLine = (pattern) => {
  const match = content.match(pattern);
  return match ? content.substring(0, match.index).split('\n').length : -1;
};

const keyPoints = {
  'LlamaModel interface': /export interface LlamaModel/,
  'LlamaService class': /export class LlamaService/,
  'Constructor': /constructor\(LlamaServerConfig/,
  'loadModels()': /private async loadModels\(\): Promise/,
  'loadModelsFromFilesystem()': /private loadModelsFromFilesystem\(\): void/,
  'handleCrash()': /private async handleCrash\(\): Promise/,
  'buildArgs()': /private buildArgs\(\): string/,
  'logger()': /private logger\(/,
  'End of class': /^}$/
};

console.log('\nKey structure points:');
for (const [name, pattern] of Object.entries(keyPoints)) {
  const lineNum = findLine(pattern);
  if (lineNum > 0) {
    console.log(`  Line ${String(lineNum).padEnd(4)}: ${name}`);
  }
}

// Check for interface fields
const llamaModelMatch = content.match(/export interface LlamaModel \{([\s\S]+?)\}/);
if (llamaModelMatch) {
  console.log('\nLlamaModel interface fields:');
  const interfaceBody = llamaModelMatch[1];
  const fields = interfaceBody.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => line.replace(/;/, ''));
  
  fields.forEach(field => {
    console.log(`  ✅ ${field}`);
  });
}

// Check for duplicates
const functions = content.match(/\s+(?:private|public)\s+(?:async\s+)?\w+\(/g) || [];
console.log(`\nFunction definitions: ${functions.length}`);

const functionNames = functions.map(f => f.match(/\w+\(/)[0]);
const uniqueNames = new Set(functionNames);
const duplicates = functionNames.filter((name, idx) => functionNames.indexOf(name) !== idx);

if (duplicates.length > 0) {
  console.log(`❌ Duplicate functions: ${duplicates.join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ No duplicate functions');
}

// Check for orphaned code after closing brace
const lastBrace = content.lastIndexOf('}');
const afterBrace = content.substring(lastBrace + 1).trim();
if (afterBrace && afterBrace !== '') {
  console.log(`\n❌ Orphaned code after final brace:\n${afterBrace}`);
  process.exit(1);
} else {
  console.log('✅ No orphaned code after class definition');
}

// Check for console.log (should use this.logger)
const consoleLogCount = (content.match(/console\.log/g) || []).length;
if (consoleLogCount > 0) {
  console.log(`\n❌ Found ${consoleLogCount} console.log() calls (should use this.logger())`);
  process.exit(1);
} else {
  console.log('✅ No console.log() calls found');
}

console.log('\n=== All checks passed! ===\n');
console.log('File is clean and follows all requirements.');
