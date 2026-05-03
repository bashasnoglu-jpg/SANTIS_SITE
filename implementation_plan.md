# Implementation Plan - Sovereign Docker Pipeline Standardization

Stabilize and normalize the Santis OS production deployment pipeline by enforcing strict GHCR naming conventions and modernizing the build process.

## User Review Required

> [!IMPORTANT]
> The Docker image name will be standardized to `ghcr.io/bashasnoglu-jpg/santis-sovereign-os:latest`. Please confirm if this matches your production registry expectations.

> [!WARNING]
> The Dockerfile will switch from `npm` to `pnpm`. This requires `pnpm-lock.yaml` to be up-to-date in the repository.

## Proposed Changes

### [Docker Infrastructure]

#### [MODIFY] [Dockerfile](file:///c:/Users/tourg/Desktop/SANTIS_SITE/Dockerfile)
- Refactor to use `node:20-slim` base image.
- Enable `corepack` and install `pnpm`.
- Copy root `package.json` and `pnpm-lock.yaml` for dependency caching.
- Use `pnpm install --frozen-lockfile`.
- Build the `ingestion-api` and its dependencies.
- Optimize the image size by using a multi-stage build.

#### [MODIFY] [docker-publish.yml](file:///c:/Users/tourg/Desktop/SANTIS_SITE/.github/workflows/docker-publish.yml)
- Ensure `IMAGE_NAME` is lowercase `bashasnoglu-jpg/santis-sovereign-os`.
- Update the build step to ensure it aligns with the new Dockerfile structure.
- Verify telemetry payloads use the correct lowercase image name.

## Verification Plan

### Automated Tests
- Run a local Docker build to verify the new multi-stage process:
  `docker build -t santis-test .`
- Verify the build output and image size.

### Manual Verification
- Inspect the generated GitHub Actions workflow logic for any remaining uppercase references in the `IMAGE_NAME` or `tags` fields.
- Confirm `command_ack` and telemetry events in the workflow are correctly formatted.
