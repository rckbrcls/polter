#!/usr/bin/env bash

set -euo pipefail

INSTALL_DIR="$HOME/.polter/bin"
POLTER_HOME="$HOME/.polter"

echo "Polter Uninstaller"
echo ""

removed=0

if [ -f "$INSTALL_DIR/polter" ]; then
  rm -f "$INSTALL_DIR/polter"
  echo "  Removed $INSTALL_DIR/polter"
  removed=$((removed + 1))
fi

if [ -f "$INSTALL_DIR/polter-mcp" ]; then
  rm -f "$INSTALL_DIR/polter-mcp"
  echo "  Removed $INSTALL_DIR/polter-mcp"
  removed=$((removed + 1))
fi

if [ "$removed" -eq 0 ]; then
  echo "  No Polter binaries found in $INSTALL_DIR"
fi

# Remove bin dir if empty
if [ -d "$INSTALL_DIR" ] && [ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
  rmdir "$INSTALL_DIR"
  echo "  Removed empty directory $INSTALL_DIR"
fi

# Remove .polter dir if empty
if [ -d "$POLTER_HOME" ] && [ -z "$(ls -A "$POLTER_HOME" 2>/dev/null)" ]; then
  rmdir "$POLTER_HOME"
  echo "  Removed empty directory $POLTER_HOME"
fi

echo ""
echo "Polter has been uninstalled."
echo ""
echo "If you added Polter to your PATH, remove this line from your shell profile:"
echo ""
echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
echo ""
echo "Then restart your terminal or run: source ~/.bashrc  # or ~/.zshrc"
