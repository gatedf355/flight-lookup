#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/checkpoint.sh "Short description of this snapshot"
#   bash scripts/checkpoint.sh -f "Include WIP and commit it first"
#
# Creates BOTH an annotated tag and a branch, then pushes them.
# Appends an entry to CHECKPOINTS.md with timestamp, tag, branch, and commit.

FORCE=0
if [[ "${1:-}" == "-f" ]]; then
  FORCE=1
  shift || true
fi

DESC="${*:-checkpoint}"
DATE="$(date +"%Y%m%d-%H%M%S")"
SHORT="$(git rev-parse --short HEAD)"
TAG="ckpt-${DATE}-${SHORT}"
BRANCH="checkpoint/${DATE}-${SHORT}"

# Ensure clean tree unless -f
if [[ "$FORCE" -eq 0 ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "✖ Working tree not clean. Commit changes, or re-run with -f to auto-commit WIP." >&2
    exit 1
  fi
else
  git add -A
  git commit -m "WIP snapshot ${DATE}: ${DESC}" || true
  SHORT="$(git rev-parse --short HEAD)"
fi

git tag -a "$TAG" -m "Checkpoint: ${DESC} (commit ${SHORT})"
git branch "$BRANCH"

git push origin "$BRANCH"
git push origin "$TAG"

touch CHECKPOINTS.md
printf -- "- %s • tag \`%s\` • branch \`%s\` • commit %s • %s\n" \
  "$(date -u +"%Y-%m-%d %H:%M:%SZ")" "$TAG" "$BRANCH" "$SHORT" "$DESC" >> CHECKPOINTS.md

echo "✅ Created checkpoint:"
echo "   tag:    $TAG"
echo "   branch: $BRANCH"
echo "   commit: $SHORT"
echo
echo "Restore later:"
echo "  git fetch --all --tags"
echo "  git switch -c restore-$TAG $TAG      # or: git reset --hard $TAG (danger)"
