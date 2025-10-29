# GitHub Business Docs MCP Server

**Minimal GitHub MCP with OAuth User Attribution**

A context-efficient Model Context Protocol server for managing business documents in GitHub repositories. Features OAuth authentication so commits show your name, not a bot account.

**Installation:** Use the `.mcpb` bundle package for one-click installation in Claude Desktop (see Quick Start below).

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

### Recommended: MCPB Bundle Installation (One-Click)

The easiest way to install is using the MCPB bundle package:

1. **Create GitHub OAuth App**
   - Go to [https://github.com/settings/developers](https://github.com/settings/developers)
   - Click **"OAuth Apps"** → **"New OAuth App"**
   - Fill in:
     - **Application name:** `docs-mcp-[yourname]` (or any name you prefer)
     - **Homepage URL:** `http://localhost:3000`
     - **Authorization callback URL:** `http://localhost:3000/auth/callback`
   - Copy the **Client ID** (starts with `Iv`) and **Client Secret**

2. **Download and Install**
   - Download the latest `.mcpb` file from [releases](https://github.com/cto4ai/github-business-docs-mcp/releases)
   - Double-click the `.mcpb` file (or drag to Claude Desktop)
   - Enter your OAuth credentials when prompted
   - Done! No config file editing needed.

3. **First Use**
   - Browser opens for GitHub authorization
   - Click "Authorize"
   - All commits will show YOUR name!

For detailed MCPB installation instructions, see **[README-MCPB.md](README-MCPB.md)**.

### Alternative: Manual Installation (For Development)

If you're developing or want manual control:

1. **Create GitHub OAuth Credentials** (same as above)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Claude Desktop**

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

4. **Use with Claude** - Start Claude Desktop and authorize when prompted

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
github-business-docs-mcp/
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

### Building MCPB Package

To build a production-ready MCPB bundle:

```bash
# 1. Create .env file with your credentials
cp .env.template .env
# Edit .env with your GitHub OAuth credentials

# 2. Build the package
bash scripts/build-mcpb.sh
```

This creates `github-business-docs-mcp-4.0.0.mcpb` ready for distribution.

For detailed MCPB packaging instructions, see **[docs/development/mcpb-packaging.md](docs/development/mcpb-packaging.md)**.

### Testing Locally

Run the server directly for development:

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
GH_DEFAULT_DOCROOT=docs  # Optional: restrict to a subdirectory
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

- **v4.0.0** (Current) - Path prepending and dot-file protection
  - Full docroot enforcement across all 7 tools
  - New PathValidator service and DocrootResolver utility
  - `ignore_docroot` parameter added to all tools for override
  - Dot-file filtering to protect sensitive configuration files
  - Automatic path prepending for docroot-scoped operations
  - Package renamed from `github-docs-mcp` to `github-business-docs-mcp`

- **v3.0.1** - Bug fix for docroot handling
  - Fixed docroot handling for empty string and "." values in `.mcp-config.json`

- **v3.0.0** - Minimal catalog output + docroot configuration
  - Simplified catalog output format (removed `tree`, renamed `flat_list` to `files`)
  - Added docroot configuration with 3-level hierarchy (tool parameter → `.mcp-config.json` → server default)
  - Added `.mcp-config.json` support for per-repo configuration
  - Moved `get_repository_catalog` to first position as discovery tool

- **v2.1.0** - Added document catalog feature
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
