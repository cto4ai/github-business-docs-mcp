// Document Catalog Service
// Provides lightweight catalog of all documents in repository
// Uses GitHub Tree API for single-call repository discovery

class DocumentCatalogService {
  constructor(githubApiService) {
    this.api = githubApiService;
    this.cache = new Map(); // In-memory cache: key -> { catalog, timestamp }
    this.TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Build catalog of all documents in repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - Root path to catalog (default: '')
   * @param {string[]} extensions - File extensions to include (default: ['.md', '.txt'])
   * @param {string} branch - Branch name (default: main/master)
   * @returns {Promise<Object>} - Document catalog
   */
  async buildCatalog(owner, repo, path = '', extensions = ['.md', '.txt'], branch = 'main') {
    // Check cache first
    const cached = this.getCachedCatalog(owner, repo, path);
    if (cached) {
      return cached;
    }

    try {
      // Get default branch if 'main' doesn't work
      let treeBranch = branch;

      // Fetch repository tree using GitHub Tree API with recursive flag
      // This returns the entire tree in a single API call
      const treeData = await this.fetchRepositoryTree(owner, repo, treeBranch);

      // Filter tree to only include document files
      const documentFiles = this.filterDocumentFiles(treeData.tree, path, extensions);

      // Build tree structure (hierarchical)
      const tree = this.buildTreeStructure(documentFiles, path);

      // Build flat list (linear array)
      const flatList = this.buildFlatList(documentFiles, path);

      // Calculate statistics
      const statistics = this.calculateStatistics(documentFiles, extensions);

      // Build final catalog
      const catalog = {
        repository: `${owner}/${repo}`,
        scanned_path: path || '(root)',
        branch: treeBranch,
        indexed_at: new Date().toISOString(),
        cache_expires_at: new Date(Date.now() + this.TTL).toISOString(),
        statistics,
        tree,
        flat_list: flatList
      };

      // Cache the catalog
      this.setCatalog(owner, repo, path, catalog);

      return catalog;
    } catch (error) {
      // Try 'master' branch if 'main' failed
      if (branch === 'main' && error.message.includes('404')) {
        return this.buildCatalog(owner, repo, path, extensions, 'master');
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
   * Build hierarchical tree structure from flat file list
   * @private
   */
  buildTreeStructure(files, basePath) {
    const tree = {};

    files.forEach(file => {
      // Remove base path if present
      let relativePath = file.path;
      if (basePath) {
        relativePath = file.path.substring(basePath.length);
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }
      }

      const parts = relativePath.split('/');
      let current = tree;

      // Navigate/create nested structure
      for (let i = 0; i < parts.length - 1; i++) {
        const folder = parts[i];
        if (!current[folder]) {
          current[folder] = {};
        }
        current = current[folder];
      }

      // Add file to appropriate folder
      const fileName = parts[parts.length - 1];
      const folderName = parts.length > 1 ? parts[parts.length - 2] : '(root)';

      if (!current[folderName]) {
        current[folderName] = [];
      }

      // Ensure it's an array before pushing
      if (!Array.isArray(current[folderName])) {
        const temp = current[folderName];
        current[folderName] = [];
        // If there was nested structure, preserve it
        if (typeof temp === 'object') {
          Object.keys(temp).forEach(key => {
            current[key] = temp[key];
          });
        }
      }

      current[folderName].push({
        path: file.path,
        name: file.name,
        size: file.size,
        extension: file.extension
      });
    });

    return tree;
  }

  /**
   * Build flat list from file array
   * @private
   */
  buildFlatList(files, basePath) {
    return files.map(file => {
      const pathParts = file.path.split('/');
      const folder = pathParts.length > 1
        ? pathParts.slice(0, -1).join('/')
        : '(root)';

      return {
        path: file.path,
        name: file.name,
        size: file.size,
        extension: file.extension,
        folder: folder
      };
    }).sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Calculate statistics for catalog
   * @private
   */
  calculateStatistics(files, extensions) {
    const stats = {
      total_files: files.length,
      total_folders: new Set(files.map(f => {
        const parts = f.path.split('/');
        return parts.length > 1 ? parts.slice(0, -1).join('/') : '(root)';
      })).size,
      total_size_bytes: files.reduce((sum, f) => sum + (f.size || 0), 0),
      file_types: {}
    };

    // Count by extension
    extensions.forEach(ext => {
      const count = files.filter(f => f.extension === ext).length;
      if (count > 0) {
        stats.file_types[ext] = count;
      }
    });

    // Add human-readable size
    stats.total_size_human = this.formatBytes(stats.total_size_bytes);

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
