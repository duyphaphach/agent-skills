#!/usr/bin/env bash
# verify-conventions.sh <scss-file> [php-template]
# Verifies that a refactored output follows all project conventions.
# Runs a broader set of checks than lint-scss.sh — use this as the final
# gate before marking a refactor done.
#
# Usage:
#   bash .agents/skills/frontend-refactoring/scripts/verify-conventions.sh \
#     web/scss/overrides/_fl-sidebar.scss views/layouts/main.php

set -euo pipefail

SCSS_FILE="${1:-}"
PHP_FILE="${2:-}"
VIOLATIONS=0

if [[ -z "$SCSS_FILE" || ! -f "$SCSS_FILE" ]]; then
  echo "Usage: verify-conventions.sh <file.scss> [template.php]"
  exit 2
fi

fail()  { echo "  FAIL  $1"; VIOLATIONS=$((VIOLATIONS + 1)); }
warn()  { echo "  WARN  $1"; }
ok()    { echo "  ok"; }

# ==========================================================================
# SCSS CHECKS
# ==========================================================================
echo "═══════════════════════════════════════"
echo "SCSS: $SCSS_FILE"
echo "═══════════════════════════════════════"

PREV=$VIOLATIONS

# --------------------------------------------------------------------------
# 1. Must be wrapped in .facelift-layout
# --------------------------------------------------------------------------
echo ""
echo "[ .facelift-layout wrapper ]"
if grep -q '\.facelift-layout' "$SCSS_FILE" 2>/dev/null; then
  ok
else
  fail "No .facelift-layout wrapper found — overrides must live inside it"
fi

# --------------------------------------------------------------------------
# 2. No flat child selectors — detect .parent .child outside nesting
#    (heuristic: a selector line that starts with two class names = flat)
# --------------------------------------------------------------------------
echo ""
echo "[ flat selectors ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  fail "$match"
done < <(grep -nE '^\s+\.[a-z].*\.[a-z]' "$SCSS_FILE" 2>/dev/null \
  | grep -v '^\s*//' \
  | grep -v '@' \
  || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 3. display: flex without layout mixin
# --------------------------------------------------------------------------
echo ""
echo "[ display: flex without @include ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  fail "$match"
done < <(grep -n 'display:\s*flex' "$SCSS_FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 4. Raw padding/margin (not zero resets)
# --------------------------------------------------------------------------
echo ""
echo "[ raw padding / margin (non-zero) ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  # allow: padding: 0, margin: 0  (zero resets are fine)
  if ! echo "$match" | grep -qE ':\s*0\s*(!important)?;?\s*$'; then
    fail "$match"
  fi
done < <(grep -nE '^\s*(padding|margin)\s*:' "$SCSS_FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 5. Physical direction properties (not logical)
# --------------------------------------------------------------------------
echo ""
echo "[ physical direction (use logical: padding-inline, margin-block) ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  fail "$match"
done < <(grep -nE '(padding|margin)-(left|right|top|bottom)\s*:' "$SCSS_FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 6. Raw hex colors
# --------------------------------------------------------------------------
echo ""
echo "[ raw hex colors ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  fail "$match"
done < <(grep -n '#[0-9a-fA-F]\{3,8\}\b' "$SCSS_FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 7. Raw rem/em values (in properties, not variable declarations)
# --------------------------------------------------------------------------
echo ""
echo "[ raw rem/em values ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  fail "$match"
done < <(grep -n '[0-9]\+\.\?[0-9]*\(rem\|em\)\b' "$SCSS_FILE" 2>/dev/null \
  | grep -v '^\s*//' \
  | grep -vE '^[^:]+:\s*\$' \
  || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 8. Off-scale px values (excluding @media and variable declarations)
# --------------------------------------------------------------------------
echo ""
echo "[ off-scale px values ]"
PREV=$VIOLATIONS
ALLOWED_PX="0|1|2|4|8|10|12|16|20|24|32|40|48|56|64|80|96"
while IFS= read -r match; do
  px_val=$(echo "$match" | grep -oE '[0-9]+px' | grep -oE '^[0-9]+' | head -1)
  if [[ -n "$px_val" ]] && ! echo "$px_val" | grep -qE "^(${ALLOWED_PX})$"; then
    fail "$match"
  fi
done < <(grep -nE '[0-9]+px' "$SCSS_FILE" 2>/dev/null \
  | grep -v '^\s*//' \
  | grep -v '@media' \
  | grep -vE '^[^:]+:\s*\$' \
  || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# --------------------------------------------------------------------------
# 9. Nesting depth > 3 levels (heuristic: lines with 4+ levels of indent)
# --------------------------------------------------------------------------
echo ""
echo "[ nesting depth > 3 ]"
PREV=$VIOLATIONS
while IFS= read -r match; do
  warn "$match  ← consider flattening HTML or splitting component"
done < <(grep -nE '^(\s{16}|\t{4})[^/]' "$SCSS_FILE" 2>/dev/null | grep -v '^\s*//' || true)
[[ $VIOLATIONS -eq $PREV ]] && ok

# ==========================================================================
# PHP TEMPLATE CHECKS (optional)
# ==========================================================================
if [[ -n "$PHP_FILE" && -f "$PHP_FILE" ]]; then
  echo ""
  echo "═══════════════════════════════════════"
  echo "Template: $PHP_FILE"
  echo "═══════════════════════════════════════"

  # ------------------------------------------------------------------------
  # 10. Component-scoped class remnants
  # ------------------------------------------------------------------------
  echo ""
  echo "[ component-scoped class remnants (aml-*, kyc-*, client-*) ]"
  PREV=$VIOLATIONS
  while IFS= read -r match; do
    fail "$match"
  done < <(grep -nE '(aml-|kyc-|client-)[a-z]' "$PHP_FILE" 2>/dev/null || true)
  [[ $VIOLATIONS -eq $PREV ]] && ok

  # ------------------------------------------------------------------------
  # 11. Inline style attributes
  # ------------------------------------------------------------------------
  echo ""
  echo "[ inline style attributes ]"
  PREV=$VIOLATIONS
  while IFS= read -r match; do
    fail "$match"
  done < <(grep -n 'style="' "$PHP_FILE" 2>/dev/null || true)
  [[ $VIOLATIONS -eq $PREV ]] && ok

  # ------------------------------------------------------------------------
  # 12. Appearance-based class names (color/size in class name)
  # ------------------------------------------------------------------------
  echo ""
  echo "[ appearance-based class names ]"
  PREV=$VIOLATIONS
  while IFS= read -r match; do
    warn "$match  ← class name describes appearance, not role"
  done < <(grep -nE 'class="[^"]*(text-align-|pb-[0-9]|pt-[0-9]|ml-[0-9]|mr-[0-9])[^"]*"' "$PHP_FILE" 2>/dev/null || true)
  [[ $VIOLATIONS -eq $PREV ]] && ok
fi

# ==========================================================================
# Summary
# ==========================================================================
echo ""
echo "═══════════════════════════════════════"
if [[ $VIOLATIONS -eq 0 ]]; then
  echo "✓ All conventions pass"
  exit 0
else
  echo "✗ $VIOLATIONS violation(s) — fix before marking done"
  exit 1
fi
