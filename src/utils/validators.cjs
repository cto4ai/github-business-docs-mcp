const crypto = require("crypto");

/**
 * Validates a GitHub webhook signature.
 * @param {string} secret - The webhook secret configured in GitHub.
 * @param {string} payloadBody - The raw request body string.
 * @param {string} signatureHeader - The value of the 'X-Hub-Signature-256' header.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
function isValidWebhookSignature(secret, payloadBody, signatureHeader) {
  if (!secret || !payloadBody || !signatureHeader) {
    console.error("Webhook signature validation missing required parameters.");
    return false;
  }

  const signature = signatureHeader.startsWith("sha256=")
    ? signatureHeader.substring(7)
    : signatureHeader;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadBody, "utf-8");
  const expectedSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

/**
 * Permission checking for MCP tools.
 *
 * NOTE: Permission checking is delegated to GitHub API token permissions.
 * This function returns true as GitHub enforces access control at the API level.
 * Additional MCP-level permission logic could be added here if needed for
 * specific use cases (e.g., restricting certain tools, validating user roles).
 *
 * @param {object} userContext - Information about the user/caller.
 * @param {string} toolName - The name of the tool being called.
 * @param {object} args - The arguments for the tool.
 * @param {object} defaultRepo - The default repository context.
 * @returns {Promise<boolean>} - True if permission is granted, false otherwise.
 */
async function checkPermissions(userContext, toolName, args, defaultRepo) {
  // Permission enforcement is handled by GitHub API token scopes
  // If additional MCP-level restrictions are needed, implement them here
  return true;
}

module.exports = {
  isValidWebhookSignature,
  checkPermissions,
};
