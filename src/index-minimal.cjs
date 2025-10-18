#!/usr/bin/env node

// Minimal GitHub MCP Server for docs-as-code
// Provides only 6 essential tools for documentation management

const GitHubAPIService = require("./services/github-api.cjs");
const fileManagementMinimal = require("./handlers/file-management-minimal.cjs");
const repositoryMinimal = require("./handlers/repository-minimal.cjs");
const searchMinimal = require("./handlers/search-minimal.cjs");
const toolsConfigMinimal = require("./utils/tools-config-minimal.cjs");
const { formatHandlerResponse } = require("./utils/response-formatter.cjs");
const { handleError } = require("./utils/error-handler.cjs");

class GitHubMCPServerMinimal {
  constructor(config = {}, sdkModules = {}) {
    this.Server = sdkModules.Server;
    this.StdioServerTransport = sdkModules.StdioServerTransport;
    this.CallToolRequestSchema = sdkModules.CallToolRequestSchema;
    this.ListToolsRequestSchema = sdkModules.ListToolsRequestSchema;

    this.defaultOwner = null;
    this.defaultRepo = null;

    const token = process.env.GH_TOKEN
      ? process.env.GH_TOKEN.trim()
      : undefined;

    this.api = new GitHubAPIService(token);

    // Set default repository from config or environment
    this.defaultOwner = config.defaultOwner || process.env.GH_DEFAULT_OWNER;
    this.defaultRepo = config.defaultRepo || process.env.GH_DEFAULT_REPO;

    this.server = new this.Server(
      {
        name: "GitHub Docs MCP Server (Minimal)",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  getDefaultRepo() {
    return {
      owner: this.defaultOwner,
      repo: this.defaultRepo,
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

          if (!request.params || typeof request.params !== "object") {
            throw new Error("Invalid request: missing or invalid params");
          }

          const name = request.params.name;
          const args = request.params.arguments || {};

          if (!name || typeof name !== "string" || name.trim() === "") {
            throw new Error(
              "Invalid request: tool name is required and must be a non-empty string"
            );
          }

          if (!this.api) {
            throw new Error("GitHub API service is not initialized");
          }

          const defaultRepo = this.getDefaultRepo();

          // Route to minimal handlers
          switch (name.trim()) {
            case "create_or_update_file":
              return formatHandlerResponse(
                await fileManagementMinimal.createOrUpdateFileHandler(
                  args,
                  defaultRepo,
                  this.api
                )
              );

            case "get_file":
              return formatHandlerResponse(
                await fileManagementMinimal.getFileHandler(
                  args,
                  defaultRepo,
                  this.api
                )
              );

            case "delete_file":
              return formatHandlerResponse(
                await fileManagementMinimal.deleteFileHandler(
                  args,
                  defaultRepo,
                  this.api
                )
              );

            case "list_contents":
              return formatHandlerResponse(
                await repositoryMinimal.listContentsHandler(
                  args,
                  defaultRepo,
                  this.api
                )
              );

            case "list_commits":
              return formatHandlerResponse(
                await repositoryMinimal.listCommitsHandler(
                  args,
                  defaultRepo,
                  this.api
                )
              );

            case "search_code":
              return formatHandlerResponse(
                await searchMinimal.searchCodeHandler(
                  args,
                  defaultRepo,
                  this.api
                )
              );

            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          let errorMessage = "An unexpected error occurred";
          const toolName = request?.params?.name || "unknown_tool";

          try {
            const errorResponse = handleError(error, `tool:${toolName}`, {
              toolName: toolName,
              arguments: request?.params?.arguments,
            });
            errorMessage = errorResponse.message;
          } catch (handlerError) {
            errorMessage = `Error in ${toolName}: ${
              error?.message || "Unknown error occurred"
            }`;
            process.stderr.write(
              `Error handler failed: ${handlerError.message}\n`
            );
            process.stderr.write(
              `Original error: ${error?.message || "Unknown"}\n`
            );
          }

          return {
            content: [
              {
                type: "text",
                text: errorMessage,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  async run() {
    let authenticatedUser;
    try {
      authenticatedUser = await this.api.testAuthentication();
    } catch (error) {
      console.error("Failed to authenticate with GitHub:", error.message);
      process.exit(1);
    }

    const transport = new this.StdioServerTransport();

    try {
      await this.server.connect(transport);
      console.error("🚀 GitHub Docs MCP Server (Minimal) is running...");
      console.error(
        `👤 Authenticated as: ${authenticatedUser.login} (${
          authenticatedUser.name || "No name set"
        }) ${
          authenticatedUser.email ? "email: " + authenticatedUser.email : ""
        }`
      );

      if (this.defaultOwner && this.defaultRepo) {
        console.error(
          `📦 Default repository: ${this.defaultOwner}/${this.defaultRepo}`
        );
      }

      const totalToolsCount = Object.keys(toolsConfigMinimal).length;
      console.error(`✅ ${totalToolsCount} minimal tools available`);

      process.stdin.resume();
    } catch (error) {
      console.error("Failed to connect server:", error);
      process.exit(1);
    }
  }
}

// Global error handlers
process.on("uncaughtException", (error) => {
  process.stderr.write(`Uncaught Exception: ${error.message}\n`);
  process.stderr.write(`Stack: ${error.stack}\n`);
});

process.on("unhandledRejection", (reason, promise) => {
  process.stderr.write(
    `Unhandled Rejection at: ${promise}, reason: ${reason}\n`
  );
});

process.on("SIGINT", async () => {
  console.error("🛑 Shutting down GitHub Docs MCP Server (Minimal)...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error(
    "⚠️  Received SIGTERM, shutting down GitHub Docs MCP Server (Minimal)..."
  );
  process.exit(0);
});

module.exports = GitHubMCPServerMinimal;
