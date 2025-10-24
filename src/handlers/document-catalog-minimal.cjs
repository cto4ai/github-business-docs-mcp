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
async function getRepositoryCatalogHandler(params, defaultRepo, apiService) {
  try {
    // Extract parameters with defaults
    const owner = params.owner || defaultRepo.owner;
    const repo = params.repo || defaultRepo.repo;
    const path = params.path || '';
    const extensions = params.include_extensions || ['.md', '.txt'];

    // Validate required parameters
    if (!owner || !repo) {
      return {
        success: false,
        error: 'Repository owner and name are required. Please specify owner and repo, or configure defaults.'
      };
    }

    // Create catalog service instance
    const catalogService = new DocumentCatalogService(apiService);

    // Build catalog (will use cache if available)
    const catalog = await catalogService.buildCatalog(
      owner,
      repo,
      path,
      extensions
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
