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

# Step 2: Copy required files
echo "📋 Copying files to build directory..."

# Core files
cp manifest.json "$BUILD_DIR/"
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
