#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/release.sh <patch|minor|major|x.y.z> [options]

Bump the package version, commit, tag, and push to trigger the GitHub release workflow.

Options:
  --no-push     Create the commit and tag locally without pushing
  --skip-tests  Skip running the test suite before releasing

Examples:
  npm run release:patch
  npm run release:minor
  npm run release:major
  npm run release -- 2.0.0
EOF
  exit 1
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BUMP=""
NO_PUSH=false
SKIP_TESTS=false

for arg in "$@"; do
  case "$arg" in
    --no-push) NO_PUSH=true ;;
    --skip-tests) SKIP_TESTS=true ;;
    -h | --help) usage ;;
    patch | minor | major) BUMP="$arg" ;;
    *)
      if [[ "$arg" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
        BUMP="$arg"
      else
        echo "Unknown argument: $arg"
        usage
      fi
      ;;
  esac
done

[[ -z "$BUMP" ]] && usage

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash changes before releasing."
  exit 1
fi

CURRENT="$(npm pkg get version | tr -d '"')"
echo "Current version: v${CURRENT}"

if [[ "$SKIP_TESTS" == false ]]; then
  echo "Running tests…"
  npm test
fi

if [[ "$BUMP" =~ ^(patch|minor|major)$ ]]; then
  npm version "$BUMP" --no-git-tag-version
else
  npm version "$BUMP" --no-git-tag-version --allow-same-version
fi

VERSION="$(npm pkg get version | tr -d '"')"
TAG="v${VERSION}"

git add package.json package-lock.json
git commit -m "chore: release ${TAG}"
git tag -a "$TAG" -m "${TAG}"

echo "Created ${TAG}"

if [[ "$NO_PUSH" == true ]]; then
  echo "Skipped push (--no-push). Publish with:"
  echo "  git push origin HEAD && git push origin ${TAG}"
  exit 0
fi

BRANCH="$(git branch --show-current)"
echo "Pushing ${BRANCH} and ${TAG}…"
git push origin HEAD
git push origin "$TAG"

echo "Released ${TAG}. GitHub Actions will publish the changelog and GitHub release."
