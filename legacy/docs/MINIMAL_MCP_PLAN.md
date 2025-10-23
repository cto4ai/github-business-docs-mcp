# Minimal MCP for Docs-as-Code

**Branch:** minimal-docs-mcp
**Goal:** Reduce context overhead by 90%+
**Status:** In Progress

---

## Token Reduction Strategy

### Current Full MCP
- **Tools:** 89
- **Config Lines:** 2,851
- **Handler Lines:** ~3,576
- **Estimated Tokens:** ~10,000

### Minimal MCP (Target)
- **Tools:** 6
- **Config Lines:** ~100
- **Handler Lines:** ~400
- **Estimated Tokens:** ~500-800

**Reduction: 92-95%** 🎯

---

## The 6 Essential Tools

### 1. `create_or_update_file`
**Purpose:** Create new docs or update existing (auto-detects)
**Replaces:** create_file + update_file (2 → 1 tool)
**Params:** owner, repo, path, content, message
**Token Cost:** ~100 tokens

### 2. `get_file`
**Purpose:** Read file contents
**Params:** owner, repo, path
**Token Cost:** ~60 tokens

### 3. `list_contents`
**Purpose:** Browse directories
**Params:** owner, repo, path (optional)
**Token Cost:** ~70 tokens

### 4. `delete_file`
**Purpose:** Remove files
**Params:** owner, repo, path, message
**Token Cost:** ~80 tokens

### 5. `search_code`
**Purpose:** Find documentation
**Params:** query, repo (optional)
**Token Cost:** ~70 tokens

### 6. `list_commits`
**Purpose:** View file history
**Params:** owner, repo, path (optional)
**Token Cost:** ~70 tokens

**Total: ~450-550 tokens**

---

## What Was Removed

### Entire Categories (83 tools deleted)
- ❌ Pull Requests (8 tools)
- ❌ GitHub Actions/Workflows (6 tools)
- ❌ Analytics (8 tools)
- ❌ Organizations (6 tools)
- ❌ Projects (6 tools)
- ❌ Security/Webhooks (8 tools)
- ❌ Labels (4 tools)
- ❌ Milestones (4 tools)
- ❌ Most Issue tools (7 of 8)
- ❌ Most Search tools (4 of 5)
- ❌ Most Repository tools (4 of 6)
- ❌ Most Branch/Commit tools (4 of 5)
- ❌ All Comment tools (4 tools)
- ❌ User tools (1 tool)
- ❌ Advanced features (6 tools)

### Parameter Optimizations
- ❌ Removed all pagination params (per_page, page)
- ❌ Removed all sorting options (sort, direction)
- ❌ Removed all filtering options (visibility, type, etc.)
- ❌ Removed all optional params
- ❌ Removed all default values
- ❌ Removed all enum definitions
- ❌ Stripped descriptions to <5 words

---

## Handler Files

### Keep (3 files, ~400 lines)
- ✅ `file-management-minimal.cjs` - File operations
- ✅ `repository-minimal.cjs` - List contents, commits
- ✅ `search-minimal.cjs` - Search code

### Delete (15 files, ~3,176 lines)
- ❌ advanced-features.cjs
- ❌ analytics.cjs
- ❌ branches-commits.cjs (mostly)
- ❌ comments.cjs
- ❌ enhanced-pull-requests.cjs
- ❌ issues.cjs (mostly)
- ❌ labels.cjs
- ❌ milestones.cjs
- ❌ organizations.cjs
- ❌ projects.cjs
- ❌ pull-requests.cjs
- ❌ security.cjs
- ❌ users.cjs
- ❌ workflows.cjs

---

## Docs-as-Code Workflow Coverage

### Create Documentation ✅
```
Tool: create_or_update_file
Flow: User asks to create → Skill calls tool → File created
```

### Update Documentation ✅
```
Tool: create_or_update_file (auto-detects existing file)
Flow: User asks to update → Skill gets file → Updates → Commits
```

### Find Documentation ✅
```
Tool: list_contents + search_code
Flow: User asks to find → Skill searches/browses → Shows results
```

### View History ✅
```
Tool: list_commits
Flow: User asks for history → Skill shows commits → Attribution visible
```

### Delete Documentation ✅
```
Tool: delete_file
Flow: User asks to delete → Confirmation → Delete with commit
```

### Browse Repository ✅
```
Tool: list_contents
Flow: User explores → Skill lists dirs/files → Navigation
```

**All workflows supported with just 6 tools!**

---

## OAuth Integration

Will add OAuth from POC:
- User-to-server tokens
- Individual user attribution
- Token storage & refresh
- Secure credential handling

**Token overhead:** ~200 additional tokens for OAuth config

**Total with OAuth:** ~650-750 tokens (still 92-93% reduction)

---

## Implementation Checklist

### Phase 1: Minimal Config ✅
- [x] Create tools-config-minimal.cjs (6 tools)
- [ ] Test config loads
- [ ] Measure token count

### Phase 2: Minimal Handlers ✅
- [x] Create file-management-minimal.cjs (create/update/get/delete)
- [x] Create repository-minimal.cjs (list contents, list commits)
- [x] Create search-minimal.cjs (search code)
- [x] Create index-minimal.cjs (minimal server class)
- [x] Create server-minimal.cjs (entry point)

### Phase 3: OAuth Integration
- [ ] Add OAuth service from POC
- [ ] Add token storage
- [ ] Update handlers to use user tokens
- [ ] Test user attribution

### Phase 4: Testing
- [ ] Load in Claude Desktop
- [ ] Measure actual token usage
- [ ] Test all docs-as-code workflows
- [ ] Compare with full MCP

### Phase 5: Packaging
- [ ] Package as .mcpb extension
- [ ] Create manifest.json
- [ ] Test installation
- [ ] Document usage

---

## Expected Results

### Token Comparison

| Component | Full MCP | Minimal MCP | Reduction |
|-----------|----------|-------------|-----------|
| Tool Definitions | ~10,000 | ~600 | 94% |
| OAuth Config | N/A | ~150 | N/A |
| **Total Context** | **~10,000** | **~750** | **92.5%** |

### File Size Comparison

| File | Full MCP | Minimal MCP | Reduction |
|------|----------|-------------|-----------|
| tools-config.cjs | 2,851 lines | ~100 lines | 96.5% |
| All handlers | 3,576 lines | ~400 lines | 88.8% |
| **Total Code** | **6,427 lines** | **~500 lines** | **92.2%** |

---

## Success Metrics

- ✅ 6-8 tools maximum (target: 6) ✓
- ✅ <200 lines tool config (achieved: ~100) ✓
- ⏳ <500 lines handler code (target: ~400)
- ⏳ ~500-800 tokens loaded
- ⏳ 90%+ reduction from full MCP
- ⏳ All docs-as-code workflows supported

---

## Next Steps

1. Create minimal handler files
2. Update index.cjs to use minimal config
3. Add OAuth integration
4. Test locally
5. Measure token usage
6. Package as .mcpb
7. Deploy and validate

---

## Notes

- This is an EXTREME reduction - trading features for context efficiency
- Perfect for focused docs-as-code use case
- Can always add tools back if needed
- OAuth adds ~150 tokens but provides user attribution
- Final decision: Keep in branch or separate repo

---

**Status:** Configuration and handlers complete, OAuth integration next
**Branch:** minimal-docs-mcp
**Updated:** 2025-10-18
