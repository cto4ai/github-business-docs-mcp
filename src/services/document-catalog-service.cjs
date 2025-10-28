// Document Catalog Service
// Provides lightweight catalog of all documents in repository
// Uses GitHub Tree API for single-call repository discovery

class DocumentCatalogService {
  constructor(githubApiService, serverConfig = {}) {
    this.api = githubApiService;
    this.serverConfig = serverConfig;
    this.cache = new Map(); // In-memory cache: key -> { catalog, timestamp }
    this.TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Normalize docroot value to handle special cases
   * @param {string|undefined} value - Docroot value from config
   * @returns {string|null} - Normalized docroot or null if not set
   * @private
   */
  normalizeDocroot(value) {
    // undefined = not set in config, use server default
    if (value === undefined) return null;

    // Normalize root directory indicators to empty string
    if (value === '.' || value === '/' || value === './') {
      return '';
    }

    // Remove trailing slashes for consistency
    if (typeof value === 'string' && value.endsWith('/')) {
      return value.slice(0, -1);
    }

    return value;
  }

  /**
   * Load repository configuration from .mcp-config.json
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} - Config object or defaults
   * @private
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
        docroot: this.normalizeDocroot(config.mcp?.docroot),
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
   * @param {Object} options - Options object
   * @returns {Promise<string>} - Effective docroot path
   * @private
   */
  async resolveDocroot(owner, repo, options) {
    // Priority 1: Tool parameter
    if (options.path) return options.path;

    // Priority 2: Repo config
    const repoConfig = await this.loadRepoConfig(owner, repo);
    if (repoConfig.docroot !== null) return repoConfig.docroot;

    // Priority 3: Server default
    if (options.serverDocroot) return options.serverDocroot;

    // Priority 4: Repository root
    return '';
  }

  /**
   * Build catalog of all documents in repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Catalog options
   * @param {string} options.path - Root path to catalog (optional)
   * @param {string[]} options.extensions - File extensions to include (optional)
   * @param {string} options.branch - Branch name (optional, default: main/master)
   * @param {string} options.serverDocroot - Server-level default docroot (optional)
   * @returns {Promise<Object>} - Document catalog
   */
  async buildCatalog(owner, repo, options = {}) {
    // Resolve effective docroot from priority hierarchy
    const docroot = await this.resolveDocroot(owner, repo, options);

    // Check cache first
    const cached = this.getCachedCatalog(owner, repo, docroot);
    if (cached) {
      return cached;
    }

    // Load repo config for extensions
    const repoConfig = await this.loadRepoConfig(owner, repo);

    // Determine final extensions
    const extensions = options.extensions || repoConfig.include_extensions || ['.md', '.txt'];
    const branch = options.branch || 'main';

    try {
      // Get default branch if 'main' doesn't work
      let treeBranch = branch;

      // Fetch repository tree using GitHub Tree API with recursive flag
      // This returns the entire tree in a single API call
      const treeData = await this.fetchRepositoryTree(owner, repo, treeBranch);

      // Filter tree to only include document files
      const documentFiles = this.filterDocumentFiles(treeData.tree, docroot, extensions);

      // Build flat list (linear array) - minimal format
      const flatList = this.buildFlatList(documentFiles);

      // Calculate statistics
      const statistics = this.calculateStatistics(documentFiles, extensions);

      // Build final catalog (v3.0.0 format)
      const catalog = {
        repository: `${owner}/${repo}`,
        branch: treeBranch,
        docroot: docroot || '(root)',
        cache_expires_at: new Date(Date.now() + this.TTL).toISOString(),
        statistics,
        files: flatList  // Renamed from flat_list
      };

      // Cache the catalog
      this.setCatalog(owner, repo, docroot, catalog);

      return catalog;
    } catch (error) {
      // Try 'master' branch if 'main' failed
      if (branch === 'main' && error.message.includes('404')) {
        return this.buildCatalog(owner, repo, { ...options, branch: 'master' });
      }
      throw new Error(`Failed to build catalog: ${error.message}`);
    }
  }

  /**
   * Fetch repository tree from GitHub API
   * @private
   */
  async fetchRepositoryTree(owner, repo, branch) {
    // Use GitHub Tree API with recursive flag
    // GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1
    const endpoint = `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    try {
      const response = await this.api.makeGitHubRequest(endpoint);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch repository tree: ${error.message}`);
    }
  }

  /**
   * Filter tree to only include document files in specified path
   * @private
   */
  filterDocumentFiles(tree, basePath, extensions) {
    return tree
      .filter(item => {
        // Only include blobs (files), not trees (directories)
        if (item.type !== 'blob') return false;

        // Filter by path if specified
        if (basePath && !item.path.startsWith(basePath)) return false;

        // Filter by extension
        const hasValidExtension = extensions.some(ext =>
          item.path.toLowerCase().endsWith(ext.toLowerCase())
        );

        return hasValidExtension;
      })
      .map(item => ({
        path: item.path,
        name: item.path.split('/').pop(),
        size: item.size,
        sha: item.sha,
        extension: this.getFileExtension(item.path)
      }));
  }

  /**
   * Build flat list from file array (minimal format - v3.0.0)
   * @private
   */
  buildFlatList(files) {
    return files.map(file => ({
      path: file.path,
      size: file.size
    })).sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Calculate statistics for catalog (v3.0.0 minimal format)
   * @private
   */
  calculateStatistics(files, extensions) {
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

    const stats = {
      total_files: files.length,
      total_folders: new Set(files.map(f => {
        const parts = f.path.split('/');
        return parts.length > 1 ? parts.slice(0, -1).join('/') : '(root)';
      })).size,
      total_size: this.formatBytes(totalBytes),
      file_types: {}
    };

    // Count by extension
    extensions.forEach(ext => {
      const count = files.filter(f => f.extension === ext).length;
      if (count > 0) {
        stats.file_types[ext] = count;
      }
    });

    return stats;
  }

  /**
   * Get file extension from path
   * @private
   */
  getFileExtension(path) {
    const match = path.match(/\.[^.]+$/);
    return match ? match[0] : '';
  }

  /**
   * Format bytes to human-readable string
   * @private
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get cached catalog if available and not expired
   * @private
   */
  getCachedCatalog(owner, repo, path) {
    const key = `${owner}/${repo}/${path}`;
    const cached = this.cache.get(key);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;

    if (age > this.TTL) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return cached.catalog;
  }

  /**
   * Cache catalog with timestamp
   * @private
   */
  setCatalog(owner, repo, path, catalog) {
    const key = `${owner}/${repo}/${path}`;
    this.cache.set(key, {
      catalog,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific repository (or all if no params)
   */
  clearCache(owner = null, repo = null) {
    if (!owner) {
      // Clear entire cache
      this.cache.clear();
      return;
    }

    if (!repo) {
      // Clear all entries for this owner
      const prefix = `${owner}/`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
      return;
    }

    // Clear all entries for this owner/repo
    const prefix = `${owner}/${repo}/`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key === `${owner}/${repo}/`) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = DocumentCatalogService;
