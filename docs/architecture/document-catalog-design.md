# Phase 2: Document Catalog Implementation Plan

**Version:** 2.1.0
**Date:** October 22, 2025
**Status:** Ready for Implementation

---

## Problem Statement

The current GitHub Docs MCP requires multiple sequential API calls to discover all documents in a repository. For a repository with 50 documents across 10 folders, this means 10+ separate `list_contents` calls - each waiting for the previous to complete.

**The Skill's Challenge:**
- Must use primitives (`list_contents`) to drill down through directories
- Each directory = one API call
- Deep repos = slow, sequential discovery
- High token cost for repeated traversals

**What's Needed:**
A lightweight document catalog that presents the entire repository structure in a single response - similar to how Skills present their metadata efficiently.

---

## Solution Overview

**Add 7th Tool:** `get_repository_catalog`

**What It Does:**
- Returns complete document catalog in **1 API call** (fast mode)
- Provides lightweight metadata: paths, sizes, types
- Structures data as both tree (hierarchical) and flat list
- 5-minute in-memory cache for repeated queries

**Architecture Decision: Pure In-Memory Storage**
- Catalog lives in MCP server process memory
- 5-minute TTL (time-to-live)
- Lost on restart, but rebuild cost is minimal (1 API call)
- No repository pollution, no file I/O complexity

---

## Design Philosophy: Skills-Like Structure

Just as Skills present themselves efficiently:
```json
{
  "name": "skill-name",
  "description": "Brief summary",
  "tools": ["tool1", "tool2"]
}
```

Documents should present themselves the same way:
```json
{
  "path": "docs/guides/getting-started.md",
  "title": "Getting Started Guide",
  "size": 2048,
  "summary": "Introduction to using the platform"
}
```

---

## Technical Specification

### New Tool: `get_repository_catalog`

**Input Schema:**
```javascript
{
  name: "get_repository_catalog",
  description: "Get a lightweight catalog of all documents in repository with metadata",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (optional, uses default)"
      },
      repo: {
        type: "string",
        description: "Repository name (optional, uses default)"
      },
      path: {
        type: "string",
        description: "Root path to catalog (optional, default: '' = root)"
      },
      include_extensions: {
        type: "array",
        items: { type: "string" },
        description: "File extensions to include (optional, default: ['.md', '.txt'])"
      }
    }
  }
}
```

**Output Format:**
```json
{
  "repository": "owner/repo",
  "scanned_path": "docs",
  "indexed_at": "2025-10-22T21:30:00Z",
  "cache_expires_at": "2025-10-22T21:35:00Z",
  "statistics": {
    "total_files": 47,
    "total_folders": 8,
    "total_size_bytes": 125440,
    "file_types": {
      ".md": 42,
      ".txt": 5
    }
  },
  "tree": {
    "docs": {
      "guides": [
        {
          "path": "docs/guides/getting-started.md",
          "name": "getting-started.md",
          "size": 2048,
          "extension": ".md"
        },
        {
          "path": "docs/guides/installation.md",
          "name": "installation.md",
          "size": 1536,
          "extension": ".md"
        }
      ],
      "api": [
        {
          "path": "docs/api/reference.md",
          "name": "reference.md",
          "size": 4096,
          "extension": ".md"
        }
      ]
    }
  },
  "flat_list": [
    {
      "path": "docs/guides/getting-started.md",
      "name": "getting-started.md",
      "size": 2048,
      "extension": ".md",
      "folder": "docs/guides"
    },
    {
      "path": "docs/guides/installation.md",
      "name": "installation.md",
      "size": 1536,
      "extension": ".md",
      "folder": "docs/guides"
    },
    {
      "path": "docs/api/reference.md",
      "name": "reference.md",
      "size": 4096,
      "extension": ".md",
      "folder": "docs/api"
    }
  ]
}
```

---

## Implementation Architecture

### Files to Create

#### 1. `src/services/document-catalog-service.cjs`
**Purpose:** Core catalog building logic

**Key Functions:**
```javascript
class DocumentCatalogService {
  constructor(githubApiService) {
    this.api = githubApiService;
    this.cache = new Map(); // In-memory cache
  }

  async buildCatalog(owner, repo, path = '', extensions = ['.md', '.txt']) {
    // Check cache first
    // Use GitHub Tree API: GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
    // Filter by extensions
    // Build tree structure
    // Build flat list
    // Calculate statistics
    // Cache for 5 minutes
    // Return catalog
  }

  getCachedCatalog(owner, repo, path) {
    // Check cache with TTL
  }

  clearCache(owner, repo) {
    // Manual cache invalidation if needed
  }
}
```

