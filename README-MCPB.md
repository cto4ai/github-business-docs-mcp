# GitHub Docs Manager - Claude Desktop Extension

**Minimal MCP for managing business documents in GitHub with personal commit attribution**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

## What is This?

A **Claude Desktop Extension** that gives Claude the ability to manage business documents in your GitHub repositories while ensuring **all commits show YOUR name**, not a bot account.

Perfect for managing **policies, procedures, guides, and business content** where proper attribution matters.

### Key Features

✅ **Personal Commit Attribution** - Commits show your GitHub username, not a bot
✅ **Secure Authentication** - OAuth user-to-server tokens (no PATs needed)
✅ **Minimal & Fast** - Only 7 essential tools (92% smaller than full GitHub MCPs)
✅ **One-Click Install** - No manual config file editing
✅ **Seamless Integration** - Works with Claude Desktop out of the box

### The 7 Essential Tools

1. **create_or_update_file** - Create or update files in your repository
2. **get_file** - Read file contents
3. **list_contents** - List directory contents
4. **delete_file** - Delete files from repository
5. **search_code** - Search across repository code
6. **list_commits** - View commit history
7. **get_repository_catalog** - Get complete repository document catalog in a single call

---

## Installation

### Prerequisites

- **Claude Desktop** (macOS or Windows)
- **GitHub account**
- **5 minutes** for setup

### Step 1: Create a GitHub OAuth App

You need to create a GitHub OAuth App to enable secure authentication.

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name:** `Claude Desktop - GitHub Docs` (or any name you prefer)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/callback`
4. Click **"Register application"**
5. **Copy the Client ID** (starts with `Iv`)
6. Click **"Generate a new client secret"**
7. **Copy the Client Secret** (you'll need both for installation)

### Step 2: Install the Extension

1. Download `github-docs-mcp-2.0.0.mcpb` from the [releases page](https://github.com/cto4ai/github-business-docs-mcp/releases)
2. **Double-click** the .mcpb file (or drag it to Claude Desktop)
3. Claude Desktop will prompt you for configuration:
   - **GitHub App Client ID:** Paste the Client ID from Step 1
   - **GitHub App Client Secret:** Paste the Client Secret from Step 1
   - **Default Repository Owner:** (Optional) Your GitHub username (e.g., `jack4git`)
   - **Default Repository Name:** (Optional) Repository name (e.g., `ai-first-docs-01`)
4. Click **"Install"**

That's it! No config file editing needed.

### Step 3: First Use - OAuth Authorization

The first time you use the extension:

1. Ask Claude to do something (e.g., "list the contents of my repository")
2. Your browser will open to a GitHub authorization page
3. Click **"Authorize"** to grant access
4. Browser shows "Authorization Successful!"
5. Return to Claude Desktop - it's now connected!

**Note:** Your OAuth token expires after 8 hours for security. When it expires, you'll just need to authorize again (same browser flow).

---

## Usage

Once installed, you can use natural language with Claude:

### Basic Operations

**List repository contents:**
```
"Show me the files in the docs folder"
"List everything in the root directory"
```

**Create or update files:**
```
"Create a new README.md with the following content: [your content]"
"Update the API documentation to include the new endpoint"
```

**Read files:**
```
"Show me the contents of CONTRIBUTING.md"
"What's in the config/settings.json file?"
```

**Delete files:**
```
"Delete the old-tutorial.md file"
"Remove the deprecated-api.md document"
```

**Search code:**
```
"Search for all files that mention 'authentication'"
"Find where the API key is used"
```

**View commit history:**
```
"Show me the recent commits to this repository"
"What's the commit history for README.md?"
```

### Configuration Notes

- **Default Owner/Repo:** If you set these during installation, you don't need to specify them in every request
- **Override defaults:** You can always specify a different repository in your request
- **Multiple repositories:** You can work with any repository you have access to

---

## Individual User Attribution

### Why This Matters

Traditional GitHub integrations use **bot accounts** or **Personal Access Tokens (PATs)**, which means commits show up as:

❌ `github-actions[bot]` committed
❌ `my-bot-account` committed

This extension uses **OAuth user-to-server tokens**, so commits show:

✅ **Your actual GitHub username** committed

### Benefits

- **Proper accountability** - Your team knows who wrote what
- **Contribution graphs** - Contributions count toward your GitHub profile
- **Audit trails** - Clear attribution for compliance/documentation purposes
- **Professional** - Looks better in public repositories

### Example

When you create or update a file through Claude:

```
commit 93eefa267bbacfb0c420dc5a61408927bfd59066
Author: Jack Ivers <jack4git@users.noreply.github.com>
Date:   Sat Oct 19 02:03:00 2025 +0000

    Test: Claude Desktop OAuth file creation
```

**Not this:**
```
Author: github-actions[bot] <...>
```

---

## Security & Privacy

### How Your Credentials Are Stored

- **Client ID & Secret:** Stored securely by Claude Desktop (Client Secret is encrypted)
- **OAuth Token:** Stored locally by the extension, expires after 8 hours
- **No data leaves your machine** except GitHub API calls

### GitHub Permissions

The OAuth App requests these scopes:
- `repo` - Full control of private repositories (required for creating/updating files)
- `user:email` - Read your email address (for commit attribution)

### Token Expiration

For security, OAuth tokens expire after 8 hours. When expired:
1. You'll see an authorization prompt
2. Click "Authorize" in your browser
3. Extension continues working

This is a **feature**, not a bug - it ensures tokens don't persist indefinitely.

---

## Troubleshooting

### "Cannot read properties of undefined" Error

**Problem:** The extension can't connect to GitHub.

**Solution:**
1. Check your GitHub App credentials are correct
2. Restart Claude Desktop
3. Try authorizing again when prompted

### Browser Opens But Shows Error

**Problem:** OAuth callback failed.

**Possible causes:**
- **Callback URL mismatch:** Make sure your GitHub OAuth App has `http://localhost:3000/auth/callback` as the callback URL
- **Port conflict:** Another app is using port 3000

