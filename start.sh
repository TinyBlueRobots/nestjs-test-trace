#!/bin/bash
docker compose up -d
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_EXPORTER_OTLP_INSECURE="true"
cleanup() {
  docker compose down
  exit 0
}
trap cleanup INT
bun run start