**GitHub Tree API Usage:**
```javascript
const response = await this.api.makeGitHubRequest(
  `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
);

// Returns:
// {
//   sha: "...",
//   tree: [
//     { path: "docs/guide.md", type: "blob", size: 2048, sha: "..." },
//     { path: "docs/api", type: "tree", sha: "..." },
//     ...
//   ]
// }
```

**Key Implementation Details:**
- Use existing `github-api.cjs` methods (no new API client code)
- Single API call via GitHub Tree API with `recursive=1`
- Filter results by file extension
- Build two data structures: tree (nested) and flat (linear)
- Cache with 5-minute TTL
- Error handling for large repos (GitHub limits: 100K entries)

#### 2. `src/handlers/document-catalog-minimal.cjs`
**Purpose:** MCP tool handler

```javascript
async function getRepositoryCatalogHandler(params, defaultRepo, apiService) {
  const owner = params.owner || defaultRepo.owner;
  const repo = params.repo || defaultRepo.repo;
  const path = params.path || '';
  const extensions = params.include_extensions || ['.md', '.txt'];

  try {
    // Create catalog service
    const catalogService = new DocumentCatalogService(apiService);

    // Build catalog (checks cache automatically)
    const catalog = await catalogService.buildCatalog(
      owner,
      repo,
      path,
      extensions
    );

    return {
      success: true,
      data: catalog
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getRepositoryCatalogHandler
};
```

#### 3. Update `src/utils/tools-config-minimal.cjs`
**Add 7th tool definition:**

```javascript
const minimalToolsConfig = {
  // ... existing 6 tools ...

  // 7. Get repository catalog
  get_repository_catalog: {
    name: "get_repository_catalog",
    description: "Get lightweight catalog of all documents in repository with metadata",
    inputSchema: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "Repository owner (optional, uses default)"
        },
        repo: {
          type: "string",
          description: "Repository name (optional, uses default)"
        },
        path: {
          type: "string",
          description: "Root path to catalog (optional, default: root)"
        },
        include_extensions: {
          type: "array",
          items: { type: "string" },
          description: "File extensions to include (optional, default: ['.md', '.txt'])"
        }
      }
    }
  }
};

module.exports = minimalToolsConfig;

// Updated Stats:
// - Tools: 7 (up from 6)
// - Estimated tokens: ~750 (up from ~600)
```

#### 4. Update `src/index.cjs`
**Register new handler:**

```javascript
const documentCatalogMinimal = require("./handlers/document-catalog-minimal.cjs");

// In setupToolHandlers(), add new case:
switch (toolName) {
  // ... existing 6 tools ...

  case "get_repository_catalog":
    result = await documentCatalogMinimal.getRepositoryCatalogHandler(
      finalArgs,
      defaults,
      this.api
    );
    break;
}
```

---

## Cache Strategy

### In-Memory Cache Implementation

**Structure:**
```javascript
this.cache = new Map();
// Key format: "owner/repo/path"
// Value format: { catalog, timestamp }
```

**TTL Logic:**
```javascript
getCachedCatalog(owner, repo, path = '') {
  const key = `${owner}/${repo}/${path}`;
  const cached = this.cache.get(key);

  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  const TTL = 5 * 60 * 1000; // 5 minutes

  if (age > TTL) {
    this.cache.delete(key);
    return null;
  }

  return cached.catalog;
}
```

**Benefits:**
- Repeated queries within 5 minutes = instant response
- No stale data (auto-expires)
- No disk I/O
- No repository pollution
- Simple implementation

**Memory Usage:**
- Typical catalog: ~50KB for 100 files
- 10 cached repos: ~500KB
- Negligible memory footprint

---

## Performance Analysis

### Current Approach (Sequential list_contents)

**Example: 50 documents in 10 folders**
```
Call 1:  list_contents("") → 200 tokens, 300ms
Call 2:  list_contents("docs") → 250 tokens, 300ms
Call 3:  list_contents("docs/guides") → 300 tokens, 300ms
Call 4:  list_contents("docs/api") → 280 tokens, 300ms
...
Call 10: list_contents("docs/references") → 270 tokens, 300ms

Total: 10 API calls, ~2,500 tokens, ~3 seconds
```

### With Document Catalog

**First call (builds catalog):**
```
Call 1: get_repository_catalog() → ~800 tokens, 500ms
- GitHub Tree API (recursive=1)
- Returns ALL 50 documents
- Caches for 5 minutes

Total: 1 API call, ~800 tokens, ~500ms
```

**Subsequent calls (within 5 min):**
```
Call N: get_repository_catalog() → ~800 tokens, <10ms
- Returns cached catalog
- Zero API calls

