#!/bin/bash

# Family Hub - Build Script for Deployment
# This script builds the Angular project for production deployment

echo "🚀 Building Family Hub for production deployment..."
echo ""

# Navigate to the Angular project directory
cd "$(dirname "$0")/FamilyHub"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build the project
echo "🔨 Building Angular project..."
ng build --configuration production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Build output location:"
    echo "   $(pwd)/dist/family-hub/browser/"
    echo ""
    echo "📋 Deployment files:"
    echo "   - index.html (main entry point)"
    echo "   - *.js files (application bundles)"
    echo "   - styles-*.css (stylesheets)"
    echo "   - assets/ (static files)"
    echo ""
    echo "🌐 To serve locally for testing:"
    echo "   npx http-server dist/family-hub/browser/ -o"
    echo ""
    echo "☁️  For deployment, upload the contents of 'dist/family-hub/browser/' to your web server"
    echo ""
else
    echo ""
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi
