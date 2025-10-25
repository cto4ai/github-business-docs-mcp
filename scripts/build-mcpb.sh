#!/bin/bash
# MCPB Build Script for GitHub Docs Manager v3.0.0
# Creates a production-ready .mcpb package with zero-config installation

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/mcpb-build"
PACKAGE_NAME="github-docs-mcp-3.0.0.mcpb"

echo "=========================================="
echo "Building GitHub Docs Manager MCPB Package"
echo "=========================================="
echo ""

# Step 1: Clean build directory
echo "📦 Step 1: Cleaning build directory..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"
echo "✅ Build directory ready"
echo ""

# Step 2: Install production dependencies
echo "📦 Step 2: Installing production dependencies..."
cd "$PROJECT_ROOT"
npm ci --production --quiet
echo "✅ Production dependencies installed"
echo ""

# Step 3: Copy files to build directory
echo "📦 Step 3: Copying files..."

# Core files
cp "$PROJECT_ROOT/manifest.json" "$BUILD_DIR/"
cp "$PROJECT_ROOT/server.cjs" "$BUILD_DIR/"
cp "$PROJECT_ROOT/package.json" "$BUILD_DIR/"
cp "$PROJECT_ROOT/package-lock.json" "$BUILD_DIR/"

# Copy README-MCPB.md as README.md
cp "$PROJECT_ROOT/README-MCPB.md" "$BUILD_DIR/README.md"

# Copy source directory
cp -r "$PROJECT_ROOT/src" "$BUILD_DIR/"

# Copy node_modules (production only)
cp -r "$PROJECT_ROOT/node_modules" "$BUILD_DIR/"

echo "✅ Files copied to build directory"
echo ""

# Step 3.5: Inject hardcoded config from .env
echo "📦 Step 3.5: Hardcoding config values from .env..."

# Check for .env file
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Create $PROJECT_ROOT/.env with:"
    echo "  GITHUB_CLIENT_ID=Iv..."
    echo "  GITHUB_CLIENT_SECRET=..."
    echo "  GH_DEFAULT_OWNER=jack4git"
    echo "  GH_DEFAULT_REPO=ai-first-docs-01"
    echo ""
    echo "See .env.template for example"
    exit 1
fi

# Load .env
set -a  # Export all variables
source "$PROJECT_ROOT/.env"
set +a

# Validate required values
if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "❌ Error: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET required in .env"
    exit 1
fi

# Inject into manifest using Node
node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('$BUILD_DIR/manifest.json', 'utf8'));

// Remove user_config entirely (zero-config installation)
delete manifest.user_config;

// Hardcode OAuth credentials directly in env
manifest.server.mcp_config.env = {
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET
};

// Hardcode default owner/repo/docroot in args (optional, can be empty)
manifest.server.mcp_config.args = [
  '\${__dirname}/server.cjs',
  '--default-owner',
  process.env.GH_DEFAULT_OWNER || '',
  '--default-repo',
  process.env.GH_DEFAULT_REPO || '',
  '--default-docroot',
  process.env.GH_DEFAULT_DOCROOT || ''
];

fs.writeFileSync('$BUILD_DIR/manifest.json', JSON.stringify(manifest, null, 2));
console.log('✅ Config hardcoded from .env');
console.log('   Client ID:', process.env.GITHUB_CLIENT_ID);
console.log('   Default Owner:', process.env.GH_DEFAULT_OWNER || '(not set)');
console.log('   Default Repo:', process.env.GH_DEFAULT_REPO || '(not set)');
console.log('   Default Docroot:', process.env.GH_DEFAULT_DOCROOT || '(not set)');
console.log('   🎉 Zero-config installation - no user input required!');
"
echo ""

# Step 4: Validate manifest
echo "📦 Step 4: Validating manifest..."
if node -e "
const manifest = require('$BUILD_DIR/manifest.json');
if (!manifest.name || !manifest.version || !manifest.display_name) {
  console.error('Invalid manifest: missing required fields');
  process.exit(1);
}
if (manifest.name !== 'github-docs-mcp') {
  console.error('Invalid manifest: name should be github-docs-mcp');
  process.exit(1);
}
if (manifest.version !== '3.0.0') {
  console.error('Invalid manifest: version should be 3.0.0');
  process.exit(1);
}
console.log('Manifest valid:');
console.log('  Name:', manifest.name);
console.log('  Display Name:', manifest.display_name);
console.log('  Version:', manifest.version);
"; then
    echo "✅ Manifest validation passed"
else
    echo "❌ Manifest validation failed"
    exit 1
fi
echo ""

# Step 5: Verify entry point exists
echo "📦 Step 5: Verifying entry point..."
if [ ! -f "$BUILD_DIR/server.cjs" ]; then
    echo "❌ Entry point server.cjs not found!"
    exit 1
fi
echo "✅ Entry point exists"
echo ""

# Step 6: Create .mcpb archive
echo "📦 Step 6: Creating .mcpb package..."
cd "$BUILD_DIR"
zip -r -q "../$PACKAGE_NAME" .
cd "$PROJECT_ROOT"

if [ -f "$PROJECT_ROOT/$PACKAGE_NAME" ]; then
    PACKAGE_SIZE=$(du -h "$PROJECT_ROOT/$PACKAGE_NAME" | cut -f1)
    echo "✅ Package created: $PACKAGE_NAME ($PACKAGE_SIZE)"
else
    echo "❌ Package creation failed"
    exit 1
fi
echo ""

# Step 7: Restore dev dependencies
echo "📦 Step 7: Restoring dev dependencies..."
npm install --quiet
echo "✅ Dev dependencies restored"
echo ""

# Step 8: Show summary
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo ""
echo "Package: $PACKAGE_NAME"
echo "Size: $PACKAGE_SIZE"
echo "Location: $PROJECT_ROOT/$PACKAGE_NAME"
echo ""
echo "Next steps:"
echo "1. Test the package: Double-click $PACKAGE_NAME"
echo "2. Or install manually in Claude Desktop"
echo "3. Configure with your GitHub OAuth credentials"
echo ""
echo "Build artifacts in: $BUILD_DIR/"
echo ""
