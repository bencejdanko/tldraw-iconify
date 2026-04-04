#!/bin/bash

# Exit immediately if any command fails
set -e

echo "🚀 Starting full project build..."

# 1. Build the Main App (Root)
echo "📦 Building the main tldraw application..."
pnpm build

# 2. Go to VS Code Extension directory
cd vscode-extension

# 3. Build the Extension
echo "🔌 Building the VS Code extension..."
pnpm build

# 4. Bundle Assets (Copy root assets into the extension, including README)
echo "🏗️ Bundling web application assets and sync README into the extension..."
pnpm run bundle-assets

# 5. Create VSIX Package
echo "📦 Packaging the extension into a .vsix file..."
pnpm run package

# 6. Move to root
echo "🚚 Moving the extension package to the root directory..."
mv *.vsix ..

echo "✅ Full build complete! Your .vsix file is ready in the root directory."
