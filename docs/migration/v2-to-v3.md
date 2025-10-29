# Migration Guide: v2.x to v3.0.0

**Version**: 3.0.0
**Breaking Changes**: Yes
**Migration Effort**: Low to Medium

---

## Executive Summary

Version 3.0.0 introduces **breaking changes** focused on minimizing token usage and improving configurability. The primary changes affect the `get_repository_catalog` tool output format.

**Key Changes**:
- Removed hierarchical `tree` structure (use flat `files` list)
- Simplified file entries (only `path` and `size`)
- Renamed `flat_list` → `files`
- Added docroot configuration support
- Tool reordering (`get_repository_catalog` now first)

**Expected Impact**:
- ~60-70% reduction in catalog output size
- ~5,500 tokens saved per catalog call (40-file repo)
- Consumers must derive filename/folder from path if needed

---

## Breaking Changes

### 1. Catalog Output Structure

#### `tree` Property Removed

**v2.1.0**:
```json
{
  "tree": {
    ".claude": {
      ".claude": [...]
    },
    "docs": {
      "prompts": {...}
    }
  },
  "flat_list": [...]
}
```

**v3.0.0**:
```json
{
  "files": [...]  // No tree property
}
```

**Migration**: If you were using `tree`, switch to `files` and build tree client-side if needed.

---

#### `flat_list` Renamed to `files`

**v2.1.0**:
```javascript
const files = catalog.flat_list;
```

**v3.0.0**:
```javascript
const files = catalog.files;  // Renamed property
```

**Migration**: Simple property rename.

---

### 2. File Entry Format Simplified

#### Removed Fields

**v2.1.0** (5 fields):
```json
{
  "path": "docs/policy.md",
  "name": "policy.md",           // ← Removed
  "size": 784,
  "extension": ".md",            // ← Removed
  "folder": "docs"               // ← Removed
}
```

**v3.0.0** (2 fields):
```json
{
  "path": "docs/policy.md",
  "size": 784
}
```

#### Derive Missing Fields Client-Side

```javascript
// Extract filename
const name = file.path.split('/').pop();

// Extract extension
const extension = file.path.match(/\.[^.]+$/)?.[0] || '';

// Extract folder
const folder = file.path.split('/').slice(0, -1).join('/') || '(root)';

// Example: Complete file object
const enrichedFile = {
  ...file,
  name: file.path.split('/').pop(),
  extension: file.path.match(/\.[^.]+$/)?.[0] || '',
  folder: file.path.split('/').slice(0, -1).join('/') || '(root)'
};
```

**Migration**: Add derivation logic to your code.

---

### 3. Metadata Changes

#### Removed Fields

**v2.1.0**:
```json
{
  "scanned_path": "(root)",     // ← Removed
  "indexed_at": "2025-...",      // ← Removed
  "statistics": {
    "total_size_bytes": 235562,  // ← Removed
    "total_size_human": "230 KB" // ← Removed
  }
}
```

**v3.0.0**:
```json
{
  "docroot": "(root)",           // ← New (replaces scanned_path)
  "cache_expires_at": "2025-...", // ← Kept (indexed_at removed)
  "statistics": {
    "total_size": "230 KB"       // ← Single field (human-readable)
  }
}
```

**Migration**:
- Use `docroot` instead of `scanned_path`
- Use `cache_expires_at` instead of `indexed_at`
- Use `total_size` instead of `total_size_bytes` or `total_size_human`

---

### 4. Tool Order Changed

**v2.1.0** (tools array):
1. `create_or_update_file`
2. `get_file`
3. ...
4. `get_repository_catalog` (last)

**v3.0.0** (tools array):
1. `get_repository_catalog` (first) ← Moved
2. `create_or_update_file`
3. `get_file`
4. ...

**Migration**: No code changes needed, but catalog tool now appears first in tool lists.

---

## New Features

### Docroot Configuration

Limit catalog scope to a specific subfolder within the repository.

#### Configuration Levels

**1. Server-level Default** (manifest.json):
```json
"default_docroot": "docs"
```

