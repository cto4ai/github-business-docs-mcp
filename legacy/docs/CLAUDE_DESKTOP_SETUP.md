# Claude Desktop Setup Guide

## Minimal OAuth MCP Integration

**Status:** Production Ready
**Date:** 2025-10-18
**Tested:** ✅ All tests passing

---

## Overview

This guide shows you how to integrate the Minimal OAuth MCP into Claude Desktop for seamless GitHub documentation management with individual user attribution.

---

## Prerequisites

1. **Claude Desktop** installed
2. **GitHub App created** (see [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md))
3. **GitHub App installed** on your repository
4. **OAuth credentials** (Client ID and Secret)

---

## Step 1: Locate Claude Desktop Config

**File Location:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Open in editor:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Or:
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

---

## Step 2: Add MCP Configuration

**Edit the config file to add the minimal OAuth MCP:**

```json
{
  "mcpServers": {
    "github-docs": {
      "command": "node",
      "args": [
        "/absolute/path/to/github-repos-manager-mcp/server-minimal-oauth.cjs",
        "--default-owner", "your-github-username",
        "--default-repo", "your-repo-name"
      ],
      "env": {
        "GITHUB_CLIENT_ID": "Iv1.your_client_id_here",
        "GITHUB_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

**Replace:**
- `/absolute/path/to/github-repos-manager-mcp/` → Your actual path
- `your-github-username` → Your GitHub username
- `your-repo-name` → Your default repository
- `Iv1.your_client_id_here` → Your GitHub App Client ID
- `your_client_secret_here` → Your GitHub App Client Secret

---

## Step 3: Get Absolute Path

**Find your MCP directory path:**
```bash
cd /path/to/github-repos-manager-mcp
pwd
```

Copy the output and use it in the config.

**Example:**
```
/Users/yourname/Projects/docs-as-code/github-repos-manager-mcp
```

---

## Step 4: Complete Configuration Example

**Here's a complete working example:**

```json
{
  "mcpServers": {
    "github-docs": {
      "command": "node",
      "args": [
        "/Users/jackivers/Projects/docs-as-code/github-repos-manager-mcp/server-minimal-oauth.cjs",
        "--default-owner", "your-github-username",
        "--default-repo", "your-repo-name"
      ],
      "env": {
        "GITHUB_CLIENT_ID": "your_oauth_app_client_id_here",
        "GITHUB_CLIENT_SECRET": "your_oauth_app_client_secret_here"
      }
    }
  }
}
```

---

## Step 5: Restart Claude Desktop

1. **Quit Claude Desktop** completely (Cmd+Q)
2. **Reopen Claude Desktop**
3. **Wait for MCP to load** (you'll see a browser window open)
4. **Authorize on GitHub** (click "Authorize" button)
5. **Return to Claude Desktop**

---

## Step 6: Verify Integration

### Check MCP is Loaded

Look for the 🔌 icon in Claude Desktop that shows available MCPs.

### Test with Simple Command

**Try this in Claude Desktop:**

```
List the available GitHub documentation tools
```

**Expected Response:**
Claude should list the 6 minimal tools:
- create_or_update_file
- get_file
- list_contents
- delete_file
- search_code
- list_commits

---

## Step 7: Test User Attribution

### Create a Test File

**Ask Claude:**
```
Create a test file called OAUTH_TEST.md in my repository with some content
```

**Claude will:**
1. Use the create_or_update_file tool
2. Create the file with your provided content
3. Commit to your repository

### Verify on GitHub

1. Go to your repository on GitHub
2. Find the new commit
3. **Verify it shows YOUR name** (not a bot)
4. Check your avatar is displayed
5. **Success!** Individual user attribution working!

---

## Troubleshooting

### Browser Doesn't Open

**Problem:** No browser window appears for OAuth

**Solution:**
- Check console/logs in Claude Desktop
- URL should be printed - copy and open manually
- Authorize and return to Claude Desktop

### "OAuth credentials not set"

**Problem:** Missing environment variables

**Solution:**
```json
"env": {
  "GITHUB_CLIENT_ID": "your_id",
  "GITHUB_CLIENT_SECRET": "your_secret"
}
```

Make sure both are set in the config.

### "Repository not found"

**Problem:** GitHub App not installed on repository

**Solution:**
1. Go to GitHub → Settings → Applications
2. Find your GitHub App
3. Click "Configure"
4. Add the repository
5. Restart Claude Desktop

### MCP Not Loading

**Problem:** Server fails to start

**Solution:**
1. Check the path is absolute (not relative)
2. Verify Node.js is installed: `node --version`
3. Check dependencies: `cd /path/to/mcp && npm install`
4. Review logs in Claude Desktop

### Port 3000 Already in Use

**Problem:** OAuth callback server can't start

**Solution:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]

# Restart Claude Desktop
```

