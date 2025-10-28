// Docroot Resolver Utility
// Provides docroot resolution and path validation for tool handlers

const PathValidator = require('../services/path-validator.cjs');

class DocrootResolver {
  constructor(apiService, serverConfig = {}) {
    this.api = apiService;
    this.serverConfig = serverConfig;
    this.cache = new Map(); // Cache for repo configs
    this.TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load repository configuration from .mcp-config.json
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} - Config object with normalized docroot
   */
  async loadRepoConfig(owner, repo) {
    const cacheKey = `${owner}/${repo}/config`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.TTL) {
      return cached.config;
    }

    try {
      const endpoint = `/repos/${owner}/${repo}/contents/.mcp-config.json`;
      const response = await this.api.makeGitHubRequest(endpoint);

      // Decode base64 content
      const content = Buffer.from(response.content, 'base64').toString('utf-8');
      const config = JSON.parse(content);

      const repoConfig = {
        docroot: PathValidator.normalizeDocroot(config.mcp?.docroot),
        include_extensions: config.mcp?.include_extensions || null
      };

      this.cache.set(cacheKey, {
        config: repoConfig,
        timestamp: Date.now()
      });

      return repoConfig;
    } catch (error) {
      // Config file doesn't exist - cache empty config
      const emptyConfig = { docroot: null, include_extensions: null };
      this.cache.set(cacheKey, {
        config: emptyConfig,
        timestamp: Date.now()
      });
      return emptyConfig;
    }
  }

  /**
   * Resolve effective docroot from priority hierarchy
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Resolution options
   * @param {string} options.toolParam - Tool-level path parameter (highest priority)
   * @param {boolean} options.ignore_docroot - Whether to ignore docroot (returns empty string)
   * @returns {Promise<Object>} - { docroot: string, source: string }
   */
  async resolveDocroot(owner, repo, options = {}) {
    const { toolParam, ignore_docroot = false } = options;

    // If ignore_docroot is true, return empty docroot (full repo access)
    if (ignore_docroot === true) {
      return { docroot: '', source: 'ignored' };
    }

    // Priority 1: Tool parameter (for catalog tool mainly)
    if (toolParam) {
      return { docroot: toolParam, source: 'tool_parameter' };
    }

    // Priority 2: Repo config
    const repoConfig = await this.loadRepoConfig(owner, repo);
    if (repoConfig.docroot !== null) {
      return { docroot: repoConfig.docroot, source: 'repo_config' };
    }

    // Priority 3: Server default
    const serverDefault = this.serverConfig.default_docroot || null;
    if (serverDefault) {
      const normalized = PathValidator.normalizeDocroot(serverDefault);
      if (normalized !== null) {
        return { docroot: normalized, source: 'server_default' };
      }
    }

    // Priority 4: Repository root (no restrictions)
    return { docroot: '', source: 'repository_root' };
  }

  /**
   * Validate a path against docroot restrictions
   * Convenience method that combines resolution and validation
   *
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - Path to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.ignore_docroot - Whether to bypass docroot check
   * @param {string} options.operation - Operation name (for error messages)
   * @returns {Promise<Object>} - { valid: boolean, error: string|null, docroot: string, source: string }
   */
  async validatePath(owner, repo, path, options = {}) {
    const { ignore_docroot = false, operation = 'access' } = options;

    // Resolve docroot
    const { docroot, source } = await this.resolveDocroot(owner, repo, { ignore_docroot });

    // Validate path
    const validation = PathValidator.validatePath(path, docroot, { ignore_docroot, operation });

    return {
      ...validation,
      docroot,
      source
    };
  }
}

module.exports = DocrootResolver;
