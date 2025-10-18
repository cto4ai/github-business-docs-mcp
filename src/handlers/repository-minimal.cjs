// Minimal repository handler for docs-as-code
const { getOwnerRepo } = require("../utils/shared-utils.cjs");

// List directory contents
async function listContentsHandler(params, defaultRepo, apiService) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path = "", ref } = params;

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
async function listCommitsHandler(params, defaultRepo, apiService) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path, sha, per_page = 10 } = params;

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
