#!/usr/bin/env node

// Minimal GitHub MCP Server with OAuth entry point
const GitHubMCPServerMinimalOAuth = require("./src/index-minimal-oauth.cjs");

// Parse command line arguments for config
const args = process.argv.slice(2);
const config = {
  oauth: {}, // OAuth config from environment
};

// Support command line arguments for default repository
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--default-owner" && args[i + 1]) {
    config.defaultOwner = args[i + 1];
    i++;
  } else if (args[i] === "--default-repo" && args[i + 1]) {
    config.defaultRepo = args[i + 1];
    i++;
  }
}

// Start the minimal OAuth server with config
async function main() {
  try {
    const { Server } = await import(
      "@modelcontextprotocol/sdk/server/index.js"
    );
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    const { CallToolRequestSchema, ListToolsRequestSchema } = await import(
      "@modelcontextprotocol/sdk/types.js"
    );

    const sdkModules = {
      Server,
      StdioServerTransport,
      CallToolRequestSchema,
      ListToolsRequestSchema,
    };

    const server = new GitHubMCPServerMinimalOAuth(config, sdkModules);
    await server.run();
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main();
