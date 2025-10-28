// Minimal repository handler for docs-as-code
const { getOwnerRepo } = require("../utils/shared-utils.cjs");
const DocrootResolver = require("../utils/docroot-resolver.cjs");

// List directory contents
async function listContentsHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path = "", ref, ignore_docroot = false } = params;

    // Validate path against docroot restrictions
    const resolver = new DocrootResolver(apiService, serverConfig);
    const validation = await resolver.validatePath(owner, repo, path, {
      ignore_docroot,
      operation: 'list contents'
    });

    if (!validation.valid) {
      return {
        success: false,
        message: validation.error,
        error: `Docroot restriction: ${validation.reason}`
      };
    }

    const result = await apiService.getRepoContents(owner, repo, path, ref);

    return {
      success: true,
      data: Array.isArray(result) ? result : [result],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.toString(),
    };
  }
}

// List commits
async function listCommitsHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path, sha, per_page = 10, ignore_docroot = false } = params;

    // Validate path against docroot restrictions (if path is specified)
    if (path) {
      const resolver = new DocrootResolver(apiService, serverConfig);
      const validation = await resolver.validatePath(owner, repo, path, {
        ignore_docroot,
        operation: 'list commits'
      });

      if (!validation.valid) {
        return {
          success: false,
          message: validation.error,
          error: `Docroot restriction: ${validation.reason}`
        };
      }
    }

    const result = await apiService.listCommits(
      owner,
      repo,
      { path, sha, per_page }
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.toString(),
    };
  }
}

module.exports = {
  listContentsHandler,
  listCommitsHandler,
};
