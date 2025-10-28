// Path Validator Service
// Provides shared path validation and docroot enforcement logic

class PathValidator {
  /**
   * Normalize docroot value to handle special cases
   * @param {string|undefined|null} value - Docroot value from config
   * @returns {string|null} - Normalized docroot or null if not set
   */
  static normalizeDocroot(value) {
    // undefined/null = not set in config, use server default
    if (value === undefined || value === null) return null;

    // Normalize root directory indicators to empty string
    if (value === '.' || value === '/' || value === './') {
      return '';
    }

    // Remove trailing slashes for consistency
    if (typeof value === 'string' && value.endsWith('/')) {
      return value.slice(0, -1);
    }

    return value;
  }

  /**
   * Normalize path for comparison
   * @param {string} path - File or directory path
   * @returns {string} - Normalized path
   */
  static normalizePath(path) {
    if (!path) return '';

    // Remove leading ./ or /
    path = path.replace(/^\.\//, '').replace(/^\//, '');

    // Remove trailing slashes
    path = path.replace(/\/$/, '');

    return path;
  }

  /**
   * Check if a path is within the docroot
   * @param {string} path - Path to check
   * @param {string} docroot - Docroot to check against
   * @returns {boolean} - True if path is within docroot
   */
  static isPathInDocroot(path, docroot) {
    // Empty/null docroot means repository root - all paths allowed
    if (!docroot || docroot === '') return true;

    const normalizedPath = this.normalizePath(path);
    const normalizedDocroot = this.normalizePath(docroot);

    // Empty path after normalization is root - check if docroot is also root
    if (!normalizedPath) return !normalizedDocroot;

    // Exact match
    if (normalizedPath === normalizedDocroot) return true;

    // Check if path starts with docroot/
    return normalizedPath.startsWith(normalizedDocroot + '/');
  }

  /**
   * Determine if docroot enforcement should be applied
   * @param {string} docroot - Configured docroot
   * @param {boolean} ignoreFlag - ignore_docroot parameter value
   * @returns {boolean} - True if enforcement should apply
   */
  static shouldEnforceDocroot(docroot, ignoreFlag) {
    // If ignore flag is explicitly true, don't enforce
    if (ignoreFlag === true) return false;

    // If no docroot configured (empty string or null), no enforcement needed
    if (!docroot || docroot === '') return false;

    // Otherwise, enforce
    return true;
  }

  /**
   * Validate a path against docroot restrictions
   * @param {string} path - Path to validate
   * @param {string} docroot - Configured docroot
   * @param {Object} options - Validation options
   * @param {boolean} options.ignore_docroot - Whether to bypass docroot restrictions
   * @param {string} options.operation - Operation name (for error messages)
   * @returns {Object} - { valid: boolean, error: string|null, reason: string|null }
   */
  static validatePath(path, docroot, options = {}) {
    const { ignore_docroot = false, operation = 'access' } = options;

    // Check if enforcement applies
    if (!this.shouldEnforceDocroot(docroot, ignore_docroot)) {
      return { valid: true, error: null, reason: null };
    }

    // Check if path is within docroot
    if (this.isPathInDocroot(path, docroot)) {
      return { valid: true, error: null, reason: null };
    }

    // Path is outside docroot - generate error
    const error = this.generateDocrootError(path, docroot, operation);
    return {
      valid: false,
      error: error.message,
      reason: error.reason
    };
  }

  /**
   * Generate a helpful docroot restriction error message
   * @param {string} path - Path that was blocked
   * @param {string} docroot - Configured docroot
   * @param {string} operation - Operation that was attempted
   * @returns {Object} - { message: string, reason: string }
   */
  static generateDocrootError(path, docroot, operation) {
    const message = `Cannot ${operation} '${path}': Path is outside configured docroot '${docroot}'.

To ${operation} this file, you have two options:

1. Quick override (one-time): Add "ignore_docroot": true to your tool call
2. Permanent change: Update .mcp-config.json to change your workspace:
   {
     "mcp": {
       "docroot": "."
     }
   }

Current workspace: '${docroot}'`;

    const reason = `outside_docroot`;

    return { message, reason };
  }

  /**
   * Get docroot configuration source description
   * @param {Object} sources - Source flags
   * @param {boolean} sources.fromRepoConfig - From .mcp-config.json
   * @param {boolean} sources.fromServerDefault - From server default
   * @param {boolean} sources.fromToolParam - From tool parameter
   * @returns {string} - Human-readable source description
   */
  static getDocrootSource(sources = {}) {
    if (sources.fromToolParam) return 'tool parameter';
    if (sources.fromRepoConfig) return 'repository .mcp-config.json';
    if (sources.fromServerDefault) return 'server default';
    return 'repository root (default)';
  }
}

module.exports = PathValidator;
