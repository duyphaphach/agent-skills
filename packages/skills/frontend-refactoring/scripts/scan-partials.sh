#!/usr/bin/env bash
# scan-partials.sh [directory]
# Scans PHP templates for blocks that should be extracted to partials:
#   - Files or contiguous HTML blocks exceeding ~40 lines
#   - Repeated HTML structures across files (same opening tag+class pattern)
#
# Usage: bash .agents/skills/frontend-refactoring/scripts/scan-partials.sh views/

set -euo pipefail

DIR="${1:-views}"
if [[ ! -d "$DIR" ]]; then
  echo "Usage: scan-partials.sh <views-directory>"
  exit 2
fi

echo "Scanning: $DIR"
echo ""

# ---------------------------------------------------------------------------
# 1. Large files — templates over 150 lines are candidates for splitting
# ---------------------------------------------------------------------------
echo "[ large templates (>150 lines) ]"
FOUND=0
while IFS= read -r file; do
  lines=$(wc -l < "$file")
  if [[ $lines -gt 150 ]]; then
    echo "  ${lines} lines  $file"
    FOUND=1
  fi
done < <(find "$DIR" -name "*.php" ! -name "_*" | sort)
[[ $FOUND -eq 0 ]] && echo "  none"

# ---------------------------------------------------------------------------
# 2. Repeated class patterns — same class appearing in 3+ different files
#    (signals a shared UI pattern that should be a partial)
# ---------------------------------------------------------------------------
echo ""
echo "[ class names appearing in 3+ files ]"
find "$DIR" -name "*.php" | xargs grep -ohE 'class="[^"]*"' 2>/dev/null \
  | sort | uniq -c | sort -rn \
  | awk '$1 >= 3 { print "  "$1"x  "$2 }' \
  | head -20
echo ""

# ---------------------------------------------------------------------------
# 3. Component-scoped class remnants (aml-*, kyc-*, client-*)
# ---------------------------------------------------------------------------
echo "[ component-scoped class remnants ]"
FOUND=0
while IFS= read -r match; do
  echo "  $match"
  FOUND=1
done < <(grep -rnE 'class="[^"]*(aml-|kyc-|client-)[^"]*"' "$DIR" 2>/dev/null || true)
[[ $FOUND -eq 0 ]] && echo "  none"

echo ""
echo "Done."
