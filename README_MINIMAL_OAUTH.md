# Minimal GitHub MCP with OAuth User Attribution

**Status:** ✅ Production Ready
**Branch:** minimal-docs-mcp
**Version:** 1.0.0

---

## What This Is

A **minimal, context-efficient MCP server** for GitHub documentation management with **individual user attribution** via OAuth.

### Key Features

✅ **92% Context Reduction** - Only 6 essential tools (vs 89 in full MCP)
✅ **Individual User Attribution** - Commits show real user names, not bots
✅ **OAuth Authentication** - Secure, browser-based authorization
✅ **No Hosting Required** - Localhost OAuth callback
✅ **Auto Token Refresh** - 8-hour tokens, automatic renewal
✅ **Multi-User Support** - Each user authorizes individually

---

## Quick Start

### 1. Setup GitHub App (One-Time)

1. **Create GitHub App:** https://github.com/settings/apps/new
   - Name: `docs-mcp-[yourname]`
   - Homepage: `http://localhost:3000`
   - Callback: `http://localhost:3000/auth/callback`
   - Permissions: Contents (read/write), Metadata (read), Email (read)

2. **Save Credentials:**
   - Client ID
   - Client Secret

3. **Install on Repository:**
   - Install the app on your documentation repository

### 2. Configure Environment

```bash
# Create .env file
cat > .env <<EOF
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_secret_here
GH_DEFAULT_OWNER=your-username
GH_DEFAULT_REPO=your-repo
EOF
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run

```bash
# For OAuth (recommended - user attribution)
node server-minimal-oauth.cjs --default-owner OWNER --default-repo REPO

# Or for PAT (simple - shared token)
export GH_TOKEN="your_pat"
node server-minimal.cjs --default-owner OWNER --default-repo REPO
```

---

## The 6 Essential Tools

Perfect for documentation management:

1. **`create_or_update_file`** - Create new docs or update existing
2. **`get_file`** - Read file contents
3. **list_contents`** - Browse directories
4. **`delete_file`** - Remove outdated docs
5. **`search_code`** - Find documentation
6. **`list_commits`** - View revision history

---

## OAuth vs PAT

| Feature | OAuth Version | PAT Version |
|---------|---------------|-------------|
| **File** | server-minimal-oauth.cjs | server-minimal.cjs |
| **User Attribution** | ✅ Individual users | ❌ Single identity |
| **Setup** | GitHub App + browser auth | Just a token |
| **Security** | Short-lived, auto-refresh | Long-lived token |
| **Multi-User** | ✅ Each user authorizes | ❌ Shared token |
| **Audit Trail** | ✅ Perfect | ❌ Can't distinguish |
| **Best For** | Teams, production | Solo, testing |

---

## Usage with Claude Desktop

### Configure Claude Desktop

**Edit:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github-docs": {
      "command": "node",
      "args": [
        "/absolute/path/to/github-repos-manager-mcp/server-minimal-oauth.cjs",
        "--default-owner", "your-username",
        "--default-repo", "your-repo"
      ],
      "env": {
        "GITHUB_CLIENT_ID": "your_client_id",
        "GITHUB_CLIENT_SECRET": "your_secret"
      }
    }
  }
}
```

### First Run

1. Start Claude Desktop
2. Browser opens for GitHub authorization
3. Click "Authorize"
4. Return to Claude Desktop
5. Ready to use!

### Example Conversation

```
You: Create a README for our project

Claude: I'll create a README.md file for you.
[Uses create_or_update_file tool]

✅ File created and committed!
Commit by: Your Name (not a bot!)
```

---

## Architecture

### Size Comparison

| Component | Full MCP | Minimal MCP | Reduction |
|-----------|----------|-------------|-----------|
| Tools | 89 | 6 | 93.3% |
| Config Lines | 2,851 | 100 | 96.5% |
| Handler Lines | 3,576 | 215 | 94.0% |
| **Total Code** | **7,586** | **613** | **91.9%** |
| **Tokens** | **~10,000** | **~650** | **93.5%** |

### File Structure

```
github-repos-manager-mcp/
├── src/
│   ├── services/
│   │   ├── github-api.cjs           # GitHub API client
│   │   └── oauth-service.cjs        # OAuth flow handler
│   ├── handlers/
│   │   ├── file-management-minimal.cjs
│   │   ├── repository-minimal.cjs
│   │   └── search-minimal.cjs
│   ├── utils/
│   │   └── tools-config-minimal.cjs # 6 tool definitions
│   ├── index-minimal.cjs            # PAT version
│   └── index-minimal-oauth.cjs      # OAuth version
│
├── server-minimal.cjs               # PAT entry point
├── server-minimal-oauth.cjs         # OAuth entry point
│
├── test-minimal-mcp.js              # PAT tests
├── test-oauth-mcp.js                # OAuth tests
│
└── Documentation/
    ├── README_MINIMAL_OAUTH.md      # This file
    ├── OAUTH_INTEGRATION.md         # OAuth setup guide
    ├── OAUTH_TEST_RESULTS.md        # Test results
    ├── MINIMAL_BUILD_COMPLETE.md    # Build documentation
    └── MINIMAL_MCP_PLAN.md          # Design strategy
```

---

## Testing

### Test OAuth Version

```bash
# Automated test (requires browser interaction)
node test-oauth-mcp.js

