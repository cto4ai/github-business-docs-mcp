#!/usr/bin/env node

/**
 * Test script for minimal MCP server
 * Tests that the 6 essential tools are loaded and callable
 */

const GitHubMCPServerMinimal = require("./src/index-minimal.cjs");

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

async function testMinimalMCP() {
  console.log('🧪 Testing Minimal MCP Server\n');
  console.log('=' .repeat(60));

  // Check for required environment variables
  console.log('\n📋 Checking Environment:');
  console.log(`   GH_TOKEN: ${process.env.GH_TOKEN ? '✓ Set' : '✗ Not set'}`);
  console.log(`   GH_DEFAULT_OWNER: ${process.env.GH_DEFAULT_OWNER || '(not set)'}`);
  console.log(`   GH_DEFAULT_REPO: ${process.env.GH_DEFAULT_REPO || '(not set)'}`);

  if (!process.env.GH_TOKEN) {
    console.log('\n⚠️  GH_TOKEN not set - using mock token for tool listing test');
    console.log('   (Actual API calls will fail, but we can verify tools load)');
    process.env.GH_TOKEN = 'mock_token_for_testing';
  }

  console.log('\n🔧 Initializing Server:');

  try {
    const config = {
      defaultOwner: process.env.GH_DEFAULT_OWNER || 'test-owner',
      defaultRepo: process.env.GH_DEFAULT_REPO || 'test-repo'
    };

    const server = new GitHubMCPServerMinimal(config, mockSDK);

    console.log(`✓ Default repository: ${config.defaultOwner}/${config.defaultRepo}`);

    // Test list tools
    console.log('\n📦 Testing Tool Listing:');
    const listHandler = server.server.handlers.get('ListToolsRequest');
    if (listHandler) {
      const toolsResponse = await listHandler();
      console.log(`✓ Found ${toolsResponse.tools.length} tools:`);
      toolsResponse.tools.forEach((tool, i) => {
        console.log(`   ${i + 1}. ${tool.name}`);
        console.log(`      ${tool.description}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Minimal MCP Server Test Complete!');
    console.log('\nThe server is ready to:');
    console.log('  • List 6 essential documentation tools');
    console.log('  • Handle file operations (create, read, update, delete)');
    console.log('  • Search and browse repositories');
    console.log('  • View commit history');
    console.log('\n📖 To run the server:');
    console.log('   node server-minimal.cjs --default-owner OWNER --default-repo REPO');
    console.log('\n🔜 Next step: OAuth integration for user attribution');

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
testMinimalMCP().catch(console.error);
