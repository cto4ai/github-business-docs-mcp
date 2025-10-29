// Document Catalog Handler
// Handles get_repository_catalog tool requests

const DocumentCatalogService = require("../services/document-catalog-service.cjs");

/**
 * Get repository catalog handler
 * Returns lightweight catalog of all documents in repository
 *
 * @param {Object} params - Tool parameters
 * @param {string} params.owner - Repository owner (optional, uses default)
 * @param {string} params.repo - Repository name (optional, uses default)
 * @param {string} params.path - Root path to catalog (optional, default: root)
 * @param {string[]} params.include_extensions - File extensions to include (optional, default: ['.md', '.txt'])
 * @param {Object} defaultRepo - Default repository configuration
 * @param {Object} apiService - GitHub API service instance
 * @returns {Promise<Object>} - Handler response
 */
async function getRepositoryCatalogHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    // Extract parameters with defaults
    const owner = params.owner || defaultRepo.owner;
    const repo = params.repo || defaultRepo.repo;

    // Validate required parameters
    if (!owner || !repo) {
      return {
        success: false,
        error: 'Repository owner and name are required. Please specify owner and repo, or configure defaults.'
      };
    }

    // Build options object for catalog service
    const options = {
      path: params.path || null,  // Tool parameter (highest priority)
      extensions: params.include_extensions || null,
      branch: params.branch || 'main',
      serverDocroot: serverConfig.default_docroot || null,  // Server default (lowest priority)
      ignore_docroot: params.ignore_docroot || false  // Allow override
    };

    // If ignore_docroot is true, override path to empty (full repo)
    if (options.ignore_docroot) {
      options.path = '';
    }

    // Create catalog service instance
    const catalogService = new DocumentCatalogService(apiService, serverConfig);

    // Build catalog (will use cache if available)
    const catalog = await catalogService.buildCatalog(
      owner,
      repo,
      options
    );

    // Return success response
    return {
      success: true,
      data: catalog,
      message: `Found ${catalog.statistics.total_files} documents across ${catalog.statistics.total_folders} folders`
    };

  } catch (error) {
    // Handle errors gracefully
    return {
      success: false,
      error: `Failed to build repository catalog: ${error.message}`,
      details: error.stack
    };
  }
}

module.exports = {
  getRepositoryCatalogHandler
};
