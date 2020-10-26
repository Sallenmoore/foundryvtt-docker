#!/bin/sh
# shellcheck disable=SC2039
# busybox supports more features than POSIX /bin/sh

# setup logging
# shellcheck disable=SC2034
# LOG_NAME used in sourced file
LOG_NAME="Launcher"
# shellcheck disable=SC1091
# disable following
source logging.sh

if [ "$1" = "--shell" ]; then
  /bin/sh
  exit $?
fi

# Update configuration file
mkdir -p /data/Config >& /dev/null
log "Generating options.json file."
./set_options.js > /data/Config/options.json

# Save Admin Access Key if it is set
if [[ "${FOUNDRY_ADMIN_KEY:-}" ]]; then
  log "Setting 'Admin Access Key'."
  echo "${FOUNDRY_ADMIN_KEY}" | ./set_password.js > /data/Config/admin.txt
else
  log_warn "No 'Admin Access Key' has been configured."
  rm /data/Config/admin.txt >& /dev/null || true
fi

# Spawn node with clean environment to prevent credential leaks
log "Starting Foundry Virtual Tabletop."
env -i HOME="$HOME" node "$@"
