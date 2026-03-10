#!/usr/bin/env bash

set -euo pipefail

REPO="polterware/polter"
INSTALL_DIR="$HOME/.polter/bin"

detect_platform() {
  local os arch

  case "$(uname -s)" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
    *)
      echo "Error: Unsupported operating system: $(uname -s)" >&2
      echo "Polter supports macOS and Linux." >&2
      exit 1
      ;;
  esac

  case "$(uname -m)" in
    arm64 | aarch64) arch="arm64" ;;
    x86_64 | amd64)  arch="x64" ;;
    *)
      echo "Error: Unsupported architecture: $(uname -m)" >&2
      echo "Polter supports arm64 and x64." >&2
      exit 1
      ;;
  esac

  echo "${os}-${arch}"
}

get_latest_version() {
  local url="https://api.github.com/repos/${REPO}/releases/latest"
  local response

  if command -v curl >/dev/null 2>&1; then
    response=$(curl -fsSL "$url")
  elif command -v wget >/dev/null 2>&1; then
    response=$(wget -qO- "$url")
  else
    echo "Error: curl or wget is required." >&2
    exit 1
  fi

  echo "$response" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1
}

download() {
  local url="$1" dest="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$dest" "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$dest" "$url"
  fi
}

main() {
  local platform version base_url

  platform=$(detect_platform)
  echo "Detected platform: ${platform}"

  echo "Fetching latest release..."
  version=$(get_latest_version)

  if [ -z "$version" ]; then
    echo "Error: Could not determine latest version." >&2
    exit 1
  fi

  echo "Installing Polter ${version}..."

  base_url="https://github.com/${REPO}/releases/download/${version}"

  mkdir -p "$INSTALL_DIR"

  echo "Downloading polter..."
  download "${base_url}/polter-${platform}" "${INSTALL_DIR}/polter"
  chmod +x "${INSTALL_DIR}/polter"

  echo "Downloading polter-mcp..."
  download "${base_url}/polter-mcp-${platform}" "${INSTALL_DIR}/polter-mcp"
  chmod +x "${INSTALL_DIR}/polter-mcp"

  echo ""
  echo "Polter ${version} installed to ${INSTALL_DIR}"

  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
    echo ""
    echo "Add Polter to your PATH by adding this line to your shell profile:"
    echo ""
    echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    echo ""
    echo "Then restart your terminal or run:"
    echo ""
    echo "  source ~/.bashrc  # or ~/.zshrc"
  fi

  echo ""
  echo "Run 'polter' to get started."
}

main
