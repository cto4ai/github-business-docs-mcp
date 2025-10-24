#!/usr/bin/env node

/**
 * Test script to create a real commit via OAuth MCP
 * Verifies that user attribution works correctly
 */

require('dotenv').config();
const GitHubOAuthService = require("./src/services/oauth-service.cjs");

async function testRealCommit() {
  console.log('🧪 Testing Real Commit with OAuth User Attribution\n');
  console.log('=' .repeat(60));

  // Check environment
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GH_DEFAULT_OWNER, GH_DEFAULT_REPO } = process.env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.log('\n❌ Missing OAuth credentials in .env file');
    console.log('   Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
    return;
  }

  if (!GH_DEFAULT_OWNER || !GH_DEFAULT_REPO) {
    console.log('\n❌ Missing default repository in .env file');
    console.log('   Set GH_DEFAULT_OWNER and GH_DEFAULT_REPO');
    return;
  }

  console.log('\n📋 Configuration:');
  console.log(`   Repository: ${GH_DEFAULT_OWNER}/${GH_DEFAULT_REPO}`);
  console.log(`   GitHub App: ${GITHUB_CLIENT_ID}`);

  try {
    // Initialize OAuth service
    const oauth = new GitHubOAuthService({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    });

    // Authorize user
    console.log('\n🔐 Starting OAuth Authorization...');
    const { accessToken, user } = await oauth.authorize();

    console.log(`\n✅ Authorized as: ${user.login} (${user.name})`);

    // Create test file
    const timestamp = Date.now();
    const filename = `oauth-commit-test-${timestamp}.md`;
    const content = `# OAuth Commit Test

**Created By:** ${user.name || user.login} (@${user.login})
**Date:** ${new Date().toISOString()}
**Purpose:** Test OAuth user attribution

This file was created via OAuth MCP to verify that commits show individual user attribution.

## Expected Result

When viewing this commit on GitHub, it should show:
- **Author:** ${user.name || user.login}
- **Committer:** ${user.name || user.login}
- **Avatar:** @${user.login}'s profile picture
- **NOT a bot account**

## Test Details

- OAuth Service: Working ✅
- User Token: Received ✅
- User Info: Retrieved ✅
- File Creation: In progress...

---

🤖 Generated via OAuth MCP - Minimal Docs-as-Code Server
`;

    console.log('\n📝 Creating test file in repository...');
    console.log(`   File: ${filename}`);
    console.log(`   Repository: ${GH_DEFAULT_OWNER}/${GH_DEFAULT_REPO}`);

    // Encode content to base64
    const contentBase64 = Buffer.from(content).toString('base64');

    // Create file via GitHub API
    const createUrl = `https://api.github.com/repos/${GH_DEFAULT_OWNER}/${GH_DEFAULT_REPO}/contents/${filename}`;

    const response = await fetch(createUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Test OAuth user attribution via minimal MCP\n\nCreated by ${user.login} to verify individual commit attribution.`,
        content: contentBase64,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create file: ${response.status} ${response.statusText}\n${error}`);
    }

    const result = await response.json();

    console.log('\n✅ File created successfully!');
    console.log(`   File: ${filename}`);
    console.log(`   Commit SHA: ${result.commit.sha}`);
    console.log(`   Commit URL: ${result.commit.html_url}`);

    // Fetch commit details to verify attribution
    console.log('\n🔍 Verifying commit attribution...');

    const commitUrl = `https://api.github.com/repos/${GH_DEFAULT_OWNER}/${GH_DEFAULT_REPO}/commits/${result.commit.sha}`;

    const commitResponse = await fetch(commitUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!commitResponse.ok) {
      throw new Error(`Failed to fetch commit: ${commitResponse.status}`);
    }

    const commit = await commitResponse.json();

    console.log('\n📊 Commit Attribution Details:');
    console.log(`   Commit SHA: ${commit.sha.substring(0, 8)}...`);
    console.log(`   Author Name: ${commit.commit.author.name}`);
    console.log(`   Author Email: ${commit.commit.author.email}`);
    console.log(`   Committer Name: ${commit.commit.committer.name}`);
    console.log(`   Committer Email: ${commit.commit.committer.email}`);

    if (commit.author) {
      console.log(`   GitHub User: @${commit.author.login}`);
      console.log(`   Avatar: ${commit.author.avatar_url}`);
    }

    // Verify attribution
    const isCorrectUser = commit.author && commit.author.login === user.login;
    const authorMatchesUser = commit.commit.author.name.includes(user.name || user.login);

    console.log('\n' + '='.repeat(60));

    if (isCorrectUser && authorMatchesUser) {
      console.log('✅ SUCCESS! User attribution is CORRECT!');
      console.log(`   ✓ Commit shows ${user.login} as author`);
      console.log(`   ✓ Not showing as a bot account`);
      console.log(`   ✓ Individual user attribution working!`);
    } else {
      console.log('⚠️  WARNING: Attribution may not be correct');
      console.log(`   Expected: ${user.login}`);
      console.log(`   Got: ${commit.author?.login || 'unknown'}`);
    }

    console.log('\n👉 View commit on GitHub:');
    console.log(`   ${commit.html_url}`);

    console.log('\n🎯 OAuth User Attribution Test Complete!');
    console.log('=' .repeat(60));

    // Logout
    oauth.logout();

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
testRealCommit().catch(console.error);
