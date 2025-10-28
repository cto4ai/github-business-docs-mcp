#!/usr/bin/env node

// Quick validation test for v4.0.0 docroot enforcement services
const PathValidator = require('../src/services/path-validator.cjs');

console.log('🧪 Testing v4.0.0 Docroot Enforcement Services\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

function test(description, condition) {
  if (condition) {
    console.log(`✓ ${description}`);
    passed++;
  } else {
    console.log(`✗ ${description}`);
    failed++;
  }
}

// Test 1: PathValidator.normalizeDocroot()
console.log('\n1. PathValidator.normalizeDocroot()');
test('  "." normalizes to ""', PathValidator.normalizeDocroot('.') === '');
test('  "/" normalizes to ""', PathValidator.normalizeDocroot('/') === '');
test('  "./" normalizes to ""', PathValidator.normalizeDocroot('./') === '');
test('  "docs/" normalizes to "docs"', PathValidator.normalizeDocroot('docs/') === 'docs');
test('  "docs" stays "docs"', PathValidator.normalizeDocroot('docs') === 'docs');
test('  undefined returns null', PathValidator.normalizeDocroot(undefined) === null);
test('  null returns null', PathValidator.normalizeDocroot(null) === null);
test('  "" stays ""', PathValidator.normalizeDocroot('') === '');

// Test 2: PathValidator.isPathInDocroot()
console.log('\n2. PathValidator.isPathInDocroot()');
test('  "docs/file.md" in "docs"', PathValidator.isPathInDocroot('docs/file.md', 'docs'));
test('  "docs/sub/file.md" in "docs"', PathValidator.isPathInDocroot('docs/sub/file.md', 'docs'));
test('  "README.md" NOT in "docs"', !PathValidator.isPathInDocroot('README.md', 'docs'));
test('  "docs2/file.md" NOT in "docs"', !PathValidator.isPathInDocroot('docs2/file.md', 'docs'));
test('  Any path in "" (root)', PathValidator.isPathInDocroot('any/path.md', ''));
test('  Any path in null (root)', PathValidator.isPathInDocroot('any/path.md', null));
test('  "docs" exact match with "docs"', PathValidator.isPathInDocroot('docs', 'docs'));

// Test 3: PathValidator.shouldEnforceDocroot()
console.log('\n3. PathValidator.shouldEnforceDocroot()');
test('  Enforce when docroot="docs", ignore=false', PathValidator.shouldEnforceDocroot('docs', false));
test('  Don\'t enforce when ignore=true', !PathValidator.shouldEnforceDocroot('docs', true));
test('  Don\'t enforce when docroot=""', !PathValidator.shouldEnforceDocroot('', false));
test('  Don\'t enforce when docroot=null', !PathValidator.shouldEnforceDocroot(null, false));

// Test 4: PathValidator.validatePath()
console.log('\n4. PathValidator.validatePath()');

const validInside = PathValidator.validatePath('docs/file.md', 'docs', {
  ignore_docroot: false,
  operation: 'read'
});
test('  Valid path inside docroot', validInside.valid === true);

const invalidOutside = PathValidator.validatePath('README.md', 'docs', {
  ignore_docroot: false,
  operation: 'read'
});
test('  Invalid path outside docroot', invalidOutside.valid === false);
test('  Error message exists', invalidOutside.error && invalidOutside.error.length > 0);
test('  Error mentions ignore_docroot', invalidOutside.error.includes('ignore_docroot'));

const overrideWorks = PathValidator.validatePath('README.md', 'docs', {
  ignore_docroot: true,
  operation: 'read'
});
test('  Override with ignore_docroot=true works', overrideWorks.valid === true);

const noDocrootAlwaysValid = PathValidator.validatePath('any/file.md', '', {
  ignore_docroot: false,
  operation: 'read'
});
test('  No docroot (empty) always valid', noDocrootAlwaysValid.valid === true);

// Test 5: PathValidator.normalizePath()
console.log('\n5. PathValidator.normalizePath()');
test('  "./file.md" normalizes to "file.md"', PathValidator.normalizePath('./file.md') === 'file.md');
test('  "/file.md" normalizes to "file.md"', PathValidator.normalizePath('/file.md') === 'file.md');
test('  "dir/" normalizes to "dir"', PathValidator.normalizePath('dir/') === 'dir');
test('  "dir/file.md" stays "dir/file.md"', PathValidator.normalizePath('dir/file.md') === 'dir/file.md');

// Test 6: Error message quality
console.log('\n6. Error Message Quality');
const errorMsg = PathValidator.generateDocrootError('README.md', 'docs', 'read');
test('  Error has message property', errorMsg.message && errorMsg.message.length > 0);
test('  Error has reason property', errorMsg.reason === 'outside_docroot');
test('  Message mentions the path', errorMsg.message.includes('README.md'));
test('  Message mentions the docroot', errorMsg.message.includes('docs'));
test('  Message offers ignore_docroot solution', errorMsg.message.includes('ignore_docroot'));
test('  Message offers .mcp-config.json solution', errorMsg.message.includes('.mcp-config.json'));

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('\n🎉 Core docroot enforcement services are working correctly!');
  console.log('Ready to proceed with schema updates and full integration testing.\n');
  process.exit(0);
}
