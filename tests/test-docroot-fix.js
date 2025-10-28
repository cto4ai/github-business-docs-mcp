#!/usr/bin/env node

// Quick test to verify docroot normalization fix
const DocumentCatalogService = require('./src/services/document-catalog-service.cjs');

// Create instance with mock API service
const mockApi = {
  makeGitHubRequest: async () => ({ content: '', tree: [] })
};

const service = new DocumentCatalogService(mockApi, {});

// Test normalizeDocroot method
console.log('Testing normalizeDocroot() method:\n');

const testCases = [
  { input: undefined, expected: null, description: 'undefined (not set)' },
  { input: '.', expected: '', description: '"." (current dir)' },
  { input: '/', expected: '', description: '"/" (root)' },
  { input: './', expected: '', description: '"./" (current dir)' },
  { input: '', expected: '', description: 'empty string' },
  { input: 'docs', expected: 'docs', description: '"docs"' },
  { input: 'docs/', expected: 'docs', description: '"docs/" (trailing slash)' },
  { input: 'path/to/docs/', expected: 'path/to/docs', description: '"path/to/docs/"' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = service.normalizeDocroot(input);
  const status = result === expected ? '✓ PASS' : '✗ FAIL';

  if (result === expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${status}: ${description}`);
  console.log(`  Input: ${JSON.stringify(input)}`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Got: ${JSON.stringify(result)}`);
  console.log();
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}

console.log('✓ All tests passed!\n');
