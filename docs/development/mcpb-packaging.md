# MCPB Desktop Extension Packaging Plan

## Overview

This document outlines the plan to package the **GitHub Docs OAuth MCP** as a Claude Desktop Extension (.mcpb file) for one-click installation.

---

## 1. Package Structure

The .mcpb file will be a zip archive with the following structure:

```
github-docs-oauth-1.0.0.mcpb
├── manifest.json                    # ✅ CREATED - Package metadata and configuration
├── server-minimal-oauth.cjs         # ✅ EXISTS - Entry point
├── src/                             # ✅ EXISTS - Source code
│   ├── index-minimal-oauth.cjs      #   Main server class
│   ├── services/
│   │   ├── github-api.cjs          #   GitHub API client
│   │   └── oauth-service.cjs       #   OAuth flow handler
│   ├── handlers/
│   │   ├── file-management-minimal.cjs
│   │   ├── repository-minimal.cjs
│   │   └── search-minimal.cjs
│   └── utils/
│       ├── error-handler.cjs
│       ├── response-formatter.cjs
│       ├── shared-utils.cjs
│       └── tools-config-minimal.cjs
├── node_modules/                    # ⏳ TO BUNDLE - All dependencies
│   ├── @modelcontextprotocol/
│   ├── axios/
│   ├── express/
│   ├── open/
│   └── ... (all dependencies)
├── package.json                     # ✅ EXISTS - Node.js metadata
├── package-lock.json                # ✅ EXISTS - Dependency lock
├── README.md                        # ⏳ TO CREATE - User documentation
└── icon.png (optional)              # ⏳ TO CREATE - Extension icon
```

---

## 2. Manifest.json Configuration

### ✅ Created Fields

**Required:**
- `manifest_version`: "1.0"
- `name`: "github-docs-oauth"
- `display_name`: "GitHub Docs (OAuth)"
- `version`: "1.0.0"
- `description`: Short description
- `long_description`: Detailed markdown description
- `author`: CTO4 information
- `server`: Command, args, env configuration

**User Configuration:**
- `github_client_id` (required, string) - GitHub OAuth App Client ID
- `github_client_secret` (required, string, sensitive) - GitHub OAuth App Client Secret
- `default_owner` (optional, string) - Default repository owner
- `default_repo` (optional, string) - Default repository name

**Tools Declaration:**
- All 6 minimal tools declared
- `tools_generated`: false
- `prompts_generated`: false

**Metadata:**
- Repository, homepage, documentation, support URLs
- Keywords for discoverability
- License: MIT
- Compatibility: Node.js >= 18.0.0

### How User Config Works

When users install the extension, Claude Desktop will prompt them to enter:

1. **GitHub App Client ID** - They create a GitHub OAuth App and copy the Client ID
2. **GitHub App Client Secret** - They copy the secret from their GitHub OAuth App
3. **Default Owner** (optional) - e.g., "jack4git"
4. **Default Repo** (optional) - e.g., "ai-first-docs-01"

