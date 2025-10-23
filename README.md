# GitHub Docs MCP Server

**Minimal GitHub MCP with OAuth User Attribution**

A context-efficient Model Context Protocol server for GitHub documentation workflows. Features OAuth authentication so commits show your name, not a bot account.

---

## Features

✅ **6 Essential Tools** - Only what you need for docs-as-code workflows
✅ **OAuth User Attribution** - Commits show individual user names
✅ **93% Context Reduction** - ~650 tokens vs ~10,000 in full GitHub MCPs
✅ **Production Ready** - Tested and working with Claude Desktop
✅ **No Hosting Required** - Localhost OAuth flow
✅ **Auto Token Refresh** - 8-hour tokens, automatic renewal

---

## Quick Start

### 1. Create GitHub OAuth App

1. Go to [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Fill in:
   - **Name:** `docs-mcp-[yourname]`
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000/auth/callback`
   - **Permissions:**
     - Repository Contents: Read & Write
     - Metadata: Read
     - Email: Read
3. Create the app and save:
   - Client ID
   - Client Secret

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-docs": {
      "command": "node",
      "args": [
        "/absolute/path/to/github-docs-mcp/server.cjs",
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

### 4. Use with Claude

Start Claude Desktop. On first use:
1. Browser opens for GitHub authorization
2. Click "Authorize"
3. Return to Claude Desktop
4. All commits will show YOUR name!

---

## The 6 Tools

Perfect for documentation workflows:

| Tool | Purpose |
|------|---------|
| `create_or_update_file` | Create new docs or update existing |
| `get_file` | Read file contents |
| `list_contents` | Browse directories |
| `delete_file` | Remove outdated docs |
| `search_code` | Find documentation |
| `list_commits` | View revision history |

---

## Architecture

### Repository Structure

```
github-docs-mcp/
├── server.cjs                        # Main entry point
├── src/
│   ├── index.cjs                     # OAuth server implementation
│   ├── services/
│   │   ├── github-api.cjs            # GitHub API client
│   │   ├── oauth-service.cjs         # OAuth flow handler
│   │   ├── cache-service.cjs         # Optional caching
│   │   └── file-service.cjs          # File operations
│   ├── handlers/
│   │   ├── file-management-minimal.cjs
│   │   ├── repository-minimal.cjs
│   │   └── search-minimal.cjs
│   └── utils/
│       ├── tools-config-minimal.cjs  # 6 tool definitions
│       ├── error-handler.cjs
│       └── response-formatter.cjs
├── legacy/                           # Original 89-tool MCP (archived)
└── package.json
```

### Why Minimal?

| Metric | Full MCP | This MCP | Reduction |
|--------|----------|----------|-----------|
| **Tools** | 89 | 6 | 93.3% |
| **Config Lines** | 2,851 | 100 | 96.5% |
| **Handler Lines** | 3,576 | 215 | 94.0% |
| **Total Tokens** | ~10,000 | ~650 | 93.5% |

**Benefits:**
- Faster Claude loading
- More context for your actual work
- Focused on documentation workflows
- Easier to understand and maintain

---

## OAuth vs PAT

| Feature | OAuth (This) | PAT |
|---------|--------------|-----|
| **User Attribution** | ✅ Individual users | ❌ Single identity |
| **Setup** | GitHub App + browser | Just a token |
| **Security** | Short-lived, auto-refresh | Long-lived token |
| **Multi-User** | ✅ Each user authorizes | ❌ Shared token |
| **Audit Trail** | ✅ Perfect | ❌ Can't distinguish users |

---

## Example Usage

```
You: Create a README for our API documentation

Claude: I'll create a README.md file for your API documentation.
[Creates file using create_or_update_file]

✅ File created: README.md
Committed by: Your Name <your@email.com>
```

All commits are attributed to YOU, not a bot account.

---

## Development

### Testing

Run the server:

```bash
node server.cjs --default-owner YOUR_OWNER --default-repo YOUR_REPO
```

The browser will open for OAuth authorization on first run.

### Environment Variables

Optional environment variables (can also pass as CLI args):

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GH_DEFAULT_OWNER=your-username
GH_DEFAULT_REPO=your-repo
```

---

## Documentation

- **[README_MINIMAL_OAUTH.md](README_MINIMAL_OAUTH.md)** - Complete OAuth setup guide
- **[OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md)** - OAuth flow details
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Development roadmap
- **[legacy/](legacy/)** - Original 89-tool MCP (archived)

---

## Troubleshooting

### "OAuth credentials not set"

Set environment variables:
```bash
export GITHUB_CLIENT_ID="your_id"
export GITHUB_CLIENT_SECRET="your_secret"
```

### "Port 3000 already in use"

Find and kill the process:
```bash
lsof -i :3000
kill -9 [PID]
```

### "Repository not found"

1. Verify GitHub App is installed on your repository
2. Check repository permissions in GitHub App settings
3. Confirm default owner/repo settings

---

## Version History

- **v2.0.0** (Current) - Minimal OAuth version promoted to primary
  - 6 tools only
  - OAuth user attribution
  - Original 89-tool MCP moved to `/legacy`

- **v1.x** (Legacy) - Original comprehensive GitHub MCP
  - 89 tools
  - PAT authentication
  - Archived in `/legacy` directory

---

## License

MIT

---

## Credits

- **Original MCP:** Sergey Kurdin
- **Minimal OAuth Version:** Jack Ivers
- **MCP Protocol:** Anthropic

Built for docs-as-code workflows with individual user accountability.
