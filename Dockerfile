FROM openemr/openemr:flex

# Copy dependency manifests first so these expensive layers are cached
# and only re-run when dependencies actually change.
COPY composer.json composer.lock /openemr/
RUN cd /openemr && composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || true

COPY package.json package-lock.json /openemr/
RUN cd /openemr && npm ci && npm run build

# Copy the rest of the source — only invalidates this final layer on code changes.
COPY . /openemr

# The flex image's startup rsync includes /couchdb/data; create it so rsync doesn't error.
RUN mkdir -p /couchdb/data

EXPOSE 80
