FROM openemr/openemr:flex

# Copy source into the container
# The flex image expects OpenEMR source at /openemr (symlinked to the web root)
COPY . /openemr

EXPOSE 80
