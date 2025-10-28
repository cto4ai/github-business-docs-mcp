// Minimal search handler for docs-as-code
const { getOwnerRepo } = require("../utils/shared-utils.cjs");
const DocrootResolver = require("../utils/docroot-resolver.cjs");
const PathValidator = require("../services/path-validator.cjs");

// Search code in repository
async function searchCodeHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { query, path, per_page = 10, ignore_docroot = false, allow_dotfiles = false } = params;

    if (!query) {
      throw new Error("query required");
    }

    // Resolve docroot to scope search
    const resolver = new DocrootResolver(apiService, serverConfig);
    const { docroot } = await resolver.resolveDocroot(owner, repo, { ignore_docroot });

    // Determine search path: user-specified path OR docroot (if not ignoring)
    let searchPath = path;
    if (!searchPath && docroot && !ignore_docroot) {
      searchPath = docroot;
    } else if (searchPath && docroot && !ignore_docroot) {
      // Prepend docroot to user-specified path
      if (!searchPath.startsWith(docroot + '/') && searchPath !== docroot) {
        searchPath = `${docroot}/${searchPath}`;
      }
    }

    // Construct search query with repo scope
    const searchQuery = `${query} repo:${owner}/${repo}${searchPath ? ` path:${searchPath}` : ""}`;

    const result = await apiService.searchCode(searchQuery, { per_page });

    // Filter out dot-files from results unless allow_dotfiles is true
    if (!allow_dotfiles && result.items) {
      result.items = result.items.filter(item => {
        return !PathValidator.hasDotComponents(item.path);
      });
      result.total_count = result.items.length;  // Update count after filtering
    }

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
  searchCodeHandler,
};
