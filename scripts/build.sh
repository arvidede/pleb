#!/usr/bin/env sh
set -e # Exit immediately if a command exits with a non-zero status.

echo "Building main application bundles..."
bun build ./src/index.ts ./src/cli.ts \
    --outdir ./dist \
    --target bun \
    --sourcemap=linked \
    --external react \
    --external react-dom \
    --external postcss-url
echo "Generating type declarations..."
tsc --emitDeclarationOnly --project tsconfig.json
echo "Done!"
