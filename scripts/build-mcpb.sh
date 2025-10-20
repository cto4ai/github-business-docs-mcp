#!/bin/bash

# Build script for GitHub Docs OAuth MCPB package
# Creates github-docs-oauth-1.0.0.mcpb

set -e  # Exit on error

echo "🚀 Building GitHub Docs OAuth MCPB package..."
echo ""

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Load configuration from .env file
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found!"
  echo "   Please create a .env file with:"
  echo "   - GITHUB_CLIENT_ID"
  echo "   - GITHUB_CLIENT_SECRET"
  echo "   - GH_DEFAULT_OWNER (optional)"
  echo "   - GH_DEFAULT_REPO (optional)"
  exit 1
fi

echo "📝 Loading configuration from .env file..."
# Source the .env file
set -a
source .env
set +a

# Validate required values
if [ -z "$GITHUB_CLIENT_ID" ]; then
  echo "❌ Error: GITHUB_CLIENT_ID not set in .env"
  exit 1
fi

if [ -z "$GITHUB_CLIENT_SECRET" ]; then
  echo "❌ Error: GITHUB_CLIENT_SECRET not set in .env"
  exit 1
fi

echo "   ✅ GitHub Client ID: ${GITHUB_CLIENT_ID:0:10}..."
echo "   ✅ GitHub Client Secret: ***"
if [ -n "$GH_DEFAULT_OWNER" ]; then
  echo "   ✅ Default Owner: $GH_DEFAULT_OWNER"
fi
if [ -n "$GH_DEFAULT_REPO" ]; then
  echo "   ✅ Default Repo: $GH_DEFAULT_REPO"
fi
echo ""

# Configuration
VERSION="1.0.0"
PACKAGE_NAME="github-docs-oauth"
BUILD_DIR="mcpb-build"
OUTPUT_FILE="${PACKAGE_NAME}-${VERSION}.mcpb"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
rm -f "$OUTPUT_FILE"

# Create build directory
echo "📁 Creating build directory..."
mkdir -p "$BUILD_DIR"

# Step 1: Install production dependencies in a temp location
echo "📦 Installing production dependencies..."
echo "   (This may take a minute...)"
npm ci --production --quiet

# Step 2: Copy required files and inject config
echo "📋 Copying files to build directory..."

# Copy manifest and hardcode config values from .env
echo "   Hardcoding config values into manifest.json..."
node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Remove user_config entirely (hardcoding values instead)
delete manifest.user_config;

// Hardcode values directly into server.mcp_config
manifest.server.mcp_config.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
manifest.server.mcp_config.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Update args to use hardcoded values instead of user_config references
manifest.server.mcp_config.args = [
  '\${__dirname}/server-minimal-oauth.cjs',
  '--default-owner',
  process.env.GH_DEFAULT_OWNER || '',
  '--default-repo',
  process.env.GH_DEFAULT_REPO || ''
];

fs.writeFileSync('$BUILD_DIR/manifest.json', JSON.stringify(manifest, null, 2));
console.log('   ✅ Config values hardcoded into manifest.json');
console.log('   ℹ️  No user input required - zero-config installation');
"

# Other core files
cp server-minimal-oauth.cjs "$BUILD_DIR/"
cp package.json "$BUILD_DIR/"
cp package-lock.json "$BUILD_DIR/"
cp README-MCPB.md "$BUILD_DIR/README.md"  # Rename for package
cp LICENSE "$BUILD_DIR/" 2>/dev/null || echo "⚠️  No LICENSE file found (optional)"

# Source code
echo "   Copying src/ directory..."
cp -r src/ "$BUILD_DIR/src/"

# Dependencies
echo "   Copying node_modules/ (this will take a moment)..."
cp -r node_modules/ "$BUILD_DIR/node_modules/"

# Step 3: Clean up build directory
echo "🧹 Cleaning build directory..."
# Remove dev dependencies that might have been included
rm -rf "$BUILD_DIR/node_modules/@types" 2>/dev/null || true
# Remove test files
rm -f "$BUILD_DIR"/*.test.js 2>/dev/null || true
# Remove any .git directories in dependencies
find "$BUILD_DIR/node_modules" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

# Step 4: Create the .mcpb archive
echo "📦 Creating .mcpb archive..."
cd "$BUILD_DIR"
zip -r "../$OUTPUT_FILE" . -q
cd ..

# Step 5: Calculate package size
PACKAGE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo ""
echo "✅ Package built successfully!"
echo ""
echo "📊 Package Details:"
echo "   Name:    $PACKAGE_NAME"
echo "   Version: $VERSION"
echo "   File:    $OUTPUT_FILE"
echo "   Size:    $PACKAGE_SIZE"
echo ""

# Step 6: Verify package contents
echo "📂 Package Contents:"
unzip -l "$OUTPUT_FILE" | head -n 20
echo "   ..."
TOTAL_FILES=$(unzip -l "$OUTPUT_FILE" | grep -c "files")
echo ""

# Step 7: Restore dev dependencies
echo "🔄 Restoring dev dependencies..."
npm ci --quiet

echo ""
echo "🎉 Build complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Test the package:"
echo "      - Open Claude Desktop"
echo "      - Double-click $OUTPUT_FILE"
echo "      - Enter your GitHub OAuth App credentials"
echo "      - Test the tools"
echo ""
echo "   2. If testing succeeds:"
echo "      - Create a GitHub release (v$VERSION)"
echo "      - Upload $OUTPUT_FILE to the release"
echo "      - Update documentation"
echo ""
