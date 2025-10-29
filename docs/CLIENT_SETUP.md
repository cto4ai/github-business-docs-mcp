# Client Setup Guide - GitHub Docs MCP Server

## Overview

This MCP enables Claude Desktop to manage your GitHub documentation repositories with OAuth user attribution. All commits will show YOUR name, not a bot account.

## Prerequisites

- Claude Desktop (macOS or Windows)
- GitHub account
- 10 minutes for setup

---

## Step 1: Create GitHub OAuth Credentials

### Recommended: OAuth App (Simpler)

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **"OAuth Apps"** tab
3. Click **"New OAuth App"**
4. Fill in the form:
   - **Application name:** `GitHub Docs MCP` (or any name you prefer)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/callback`
   - **Application description:** (optional) "MCP for managing GitHub docs"
5. Click **"Register application"**
6. **Copy the Client ID** (starts with `Iv`) - you'll need this
7. Click **"Generate a new client secret"**
8. **Copy the Client Secret** - you'll need this (you can only see it once!)

**Why OAuth App?**
- ✅ Simpler setup (fewer fields)
- ✅ No "installation" concept
- ✅ Immediate access to user's repos after authorization
- ✅ Perfect for this use case

### Alternative: GitHub App (Also Works)

If you prefer a GitHub App (more features, more complex):

1. Go to [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Fill in the form:
   - **Name:** `GitHub Docs MCP` (must be globally unique)
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000/auth/callback`
   - **Webhook:** Uncheck "Active"
3. Set **Permissions:**
   - Repository → Contents: Read and write
   - Repository → Metadata: Read-only
   - Account → Email addresses: Read-only
4. Click **"Create GitHub App"**
5. Copy the **Client ID** (in "About" section)
6. Click **"Generate a new client secret"** and copy the **Client Secret**
7. **Install the app** on your repository:
   - Click "Install App" in left sidebar
   - Select repositories to grant access

**Why GitHub App?**
- ✅ Additional features available (webhooks, events)
- ✅ More robust for complex integrations
- ❌ Requires "installation" on repositories
- ❌ More setup steps

**Note:** Both options provide identical user experience for OAuth authentication.

---

## Step 2: Install the MCP Package

### Option A: MCPB Package (Recommended)

