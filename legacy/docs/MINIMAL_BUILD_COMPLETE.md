# Minimal MCP Build Complete

**Date:** 2025-10-18
**Branch:** minimal-docs-mcp
**Status:** Core implementation complete, ready for OAuth integration

---

## What Was Built

### 1. Tool Configuration
**File:** [src/utils/tools-config-minimal.cjs](src/utils/tools-config-minimal.cjs)
**Size:** ~100 lines (vs 2,851 in full version)
**Tools:** 6 (vs 89 in full version)

```javascript
const minimalToolsConfig = {
  create_or_update_file,  // Combines create + update
  get_file,               // Read file contents
  list_contents,          // Browse directories
  delete_file,            // Remove files
  search_code,            // Find documentation
  list_commits            // View file history
};
```

### 2. File Management Handler
**File:** [src/handlers/file-management-minimal.cjs](src/handlers/file-management-minimal.cjs)
**Size:** ~127 lines
**Functions:**
- `createOrUpdateFileHandler` - Smart create/update with auto-detection
- `getFileHandler` - Read and decode file contents
- `deleteFileHandler` - Delete files with proper SHA handling

**Key Feature:** Combined create/update into single tool that automatically detects if file exists and gets SHA if needed.

### 3. Repository Handler
**File:** [src/handlers/repository-minimal.cjs](src/handlers/repository-minimal.cjs)
**Size:** ~54 lines
**Functions:**
- `listContentsHandler` - Browse directory contents
- `listCommitsHandler` - View commit history with filtering

### 4. Search Handler
**File:** [src/handlers/search-minimal.cjs](src/handlers/search-minimal.cjs)
**Size:** ~34 lines
**Functions:**
- `searchCodeHandler` - Search code across repository

### 5. Minimal Server Class
**File:** [src/index-minimal.cjs](src/index-minimal.cjs)
**Size:** ~250 lines (vs 1,091 in full version)
**Features:**
- Simplified request handling
- Default repository support
- Clean error handling
- No complex filtering/allowlisting

### 6. Entry Point
**File:** [server-minimal.cjs](server-minimal.cjs)
**Size:** ~48 lines
**Features:**
- Command-line arg parsing for default repo
- SDK module loading
- Server initialization

---

## Size Comparison

| Component | Full MCP | Minimal MCP | Reduction |
|-----------|----------|-------------|-----------|
| Tool Config | 2,851 lines | ~100 lines | **96.5%** |
| Handlers | 3,576 lines | ~215 lines | **94.0%** |
| Server Class | 1,091 lines | ~250 lines | **77.1%** |
| Entry Point | 68 lines | 48 lines | 29.4% |
| **Total** | **7,586 lines** | **~613 lines** | **91.9%** |

---

## Files Created

```
src/utils/
  └── tools-config-minimal.cjs       ✅ Created

src/handlers/
  ├── file-management-minimal.cjs    ✅ Created
  ├── repository-minimal.cjs         ✅ Created
  └── search-minimal.cjs             ✅ Created

src/
  └── index-minimal.cjs              ✅ Created

./
  └── server-minimal.cjs             ✅ Created
```

---

## Minimal MCP Workflow Coverage

### ✅ Create Documentation
**Tool:** `create_or_update_file`
```javascript
{
  path: "docs/guide.md",
  content: "# Guide\n...",
  message: "Add user guide"
}
```

### ✅ Update Documentation
**Tool:** `create_or_update_file` (auto-detects existing file)
```javascript
{
  path: "docs/guide.md",
  content: "# Updated Guide\n...",
  message: "Update user guide"
}
```

### ✅ Read Documentation
**Tool:** `get_file`
```javascript
{
  path: "docs/guide.md"
}
```

### ✅ Browse Repository
**Tool:** `list_contents`
```javascript
{
  path: "docs/"  // List all docs
}
```

### ✅ Search Documentation
**Tool:** `search_code`
```javascript
{
  query: "authentication",
  path: "docs/"  // Optional: search in docs/ only
}
```

### ✅ View History
**Tool:** `list_commits`
```javascript
{
  path: "docs/guide.md",  // Optional: commits for specific file
  per_page: 10
}
```

### ✅ Delete Documentation
**Tool:** `delete_file`
```javascript
{
  path: "docs/old-guide.md",
  message: "Remove outdated guide"
}
```

---

## Next Steps

### Phase 3: OAuth Integration
- [ ] Port OAuth service from POC ([poc-oauth-test/oauth-test.js](../../claude/skills/poc-oauth-test/oauth-test.js))
- [ ] Create OAuth service module
- [ ] Add token storage and refresh logic
- [ ] Update handlers to use user-specific tokens
- [ ] Test user attribution in commits

### Phase 4: Testing
- [ ] Test server-minimal.cjs locally
- [ ] Verify all 6 tools work correctly
- [ ] Measure actual token usage in Claude Desktop
- [ ] Test with default repository configuration
- [ ] Validate error handling

### Phase 5: Desktop Extension Packaging
- [ ] Create manifest.json for .mcpb package
- [ ] Configure OAuth user_config with sensitive fields
- [ ] Bundle MCP with dependencies
- [ ] Test installation via double-click
- [ ] Document setup process