**2. Per-repository Override** (.mcp-config.json in repo root):
```json
{
  "mcp": {
    "docroot": "documentation",
    "include_extensions": [".md", ".txt", ".pdf"]
  }
}
```

**3. Tool Parameter Override** (per-call):
```javascript
get_repository_catalog({
  owner: "myorg",
  repo: "myrepo",
  path: "archive"  // Overrides all defaults
})
```

#### Priority

1. Tool `path` parameter (highest)
2. Repo `.mcp-config.json` docroot
3. Server `default_docroot`
4. Repository root (lowest)

---

## Migration Steps

### Step 1: Update Code to Handle New Format

**Before (v2.1.0)**:
```javascript
async function processCatalog(catalog) {
  const files = catalog.flat_list;

  files.forEach(file => {
    console.log(`File: ${file.name}`);
    console.log(`Folder: ${file.folder}`);
    console.log(`Extension: ${file.extension}`);
  });

  console.log(`Scanned: ${catalog.scanned_path}`);
  console.log(`Size: ${catalog.statistics.total_size_human}`);
}
```

**After (v3.0.0)**:
```javascript
async function processCatalog(catalog) {
  const files = catalog.files;  // ← Renamed

  files.forEach(file => {
    // Derive missing fields
    const name = file.path.split('/').pop();
    const folder = file.path.split('/').slice(0, -1).join('/') || '(root)';
    const extension = file.path.match(/\.[^.]+$/)?.[0] || '';

    console.log(`File: ${name}`);
    console.log(`Folder: ${folder}`);
    console.log(`Extension: ${extension}`);
  });

  console.log(`Scanned: ${catalog.docroot}`);  // ← Renamed
  console.log(`Size: ${catalog.statistics.total_size}`);  // ← Simplified
}
```

---

### Step 2: Remove Tree Usage

**Before (v2.1.0)**:
```javascript
// Using tree structure
function displayTree(tree) {
  Object.entries(tree).forEach(([folder, contents]) => {
    if (Array.isArray(contents)) {
      console.log(`Folder: ${folder}`);
      contents.forEach(file => console.log(`  - ${file.name}`));
    } else {
      // Nested folders
      displayTree(contents);
    }
  });
}

displayTree(catalog.tree);
```

**After (v3.0.0)** - Option A (build tree client-side):
```javascript
// Build tree from flat list
function buildTree(files) {
  const tree = {};

  files.forEach(file => {
    const folder = file.path.split('/').slice(0, -1).join('/') || '(root)';
    if (!tree[folder]) tree[folder] = [];
    tree[folder].push(file);
  });

  return tree;
}

const tree = buildTree(catalog.files);
displayTree(tree);
```

**After (v3.0.0)** - Option B (use flat list directly):
```javascript
// Group by folder manually
const byFolder = catalog.files.reduce((acc, file) => {
  const folder = file.path.split('/').slice(0, -1).join('/') || '(root)';
  if (!acc[folder]) acc[folder] = [];
  acc[folder].push(file);
  return acc;
}, {});

Object.entries(byFolder).forEach(([folder, files]) => {
  console.log(`Folder: ${folder}`);
  files.forEach(file => {
    const name = file.path.split('/').pop();
    console.log(`  - ${name}`);
  });
});
```

---

### Step 3: Configure Docroot (Optional)

If you want to limit catalog scope:

**Option 1: Server-level** (for all repositories):
```bash
# Set environment variable or config
export GH_DEFAULT_DOCROOT="docs"
```

**Option 2: Per-repository** (create `.mcp-config.json`):
```bash
# In your repository root
cat > .mcp-config.json << 'EOF'
{
  "mcp": {
    "docroot": "documentation",
    "include_extensions": [".md", ".txt"]
  }
}
EOF

# Commit to repository
git add .mcp-config.json
git commit -m "Configure MCP docroot"
git push
```

**Option 3: Per-call** (tool parameter):
```javascript
const catalog = await get_repository_catalog({
  owner: "myorg",
  repo: "myrepo",
  path: "docs/guides"  // Scan only this subfolder
});
```

---