1. Download `github-docs-mcp-2.1.0.mcpb` from the [releases page](https://github.com/cto4ai/github-business-docs-mcp/releases)
2. Double-click the `.mcpb` file (or drag it to Claude Desktop)
3. Claude Desktop will prompt for configuration:
   - **GitHub App Client ID:** Paste your Client ID
   - **GitHub App Client Secret:** Paste your Client Secret
   - **Default Repository Owner:** (Optional) Your GitHub username
   - **Default Repository Name:** (Optional) Your repo name
4. Click **"Install"**

That's it! No manual config file editing needed.

### Option B: Source Installation

If you prefer to install from source:

1. Clone the repository:
   ```bash
   git clone https://github.com/cto4ai/github-business-docs-mcp.git
   cd github-business-docs-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Claude Desktop's config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

4. Add this configuration:
   ```json
   {
     "mcpServers": {
       "github-docs": {
         "command": "node",
         "args": [
           "/absolute/path/to/github-business-docs-mcp/server.cjs",
           "--default-owner", "your-username",
           "--default-repo", "your-repo"
         ],
         "env": {
           "GITHUB_CLIENT_ID": "your_client_id_here",
           "GITHUB_CLIENT_SECRET": "your_client_secret_here"
         }
       }
     }
   }
   ```

   **Important:**
   - Replace `/absolute/path/to/` with the full path to the repository
   - Replace `your_client_id_here` and `your_client_secret_here` with your credentials
   - Optionally set `--default-owner` and `--default-repo`

5. Restart Claude Desktop

---

## Step 3: First Use - Authorize

The first time you use the MCP with Claude:

1. **Start Claude Desktop**
2. **Ask Claude** to do something with GitHub (e.g., "list my repository contents")
3. **Browser will open automatically** to GitHub authorization page
4. **Click "Authorize"** to grant access
5. **Browser shows "Authorization Successful!"** - close the window
6. **Return to Claude Desktop** - you're now connected!

**Your OAuth token expires after 8 hours for security.** When it expires, you'll just need to authorize again (same browser flow).

---

## The 7 Tools Available

Claude can now use these tools to manage your GitHub documentation:

### 1. **create_or_update_file**
Create new documentation files or update existing ones.

**Example:** "Create a README for my project that explains how to install and use it"

### 2. **get_file**
Read the contents of any file in your repository.

**Example:** "Show me the contents of docs/api.md"

### 3. **list_contents**
Browse directories and see what files exist.

**Example:** "What files are in the docs/ directory?"

### 4. **delete_file**
Remove files from your repository.

**Example:** "Delete the old CHANGELOG.md file"

### 5. **search_code**
Search across your entire repository for specific content.

**Example:** "Find all mentions of 'deprecated' in the documentation"

### 6. **list_commits**
View the revision history for files or the entire repository.

**Example:** "Show me the recent changes to README.md"

### 7. **get_repository_catalog**
Get a complete overview of your repository's structure in a single call.

**Example:** "Give me a map of all the documentation in this repository"

---

## Example Workflows

### Creating Documentation

**You:** "Create a new file called `CONTRIBUTING.md` with guidelines for contributors"

**Claude:** [Creates the file with standard contributing guidelines]

**Result:** File appears in your repository with a commit showing YOUR name

### Updating Documentation

**You:** "Update the README to add a new 'Installation' section"

**Claude:** [Reads current README, adds the section, commits the change]

**Result:** README updated, commit history shows you as the author

### Organizing Documentation

**You:** "Show me all the markdown files in the repository, then help me organize them into a better structure"

**Claude:** [Uses catalog tool to map all files, suggests reorganization]

**Result:** Clear overview of your docs with suggested improvements

---

## Troubleshooting

### "OAuth credentials not set"

**Problem:** MCP can't find your GitHub credentials

**Solution:**
- Verify Client ID and Secret are correct in configuration
- Check for typos or extra spaces
- Make sure you copied the full Client ID and Secret
- For source installation: Check the config file path is correct

### "Authorization failed"

**Problem:** GitHub authorization didn't complete successfully

**Solution:**
- Make sure callback URL is exactly: `http://localhost:3000/auth/callback`
- Check that port 3000 is not already in use by another application
- Try authorizing again (restart Claude Desktop if needed)

### "Repository not found"

**Problem:** MCP can't access the specified repository

**For OAuth Apps:**
- OAuth Apps automatically get access to all your repos after authorization
- Make sure you're using the correct owner/repo names

**For GitHub Apps:**
- Make sure the GitHub App is installed on the repository
- Go to https://github.com/settings/installations
- Click "Configure" on your GitHub App
- Add the repository to "Repository access"

### "Port 3000 already in use"

**Problem:** Another application is using port 3000

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process (replace [PID] with the actual process ID)
kill -9 [PID]

# Or restart your computer to clear all ports
```

### "Token expired" or "Authorization required"

**Problem:** Your OAuth token has expired (8-hour limit)

**Solution:**
- This is normal! OAuth tokens expire for security
- Just use Claude again - browser will open for re-authorization
- Click "Authorize" again (takes 5 seconds)
- Continue working

### Commits Show Wrong Name

**Problem:** Commits show a different name than yours

**Possible Causes:**
1. **Multiple GitHub accounts:** Make sure you authorized with the correct account
2. **Git config:** Your local git config might have different author settings
3. **Wrong token:** You might be using a PAT instead of OAuth

**Solution:**
- For OAuth: The name should always match the authorizing GitHub account
- Revoke and re-authorize to ensure correct account
- Check which account you're logged into on GitHub

---

## Security Best Practices

### Protecting Your Credentials

1. **Keep Client Secret secure**
   - Never commit it to a repository
   - Don't share it with others
   - Treat it like a password

2. **Use short-lived tokens**
   - OAuth tokens expire after 8 hours automatically
   - This limits exposure if a token is compromised

3. **Revoke access if compromised**
   - If you suspect your credentials are exposed:
     - Go to https://github.com/settings/applications
     - Find your OAuth App
     - Click "Revoke" to invalidate all tokens
     - Generate new credentials

4. **Audit regularly**
   - Periodically review authorized applications
   - Remove any you no longer use
   - Check recent commit history for unexpected changes

### Repository Permissions

**For OAuth Apps:**
- Grants access to ALL your repositories
- User must authorize to grant access
- Permissions are at the OAuth scope level (repo, user:email)

**For GitHub Apps:**
- You control exactly which repositories the app can access
- Can be more restrictive
- Good for organizations with many repos

### What This MCP Can Do

With the default permissions, the MCP can:
- ✅ Read files from your repositories
- ✅ Create, update, and delete files
- ✅ Create commits (attributed to you)
- ✅ Read your commit history
- ✅ Search code in your repositories
- ✅ Read repository metadata

The MCP **cannot**:
- ❌ Change repository settings
- ❌ Manage collaborators
- ❌ Delete repositories
- ❌ Create or delete branches (only works with default branch)
- ❌ Access private repositories you don't have access to

---

## Default Repository Configuration

You can optionally set a default repository to avoid specifying it every time:

### MCPB Installation
When installing the `.mcpb` package, you can provide:
- **Default Repository Owner:** Your GitHub username or organization
- **Default Repository Name:** The repository name

### Source Installation
In your Claude Desktop config:
```json
"args": [
  "/path/to/server.cjs",
  "--default-owner", "your-username",
  "--default-repo", "your-repo"
]
```

### Benefits of Default Repository
- **Convenience:** No need to specify repo in every request
- **Faster:** Claude knows which repository to work with
- **Cleaner:** Simpler prompts to Claude

### Overriding Default
Even with a default set, you can still work with other repositories:

**Example:** "List files in other-org/other-repo"

Claude will use the specified repository instead of the default.

---

## Multi-User Setup

If multiple team members want to use this MCP:

### Each User Needs

1. **Their own OAuth credentials**
   - Don't share Client ID/Secret between users
   - Each person creates their own OAuth App or uses a shared GitHub App
2. **Their own authorization**
   - Each person authorizes with their GitHub account
   - Commits will show each person's individual name

### For Organizations

**Option A: Individual OAuth Apps (Recommended)**
- Pros: Complete isolation, easy to revoke
- Cons: Each person sets up their own

**Option B: Shared GitHub App**
- Pros: Centralized management, same credentials for all
- Cons: More complex initial setup, requires GitHub App installation

---

## Uninstalling

### MCPB Package
1. Open Claude Desktop settings
2. Go to MCP Servers section
3. Find "GitHub Docs Manager"
4. Click "Uninstall"

### Source Installation
1. Edit Claude Desktop config file
2. Remove the `"github-docs"` entry from `mcpServers`
3. Save the file
4. Restart Claude Desktop

### Revoking Access
After uninstalling, revoke GitHub access:
1. Go to https://github.com/settings/applications
2. Find your OAuth App
3. Click "Revoke" to remove all tokens

---

## FAQ

### Do I need to know Git or command-line?
**No!** That's the whole point. Just talk to Claude normally about what you want to do with your documentation.

### Can I use this with private repositories?
**Yes!** As long as you have access to the repository:
- OAuth Apps get access to your private repos automatically
- GitHub Apps need to be installed on private repos

### Will this work with organization repositories?
**Yes!** If you have write access to an organization's repository, you can use this MCP with it.

### Can multiple people use the same OAuth credentials?
**Not recommended.** Each person should have their own OAuth App or authorize with a shared GitHub App. This ensures proper attribution and security.

### What happens if my token expires while Claude is working?
Claude will prompt you to re-authorize. Just authorize again and Claude will continue where it left off.

### Can I use this for code, not just documentation?
**Yes!** While optimized for documentation workflows, the tools work with any text files in your repository.

### Does this work with GitHub Enterprise?
**Not currently.** This MCP is designed for github.com only. GitHub Enterprise support could be added in the future.

---

## Getting Help

### Support Channels

- **GitHub Issues:** https://github.com/cto4ai/github-business-docs-mcp/issues
- **Documentation:** https://github.com/cto4ai/github-business-docs-mcp#readme
- **Discussions:** https://github.com/cto4ai/github-business-docs-mcp/discussions

### When Reporting Issues

Please include:
1. What you were trying to do
2. What happened instead
3. Any error messages you saw
4. Your setup (macOS/Windows, MCPB or source installation)
5. Whether you're using OAuth App or GitHub App

**Don't include:** Your Client ID, Client Secret, or any tokens

---

## What's Next?

Once you're set up, try these to get started:

1. **"List all the markdown files in my repository"**
   - See what documentation you currently have

2. **"Create a basic README if one doesn't exist"**
   - Get started with documentation

3. **"Show me the structure of my docs/ directory"**
   - Understand your documentation organization

4. **"Help me write a getting started guide"**
   - Create new documentation with Claude's help

5. **"Find all the TODOs in my documentation"**
   - Discover what needs to be updated

Remember: All changes will be committed with YOUR name, so you have full accountability and attribution!

---

## Version Information

**Current Version:** 2.1.0
**Last Updated:** October 2024
**Compatibility:** Claude Desktop ≥ 0.10.0
**Node.js:** ≥ 18.0.0

---

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.
