#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

VERSION=$(bun -e "console.log(require('./package.json').version)")

echo "Tagging v${VERSION}..."
git tag "v${VERSION}"
git push origin "v${VERSION}"

echo "Release completed. Tag v${VERSION} pushed — GitHub Actions will build and publish binaries."
