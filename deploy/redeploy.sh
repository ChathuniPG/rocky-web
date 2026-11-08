#!/usr/bin/env bash
# Redeploys rocky-web on the EC2 instance: pull, install, build, (re)start, verify.
#
# Usage (as the application user, from anywhere):
#   bash deploy/redeploy.sh
#
# Prerequisites on the server: Node 26, PM2, and a `.env.local` in the repository root
# with FIREBASE_STORAGE_BUCKET (and API_INTERNAL_URL if the API is not on
# 127.0.0.1:4000). See .env.example: the build and the running server both read it.
#
# Optional: HEALTH_URL overrides the page that is polled after the restart.

# -e: stop on the first failing command. -u: an unset variable is an error.
# -o pipefail: a pipeline fails if any command in it fails, not only the last one.
set -euo pipefail

readonly APP_NAME='rocky-web'
# /login is a public page, so it returns 200 without a session; it also proves that the
# server can render a page, not only that the port is open.
readonly HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/login}"
readonly HEALTH_ATTEMPTS=15
readonly HEALTH_INTERVAL_SECONDS=2

log() {
  echo "==> $*"
}

# Polls the health URL until it returns 200. Next.js needs a few seconds to boot after a
# reload, so a single request right away would fail on a healthy deploy.
wait_for_health() {
  local status=''
  local attempt
  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
    # `|| true`: curl exits non-zero while the port is still closed; that is a retry, not
    # a reason for set -e to abort. %{http_code} is then 000.
    status="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 5 "$HEALTH_URL" || true)"
    if [[ "$status" == '200' ]]; then
      log "Health check passed ($HEALTH_URL)"
      return 0
    fi
    sleep "$HEALTH_INTERVAL_SECONDS"
  done

  echo "Health check failed: $HEALTH_URL returned $status after $HEALTH_ATTEMPTS attempts." >&2
  echo "Inspect the logs with: pm2 logs $APP_NAME --lines 100" >&2
  return 1
}

main() {
  # Run from the repository root, wherever the script is called from: npm, Next.js (which
  # reads .env.local and writes .next/) and the ecosystem file all resolve paths from it.
  cd "$(dirname "${BASH_SOURCE[0]}")/.."

  log 'Pulling latest code'
  # --ff-only: never create a merge commit on the server; fail if history has diverged.
  git pull --ff-only

  log 'Installing dependencies'
  # TypeScript and Tailwind CSS are devDependencies that `next build` needs. --include=dev
  # installs them even if NODE_ENV=production is set in this shell.
  npm ci --include=dev

  log 'Building'
  # Reads .env.local: the /api rewrite and the image bucket are baked into the build.
  npm run build

  if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    log "Reloading $APP_NAME"
    # --update-env picks up changes to the env block in ecosystem.config.cjs.
    pm2 reload ecosystem.config.cjs --update-env
  else
    log "Starting $APP_NAME"
    pm2 start ecosystem.config.cjs
  fi

  # Saves the process list so `pm2 startup` restores the app after a reboot.
  pm2 save

  wait_for_health
}

# Everything runs inside main(), called on the last line: bash reads a script while it
# executes it, so if `git pull` changes this file mid-run, a script without a function
# could continue with a mix of old and new lines. A function is parsed completely first.
main "$@"
