# `list_commits` Tool Implementation Gap

**Date**: October 29, 2025
**Status**: Documented - Awaiting Implementation Decision
**Severity**: High - Declared tool is non-functional

## Issue Summary

The `list_commits` tool is declared in the manifest and has a complete handler implementation, but the underlying API service method is missing, causing a runtime error when the tool is invoked.

**Error Message**:
```
apiService.listCommits is not a function
```

**Discovery Context**:
- Discovered during MCPB testing with Claude Desktop
- User attempted to use the tool to view commit history
- Claude Desktop showed tool as available but execution failed

## Technical Analysis

### Where the Problem Exists

**1. Tool Declaration** ✅
[manifest.json:121-124](../../manifest.json#L121-L124)
```json
{
  "name": "list_commits",
  "description": "List commit history for the repository or a specific file"
}
```

**2. Server Routing** ✅
[src/index.cjs:207-214](../../src/index.cjs#L207-L214)
```javascript
case "list_commits":
  result = await repositoryMinimal.listCommitsHandler(
    finalArgs,
    defaults,
    this.api,
    this.getServerConfig()
  );
  break;
```

**3. Handler Implementation** ✅
[src/handlers/repository-minimal.cjs:58-112](../../src/handlers/repository-minimal.cjs#L58-L112)
```javascript
async function listCommitsHandler(params, defaultRepo, apiService, serverConfig = {}) {
  // ... validation and path construction ...

  const result = await apiService.listCommits(  // ❌ THIS METHOD DOESN'T EXIST
    owner,
    repo,
    { path: fullPath, sha, per_page }
  );

  return {
    success: true,
    data: result,
  };
}
```

**4. API Service Method** ❌ **MISSING**
[src/services/github-api.cjs](../../src/services/github-api.cjs)

The `GitHubAPIService` class has no `listCommits()` method.

## Root Cause

When the codebase was refactored from the full-featured version to the "minimal" version:

1. **Legacy code** ([legacy/src/handlers/branches-commits.cjs:86-108](../../legacy/src/handlers/branches-commits.cjs#L86-L108)) called `makeGitHubRequest()` directly:
   ```javascript
   async function listCommits(args, apiService) {
     const { owner, repo, sha, path, author, since, until, per_page = 30 } = args;

     const params = new URLSearchParams({ per_page: per_page.toString() });
     if (sha) params.append("sha", sha);
     if (path) params.append("path", path);
     // ... other params ...

     const commits = await apiService.makeGitHubRequest(
       `/repos/${owner}/${repo}/commits?${params.toString()}`
     );
     return branchCommitFormatters.formatListCommitsOutput(commits, owner, repo);
   }
   ```

2. **Current handler** was refactored to expect a dedicated `listCommits()` service method (consistent with other tools like `getRepoContents()`, `createOrUpdateFile()`, etc.)

3. **The API service method was never created** during the refactoring process

## Existing REST API Pattern

The entire `GitHubAPIService` class follows a consistent pattern of wrapping GitHub REST API v3 calls:

```javascript
// Example: getRepoContents (line 186)
async getRepoContents(owner, repo, filePath, ref) {
  let endpoint = `/repos/${owner}/${repo}/contents/${filePath}`;
  if (ref) {
    endpoint += `?ref=${encodeURIComponent(ref)}`;
  }
  return this.makeGitHubRequest(endpoint);
}

// Example: createOrUpdateFile (line 101)
async createOrUpdateFile(owner, repo, filePathInRepo, commitMessage, base64Content, sha, branch) {
  let endpoint = `/repos/${owner}/${repo}/contents/${filePathInRepo}`;
  const payload = { message: commitMessage, content: base64Content };
  if (sha) payload.sha = sha;
  if (branch) payload.branch = branch;

  return this.makeGitHubRequest(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
```

**Adding `listCommits()` would follow this exact same pattern.**

## Business User Perspective: Version History & Undo Features

During investigation, we explored what business users actually need for version control:

### User Scenarios

**1. "Show me what changed"**
- "I want to see the history of changes to this document"
- "Who edited this file and when?"
- "What did the readme look like last week?"

**2. "Undo/Restore"**
- "Oops, I just accidentally updated the wrong file - undo!"
- "Someone made a bad change, I want to go back to yesterday's version"
- "Restore this document to how it was before the last 3 edits"

**3. "Preview before restoring"**
- "Let me see what the old version looked like before I restore it"
- "Show me the difference between now and the version from last Tuesday"

### Required Capabilities Analysis

To support these scenarios, we need:

#### 1. View Version History (Currently Broken)
**Method**: `listCommits(owner, repo, {path, sha, per_page})`
**Returns**: Array of commits with:
- Commit SHA (version identifier)
- Commit message
- Author name and email
- Timestamp

**Business user sees**: "Version history" similar to Google Docs revision history

#### 2. Preview Old Version (Already Available!)
**Method**: `getRepoContents(owner, repo, path, ref)` ✅
**Returns**: File content from that point in time

**Note**: The `ref` parameter can be a commit SHA, enabling retrieval of any historical version

#### 3. Restore Version (Already Available!)
**Method**: `createOrUpdateFile()` ✅
**Returns**: New commit with restored content

### Complete Workflow Example

**User**: "Show me the history of policies/vacation.md"
```javascript
// Step 1: Get version history
listCommits("myorg", "docs-repo", {path: "policies/vacation.md"})
→ Returns: [
    {sha: "abc123", message: "Updated vacation policy", author: "jane", date: "2025-10-28"},
    {sha: "def456", message: "Initial vacation policy", author: "john", date: "2025-10-15"},
  ]
```

**User**: "Show me what it looked like on Oct 15"
```javascript
// Step 2: Preview old version
getRepoContents("myorg", "docs-repo", "policies/vacation.md", "def456")
→ Returns: {content: "base64...", ...} // Old content
```

**User**: "Restore that version"
```javascript
// Step 3: Restore old content
createOrUpdateFile("myorg", "docs-repo", "policies/vacation.md",
                   "Restored vacation.md to version from Oct 15",
                   oldContentBase64, currentSHA, "main")
→ Creates new commit with restored content
```

## Proposed Implementation

### Minimal Fix: Add `listCommits()` Method

**Location**: [src/services/github-api.cjs](../../src/services/github-api.cjs) (after `getRepoContents`, around line 210)

```javascript
/**
 * List commits for a repository or specific file path
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Query options
 * @param {string} options.path - Only commits containing this file path
 * @param {string} options.sha - SHA or branch to start listing commits from
 * @param {number} options.per_page - Number of results (1-100, default 30)
 * @returns {Promise<Array>} Array of commit objects
 */
async listCommits(owner, repo, options = {}) {
  const { path, sha, per_page = 30 } = options;

  const params = new URLSearchParams({
    per_page: per_page.toString(),
  });

  if (sha) params.append("sha", sha);
  if (path) params.append("path", path);

  const endpoint = `/repos/${owner}/${repo}/commits?${params.toString()}`;

  try {
    const result = await this.makeGitHubRequest(endpoint);
    return result;
  } catch (error) {
    console.error(`Failed to list commits for '${path || 'repository'}': ${error.message}`);
    throw error;
  }
}
```

**GitHub API Reference**: [GET /repos/{owner}/{repo}/commits](https://docs.github.com/en/rest/commits/commits#list-commits)

### Testing the Fix

**Test Case 1: List all commits**
```javascript
await apiService.listCommits("owner", "repo", {per_page: 10});
```

**Test Case 2: List commits for specific file**
```javascript
await apiService.listCommits("owner", "repo", {
  path: "docs/README.md",
  per_page: 20
});
```

**Test Case 3: List commits from specific branch**
```javascript
await apiService.listCommits("owner", "repo", {
  sha: "feature-branch",
  per_page: 10
});
```

## Enhancement Ideas (Future Consideration)

Beyond fixing the current implementation gap, we could enhance version control features:

### 1. Convenience Method: "Undo Last Change"

```javascript
async undoLastChange(owner, repo, path) {
  // Get last 2 commits for the file
  const commits = await this.listCommits(owner, repo, {path, per_page: 2});

  if (commits.length < 2) {
    throw new Error("No previous version available to restore");
  }

  // Get content from second-to-last commit
  const previousCommit = commits[1];
  const oldVersion = await this.getRepoContents(owner, repo, path, previousCommit.sha);

  // Restore it
  const current = await this.getRepoContents(owner, repo, path);
  return this.createOrUpdateFile(
    owner, repo, path,
    `Reverted ${path} to version from ${previousCommit.commit.author.date}`,
    oldVersion.content,
    current.sha,
    "main"
  );
}
```

### 2. Business-Friendly Commit Messages

Auto-generate clear commit messages for restores:
- "Reverted vacation.md to version from Oct 15, 2025"
- "Undid last change to README.md (restored version by John from 2 days ago)"

### 3. Diff View Between Versions

Show what changed between two versions (would require additional GitHub API calls or local diff computation).

### 4. Batch Restore

Restore multiple files to a specific point in time (useful for "undo all changes from the last hour").

## Decision Points

### Immediate Actions
1. **Should we implement the minimal fix?**
   - Add `listCommits()` method to GitHubAPIService
   - Makes declared tool functional
   - Low risk, high value
   - **Recommendation**: Yes, implement immediately

2. **Should we update both repositories?**
   - Main: `/Users/jackivers/Projects/docs-as-code/github-business-docs-mcp/`
   - MyShortlister: `/Users/jackivers/Projects/shortlister/github/github-business-docs-mcp/`
   - **Recommendation**: Yes, fix in main, then rebuild MyShortlister MCPB

### Future Enhancements
3. **Should we add business-friendly "undo" workflows?**
   - Requires understanding typical business user workflows
   - May need user research/testing
   - **Recommendation**: Document as future enhancement, implement after gathering user feedback

4. **What level of version control visibility do business users need?**
   - Simple: Just show version history and allow restore
   - Advanced: Show diffs, batch operations, automatic undo
   - **Recommendation**: Start simple, enhance based on actual usage patterns

## Impact Assessment

**If Not Fixed**:
- Tool is advertised but non-functional
- Users cannot view commit history through MCP
- "Business Documents" branding promise of simplified version control is broken
- Poor user experience (tool appears available but fails)

**If Fixed (Minimal)**:
- Users can view version history
- Combined with existing `getRepoContents(ref)`, enables preview of old versions
- Combined with existing `createOrUpdateFile()`, enables manual restore workflow
- "Google Docs-like" version history becomes possible

**If Enhanced (Future)**:
- One-click "undo" for business users
- Complete version control without Git knowledge
- Differentiates product from simple file editors

## Related Files

- [manifest.json](../../manifest.json) - Tool declaration
- [src/index.cjs](../../src/index.cjs) - Tool routing
- [src/handlers/repository-minimal.cjs](../../src/handlers/repository-minimal.cjs) - Handler implementation
- [src/services/github-api.cjs](../../src/services/github-api.cjs) - Where fix should be added
- [legacy/src/handlers/branches-commits.cjs](../../legacy/src/handlers/branches-commits.cjs) - Legacy implementation reference

## Conversation Reference

This issue was discovered and analyzed during MCPB testing session on October 29, 2025. The conversation covered:
- Root cause analysis of the missing method
- Comparison with legacy implementation
- Business user perspective on version control needs
- Complete workflow analysis for version history/restore features
- REST API pattern confirmation

---

**Next Steps**: Decision needed on whether to implement minimal fix now or design comprehensive version control enhancement first.