Total: 0 API calls, ~800 tokens, instant
```

**Efficiency Gains:**
- **API calls:** 90% reduction (10 → 1)
- **Tokens:** 68% reduction (2,500 → 800)
- **Time:** 83% reduction (3s → 0.5s)
- **Rate limit:** 90% reduction (0.2% → 0.02%)

---

## Token Efficiency

### Catalog Size Estimates

**Small repo (20 files, 5 folders):**
- Tree structure: ~300 tokens
- Flat list: ~200 tokens
- Statistics: ~50 tokens
- **Total: ~550 tokens**

**Medium repo (100 files, 15 folders):**
- Tree structure: ~500 tokens
- Flat list: ~400 tokens
- Statistics: ~80 tokens
- **Total: ~980 tokens**

**Large repo (500 files, 50 folders):**
- Tree structure: ~1,500 tokens
- Flat list: ~1,800 tokens
- Statistics: ~150 tokens
- **Total: ~3,450 tokens**

**Comparison to Current Approach:**
- Small: 550 vs 1,500 tokens (63% reduction)
- Medium: 980 vs 3,500 tokens (72% reduction)
- Large: 3,450 vs 12,000+ tokens (71% reduction)

---

## Use Cases Enabled

### 1. Instant Repository Overview
**Before:**
```
User: "Show me all the documentation"
Claude: [10 sequential API calls...]
Claude: "I found docs in several folders. Let me list each one..."
User: [waits 3+ seconds]
```

**After:**
```
User: "Show me all the documentation"
Claude: [1 API call]
Claude: "I found 47 documents across 8 folders:
- docs/guides: 15 files (32 KB)
- docs/api: 12 files (48 KB)
- docs/tutorials: 10 files (28 KB)
Would you like to explore a specific section?"
User: [instant response]
```

### 2. Smart Document Discovery
```
User: "Find all API documentation"
Claude: [Reads catalog, filters by path pattern "api"]
Claude: "Found 12 API documents:
- docs/api/reference.md (8 KB)
- docs/api/authentication.md (3 KB)
..."
```

### 3. Repository Health Check
```
User: "Are there any large files I should know about?"
Claude: [Reads catalog, filters by size > 10KB]
Claude: "Found 3 files over 10 KB:
- docs/comprehensive-guide.md (24 KB)
- docs/api/full-reference.md (18 KB)
- docs/tutorials/complete-walkthrough.md (15 KB)"
```

### 4. Structure Analysis
```
User: "How is the documentation organized?"
Claude: [Reads catalog tree structure]
Claude: "Your docs are organized into:
- guides/ (15 files) - Getting started content
- api/ (12 files) - API references
- tutorials/ (10 files) - Step-by-step guides
- references/ (10 files) - Additional resources"
```

### 5. Foundation for Future Features
- Document recommendations
- Orphan file detection
- Structure validation
- Template compliance checking
- Duplicate content detection

---

## Version Update

**From:** v2.0.1 (Zero-config bug fix)
**To:** v2.1.0 (New feature - Document Catalog)

**Semantic versioning rationale:**
- MAJOR.MINOR.PATCH
- 2.0.1 → 2.1.0
- MINOR bump: New feature added (backward compatible)
- No breaking changes to existing 6 tools

**Files to update:**
- `manifest.json`: version = "2.1.0"
- `package.json`: version = "2.1.0"
- `README.md`: Document new 7th tool
- `build script`: Update package name to `github-docs-mcp-2.1.0.mcpb`

---

## Testing Strategy

### Test Scenarios

#### 1. Small Repository Test
**Repo:** 10 docs, 3 folders, simple structure
**Verify:**
- ✅ Catalog builds successfully
- ✅ All 10 files discovered
- ✅ Tree structure accurate
- ✅ Flat list complete
- ✅ Statistics correct

#### 2. Medium Repository Test
**Repo:** 50 docs, 10 folders, moderate nesting
**Verify:**
- ✅ Performance acceptable (~500ms)
- ✅ All files discovered
- ✅ Deep nesting handled
- ✅ Extension filtering works

#### 3. Large Repository Test
**Repo:** 200+ docs, 20+ folders, complex structure
**Verify:**
- ✅ Scalability (< 2 seconds)
- ✅ No data loss
- ✅ Memory usage reasonable

#### 4. Cache Test
**Steps:**
1. Call `get_repository_catalog()` → Builds catalog
2. Call again immediately → Returns cached version
3. Wait 6 minutes
4. Call again → Rebuilds catalog

**Verify:**
- ✅ First call: 1 API call
- ✅ Second call: 0 API calls, instant
- ✅ Third call: 1 API call (cache expired)

#### 5. Error Handling Test
**Scenarios:**
- Invalid repository
- Network error
- Rate limit exceeded
- Empty repository
- Repo with only non-document files

**Verify:**
- ✅ Graceful error messages
- ✅ No crashes
- ✅ Helpful feedback to user

---

## Breaking Changes

**None!** This is a purely additive release:
- All 6 existing tools unchanged
- New 7th tool adds capability
- Skills can use it or ignore it
- Fully backward compatible

---

## Implementation Checklist

### Phase 2A: Document Catalog (v2.1.0)

**Code Implementation:**
- [ ] Create `src/services/document-catalog-service.cjs`
  - [ ] GitHub Tree API integration
  - [ ] Extension filtering
  - [ ] Tree structure builder
  - [ ] Flat list builder
  - [ ] Statistics calculator
  - [ ] In-memory cache with TTL
  - [ ] Error handling

- [ ] Create `src/handlers/document-catalog-minimal.cjs`
  - [ ] Handler function
  - [ ] Parameter validation
  - [ ] Response formatting
  - [ ] Error handling

- [ ] Update `src/utils/tools-config-minimal.cjs`
  - [ ] Add 7th tool definition
  - [ ] Update comments/stats

- [ ] Update `src/index.cjs`
  - [ ] Import new handler
  - [ ] Add switch case
  - [ ] Register tool

**Version Updates:**
- [ ] Update `manifest.json` → 2.1.0
- [ ] Update `package.json` → 2.1.0
- [ ] Update `scripts/build-mcpb.sh` → 2.1.0 references

**Documentation:**
- [ ] Update `README.md` - Add 7th tool to list
- [ ] Update `README-MCPB.md` - Add tool description
- [ ] Create usage examples
- [ ] Update tool count (6 → 7)

**Testing:**
- [ ] Test with small repo (10 files)
- [ ] Test with medium repo (50 files)
- [ ] Test with large repo (200+ files)
- [ ] Test cache functionality
- [ ] Test error scenarios
- [ ] Verify token counts

**Build & Release:**
- [ ] Run build script
- [ ] Generate `github-docs-mcp-2.1.0.mcpb`
- [ ] Test installation (zero-config still works)
- [ ] Verify new tool appears in Claude Desktop
- [ ] Test catalog functionality

**Git:**
- [ ] Commit changes
- [ ] Tag v2.1.0
- [ ] Push to remote
- [ ] Update release notes

---

## Success Criteria

**Must have:**
- ✅ `get_repository_catalog` tool functional
- ✅ Single API call discovers all documents
- ✅ Tree and flat list structures returned
- ✅ Statistics accurate
- ✅ Cache works (5-minute TTL)
- ✅ All existing 6 tools unchanged
- ✅ Zero-config installation preserved

**Performance targets:**
- ✅ Catalog build time < 1 second (medium repos)
- ✅ Cache hit response time < 10ms
- ✅ Token usage < 1,000 for typical repo
- ✅ Memory usage < 1MB for cached catalogs

**Quality checks:**
- ✅ No breaking changes
- ✅ Error handling comprehensive
- ✅ Code follows existing patterns
- ✅ Documentation complete
- ✅ Tests pass

---

## Future Enhancements (Post-2.1.0)

### Phase 2B: Enhanced Metadata (v2.2.0)
- Title extraction (first H1 from files)
- Summary extraction (first paragraph)
- Configurable via `include_metadata` parameter
- Fetch only top N files to minimize API calls

### Phase 2C: Advanced Features (v2.3.0+)
- Last modified dates (via Git commits)
- Document relationships (link detection)
- Frontmatter parsing (YAML/TOML)
- Tag/category support
- Change detection (stale content alerts)
- Document templates detection

### Phase 2D: Performance Optimizations
- Persistent cache (optional disk storage)
- Incremental index updates
- Background refresh
- Compression for large catalogs

---

## References

**GitHub API Documentation:**
- Tree API: https://docs.github.com/en/rest/git/trees
- Contents API: https://docs.github.com/en/rest/repos/contents

**Related Files:**
- Current 6 tools: `src/utils/tools-config-minimal.cjs`
- GitHub API client: `src/services/github-api.cjs`
- Cache service: `src/services/cache-service.cjs`
- MCP server: `src/index.cjs`

---

**Plan Status:** Ready for Implementation
**Target Version:** 2.1.0
**Estimated Implementation Time:** 2-3 hours
**Risk Level:** Low (additive, no breaking changes)
