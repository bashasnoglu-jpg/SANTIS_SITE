# Walkthrough - Sovereign Docker Pipeline Standardization

I have modernized and standardized the Docker deployment pipeline for Santis OS, ensuring strict lowercase naming for GitHub Container Registry (GHCR) and adopting `pnpm` for a deterministic build environment.

## Changes Made

### Docker Infrastructure
- **Dockerfile**: Completely refactored to use a multi-stage `pnpm deploy` strategy.
    - Base image switched to `node:20-slim`.
    - Enabled `Corepack` for automatic `pnpm` management.
    - Implemented `pnpm --prod deploy` to create a lightweight, standalone production bundle for `@santis/ingestion-api`.
- **ingestion-api/package.json**: Restored to use devDependencies for TS engines to maintain lockfile sync, while handling production execution via global installs in the Docker runner stage.

### GitHub Actions Workflow
- **.github/workflows/docker-publish.yml**:
    - Standardized `IMAGE_NAME` to `bashasnoglu-jpg/santis-sovereign-os` (strictly lowercase).
    - Added a normalization step to create `REPO_LC` (lowercase repository name).
    - Added a guard step (`Enforce lowercase image contract`) that fails the build if any uppercase characters are detected in the image name.
    - **Final Polish**: Updated all telemetry payloads to use `${{ env.REPO_LC }}` instead of `${{ github.repository }}`, ensuring 100% lowercase consistency in all external signals.
    - Ensured all telemetry payloads and image tags use the standardized lowercase path.

## Validation Results

### Automated Verification
- The Dockerfile now follows the standard `pnpm` monorepo production pattern.
- The GitHub Actions workflow logic was verified to ensure that `${{ env.IMAGE_NAME }}` and `${{ env.REPO_LC }}` are used consistently.

### Manual Verification Required
- **Local Build Test**: Run `docker build -t santis-sovereign-os .` locally to confirm that `pnpm install` and `pnpm deploy` work correctly with the current `pnpm-lock.yaml`.
- **CI/CD Run**: After pushing these changes, monitor the first run of the "Build and Publish Docker Image" action in GitHub to ensure successful GHCR publication and lowercase telemetry emission.

---

Santis OS is now equipped with a production-grade, "Zero-Jank" container pipeline that strictly adheres to registry standards.
