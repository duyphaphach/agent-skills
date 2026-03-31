#!/usr/bin/env bash
# lint-scss.sh <file>
# Checks a SCSS file against the project's styling conventions.
# Exits 0 if clean, 1 if violations found.
#
# Usage: bash .agents/skills/frontend-refactoring/scripts/lint-scss.sh web/scss/overrides/_fl-sidebar.scss

set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage: lint-scss.sh <path/to/file.scss>"
  exit 2
fi

VIOLATIONS=0

fail() {
  echo "  FAIL  $1"
  VIOLATIONS=$((VIOLATIONS + 1))
}

echo "Linting: $FILE"
echo ""

# ---------------------------------------------------------------------------
# 1. Raw hex colors — should use var(--token)
# ---------------------------------------------------------------------------
echo "[ colors ]"
while IFS= read -r match; do
  fail "$match"
done < <(grep -n '#[0-9a-fA-F]\{3,8\}\b' "$FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq 0 ]] && echo "  ok"
PREV=$VIOLATIONS

# ---------------------------------------------------------------------------
# 2. Raw rem/em values in property declarations — should use var(--text-*) or var(--leading-*)
#    Excludes: SCSS variable declarations ($var: ...) and comment lines
# ---------------------------------------------------------------------------
echo ""
echo "[ rem/em values in properties ]"
while IFS= read -r match; do
  fail "$match"
done < <(grep -n '[0-9]\+\.\?[0-9]*\(rem\|em\)\b' "$FILE" 2>/dev/null \
  | grep -v '^\s*//' \
  | grep -vE '^[^:]+:\s*\$' \
  || true)
[[ $VIOLATIONS -eq $PREV ]] && echo "  ok"
PREV=$VIOLATIONS

# ---------------------------------------------------------------------------
# 3. display: flex without mixin — should use @include flex-row/col/center/between
# ---------------------------------------------------------------------------
echo ""
echo "[ display: flex without mixin ]"
while IFS= read -r match; do
  fail "$match"
done < <(grep -n 'display:\s*flex' "$FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && echo "  ok"
PREV=$VIOLATIONS

# ---------------------------------------------------------------------------
# 4. Raw padding/margin properties — should use @include p/m/px/py/etc.
# ---------------------------------------------------------------------------
echo ""
echo "[ raw padding / margin ]"
while IFS= read -r match; do
  fail "$match"
done < <(grep -nE '^\s*(padding|margin)\s*:' "$FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && echo "  ok"
PREV=$VIOLATIONS

# ---------------------------------------------------------------------------
# 5. Physical direction properties — should use logical (padding-inline, etc.)
# ---------------------------------------------------------------------------
echo ""
echo "[ physical direction properties ]"
while IFS= read -r match; do
  fail "$match"
done < <(grep -nE '(padding|margin)-(left|right|top|bottom)\s*:' "$FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && echo "  ok"
PREV=$VIOLATIONS

# ---------------------------------------------------------------------------
# 6. Non-4px-scale raw pixel values — allowed: 0,1,2,4,8,10,12,16,20,24,32,40,48,56,64,80,96
#    Excludes: @media query lines, SCSS variable declarations, comment lines
# ---------------------------------------------------------------------------
echo ""
echo "[ off-scale px values ]"
ALLOWED_PX="0|1|2|4|8|10|12|16|20|24|32|40|48|56|64|80|96"
while IFS= read -r match; do
  px_val=$(echo "$match" | grep -oE '[0-9]+px' | grep -oE '^[0-9]+' | head -1)
  if [[ -n "$px_val" ]] && ! echo "$px_val" | grep -qE "^(${ALLOWED_PX})$"; then
    fail "$match"
  fi
done < <(grep -nE '[0-9]+px' "$FILE" 2>/dev/null \
  | grep -v '^\s*//' \
  | grep -v '@media' \
  | grep -vE '^[^:]+:\s*\$' \
  || true)
[[ $VIOLATIONS -eq $PREV ]] && echo "  ok"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
if [[ $VIOLATIONS -eq 0 ]]; then
  echo "✓ No violations found"
  exit 0
else
  echo "✗ $VIOLATIONS violation(s) — fix before committing"
  exit 1
fi
