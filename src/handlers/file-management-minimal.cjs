// Minimal file management handler for docs-as-code
// Combines create/update into single operation
const { getOwnerRepo } = require("../utils/shared-utils.cjs");

// Combined create or update file handler
async function createOrUpdateFileHandler(params, defaultRepo, apiService) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path: filePath, content, message, branch } = params;

    if (!filePath || !content || !message) {
      throw new Error("path, content, and message required");
    }

    // Encode content
    const fileContent = Buffer.from(String(content)).toString("base64");

    // Check if file exists to get SHA
    let sha = null;
    try {
      const existing = await apiService.getRepoContents(owner, repo, filePath, branch);
      if (existing && existing.sha) {
        sha = existing.sha;
      }
    } catch (error) {
      // File doesn't exist, will create new (sha = null)
    }

    const result = await apiService.createOrUpdateFile(
      owner,
      repo,
      filePath,
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
async function getFileHandler(params, defaultRepo, apiService) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path: filePath, ref } = params;

    if (!filePath) {
      throw new Error("path required");
    }

    const result = await apiService.getRepoContents(owner, repo, filePath, ref);

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
async function deleteFileHandler(params, defaultRepo, apiService) {
  try {
    const { owner, repo } = getOwnerRepo(params, defaultRepo);
    const { path: filePath, message, branch } = params;

    if (!filePath || !message) {
      throw new Error("path and message required");
    }

    // Get current SHA
    const existing = await apiService.getRepoContents(owner, repo, filePath, branch);
    if (!existing || !existing.sha) {
      throw new Error("File not found");
    }

    const result = await apiService.deleteFileFromRepo(
      owner,
      repo,
      filePath,
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
