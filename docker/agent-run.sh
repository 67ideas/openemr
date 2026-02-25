#!/bin/sh
# s6 service: run the OpenEMR AI agent server.
# s6 expects this script to exec a foreground process.
exec /openemr/agent/node_modules/.bin/tsx /openemr/agent/src/server.ts
