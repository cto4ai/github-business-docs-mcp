// Minimal repository handler for docs-as-code
const { getOwnerRepo } = require("../utils/shared-utils.cjs");
const DocrootResolver = require("../utils/docroot-resolver.cjs");

// List directory contents
async function listContentsHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path = "", ref, ignore_docroot = false, allow_dotfiles = false } = params;

    // Validate path against docroot and dotfile restrictions
    const resolver = new DocrootResolver(apiService, serverConfig);
    const validation = await resolver.validatePath(owner, repo, path, {
      ignore_docroot,
      allow_dotfiles,
      operation: 'list contents'
    });

    if (!validation.valid) {
      return {
        success: false,
        message: validation.error,
        error: `Path restriction: ${validation.reason}`
      };
    }

    // Construct full GitHub path by prepending docroot (if applicable)
    const { docroot } = await resolver.resolveDocroot(owner, repo, { ignore_docroot });
    let fullPath;
    if (ignore_docroot || !docroot) {
      fullPath = path;
    } else {
      if (path === "" || path === ".") {
        fullPath = docroot;  // List root of docroot
      } else if (path.startsWith(docroot + '/') || path === docroot) {
        fullPath = path;
      } else {
        fullPath = path ? `${docroot}/${path}` : docroot;
      }
    }

    const result = await apiService.getRepoContents(owner, repo, fullPath, ref);

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
    const { path, sha, per_page = 10, ignore_docroot = false, allow_dotfiles = false } = params;

    let fullPath = path;

    // Validate and prepend path against docroot (if path is specified)
    if (path) {
      const resolver = new DocrootResolver(apiService, serverConfig);
      const validation = await resolver.validatePath(owner, repo, path, {
        ignore_docroot,
        allow_dotfiles,
        operation: 'list commits'
      });

      if (!validation.valid) {
        return {
          success: false,
          message: validation.error,
          error: `Path restriction: ${validation.reason}`
        };
      }

      // Construct full GitHub path by prepending docroot (if applicable)
      const { docroot } = await resolver.resolveDocroot(owner, repo, { ignore_docroot });
      if (ignore_docroot || !docroot) {
        fullPath = path;
      } else {
        if (path.startsWith(docroot + '/') || path === docroot) {
          fullPath = path;
        } else {
          fullPath = `${docroot}/${path}`;
        }
      }
    }

    const result = await apiService.listCommits(
      owner,
      repo,
      { path: fullPath, sha, per_page }
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
