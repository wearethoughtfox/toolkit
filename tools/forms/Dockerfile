# PocketBase with the forms hooks and migration built in.
#
# Coolify builds this from the repo (base directory /tools/forms). The
# database lives in /pb/pb_data: mount a persistent volume there.
#
# Based on the Dockerfile in PocketBase's "Going to production" docs:
# https://pocketbase.io/docs/going-to-production/

FROM alpine:3.24

# The PocketBase release to use. Change it here to upgrade, and read the
# changelog first: https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md
# Note: v0.40.6 says later releases may be published from a new host
# (ganigeorgiev.com) instead of GitHub; update the URL below if so.
ARG PB_VERSION=0.40.6
# Optional: the zip's SHA-256 from the release's checksums.txt. When set,
# the build stops if the download doesn't match.
ARG PB_SHA256=""
# Filled in by Docker BuildKit: amd64 (Hetzner CX/CPX) or arm64 (CAX).
ARG TARGETARCH=amd64

RUN apk add --no-cache ca-certificates unzip wget \
 && wget -q -O /tmp/pb.zip \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" \
 && if [ -n "$PB_SHA256" ]; then echo "$PB_SHA256  /tmp/pb.zip" | sha256sum -c -; fi \
 && unzip /tmp/pb.zip pocketbase -d /pb \
 && rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/api/health || exit 1

# --automigrate=false: changes made in the admin UI don't write new
#   migration files into the container (they would vanish on redeploy).
#   Change the schema with a migration file in pb_migrations instead.
# --hooksWatch=false: the hooks don't change inside a built image.
# --encryptionEnv: settings (the SMTP password) are stored encrypted with
#   the key in PB_ENCRYPTION_KEY (32 characters). Keep a copy of the key:
#   without it PocketBase can't read its settings or a restored backup.
CMD ["/pb/pocketbase", "serve", \
     "--http=0.0.0.0:8080", \
     "--dir=/pb/pb_data", \
     "--hooksDir=/pb/pb_hooks", \
     "--migrationsDir=/pb/pb_migrations", \
     "--automigrate=false", \
     "--hooksWatch=false", \
     "--encryptionEnv=PB_ENCRYPTION_KEY"]
