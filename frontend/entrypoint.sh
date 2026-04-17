#!/bin/sh
set -eu

FRONTEND_DIR="/app/frontend/assets"

js_file="$(find "$FRONTEND_DIR" -maxdepth 1 -type f -name '*.js' | head -n 1)"

if [ -z "${js_file:-}" ]; then
  echo "No JS file found in $FRONTEND_DIR" >&2
  exit 1
fi

tmp_file="${js_file}.tmp"

escape_sed_replacement() {
  printf '%s' "$1" | sed 's/[\/&]/\\&/g'
}

cp "$js_file" "$tmp_file"

placeholders="$(grep -o 'PLACEHOLDER_VITE_[A-Z0-9_]*' "$js_file" | sort -u || true)"

for placeholder in $placeholders; do
  var_name="${placeholder#PLACEHOLDER_}"
  value="$(eval "printf '%s' \"\${$var_name-}\"")"
  escaped_value="$(escape_sed_replacement "$value")"
  sed "s|$placeholder|$escaped_value|g" "$tmp_file" > "${tmp_file}.next"
  mv "${tmp_file}.next" "$tmp_file"
done

mv "$tmp_file" "$js_file"

exec nginx -g 'daemon off;'
