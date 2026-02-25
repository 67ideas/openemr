FROM openemr/openemr:flex

COPY . /openemr

# Pre-build PHP and JS dependencies at image build time so container
# startup is fast and doesn't time out the Railway healthcheck.
RUN cd /openemr && composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || true
RUN cd /openemr && npm ci && npm run build

EXPOSE 80
