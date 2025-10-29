#!/usr/bin/env node
// Test for path prepending feature (v4.0.0)
// Verifies that relative paths are correctly prepended with docroot

console.log('Testing path prepending logic...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Simulate the path prepending logic from handlers
function constructFullPath(filePath, docroot, ignore_docroot) {
  if (ignore_docroot || !docroot) {
    return filePath;
  }

  if (filePath.startsWith(docroot + '/') || filePath === docroot) {
    return filePath;  // Already has docroot prefix
  }

  return `${docroot}/${filePath}`;
}

// Test scenarios
test('Prepends docroot to relative path', () => {
  const result = constructFullPath('policies/vacation.md', 'newdocs', false);
  assert(result === 'newdocs/policies/vacation.md', `Expected 'newdocs/policies/vacation.md', got '${result}'`);
});

test('Does not double-prepend if path already has docroot', () => {
  const result = constructFullPath('newdocs/policies/vacation.md', 'newdocs', false);
  assert(result === 'newdocs/policies/vacation.md', 'Should not double-prepend');
});

test('Uses path as-is when ignore_docroot is true', () => {
  const result = constructFullPath('src/code.js', 'newdocs', true);
  assert(result === 'src/code.js', 'Should use path as-is with override');
});

test('Uses path as-is when docroot is empty', () => {
  const result = constructFullPath('README.md', '', false);
  assert(result === 'README.md', 'Should use path as-is with empty docroot');
});

test('Handles root-level files in docroot', () => {
  const result = constructFullPath('guide.md', 'docs', false);
  assert(result === 'docs/guide.md', `Expected 'docs/guide.md', got '${result}'`);
});

test('Handles deep nested paths', () => {
  const result = constructFullPath('policies/hr/remote-work.md', 'docs', false);
  assert(result === 'docs/policies/hr/remote-work.md', 'Should prepend to nested path');
});

test('Handles exact docroot path match', () => {
  const result = constructFullPath('docs', 'docs', false);
  assert(result === 'docs', 'Exact match should not prepend');
});

test('Handles path that starts with docroot as substring', () => {
  // Edge case: path is "documentation" but docroot is "docs"
  // Should prepend because it doesn't start with "docs/"
  const result = constructFullPath('documentation/guide.md', 'docs', false);
  assert(result === 'docs/documentation/guide.md', 'Should prepend even when docroot is substring');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(60));

if (failed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