---

## Testing Locally (Without OAuth)

```bash
# Set environment variables
export GH_TOKEN="your_pat_here"
export GH_DEFAULT_OWNER="owner"
export GH_DEFAULT_REPO="repo"

# Run minimal server
node server-minimal.cjs
```

Or with command-line args:
```bash
node server-minimal.cjs --default-owner owner --default-repo repo
```

---

## Estimated Token Usage

| Component | Tokens |
|-----------|--------|
| Tool Definitions (6) | ~450 |
| OAuth Config (when added) | ~150 |
| Overhead | ~50 |
| **Total** | **~650** |

**Reduction from full MCP:** ~10,000 → ~650 = **93.5%** 🎯

---

## Key Design Decisions

### 1. Combined Create/Update
Instead of separate `create_file` and `update_file` tools, we have one smart tool that:
- Tries to get the file first
- If it exists, extracts SHA and updates
- If it doesn't exist, creates new
- **Saves:** 1 tool definition (~100 tokens)

### 2. Minimal Parameters
- Removed all optional pagination (page, per_page)
- Removed all sorting options (sort, direction)
- Removed all filtering (visibility, affiliation, etc.)
- Removed all default values from schema
- **Saves:** ~200-300 tokens per tool

### 3. Short Descriptions
- Full MCP: "Create or update a file in the repository. If the file exists, it will be updated; otherwise, it will be created. This operation requires..."
- Minimal: "Create or update file in repository"
- **Saves:** ~50 tokens per tool

### 4. Removed Enums
- No enum definitions for states, types, etc.
- Simple string parameters only
- **Saves:** ~30-50 tokens per tool with enums

### 5. Essential Tools Only
- Focused on docs-as-code workflow
- Removed all PR, issue, workflow, analytics tools
- **Saves:** ~9,400 tokens (83 tools × ~113 tokens avg)

---

## Dependencies

All dependencies from parent project:
- `@modelcontextprotocol/sdk` - MCP server framework
- `node-cache` - Caching (inherited, may not need)
- GitHub API via `src/services/github-api.cjs` (reused from full MCP)

No additional dependencies required! ✅

---

## Architecture

```
server-minimal.cjs (entry point)
  └── src/index-minimal.cjs (server class)
      ├── src/utils/tools-config-minimal.cjs (6 tools)
      ├── src/handlers/file-management-minimal.cjs
      ├── src/handlers/repository-minimal.cjs
      ├── src/handlers/search-minimal.cjs
      ├── src/services/github-api.cjs (reused from full MCP)
      ├── src/utils/response-formatter.cjs (reused)
      └── src/utils/error-handler.cjs (reused)
```

**Reused modules:** 3 (API service, formatters, error handler)
**New modules:** 6 (minimal config + handlers + server)

---

## Success Criteria

- ✅ **6 tools maximum** - Achieved (exactly 6)
- ✅ **<200 lines tool config** - Achieved (~100 lines, 50% of target)
- ✅ **<500 lines handler code** - Achieved (~215 lines, 43% of target)
- ⏳ **~500-800 tokens loaded** - Estimated ~650 (needs testing)
- ⏳ **90%+ reduction** - Estimated 93.5% (needs verification)
- ✅ **All docs workflows supported** - All 7 workflows covered

---

## What's NOT in Minimal MCP

These features from full MCP are intentionally excluded:

### Removed Categories (83 tools)
- ❌ Pull Requests (8 tools)
- ❌ GitHub Actions (6 tools)
- ❌ Analytics & Insights (8 tools)
- ❌ Organizations (6 tools)
- ❌ Projects & Boards (6 tools)
- ❌ Security & Webhooks (8 tools)
- ❌ Labels (4 tools)
- ❌ Milestones (4 tools)
- ❌ Issues (7 of 8 tools)
- ❌ Comments (4 tools)
- ❌ Most Search tools (4 of 5)
- ❌ Most Repository tools (4 of 6)
- ❌ Most Branch/Commit tools (4 of 5)
- ❌ Users (1 tool)
- ❌ Advanced features (6 tools)

### Removed Features
- ❌ Tool allowlisting/blocklisting
- ❌ Repository restrictions
- ❌ Pagination options
- ❌ Sorting and filtering
- ❌ Set default repo tool (use env/args instead)
- ❌ Verbose descriptions and examples

**Trade-off:** Extreme simplicity and minimal context for focused docs-as-code use case.

---

## Notes

- This minimal MCP is **EXTREMELY** focused on docs-as-code workflow
- Perfect for teams that only need documentation management
- Can always add more tools if needed (just update config and handlers)
- OAuth integration will add ~150 tokens but provides critical user attribution
- Works standalone or as Desktop Extension (.mcpb)

---

**Ready for OAuth integration from POC!** 🚀

See:
- [POC_RESULTS.md](../../claude/skills/docs/documents-as-code-project-planning/POC_RESULTS.md) - Proof OAuth works
- [OAUTH_APPROACH.md](../../claude/skills/docs/documents-as-code-project-planning/OAUTH_APPROACH.md) - Implementation guide
- [poc-oauth-test/oauth-test.js](../../claude/skills/poc-oauth-test/oauth-test.js) - Working OAuth code
