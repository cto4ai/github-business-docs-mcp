// Minimal search handler for docs-as-code
const { getOwnerRepo } = require("../utils/shared-utils.cjs");

// Search code in repository
async function searchCodeHandler(params, defaultRepo, apiService) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { query, path, per_page = 10 } = params;

    if (!query) {
      throw new Error("query required");
    }

    // Construct search query with repo scope
    const searchQuery = `${query} repo:${owner}/${repo}${path ? ` path:${path}` : ""}`;

    const result = await apiService.searchCode(searchQuery, { per_page });

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