These values are then:
- Passed as environment variables (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
- Passed as command-line arguments (`--default-owner`, `--default-repo`)
- Securely stored by Claude Desktop (client secret is marked `sensitive: true`)

---

## 3. Build Process

### Step 1: Install Production Dependencies

```bash
npm ci --production
```

This creates a clean `node_modules/` with only production dependencies (no dev dependencies).

### Step 2: Create Package Directory

```bash
mkdir -p mcpb-build
```

### Step 3: Copy Required Files

```bash
cp manifest.json mcpb-build/
cp server-minimal-oauth.cjs mcpb-build/
cp package.json mcpb-build/
cp package-lock.json mcpb-build/
cp README.md mcpb-build/
cp -r src/ mcpb-build/src/
cp -r node_modules/ mcpb-build/node_modules/
```

### Step 4: Create .mcpb Archive

```bash
cd mcpb-build
zip -r ../github-docs-oauth-1.0.0.mcpb .
cd ..
```

### Alternative: Use mcpb CLI Tool

If the official `mcpb` CLI is available:

```bash
npm install -g mcpb
mcpb pack
```

---

## 4. Installation User Experience

### For End Users

**Step 1: Get GitHub OAuth App Credentials**

Users need to create a GitHub OAuth App:

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: "Claude Desktop - GitHub Docs"
   - Homepage URL: "http://localhost:3000"
   - Authorization callback URL: "http://localhost:3000/auth/callback"
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

**Step 2: Install the Extension**

1. Download `github-docs-oauth-1.0.0.mcpb`
2. Double-click the file (or drag to Claude Desktop)
3. Claude Desktop prompts for configuration:
   - GitHub App Client ID: [paste from Step 1]
   - GitHub App Client Secret: [paste from Step 1]
   - Default Repository Owner: [optional, e.g., "jack4git"]
   - Default Repository Name: [optional, e.g., "ai-first-docs-01"]
4. Click "Install"

**Step 3: First Use - OAuth Authorization**

1. Use the extension (e.g., "list contents of root directory")
2. Browser opens to GitHub authorization page
3. User clicks "Authorize"
4. Browser shows "Authorization Successful!"
5. Extension is now ready - all commits will show user's name!

---

## 5. Dependencies to Bundle

### Production Dependencies (from package.json)

```json
{
  "@modelcontextprotocol/sdk": "^1.0.4",
  "axios": "^1.7.9",
  "express": "^4.21.2",
  "open": "^10.1.0"
}
```

**Total Size Estimate:** ~15-20 MB (including node_modules)

**Why Bundle Everything:**
- Node.js ships with Claude Desktop ✅
- No need for users to run `npm install` ✅
- One-click installation works immediately ✅
- No Python or other runtime dependencies ✅

---

## 6. README.md for Package

Need to create a user-friendly README that explains:

1. **What it does** - GitHub docs management with individual user attribution
2. **Prerequisites** - GitHub account, need to create OAuth App
3. **Installation** - Step-by-step with screenshots
4. **Configuration** - How to get Client ID and Secret
5. **First use** - OAuth authorization flow
6. **Usage examples** - Common operations
7. **Troubleshooting** - Common issues and solutions
8. **Security** - How credentials are stored, OAuth token expiration

---

## 7. Icon Design (Optional but Recommended)

Create a 512x512px PNG icon that represents:
- GitHub (Octocat reference)
- Documentation (book/document)
- User attribution (person/checkmark)

Suggested design: GitHub logo + document icon with a user silhouette

---

## 8. Testing the Package

### Before Distribution

1. **Clean test environment:**
   - Remove any existing MCP configuration
   - Start fresh Claude Desktop

2. **Install .mcpb file:**
   - Double-click to install
   - Verify configuration prompts appear
   - Enter test credentials

3. **Test OAuth flow:**
   - Trigger a tool call
   - Verify browser opens
   - Complete authorization
   - Verify success

4. **Test all tools:**
   - `list_contents` - ✅
   - `create_or_update_file` - ✅
   - `get_file` - ⏳
   - `delete_file` - ✅
   - `search_code` - ⏳
   - `list_commits` - ⏳

5. **Verify user attribution:**
   - Check GitHub commits
   - Confirm author shows user's name (not bot)

### Post-Distribution

- Monitor GitHub issues for installation problems
- Collect feedback on configuration UX
- Update documentation based on common questions

---

## 9. Distribution Strategy

### Option 1: GitHub Releases
- Create a release on the GitHub repository
- Attach the .mcpb file as a release asset
- Users download directly from GitHub

### Option 2: Direct Download
- Host the .mcpb file on a static website
- Provide a direct download link in README

### Option 3: Extension Store (Future)
- When Claude Desktop has an official extension store
- Submit the package for review
- Users install from the store

**Recommended:** Start with Option 1 (GitHub Releases)

---

## 10. Next Steps / Action Items

### Immediate (Before Packaging)

- [ ] Create comprehensive README.md
- [ ] Design and create icon.png (optional)
- [ ] Run `npm ci --production` to clean dependencies
- [ ] Test the server works with bundled dependencies

### Packaging

- [ ] Create build script (`scripts/build-mcpb.sh`)
- [ ] Build the .mcpb package
- [ ] Test installation on clean system
- [ ] Verify OAuth flow works
- [ ] Test all 6 tools

### Documentation

- [ ] Write installation guide with screenshots
- [ ] Create troubleshooting guide
- [ ] Document GitHub OAuth App setup process
- [ ] Add security and privacy documentation

### Distribution

- [ ] Create GitHub release (v1.0.0)
- [ ] Upload .mcpb file to release
- [ ] Announce on repository README
- [ ] Share in MCP community

---

## 11. Success Criteria

The .mcpb package is ready for distribution when:

✅ Users can install with one double-click
✅ Configuration UI appears and is intuitive
✅ OAuth flow works on first use
✅ All 6 tools function correctly
✅ Commits show user's name (verified)
✅ README is comprehensive and clear
✅ No manual configuration file editing required
✅ Works on both macOS and Windows

---

## 12. Known Challenges & Solutions

### Challenge 1: GitHub OAuth App Setup

**Problem:** Users need to create a GitHub OAuth App (not trivial)

**Solution:**
- Provide step-by-step guide with screenshots
- Include a "Quick Setup" section in README
- Consider creating a video tutorial
- Link to GitHub's official OAuth App documentation

### Challenge 2: OAuth Flow on First Use

**Problem:** Users might be surprised when browser opens

**Solution:**
- Document this clearly in README
- Consider adding a welcome prompt that explains OAuth
- Show clear "Authorization Successful!" message

### Challenge 3: Token Expiration

**Problem:** OAuth tokens expire after 8 hours

**Solution:**
- OAuth service automatically refreshes tokens
- If refresh fails, user just needs to authorize again
- Document this behavior

### Challenge 4: Multiple Repositories

**Problem:** Default repo is optional, users might forget to set it

**Solution:**
- Make default_owner and default_repo optional
- All tools accept owner/repo parameters
- Document that users can override per-operation

---

## Appendix: Manifest.json Reference

See `/Users/jackivers/Projects/docs-as-code/github-repos-manager-mcp/manifest.json` for the complete manifest with all fields configured.

Key features:
- User config with 4 fields (2 required, 2 optional)
- Sensitive field handling for Client Secret
- Command-line argument passing for defaults
- Environment variable injection for OAuth credentials
- Complete tool declarations for discoverability

---

**Last Updated:** October 18, 2025
**Status:** Planning Complete - Ready for Implementation
**Next Phase:** Build and Test