**Solution:**
1. Verify GitHub OAuth App settings
2. Close any apps using port 3000
3. Try again

### "Token expired" Message

**This is normal!** OAuth tokens expire after 8 hours for security.

**Solution:**
1. Use the extension again
2. Browser will open for re-authorization
3. Click "Authorize"
4. Continue working

### Default Repository Not Working

**Problem:** Claude says it can't find the repository.

**Solution:**
- **Specify explicitly:** "List contents of owner/repo-name"
- **Check defaults:** Make sure you entered the correct owner/repo during installation
- **Permissions:** Ensure your GitHub account has access to the repository

### Still Having Issues?

Open an issue on GitHub: https://github.com/cto4ai/github-business-docs-mcp/issues

Include:
- What you were trying to do
- The error message you saw
- Your Claude Desktop version
- Your operating system

---

## Comparison: Why This Over Other GitHub MCPs?

### vs. Full GitHub MCP

| Feature | Full GitHub MCP | This Extension |
|---------|----------------|----------------|
| **Tools** | 89 tools | 7 tools (focused) |
| **Token Usage** | ~10K tokens | ~750 tokens (92% smaller) |
| **User Attribution** | ❌ Bot account | ✅ Your name |
| **Setup** | Manual config | One-click install |
| **Use Case** | Everything GitHub | Docs-as-code workflows |

### vs. Personal Access Tokens (PATs)

| Feature | PATs | OAuth (This Extension) |
|---------|------|------------------------|
| **Attribution** | ❌ Bot or fake user | ✅ Your real username |
| **Security** | Long-lived token | 8-hour expiring tokens |
| **Revocation** | Manual | Automatic expiration |
| **Setup** | Create PAT, add to config | OAuth flow (guided) |

**Bottom line:** If you need docs-as-code with proper attribution, this is the right choice.

---

## Technical Details

### Architecture

- **Language:** Node.js (ships with Claude Desktop - no runtime to install)
- **Protocol:** Model Context Protocol (MCP) v1.0
- **Authentication:** GitHub OAuth 2.0 user-to-server tokens
- **Storage:** Local token cache (8-hour expiration)

### Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `axios` - HTTP client for GitHub API
- `express` - OAuth callback server
- `open` - Open browser for authorization

All dependencies are bundled in the .mcpb package (no `npm install` needed).

### GitHub API Usage

The extension uses the GitHub Contents API and Search API:
- `GET /repos/{owner}/{repo}/contents/{path}` - Read/list files
- `PUT /repos/{owner}/{repo}/contents/{path}` - Create/update files
- `DELETE /repos/{owner}/{repo}/contents/{path}` - Delete files
- `GET /search/code` - Search repository
- `GET /repos/{owner}/{repo}/commits` - List commits

Rate limits apply (5000 requests/hour for authenticated users).

---

## Development

Want to contribute or modify this extension?

### Repository Structure

```
github-business-docs-mcp/
├── manifest.json              # MCPB package manifest
├── server-minimal-oauth.cjs   # Entry point
├── src/
│   ├── index-minimal-oauth.cjs      # Main server class
│   ├── services/
│   │   ├── github-api.cjs          # GitHub API client
│   │   └── oauth-service.cjs       # OAuth flow handler
│   ├── handlers/
│   │   ├── file-management-minimal.cjs
│   │   ├── repository-minimal.cjs
│   │   └── search-minimal.cjs
│   └── utils/
│       ├── error-handler.cjs
│       ├── response-formatter.cjs
│       ├── shared-utils.cjs
│       └── tools-config-minimal.cjs
├── package.json
└── README.md (this file)
```

### Building from Source

```bash
# Clone the repository
git clone https://github.com/cto4ai/github-business-docs-mcp.git
cd github-business-docs-mcp

# Install dependencies
npm install

# Build the .mcpb package
npm run build:mcpb
```

### Running Tests

```bash
# Test the minimal MCP
npm run test:minimal

# Test OAuth flow
npm run test:oauth

# Test real commits (requires OAuth App credentials)
npm run test:real-commit
```

---

## Changelog

### Version 2.1.0 (October 2025)

**Document Catalog Feature**

- ✅ Added 7th tool: `get_repository_catalog`
- ✅ Single-call repository document discovery using GitHub Tree API
- ✅ In-memory catalog caching with 5-minute TTL
- ✅ Returns tree structure, flat list, and statistics
- ✅ 90% fewer API calls for document discovery
- ✅ 68% fewer tokens for catalog results

### Version 2.0.0 (October 2025)

**Production Release**

- Renamed from "GitHub Docs (OAuth)" to "GitHub Docs Manager"
- Reorganized repository structure (legacy code archived)
- Updated package naming for consistency
- Production-ready MCPB packaging

### Version 1.0.0 (October 2025)

**Initial POC Release**

- ✅ 6 essential tools for docs-as-code workflows
- ✅ OAuth user-to-server authentication
- ✅ Individual user attribution (not bot accounts)
- ✅ One-click MCPB installation
- ✅ Automatic token refresh
- ✅ Comprehensive error handling

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation:** https://github.com/cto4ai/github-business-docs-mcp
- **Issues:** https://github.com/cto4ai/github-business-docs-mcp/issues
- **Discussions:** https://github.com/cto4ai/github-business-docs-mcp/discussions

---

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io)
- Powered by [Anthropic's Claude](https://www.anthropic.com/claude)
- Inspired by the docs-as-code movement

---

**Made with ❤️ for the docs-as-code community**
