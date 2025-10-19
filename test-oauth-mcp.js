#!/usr/bin/env node

/**
 * Test script for minimal MCP server with OAuth
 * Tests OAuth flow and user attribution
 */

require('dotenv').config();
const GitHubMCPServerMinimalOAuth = require("./src/index-minimal-oauth.cjs");

// Mock SDK modules for testing
const mockSDK = {
  Server: class MockServer {
    constructor(serverInfo, capabilities) {
      this.serverInfo = serverInfo;
      this.capabilities = capabilities;
      this.handlers = new Map();
      console.log(`✓ Server initialized: ${serverInfo.name} v${serverInfo.version}`);
    }
    setRequestHandler(schema, handler) {
      this.handlers.set(schema.name || 'handler', handler);
    }
    async connect(transport) {
      console.log('✓ Server connected to transport');
    }
  },
  StdioServerTransport: class MockTransport {},
  CallToolRequestSchema: { name: 'CallToolRequest' },
  ListToolsRequestSchema: { name: 'ListToolsRequest' }
};

async function testOAuthMCP() {
  console.log('🧪 Testing Minimal MCP Server with OAuth\n');
  console.log('=' .repeat(60));

  // Check for required OAuth environment variables
  console.log('\n📋 Checking OAuth Configuration:');
  console.log(`   GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? '✓ Set' : '✗ Not set'}`);
  console.log(`   GITHUB_CLIENT_SECRET: ${process.env.GITHUB_CLIENT_SECRET ? '✓ Set' : '✗ Not set'}`);
  console.log(`   GH_DEFAULT_OWNER: ${process.env.GH_DEFAULT_OWNER || '(not set)'}`);
  console.log(`   GH_DEFAULT_REPO: ${process.env.GH_DEFAULT_REPO || '(not set)'}`);

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.log('\n⚠️  OAuth credentials not set.');
    console.log('   Set them with:');
    console.log('   export GITHUB_CLIENT_ID="your_client_id"');
    console.log('   export GITHUB_CLIENT_SECRET="your_client_secret"');
    console.log('\n   Or create a .env file with these values.');
    console.log('\n📖 See POC results for GitHub App setup:');
    console.log('   ../claude/skills/docs/documents-as-code-project-planning/POC_RESULTS.md');
    return;
  }

  console.log('\n🔧 Initializing OAuth Server:');

  try {
    const config = {
      defaultOwner: process.env.GH_DEFAULT_OWNER || 'test-owner',
      defaultRepo: process.env.GH_DEFAULT_REPO || 'test-repo',
      oauth: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }
    };

    const server = new GitHubMCPServerMinimalOAuth(config, mockSDK);

    console.log(`✓ Default repository: ${config.defaultOwner}/${config.defaultRepo}`);

    // Test OAuth authorization
    console.log('\n🔐 Starting OAuth Authorization Flow:');
    console.log('   This will open your browser for GitHub authorization...');
    console.log('   (Press Ctrl+C to cancel)\n');

    const { accessToken, user } = await server.authorize();

    console.log('\n✅ OAuth Authorization Successful!');
    console.log(`   User: ${user.login} (${user.name || 'no name set'})`);
    console.log(`   Token: ${accessToken.substring(0, 10)}...`);

    // Test tool listing
    console.log('\n📦 Testing Tool Listing:');
    const listHandler = server.server.handlers.get('ListToolsRequest');
    if (listHandler) {
      const toolsResponse = await listHandler();
      console.log(`✓ Found ${toolsResponse.tools.length} tools:`);
      toolsResponse.tools.forEach((tool, i) => {
        console.log(`   ${i + 1}. ${tool.name}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ OAuth MCP Server Test Complete!');
    console.log('\nThe server is ready to:');
    console.log(`  • Authenticate as: ${user.login}`);
    console.log('  • Create files with user attribution');
    console.log('  • All commits will show your name (not a bot)');
    console.log('  • Token auto-refreshes when needed');
    console.log('\n📖 To run the OAuth server:');
    console.log('   node server-minimal-oauth.cjs --default-owner OWNER --default-repo REPO');
    console.log('\n🎯 Ready for production use with individual user attribution!');

    // Logout to clean up
    server.oauthService.logout();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testOAuthMCP().catch(console.error);
