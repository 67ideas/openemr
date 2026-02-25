FROM openemr/openemr:flex

# Copy dependency manifests first so these expensive layers are cached
# and only re-run when dependencies actually change.
COPY composer.json composer.lock /openemr/
RUN cd /openemr && composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || true

COPY package.json package-lock.json /openemr/
RUN cd /openemr && npm ci --ignore-scripts

# Install agent dependencies before copying full source (better layer caching).
COPY agent/package.json agent/package-lock.json /openemr/agent/
RUN cd /openemr/agent && npm ci

# Copy the rest of the source — only invalidates this final layer on code changes.
COPY . /openemr
RUN cd /openemr && npx napa && npx gulp -i && npm run build

# Register the agent as an s6 service so it starts alongside Apache.
RUN mkdir -p /etc/services.d/agent
COPY docker/agent-run.sh /etc/services.d/agent/run
RUN chmod +x /etc/services.d/agent/run

# The flex image's startup rsync includes /couchdb/data; create it so rsync doesn't error.
RUN mkdir -p /couchdb/data

ENV PHP_ERRORS_STDERR=1 \
    APACHE_LOG_LEVEL=info

EXPOSE 80