---

## Advanced Configuration

### Multiple Repositories

**Add multiple MCP instances for different repos:**

```json
{
  "mcpServers": {
    "github-docs-repo1": {
      "command": "node",
      "args": [
        "/path/to/server-minimal-oauth.cjs",
        "--default-owner", "owner1",
        "--default-repo", "repo1"
      ],
      "env": {
        "GITHUB_CLIENT_ID": "your_id",
        "GITHUB_CLIENT_SECRET": "your_secret"
      }
    },
    "github-docs-repo2": {
      "command": "node",
      "args": [
        "/path/to/server-minimal-oauth.cjs",
        "--default-owner", "owner2",
        "--default-repo", "repo2"
      ],
      "env": {
        "GITHUB_CLIENT_ID": "your_id",
        "GITHUB_CLIENT_SECRET": "your_secret"
      }
    }
  }
}
```

### Using PAT Instead of OAuth

**For testing or solo use:**

```json
{
  "mcpServers": {
    "github-docs-pat": {
      "command": "node",
      "args": [
        "/path/to/server-minimal.cjs",
        "--default-owner", "your-username",
        "--default-repo", "your-repo"
      ],
      "env": {
        "GH_TOKEN": "ghp_your_personal_access_token"
      }
    }
  }
}
```

---

## Usage Examples

### Create Documentation

**You:** "Create a README.md file with a project overview"

**Claude:** Uses `create_or_update_file` to create the file, commits show YOUR name!

### Update Documentation

**You:** "Update the README to add installation instructions"

**Claude:** Uses `create_or_update_file` (auto-detects existing file), commits show YOUR name!

### Search Documentation

**You:** "Find all mentions of 'authentication' in our docs"

**Claude:** Uses `search_code` to find matches

### Browse Repository

**You:** "What documentation files do we have in the docs/ folder?"

**Claude:** Uses `list_contents` to show directory structure

### View History

**You:** "Show me the recent changes to README.md"

**Claude:** Uses `list_commits` to show commit history

### Delete Old Docs

**You:** "Delete the old DEPRECATED.md file"

**Claude:** Uses `delete_file` to remove it, commits show YOUR name!

---

## Benefits

### Individual User Attribution

✅ Every commit shows who made the change
✅ Perfect audit trail
✅ No bot accounts
✅ Real user names and avatars

### Minimal Context Usage

✅ Only 6 tools loaded (~650 tokens)
✅ 93.5% reduction from full MCP
✅ Faster Claude responses
✅ More room for conversation

### Secure OAuth

✅ Short-lived tokens (8 hours)
✅ Automatic refresh
✅ User controls via GitHub
✅ No long-lived credentials

---

## Next Steps

### After Setup

1. ✅ Test creating a file
2. ✅ Verify user attribution on GitHub
3. ✅ Try all 6 tools
4. ✅ Integrate into your workflow

### For Team Deployment

1. Share setup guide with team
2. Each member creates/uses GitHub App
3. Each authorizes individually
4. All commits show correct attribution!

---

## Support

### Documentation

- [README_MINIMAL_OAUTH.md](README_MINIMAL_OAUTH.md) - Complete guide
- [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md) - OAuth setup
- [OAUTH_TEST_RESULTS.md](OAUTH_TEST_RESULTS.md) - Test results

### Tested Configuration

- **Claude Desktop:** Latest version
- **Node.js:** v18+
- **GitHub App:** oauth-poc-test-jackivers (App ID: 2138916)
- **Test Repository:** jack4git/ai-first-docs-01
- **Status:** All tests passing ✅

---

## Summary

**Quick Setup:**
1. Add config to `claude_desktop_config.json`
2. Set absolute path to `server-minimal-oauth.cjs`
3. Add OAuth credentials
4. Restart Claude Desktop
5. Authorize in browser
6. Start using!

**Result:**
- 6 essential documentation tools
- Individual user attribution
- Seamless Claude Desktop integration
- Production-ready workflow

---

**Ready to use Minimal OAuth MCP with Claude Desktop!** 🚀
