#!/usr/bin/env node
// Test for dot-file filtering feature (v4.0.0)
// Verifies that files starting with "." are blocked by default

const PathValidator = require('../src/services/path-validator.cjs');

console.log('Testing dot-file filtering...\n');

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

// Test hasDotComponents()
test('hasDotComponents() detects files starting with dot', () => {
  assert(PathValidator.hasDotComponents('.gitignore') === true, '.gitignore should be detected');
  assert(PathValidator.hasDotComponents('.github/workflows/ci.yml') === true, '.github path should be detected');
  assert(PathValidator.hasDotComponents('docs/.vscode/settings.json') === true, 'nested .vscode should be detected');
});

test('hasDotComponents() allows files with dots in middle', () => {
  assert(PathValidator.hasDotComponents('version-2.0-guide.md') === false, 'dots in middle should be allowed');
  assert(PathValidator.hasDotComponents('file.name.with.dots.md') === false, 'multiple dots in middle allowed');
});

test('hasDotComponents() allows normal paths', () => {
  assert(PathValidator.hasDotComponents('policies/vacation.md') === false, 'normal path allowed');
  assert(PathValidator.hasDotComponents('README.md') === false, 'README.md allowed');
});

// Test validatePath() with dotfile filtering
test('validatePath() blocks dotfiles by default', () => {
  const result = PathValidator.validatePath('.gitignore', '', { allow_dotfiles: false });
  assert(result.valid === false, 'should block .gitignore');
  assert(result.reason === 'dotfile_blocked', 'reason should be dotfile_blocked');
});

test('validatePath() allows dotfiles with allow_dotfiles: true', () => {
  const result = PathValidator.validatePath('.gitignore', '', { allow_dotfiles: true });
  assert(result.valid === true, 'should allow .gitignore with override');
});

test('validatePath() blocks nested dotfiles', () => {
  const result = PathValidator.validatePath('docs/.vscode/settings.json', '', { allow_dotfiles: false });
  assert(result.valid === false, 'should block nested dotfile');
  assert(result.reason === 'dotfile_blocked', 'reason should be dotfile_blocked');
});

test('validatePath() allows normal files', () => {
  const result = PathValidator.validatePath('policies/vacation.md', '', { allow_dotfiles: false });
  assert(result.valid === true, 'should allow normal file');
});

// Test dotfile filtering with docroot
test('dotfile filtering runs before docroot check', () => {
  // Even with ignore_docroot: true, dotfiles should be blocked unless allow_dotfiles: true
  const result = PathValidator.validatePath('.github/ci.yml', 'docs', {
    ignore_docroot: true,
    allow_dotfiles: false
  });
  assert(result.valid === false, 'dotfile should be blocked even with ignore_docroot');
  assert(result.reason === 'dotfile_blocked', 'reason should be dotfile_blocked');
});

test('both overrides work together', () => {
  const result = PathValidator.validatePath('.github/ci.yml', 'docs', {
    ignore_docroot: true,
    allow_dotfiles: true
  });
  assert(result.valid === true, 'both overrides should allow access');
});

// Edge cases
test('empty path should not be considered dotfile', () => {
  assert(PathValidator.hasDotComponents('') === false, 'empty path not a dotfile');
});

test('single dot path should be blocked', () => {
  assert(PathValidator.hasDotComponents('.') === true, 'single dot should be blocked');
});

test('path with only slashes should not be dotfile', () => {
  assert(PathValidator.hasDotComponents('/') === false, '/ not a dotfile');
  assert(PathValidator.hasDotComponents('//') === false, '// not a dotfile');
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
