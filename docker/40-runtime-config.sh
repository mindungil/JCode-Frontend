#!/bin/sh
set -eu

: "${JCODE_API_URL:?JCODE_API_URL is required}"

template=/usr/share/nginx/html/runtime-config.template.js
output=/usr/share/nginx/html/runtime-config.js
variables='${JCODE_API_URL} ${JCODE_KEYCLOAK_URL} ${JCODE_REALM} ${JCODE_CLIENT_ID} ${JCODE_REDIRECT_URI} ${JCODE_SCOPE}'

envsubst "$variables" < "$template" > "$output"
chmod 644 "$output"
rm -f "$template"
