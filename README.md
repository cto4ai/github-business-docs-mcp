# GitHub Docs MCP Server

**Minimal GitHub MCP with OAuth User Attribution**

A context-efficient Model Context Protocol server for managing business documents in GitHub repositories. Features OAuth authentication so commits show your name, not a bot account.

---

## Features

✅ **7 Essential Tools** - Manage policies, procedures, guides, and business content
✅ **OAuth User Attribution** - Commits show individual user names
✅ **93% Context Reduction** - ~750 tokens vs ~10,000 in full GitHub MCPs
✅ **Production Ready** - Tested and working with Claude Desktop
✅ **No Hosting Required** - Localhost OAuth flow
✅ **Auto Token Refresh** - 8-hour tokens, automatic renewal

---

## Quick Start

### 1. Create GitHub OAuth Credentials

**Recommended: OAuth App (Simpler)**

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in:
   - **Application name:** `docs-mcp-[yourname]` (or any name you prefer)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/callback`
4. Click **"Register application"**
5. Copy the **Client ID** (starts with `Iv`)
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret** (you can only see it once!)

**Alternative: GitHub App (Also Works)**

GitHub Apps also work but require more setup. If you prefer:
- Go to [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
- Use the app's Client ID and Client Secret for OAuth

Both options provide identical OAuth user authentication.

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

## The 7 Tools

Perfect for managing business documents:

| Tool | Purpose |
|------|---------|
| `create_or_update_file` | Create new documents or update existing ones |
| `get_file` | Read document contents |
| `list_contents` | Browse folders and documents |
| `delete_file` | Remove outdated documents |
| `search_code` | Find content across all documents |
| `list_commits` | View document revision history |
| `get_repository_catalog` | Get complete inventory of all documents |

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
│   │   ├── search-minimal.cjs
│   │   └── document-catalog-minimal.cjs
│   └── utils/
│       ├── tools-config-minimal.cjs  # 7 tool definitions
│       ├── error-handler.cjs
│       └── response-formatter.cjs
├── legacy/                           # Original 89-tool MCP (archived)
└── package.json
```

### Why Minimal?

| Metric | Full MCP | This MCP | Reduction |
|--------|----------|----------|-----------|
| **Tools** | 89 | 7 | 92.1% |
| **Config Lines** | 2,851 | 110 | 96.1% |
| **Handler Lines** | 3,576 | 275 | 92.3% |
| **Total Tokens** | ~10,000 | ~750 | 92.5% |

**Benefits:**
- Faster Claude loading
- More context for your actual work
- Focused on business document management
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
You: Create a Remote Work Policy document

Claude: I'll create a remote-work-policy.md file for your business documents.
[Creates file using create_or_update_file]

✅ File created: remote-work-policy.md
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

### For Users

- **[Main README](README.md)** - Getting started, installation, usage
- **[MCPB Package Guide](README-MCPB.md)** - For .mcpb package installation

### Architecture

- **[OAuth Flow](docs/architecture/oauth-flow.md)** - How OAuth user attribution works
  - Supports both OAuth Apps (recommended) and GitHub Apps
- **[Document Catalog Design](docs/architecture/document-catalog-design.md)** - v2.1.0 catalog feature

### Development

- **[Testing Guide](docs/development/testing.md)** - How to test the MCP
- **[MCPB Packaging](docs/development/mcpb-packaging.md)** - Building .mcpb packages

### Legacy

- **[legacy/](legacy/)** - Original 89-tool MCP (archived for reference)

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

- **v2.1.0** (Current) - Added document catalog feature
  - 7 tools (added `get_repository_catalog`)
  - Single-call repository document discovery
  - In-memory catalog caching with 5-minute TTL
  - 92.5% context reduction vs full GitHub MCPs

- **v2.0.0** - Minimal OAuth version promoted to primary
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

Built for managing business documents with individual user accountability.