## Example: Repository Browser Update

**Before (v2.1.0)**:
```javascript
const CATALOG_DATA = {
  flat_list: [
    {
      path: "docs/policy.md",
      name: "policy.md",
      size: 784,
      extension: ".md",
      folder: "docs"
    }
  ]
};

// Use directly
const files = CATALOG_DATA.flat_list;
files.forEach(file => {
  console.log(file.name, file.folder, file.extension);
});
```

**After (v3.0.0)**:
```javascript
const CATALOG_DATA = {
  files: [
    {
      path: "docs/policy.md",
      size: 784
    }
  ]
};

// Enrich files if needed
const enrichedFiles = CATALOG_DATA.files.map(file => ({
  ...file,
  name: file.path.split('/').pop(),
  extension: file.path.match(/\.[^.]+$/)?.[0] || '',
  folder: file.path.split('/').slice(0, -1).join('/') || '(root)'
}));

enrichedFiles.forEach(file => {
  console.log(file.name, file.folder, file.extension);
});
```

---

## Testing Your Migration

### Validate Catalog Output

```javascript
// Test helper
function validateV3Catalog(catalog) {
  // Check required fields
  assert(catalog.repository, 'Missing repository');
  assert(catalog.branch, 'Missing branch');
  assert(catalog.docroot !== undefined, 'Missing docroot');
  assert(catalog.cache_expires_at, 'Missing cache_expires_at');
  assert(catalog.statistics, 'Missing statistics');
  assert(catalog.files, 'Missing files array');

  // Check removed fields
  assert(!catalog.tree, 'tree should be removed');
  assert(!catalog.flat_list, 'flat_list renamed to files');
  assert(!catalog.scanned_path, 'scanned_path renamed to docroot');
  assert(!catalog.indexed_at, 'indexed_at removed');

  // Check statistics
  assert(catalog.statistics.total_size, 'Missing total_size');
  assert(!catalog.statistics.total_size_bytes, 'total_size_bytes removed');
  assert(!catalog.statistics.total_size_human, 'total_size_human removed');

  // Check file format
  catalog.files.forEach(file => {
    assert(file.path, 'File missing path');
    assert(file.size >= 0, 'File missing size');
    assert(!file.name, 'File should not have name field');
    assert(!file.extension, 'File should not have extension field');
    assert(!file.folder, 'File should not have folder field');
  });

  console.log('✓ Catalog format is valid for v3.0.0');
}

// Use it
const catalog = await get_repository_catalog({...});
validateV3Catalog(catalog);
```

---

## Rollback Strategy

If you need to roll back to v2.1.0:

```bash
# Install previous version
npm install github-docs-mcp@2.1.0

# Or via git
git checkout tags/v2.1.0
```

---

## Benefits of v3.0.0

### Token Savings

**40-file repository**:
- v2.1.0: ~8,000 tokens
- v3.0.0: ~2,500 tokens
- **Savings: ~5,500 tokens (69%)**

**200-file repository**:
- v2.1.0: ~40,000 tokens
- v3.0.0: ~12,500 tokens
- **Savings: ~27,500 tokens (69%)**

### Data Reduction

**40-file repository**:
- v2.1.0: ~30 KB
- v3.0.0: ~10 KB
- **Reduction: ~67%**

---

## Support

If you encounter issues during migration:

1. Check this guide first
2. Review the [implementation plan](../new-features/v3.0.0-minimal-catalog-docroot.md)
3. File an issue: https://github.com/cto4ai/github-business-docs-mcp/issues

---

## Summary Checklist

- [ ] Update code to use `files` instead of `flat_list`
- [ ] Add client-side derivation for `name`, `extension`, `folder`
- [ ] Remove references to `tree` structure
- [ ] Update `scanned_path` → `docroot`
- [ ] Update `indexed_at` → `cache_expires_at`
- [ ] Update `total_size_bytes` → `total_size`
- [ ] Test catalog output format
- [ ] (Optional) Configure docroot if needed
- [ ] Update documentation/examples

---

**Version**: 3.0.0
**Last Updated**: October 25, 2025
