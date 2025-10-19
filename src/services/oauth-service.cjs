const express = require('express');
const { randomBytes } = require('crypto');

/**
 * OAuth Service for GitHub App user-to-server authentication
 * Provides individual user attribution for commits
 */
class GitHubOAuthService {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.GITHUB_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.GITHUB_CLIENT_SECRET;
    this.redirectUri = config.redirectUri || 'http://localhost:3000/auth/callback';
    this.scope = config.scope || 'repo user:email';
    this.port = config.port || 3000;

    // Token storage
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.authenticatedUser = null;

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'OAuth configuration required: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set'
      );
    }
  }

  /**
   * Start the OAuth authorization flow
   * Opens browser for user to authorize
   */
  async authorize() {
    const state = randomBytes(16).toString('hex');

    const authUrl =
      `https://github.com/login/oauth/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(this.scope)}&` +
      `state=${state}`;

    console.error('🔐 Starting OAuth authorization...');
    console.error(`   Opening browser to: ${authUrl}\n`);

    // Try to open browser using dynamic import (open is ESM-only)
    try {
      const open = (await import('open')).default;
      await open(authUrl);
      console.error('✅ Browser opened');
    } catch (error) {
      console.error('⚠️  Could not auto-open browser');
      console.error(`   Please open this URL manually:\n   ${authUrl}\n`);
    }

    // Wait for callback with authorization code
    const code = await this.waitForCallback(state);

    // Exchange code for access token
    await this.exchangeCodeForToken(code);

    // Get user info
    await this.getUserInfo();

    return {
      accessToken: this.accessToken,
      user: this.authenticatedUser,
    };
  }

  /**
   * Wait for OAuth callback on localhost
   */
  async waitForCallback(expectedState) {
    return new Promise((resolve, reject) => {
      const app = express();
      let server;

      const timeout = setTimeout(() => {
        server?.close();
        reject(new Error('Timeout waiting for authorization (5 minutes)'));
      }, 300000); // 5 minute timeout

      app.get('/auth/callback', async (req, res) => {
        const { code, state, error } = req.query;

        if (error) {
          clearTimeout(timeout);
          res.send(`❌ Authorization failed: ${error}`);
          server.close();
          reject(new Error(`Authorization error: ${error}`));
          return;
        }

        if (state !== expectedState) {
          clearTimeout(timeout);
          res.send('❌ Invalid state parameter (CSRF check failed)');
          server.close();
          reject(new Error('State mismatch - possible CSRF attack'));
          return;
        }

        if (code) {
          clearTimeout(timeout);
          res.send(`
            <html>
              <head>
                <title>Authorization Successful</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .container {
                    background: white;
                    padding: 60px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                  }
                  h1 { color: #28a745; margin: 0 0 20px 0; }
                  p { color: #666; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>✅ Authorization Successful!</h1>
                  <p>You can close this window and return to your terminal.</p>
                </div>
              </body>
            </html>
          `);

          server.close();
          resolve(code);
        }
      });

      server = app.listen(this.port, () => {
        console.error(`🎧 Listening for OAuth callback on http://localhost:${this.port}`);
        console.error('   Waiting for authorization...\n');
      });
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    console.error('🔄 Exchanging authorization code for access token...');

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Token exchange failed: ${data.error_description}`);
    }

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    // Calculate expiry time
    if (data.expires_in) {
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    }

    console.error('✅ Access token received');
    console.error(`   Token type: ${data.token_type}`);
    console.error(`   Scope: ${data.scope}`);
    if (data.expires_in) {
      console.error(`   Expires in: ${data.expires_in} seconds (${Math.round(data.expires_in / 60)} minutes)`);
    }

    return this.accessToken;
  }

  /**
   * Get authenticated user information
   */
  async getUserInfo() {
    console.error('\n👤 Fetching user information...');

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
    }

    this.authenticatedUser = await response.json();

    console.error(`✅ Authenticated as: ${this.authenticatedUser.login}`);
    console.error(`   Name: ${this.authenticatedUser.name || '(not set)'}`);
    console.error(`   Email: ${this.authenticatedUser.email || '(private)'}`);
    console.error(`   ID: ${this.authenticatedUser.id}`);

    return this.authenticatedUser;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return false;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.error('🔄 Refreshing access token...');

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Token refresh failed: ${data.error_description}`);
    }

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    if (data.expires_in) {
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    }

    console.error('✅ Access token refreshed');

    return this.accessToken;
  }

  /**
   * Get current valid token (refreshes if needed)
   */
  async getToken() {
    if (!this.accessToken) {
      throw new Error('Not authenticated - call authorize() first');
    }

    // Refresh token if expired or expiring soon (within 5 minutes)
    if (this.tokenExpiry && (Date.now() + 300000) >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Get authenticated user
   */
  getUser() {
    return this.authenticatedUser;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.authenticatedUser;
  }

  /**
   * Clear authentication
   */
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.authenticatedUser = null;
    console.error('🔓 Logged out');
  }
}

module.exports = GitHubOAuthService;
