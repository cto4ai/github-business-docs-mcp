# Testing Guide: GitHub Docs Manager v2.0.0

This guide walks you through testing the newly built MCPB package.

---

## Package Information

- **Name:** `github-docs-mcp-2.0.0.mcpb`
- **Display Name:** GitHub Docs Manager
- **Size:** 1.5M
- **Location:** `/Users/jackivers/Projects/docs-as-code/github-business-docs-mcp/`

---

## Prerequisites

Before testing, ensure you have:

1. ✅ **Claude Desktop** installed (macOS or Windows)
2. ✅ **GitHub OAuth App** created (if not, see setup below)
3. ✅ **Test repository** accessible (e.g., `jack4git/ai-first-docs-01`)

---

## Quick Setup: GitHub OAuth App

If you don't have a GitHub OAuth App yet:

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** `GitHub Docs Manager Test`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/callback`
4. Click **"Register application"**
5. Copy the **Client ID** (starts with `Iv`)
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret**

Keep these handy for installation!

---

## Installation Methods

### Method 1: Double-Click (Easiest)

1. Navigate to the package in Finder:
   ```bash
   open /Users/jackivers/Projects/docs-as-code/github-business-docs-mcp/
   ```

2. **Double-click** `github-docs-mcp-2.0.0.mcpb`

3. Claude Desktop will open and prompt for configuration:
   - **GitHub App Client ID:** `[paste your Client ID]`
   - **GitHub App Client Secret:** `[paste your Client Secret]`
   - **Default Repository Owner:** `jack4git` (or your username)
   - **Default Repository Name:** `ai-first-docs-01` (or your repo)

4. Click **"Install"**

### Method 2: Manual Installation

If double-click doesn't work:

1. Open Claude Desktop
2. Go to **Preferences** → **Extensions**
3. Click **"Install from file..."**
4. Select `github-docs-mcp-2.0.0.mcpb`
5. Fill in configuration as above
6. Click **"Install"**

---

## Testing Checklist

### 1. Verify Installation ✅

**Check that the extension appears:**

1. Open Claude Desktop
2. Go to **Preferences** → **Extensions**
3. Look for **"GitHub Docs Manager"**
4. Status should show **"Installed"**

---

### 2. Test OAuth Flow ✅

**First use triggers OAuth authorization:**

1. In Claude Desktop, type:
   ```
   List the contents of my repository
   ```

2. **Expected behavior:**
   - Browser opens to GitHub authorization page
   - Shows: "Authorize GitHub Docs Manager Test"
   - Lists permissions: repo, user:email

3. Click **"Authorize"**

4. **Expected result:**
   - Browser shows "Authorization Successful!"
   - Return to Claude Desktop
   - Claude lists repository contents

**Troubleshooting:**
- If browser doesn't open: Check logs at `~/Library/Logs/Claude/mcp-server-github-docs-mcp.log`
- If authorization fails: Verify OAuth App callback URL is `http://localhost:3000/auth/callback`

---

### 3. Test Tool: list_contents ✅

**Verify directory listing works:**

```
Show me what's in the root of the repository
```

**Expected output:**
- List of files and directories
- Includes file types (file/dir)
- Shows README.md, docs/, etc.

---

### 4. Test Tool: create_or_update_file ✅

**Create a test file:**

```
Create a new file called TEST-MCPB.md with the following content:

# MCPB Test

This file was created by GitHub Docs Manager v2.0.0 to verify:
- OAuth authentication works
- Personal commit attribution works
- File creation works

Tested on: [current date]
```

**Expected behavior:**
1. Claude creates the file
2. Shows confirmation: "File created successfully"
3. Returns commit SHA

**Verify in GitHub:**
1. Go to your repository on GitHub.com
2. Find `TEST-MCPB.md`
3. Click on the file
4. Check commit author - should show **YOUR GitHub username**, not a bot!

**Example commit:**
```
Author: Jack Ivers <jack4git@users.noreply.github.com>
Date:   [timestamp]

    Create TEST-MCPB.md for MCPB v2.0.0 testing
```

---

### 5. Test Tool: get_file ✅

**Read the test file:**

```
Show me the contents of TEST-MCPB.md
```

**Expected output:**
- Full file contents displayed
- Matches what you created

---

### 6. Test Tool: update_file ✅

**Update the test file:**

```
Update TEST-MCPB.md to add a line at the end:

Status: ✅ All tests passing!
```

**Expected behavior:**
1. Claude updates the file
2. Shows confirmation
3. Commit shows YOUR name

