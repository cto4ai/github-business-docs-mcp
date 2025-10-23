# Legacy: Original 89-Tool GitHub MCP

This directory contains the archived code from the original comprehensive GitHub MCP server that was forked and adapted for documentation workflows.

## What's Here

This is the **original 89-tool GitHub MCP** implementation:

- **89 comprehensive tools** covering all GitHub functionality
- **PAT authentication** (Personal Access Token)
- **20 handler modules** for different GitHub domains
- **Full feature set:** Issues, PRs, Projects, Organizations, Analytics, Security, etc.

## Why It's Archived

This repository was forked from the comprehensive MCP and then drastically simplified for a focused use case:

**From:** 89-tool general GitHub automation MCP
**To:** 6-tool documentation workflow MCP with OAuth

### The Evolution

1. **Original MCP** (v1.x) - Comprehensive GitHub management
   - 89 tools covering all GitHub features
   - ~10,000 tokens of context overhead
   - PAT authentication
   - Perfect for power users and automation

2. **Minimal OAuth MCP** (v2.0) - Documentation focused
   - 6 tools for docs-as-code workflows
   - ~650 tokens of context (93% reduction)
   - OAuth user attribution
   - Perfect for documentation teams

## What's Archived Here

### Code

```
legacy/
├── src/
│   ├── index.cjs                    # Original server implementation
│   ├── handlers/                    # 16 full-featured handlers
│   │   ├── issues.cjs
│   │   ├── pull-requests.cjs
│   │   ├── enhanced-pull-requests.cjs
│   │   ├── branches-commits.cjs
│   │   ├── workflows.cjs
│   │   ├── security.cjs
│   │   ├── analytics.cjs
│   │   ├── projects.cjs
│   │   ├── organizations.cjs
│   │   ├── users.cjs
│   │   ├── labels.cjs
│   │   ├── milestones.cjs
│   │   ├── comments.cjs
│   │   ├── file-management.cjs
│   │   ├── repository.cjs
│   │   ├── search.cjs
│   │   └── advanced-features.cjs
│   └── utils/
│       └── tools-config.cjs         # 89 tool definitions
│
├── server.cjs                       # Original entry point (PAT-based)
├── server-minimal.cjs               # PAT-based minimal server
└── docs/                            # Original documentation
    ├── README_ORIGINAL.md
    ├── TEST-CLIENT-GUIDE.md
    ├── CLAUDE_DESKTOP_SETUP.md
    ├── MINIMAL_MCP_PLAN.md
    └── MINIMAL_BUILD_COMPLETE.md
```

### Documentation

- **[docs/README_ORIGINAL.md](docs/README_ORIGINAL.md)** - Original comprehensive README
- **[docs/MINIMAL_MCP_PLAN.md](docs/MINIMAL_MCP_PLAN.md)** - Strategy for creating minimal version
- **[docs/MINIMAL_BUILD_COMPLETE.md](docs/MINIMAL_BUILD_COMPLETE.md)** - Build documentation

## The 89 Tools (Archived)

### Repository Management (9 tools)
- create_repo, get_repo_info, update_repo, delete_repo
- list_repos, fork_repo, search_repos
- get_repo_contents, get_file_contents

### File Management (5 tools)
- create_file, update_file, delete_file
- upload_file, rename_file

### Issues (10 tools)
- create_issue, get_issue, update_issue, close_issue
- list_issues, add_issue_comment, lock_issue
- assign_issue, add_labels, remove_labels

### Pull Requests (12 tools)
- create_pr, get_pr, update_pr, merge_pr
- list_prs, review_pr, request_reviewers
- get_pr_diff, get_pr_commits, list_pr_files
- approve_pr, request_changes

### Branches & Commits (8 tools)
- create_branch, delete_branch, list_branches
- get_commit, list_commits, compare_commits
- create_tag, list_tags

### Workflows & Actions (6 tools)
- list_workflows, get_workflow, trigger_workflow
- list_workflow_runs, get_workflow_run, cancel_workflow_run

### Security (6 tools)
- list_secrets, create_secret, delete_secret
- list_deploy_keys, add_deploy_key, remove_deploy_key

### Analytics (7 tools)
- get_repo_stats, get_traffic_stats, get_clone_stats
- get_referrer_stats, get_popular_paths, get_languages
- get_contributors

### Projects (5 tools)
- list_projects, create_project, update_project
- delete_project, add_project_card

### Organizations (6 tools)
- list_org_repos, get_org_info, list_org_members
- list_teams, create_team, add_team_member

### Labels & Milestones (6 tools)
- list_labels, create_label, update_label, delete_label
- list_milestones, create_milestone

### Search (4 tools)
- search_code, search_issues, search_commits, search_users

### Users (3 tools)
- get_user, list_user_repos, get_authenticated_user

### Advanced Features (2 tools)
- batch_operations, webhook_operations

## If You Need the Full MCP

If you need comprehensive GitHub automation with all 89 tools:

1. **Use the original fork source:**
   - Repository: https://github.com/sergey-kurdin/github-repos-manager-mcp
   - Full featured, actively maintained

2. **Restore from this archive:**
   ```bash
   # Copy legacy code back to main
   cp -r legacy/src/* src/
   cp legacy/server.cjs .

   # Update package.json to point to legacy/src/index.cjs
   # Install dependencies
   npm install
   ```

## Why We Simplified

### Context Efficiency

Claude Code has limited context window. The minimal version uses:
- **93% less context** for tool definitions
- **Faster loading** in Claude Desktop
- **More room** for actual documentation work

### Focused Workflow

Documentation teams need:
- ✅ Create/update files
- ✅ Read files
- ✅ List contents
- ✅ Delete files
- ✅ Search
- ✅ Commit history

They don't typically need:
- ❌ Issue management
- ❌ PR reviews
- ❌ Workflow automation
- ❌ Organization management
- ❌ Security scanning

### User Attribution

The minimal version switched to OAuth so commits show individual user names instead of a shared bot account. This is critical for documentation accountability.

## License

MIT (same as original)

---

**This code is preserved for reference but is not actively maintained.**

For the current, actively maintained minimal version, see the main repository at `../`
