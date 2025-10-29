// Minimal file management handler for docs-as-code
// Combines create/update into single operation
const { getOwnerRepo } = require("../utils/shared-utils.cjs");
const DocrootResolver = require("../utils/docroot-resolver.cjs");

// Combined create or update file handler
async function createOrUpdateFileHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path: filePath, content, message, branch, ignore_docroot = false, allow_dotfiles = false } = params;

    if (!filePath || !content || !message) {
      throw new Error("path, content, and message required");
    }

    // Validate path against docroot and dotfile restrictions
    const resolver = new DocrootResolver(apiService, serverConfig);
    const validation = await resolver.validatePath(owner, repo, filePath, {
      ignore_docroot,
      allow_dotfiles,
      operation: 'create/update'
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
      // Override mode or no docroot: use path as-is (relative to repo root)
      fullPath = filePath;
    } else {
      // Normal mode: prepend docroot if not already present
      if (filePath.startsWith(docroot + '/') || filePath === docroot) {
        fullPath = filePath;  // Already has docroot prefix
      } else {
        fullPath = `${docroot}/${filePath}`;  // Prepend docroot
      }
    }

    // Encode content
    const fileContent = Buffer.from(String(content)).toString("base64");

    // Check if file exists to get SHA (use fullPath for GitHub API)
    let sha = null;
    try {
      const existing = await apiService.getRepoContents(owner, repo, fullPath, branch);
      if (existing && existing.sha) {
        sha = existing.sha;
      }
    } catch (error) {
      // File doesn't exist, will create new (sha = null)
    }

    const result = await apiService.createOrUpdateFile(
      owner,
      repo,
      fullPath,
      message,
      fileContent,
      sha,
      branch
    );

    return {
      success: true,
      message: `File '${filePath}' ${sha ? 'updated' : 'created'}`,
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

// Get file contents
async function getFileHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path: filePath, ref, ignore_docroot = false, allow_dotfiles = false } = params;

    if (!filePath) {
      throw new Error("path required");
    }

    // Validate path against docroot and dotfile restrictions
    const resolver = new DocrootResolver(apiService, serverConfig);
    const validation = await resolver.validatePath(owner, repo, filePath, {
      ignore_docroot,
      allow_dotfiles,
      operation: 'read'
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
      fullPath = filePath;
    } else {
      if (filePath.startsWith(docroot + '/') || filePath === docroot) {
        fullPath = filePath;
      } else {
        fullPath = `${docroot}/${filePath}`;
      }
    }

    const result = await apiService.getRepoContents(owner, repo, fullPath, ref);

    // Decode content if it's a file
    if (result.content) {
      result.decoded_content = Buffer.from(result.content, 'base64').toString('utf8');
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

// Delete file
async function deleteFileHandler(params, defaultRepo, apiService, serverConfig = {}) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path: filePath, message, branch, ignore_docroot = false, allow_dotfiles = false } = params;

    if (!filePath || !message) {
      throw new Error("path and message required");
    }

    // Validate path against docroot and dotfile restrictions
    const resolver = new DocrootResolver(apiService, serverConfig);
    const validation = await resolver.validatePath(owner, repo, filePath, {
      ignore_docroot,
      allow_dotfiles,
      operation: 'delete'
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
      fullPath = filePath;
    } else {
      if (filePath.startsWith(docroot + '/') || filePath === docroot) {
        fullPath = filePath;
      } else {
        fullPath = `${docroot}/${filePath}`;
      }
    }

    // Get current SHA (use fullPath for GitHub API)
    const existing = await apiService.getRepoContents(owner, repo, fullPath, branch);
    if (!existing || !existing.sha) {
      throw new Error("File not found");
    }

    const result = await apiService.deleteFileFromRepo(
      owner,
      repo,
      fullPath,
      message,
      existing.sha,
      branch
    );

    return {
      success: true,
      message: `File '${filePath}' deleted`,
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
  createOrUpdateFileHandler,
  getFileHandler,
  deleteFileHandler,
};
