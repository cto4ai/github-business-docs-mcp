#!/usr/bin/env node
// Test for catalog path bug fix (v4.0.0)
// Verifies that paths are returned relative to docroot, not absolute

const DocumentCatalogService = require('../src/services/document-catalog-service.cjs');

// Mock GitHub API service
class MockGitHubApiService {
  async makeGitHubRequest(endpoint) {
    throw new Error('Not needed for this test');
  }
}

console.log('Testing catalog path stripping with docroot...\n');

// Create service instance
const mockApi = new MockGitHubApiService();
const service = new DocumentCatalogService(mockApi, {});

// Mock tree data as returned by GitHub API
const mockTree = [
  { type: 'blob', path: 'newdocs/policies/vacation-policy.md', size: 3670, sha: 'abc123' },
  { type: 'blob', path: 'newdocs/policies/disability-accommodation-policy.md', size: 8600, sha: 'def456' },
  { type: 'blob', path: 'newdocs/guides/onboarding.md', size: 5000, sha: 'ghi789' },
  { type: 'blob', path: 'README.md', size: 1000, sha: 'jkl012' },  // Outside docroot
  { type: 'tree', path: 'newdocs/policies', sha: 'mno345' }  // Directory, not file
];

const basePath = 'newdocs';
const extensions = ['.md', '.txt'];

// Run filterDocumentFiles
const filtered = service.filterDocumentFiles(mockTree, basePath, extensions);

console.log('Mock GitHub Tree API data (with docroot "newdocs"):');
mockTree.filter(item => item.type === 'blob').forEach(item => {
  console.log(`  - ${item.path} (${item.size} bytes)`);
});

console.log('\n✓ Filtered results (should be relative paths):');
filtered.forEach(file => {
  console.log(`  - path: "${file.path}"`);
  console.log(`    name: "${file.name}"`);
  console.log(`    size: ${file.size}`);
  console.log(`    extension: "${file.extension}"`);
  console.log();
});

// Validation
console.log('Validation:');

let allTestsPassed = true;

// Test 1: Should have 3 files (only within newdocs)
if (filtered.length !== 3) {
  console.log(`  ✗ FAIL: Expected 3 files, got ${filtered.length}`);
  allTestsPassed = false;
} else {
  console.log('  ✓ PASS: Correct number of files (3)');
}

// Test 2: Paths should NOT contain "newdocs" prefix
const pathsWithPrefix = filtered.filter(f => f.path.startsWith('newdocs'));
if (pathsWithPrefix.length > 0) {
  console.log(`  ✗ FAIL: Found ${pathsWithPrefix.length} paths still containing "newdocs" prefix:`);
  pathsWithPrefix.forEach(f => console.log(`      - ${f.path}`));
  allTestsPassed = false;
} else {
  console.log('  ✓ PASS: No paths contain "newdocs" prefix');
}

// Test 3: Paths should be relative (start with folder name or filename)
const expectedPaths = [
  'policies/vacation-policy.md',
  'policies/disability-accommodation-policy.md',
  'guides/onboarding.md'
];

expectedPaths.forEach(expectedPath => {
  const found = filtered.find(f => f.path === expectedPath);
  if (!found) {
    console.log(`  ✗ FAIL: Expected path "${expectedPath}" not found`);
    allTestsPassed = false;
  } else {
    console.log(`  ✓ PASS: Found expected path "${expectedPath}"`);
  }
});

// Test 4: Names should be correct
filtered.forEach(file => {
  const expectedName = file.path.split('/').pop();
  if (file.name !== expectedName) {
    console.log(`  ✗ FAIL: Name mismatch for ${file.path}: expected "${expectedName}", got "${file.name}"`);
    allTestsPassed = false;
  }
});
console.log('  ✓ PASS: All filenames correct');

// Test 5: Test with empty docroot (repository root)
console.log('\n✓ Testing with empty docroot (repository root):');
const mockTreeRoot = [
  { type: 'blob', path: 'README.md', size: 1000, sha: 'abc' },
  { type: 'blob', path: 'docs/guide.md', size: 2000, sha: 'def' }
];

const filteredRoot = service.filterDocumentFiles(mockTreeRoot, '', extensions);
console.log('  Filtered paths:');
filteredRoot.forEach(f => console.log(`    - ${f.path}`));

if (filteredRoot[0].path === 'README.md' && filteredRoot[1].path === 'docs/guide.md') {
  console.log('  ✓ PASS: Empty docroot returns full paths (as expected)');
} else {
  console.log('  ✗ FAIL: Empty docroot paths incorrect');
  allTestsPassed = false;
}

console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED - Catalog path fix verified!');
  console.log('='.repeat(60));
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review results above');
  console.log('='.repeat(60));
  process.exit(1);
}
