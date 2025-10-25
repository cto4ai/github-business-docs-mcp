#!/usr/bin/env node

// Minimal GitHub MCP Server for docs-as-code with OAuth
// Provides 7 essential tools with individual user attribution

const GitHubAPIService = require("./services/github-api.cjs");
const GitHubOAuthService = require("./services/oauth-service.cjs");
const fileManagementMinimal = require("./handlers/file-management-minimal.cjs");
const repositoryMinimal = require("./handlers/repository-minimal.cjs");
const searchMinimal = require("./handlers/search-minimal.cjs");
const documentCatalogMinimal = require("./handlers/document-catalog-minimal.cjs");
const toolsConfigMinimal = require("./utils/tools-config-minimal.cjs");
const { formatHandlerResponse } = require("./utils/response-formatter.cjs");
const { handleError } = require("./utils/error-handler.cjs");

class GitHubMCPServerMinimalOAuth {
  constructor(config = {}, sdkModules = {}) {
    this.Server = sdkModules.Server;
    this.StdioServerTransport = sdkModules.StdioServerTransport;
    this.CallToolRequestSchema = sdkModules.CallToolRequestSchema;
    this.ListToolsRequestSchema = sdkModules.ListToolsRequestSchema;

    this.defaultOwner = null;
    this.defaultRepo = null;
    this.defaultDocroot = null;
    this.oauthService = null;

    // Initialize OAuth service
    this.oauthService = new GitHubOAuthService(config.oauth || {});

    // Token will be set after OAuth authorization
    this.api = null;

    // Set default repository from config or environment
    this.defaultOwner = config.defaultOwner || process.env.GH_DEFAULT_OWNER;
    this.defaultRepo = config.defaultRepo || process.env.GH_DEFAULT_REPO;
    this.defaultDocroot = config.defaultDocroot || process.env.GH_DEFAULT_DOCROOT || '';

    this.server = new this.Server(
      {
        name: "GitHub Docs MCP Server (Minimal + OAuth)",
        version: "3.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Authorize user and initialize API service
   */
  async authorize() {
    console.error('\n🔐 GitHub OAuth Authorization Required\n');
    console.error('This MCP uses OAuth for individual user attribution.');
    console.error('Commits will show YOUR name, not a bot account.\n');

    const { accessToken, user } = await this.oauthService.authorize();

    // Initialize API service with user's token
    this.api = new GitHubAPIService(accessToken);

    console.error('\n✅ Authorization complete!');
    console.error(`   Authenticated as: ${user.login}`);
    console.error(`   All commits will be attributed to: ${user.name || user.login}\n`);

    return { accessToken, user };
  }

  /**
   * Get current valid token (refreshes if needed)
   */
  async getToken() {
    if (!this.oauthService.isAuthenticated()) {
      await this.authorize();
    }
    return await this.oauthService.getToken();
  }

  /**
   * Get authenticated user
   */
  getUser() {
    return this.oauthService.getUser();
  }

  getDefaultRepo() {
    return {
      owner: this.defaultOwner,
      repo: this.defaultRepo,
    };
  }

  getServerConfig() {
    return {
      default_docroot: this.defaultDocroot,
    };
  }

  setupToolHandlers() {
    // List tools handler
    this.server.setRequestHandler(this.ListToolsRequestSchema, async () => {
      try {
        const allTools = Object.values(toolsConfigMinimal);
        return {
          tools: allTools,
        };
      } catch (error) {
        const errorResponse = handleError(error, "list_tools");
        return {
          tools: [],
          error: errorResponse.message,
        };
      }
    });

    // Call tool handler
    this.server.setRequestHandler(
      this.CallToolRequestSchema,
      async (request) => {
        try {
          // Validate request
          if (!request || typeof request !== "object") {
            throw new Error("Invalid request: request must be an object");
          }

          const { params } = request;
          if (!params || typeof params !== "object") {
            throw new Error("Invalid request: params must be an object");
          }

          const { name: toolName, arguments: args } = params;

          if (!toolName) {
            throw new Error("Tool name is required");
          }

          // Ensure we're authorized before handling tool calls
          if (!this.oauthService.isAuthenticated()) {
            await this.authorize();
          }

          // Verify API client exists
          if (!this.api) {
            const token = await this.getToken();
            this.api = new GitHubAPIService(token);
          }

          // Get fresh token (will auto-refresh if needed)
          const token = await this.getToken();

          // Update API service token
          this.api.token = token;

          // Get default repo values for convenience
          const defaults = this.getDefaultRepo();
          const finalArgs = {
            owner: args.owner || defaults.owner,
            repo: args.repo || defaults.repo,
            ...args,
          };

          let result;

          // Route to appropriate handler
          // All handlers expect: (params, defaultRepo, apiService)
          switch (toolName) {
            // File Management
            case "create_or_update_file":
              result = await fileManagementMinimal.createOrUpdateFileHandler(
                finalArgs,
                defaults,
                this.api
              );
              break;
            case "get_file":
              result = await fileManagementMinimal.getFileHandler(
                finalArgs,
                defaults,
                this.api
              );
              break;
            case "delete_file":
              result = await fileManagementMinimal.deleteFileHandler(
                finalArgs,
                defaults,
                this.api
              );
              break;

            // Repository
            case "list_contents":
              result = await repositoryMinimal.listContentsHandler(
                finalArgs,
                defaults,
                this.api
              );
              break;
            case "list_commits":
              result = await repositoryMinimal.listCommitsHandler(
                finalArgs,
                defaults,
                this.api
              );
              break;

            // Search
            case "search_code":
              result = await searchMinimal.searchCodeHandler(
                finalArgs,
                defaults,
                this.api
              );
              break;

            // Document Catalog
            case "get_repository_catalog":
              result = await documentCatalogMinimal.getRepositoryCatalogHandler(
                finalArgs,
                defaults,
                this.api,
                this.getServerConfig()
              );
              break;

            default:
              throw new Error(`Unknown tool: ${toolName}`);
          }

          return formatHandlerResponse(result);
        } catch (error) {
          const errorResponse = handleError(error, request?.params?.name);
          return formatHandlerResponse(errorResponse, true);
        }
      }
    );
  }

  async run() {
    const transport = new this.StdioServerTransport();
    await this.server.connect(transport);
    // Server running - stdio is used for MCP protocol, no console output
  }
}

module.exports = GitHubMCPServerMinimalOAuth;
