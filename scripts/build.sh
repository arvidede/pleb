#!/usr/bin/env sh
set -e

echo "🗑️ Cleaning previous build..."
rm -rf ./dist

echo "Building server-side and library bundles (target: bun)..."
NODE_ENV=production bun build ./src/index.ts ./src/cli.ts ./src/image/Image.tsx \
    --outdir ./dist \
    --external postcss-url \
    --target bun \
    --sourcemap=linked \
    --env disable \
    --splitting

echo "Building client-side bundle (target: browser)..."
NODE_ENV=production bun build ./src/client/index.ts \
    --outdir ./dist/client \
    --target browser \
    --sourcemap=linked \
    --env disable \
    --splitting \
    --minify

echo "Generating type declarations..."
tsc --emitDeclarationOnly --project tsconfig.json

echo "Done!"