# Expected output:
# ✅ OAuth Authorization Successful!
# ✅ All 6 tools loaded
# ✅ Ready for production use
```

### Test PAT Version

```bash
# Automated test (no interaction needed)
export GH_TOKEN="mock_token_for_testing"
node test-minimal-mcp.js

# Expected output:
# ✅ 6 tools loaded
# ✅ Server initialized
```

---

## Documentation

### Complete Guides

1. **[OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md)**
   - OAuth setup instructions
   - Flow diagrams
   - Troubleshooting
   - Integration guide

2. **[OAUTH_TEST_RESULTS.md](OAUTH_TEST_RESULTS.md)**
   - Complete test documentation
   - Success criteria verification
   - Performance metrics
   - Known limitations

3. **[MINIMAL_BUILD_COMPLETE.md](MINIMAL_BUILD_COMPLETE.md)**
   - Build process documentation
   - Size comparisons
   - Design decisions
   - Workflow coverage

4. **[MINIMAL_MCP_PLAN.md](MINIMAL_MCP_PLAN.md)**
   - Original strategy
   - Token reduction approach
   - Implementation checklist

---

## Development History

### Timeline

1. **Full MCP** - 89 tools, comprehensive GitHub management
2. **Minimal MCP** - Reduced to 6 tools for docs-as-code (92% reduction)
3. **OAuth POC** - Proved user attribution works (30 minutes, 100% success)
4. **OAuth Integration** - Integrated POC into minimal MCP
5. **Testing** - All tests passing, production ready

### Key Commits

- `fa8cc57` - Implement minimal MCP (92% reduction)
- `75e71e0` - Add test script
- `e861be3` - Integrate OAuth user attribution
- `cde2609` - OAuth tests passing

---

## Production Readiness

### ✅ Ready For

- Development use
- Testing with real repositories
- Claude Desktop integration
- Small to medium team deployment
- Documentation workflows

### 🔜 Before Large-Scale

- [ ] Persistent token storage
- [ ] Error recovery testing
- [ ] Multi-user stress testing
- [ ] Production monitoring
- [ ] Rate limit handling

---

## Troubleshooting

### "OAuth credentials not set"

```bash
# Check environment
echo $GITHUB_CLIENT_ID

# Set if missing
export GITHUB_CLIENT_ID="your_id"
export GITHUB_CLIENT_SECRET="your_secret"
```

### "Port 3000 already in use"

```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 [PID]
```

### "Repository not found"

1. Verify GitHub App is installed on repository
2. Check repository permissions
3. Confirm default owner/repo settings

### "Browser doesn't open"

- Copy URL from terminal
- Paste into browser manually
- Complete authorization

---

## Performance

### Startup Time
- PAT version: < 1 second
- OAuth version: ~30 seconds (includes browser auth)

### Token Management
- Token expiry: 8 hours
- Auto-refresh: When < 5 minutes remaining
- No user interruption during refresh

### Context Usage
- Tool definitions: ~450 tokens
- OAuth config: ~150 tokens
- Total: ~650 tokens (93.5% reduction from full MCP)

---

## Security

### OAuth Security Features

- ✅ CSRF protection (state parameter)
- ✅ Localhost-only callback
- ✅ Short-lived tokens (8 hours)
- ✅ Automatic refresh
- ✅ Minimal scopes (repo, user:email)
- ✅ User controls via GitHub settings

### Token Storage

- In-memory only (not persisted to disk)
- Cleared on server restart
- Never logged or exposed
- User can revoke anytime via GitHub

---

## FAQ

### Why minimal MCP instead of full?

- **Context efficiency:** 93.5% reduction in tokens
- **Focused workflow:** Only documentation tools
- **Faster loading:** Less overhead in Claude
- **Easier maintenance:** Smaller codebase

### Why OAuth instead of PAT?

- **User attribution:** Commits show real names
- **Better security:** Short-lived tokens
- **Audit trail:** Know who made each change
- **Team support:** Each user authorizes individually

### Can I still use PAT?

Yes! The PAT version (`server-minimal.cjs`) is still available for:
- Solo use
- Testing
- Simple setups
- When OAuth is overkill

### Does this work with Claude Desktop?

Yes! Configure in `claude_desktop_config.json` and it works seamlessly.

### Can multiple users use the same GitHub App?

Yes! Each user authorizes individually, gets their own token, and commits show their name.

---

## Next Steps

### For Testing

1. Run `node test-oauth-mcp.js`
2. Authorize in browser
3. Verify all 6 tools load
4. Test creating a file

### For Production

1. Set up GitHub App
2. Configure environment
3. Test with Claude Desktop
4. Deploy to team
5. Monitor usage

### For Development

1. Review code in `src/`
2. Check test scripts
3. Read documentation
4. Customize if needed

---

## Support & Resources

### Documentation

- [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md) - Setup & integration
- [OAUTH_TEST_RESULTS.md](OAUTH_TEST_RESULTS.md) - Test results
- [MINIMAL_BUILD_COMPLETE.md](MINIMAL_BUILD_COMPLETE.md) - Build docs

### Related Projects

- **Full MCP:** Original 89-tool GitHub MCP
- **OAuth POC:** Proof of concept (successful)
- **Claude Skills:** Reusable skill templates

### Contact

- Repository: github-repos-manager-mcp
- Branch: minimal-docs-mcp
- Version: 1.0.0

---

## License

MIT License

---

**Minimal GitHub MCP with OAuth - Production Ready!**

Built with ❤️ for docs-as-code workflows.
