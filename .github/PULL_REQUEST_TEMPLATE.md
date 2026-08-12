## Summary

<!-- One or two sentences describing the change. -->

## Why

<!-- Explain the motivation. Link any related issue: "Closes #123" or "Refs #123". -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (please describe the impact)
- [ ] Documentation only
- [ ] Refactor / cleanup
- [ ] CI / tooling

## Checklist

- [ ] I have read [CONTRIBUTING.md](../CONTRIBUTING.md).
- [ ] `pytest tests/` passes locally.
- [ ] `cd web && npm test` passes locally.
- [ ] `cd web && npm run build` produces a clean build.
- [ ] **No secrets, credentials, or `.env` values are added to tracked files.**
      Only `.env.example` may have new placeholders.
- [ ] **No Riot game assets are added** (voice audio, splash art, champion
      portraits, …). These belong upstream and are excluded by `.gitignore`.
- [ ] If behavior changed, the relevant docs (README, `docs/PROJECT_ARCHITECTURE.md`)
      are updated.

## Screenshots / recordings (if UI)

<!-- Drag & drop images here. Do not bundle copyrighted material. -->

## Notes for the reviewer

<!-- Anything else the reviewer should know before approving. -->