---

### 7. Test Tool: search_code ✅

**Search for content:**

```
Search for files that contain "test" or "MCPB"
```

**Expected output:**
- Finds TEST-MCPB.md
- Shows matching files with context

---

### 8. Test Tool: list_commits ✅

**View commit history:**

```
Show me the recent commits to this repository
```

**Expected output:**
- List of recent commits
- Includes your test file creation/update
- **Verify:** Commits show YOUR username, not a bot

---

### 9. Test Tool: delete_file ✅

**Clean up the test file:**

```
Delete TEST-MCPB.md with the message "Cleanup: Remove MCPB test file"
```

**Expected behavior:**
1. Claude deletes the file
2. Shows confirmation
3. Commit shows YOUR name

**Verify in GitHub:**
- File is gone
- Commit history shows deletion by YOU

---

## Success Criteria

All of the following should be true:

- ✅ Extension installs without errors
- ✅ OAuth flow completes successfully
- ✅ All 6 tools work as expected
- ✅ **Commits show YOUR GitHub username** (not a bot)
- ✅ Files are created/updated/deleted correctly
- ✅ Search returns results
- ✅ Commit history displays properly

---

## Troubleshooting

### Extension Won't Install

**Error:** "Failed to install extension"

**Solutions:**
1. Check Claude Desktop version (needs ≥ 0.10.0)
2. Verify package isn't corrupted: `unzip -t github-docs-mcp-2.0.0.mcpb`
3. Try Method 2 (manual installation)

### OAuth Browser Doesn't Open

**Error:** Browser doesn't open for authorization

**Solutions:**
1. Check logs: `tail -f ~/Library/Logs/Claude/mcp-server-github-docs-mcp.log`
2. Verify port 3000 isn't in use: `lsof -i :3000`
3. Manually open: Look for URL in logs, paste in browser

### "Repository not found" Error

**Error:** Claude can't access repository

**Solutions:**
1. Verify default owner/repo are set correctly
2. Check your GitHub account has access to the repository
3. Try specifying explicitly: "List contents of owner/repo-name"

### Commits Show Wrong Username

**Problem:** Commits show bot name instead of your username

**This means OAuth isn't working correctly.**

**Solutions:**
1. Re-authorize: Ask Claude to do something, complete OAuth flow again
2. Check GitHub OAuth App permissions include `user:email`
3. Verify OAuth App is installed on your repository

### Token Expired

**Error:** "OAuth token expired"

**This is normal!** Tokens expire after 8 hours for security.

**Solution:**
1. Use the extension again
2. Browser opens for re-authorization
3. Click "Authorize"
4. Continue working

---

## Logs Location

If you encounter issues:

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp-server-github-docs-mcp.log
```

**Windows:**
```
%APPDATA%\Claude\Logs\mcp-server-github-docs-mcp.log
```

---

## Comparison with v1.0.0

| Feature | v1.0.0 (POC) | v2.0.0 (This Build) |
|---------|--------------|---------------------|
| **Name** | github-docs-oauth | github-docs-mcp |
| **Display Name** | GitHub Docs (OAuth) | GitHub Docs Manager |
| **Entry Point** | server-minimal-oauth.cjs | server.cjs |
| **Structure** | Legacy code mixed in | Clean (legacy archived) |
| **Branding** | POC-grade | Production-ready |
| **Documentation** | OAuth-focused | Clean, professional |

---

## Next Steps After Testing

### If All Tests Pass ✅

1. **Use it!** Start managing your documentation through Claude
2. **Share feedback:** Report any issues or suggestions
3. **Consider Phase 2:** Document indexing feature (if interested)

### If Tests Fail ❌

1. **Check logs** for error messages
2. **Review this guide** for troubleshooting steps
3. **Report issues** with:
   - What you were testing
   - Error message
   - Log contents
   - Claude Desktop version
   - Operating system

---

## Uninstalling (if needed)

To remove the extension:

1. Open Claude Desktop
2. Go to **Preferences** → **Extensions**
3. Find **"GitHub Docs Manager"**
4. Click **"Uninstall"**

Your GitHub OAuth App remains (can be deleted separately if desired).

---

## Build Information

**Built:** October 22, 2025
**Version:** 2.0.0
**Build Command:** `./scripts/build-mcpb.sh`
**Package Size:** 1.5M
**Production Dependencies:** 81 packages

---

**Happy Testing! 🎉**

If this test succeeds, you have a working production-ready GitHub documentation MCP with personal commit attribution!
