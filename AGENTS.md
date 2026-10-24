# Repository instructions

@RTK.md

## Branches and GitHub backups

- The user requires a different branch for every new requested update. Before editing, create a fresh `codex/<Jakarta timestamp>-<topic>` branch from the current saved HEAD, unless the user specifies another base. Run `npm run update:new -- <topic>` when the working tree is clean. Preserve any existing uncommitted work before proceeding; never discard it to satisfy the helper.
- Keep each completed update's branch. Do not reuse it for a separate requested update. `main` holds the initial baseline; changing it or merging an update requires the user's explicit instruction.
- After completing and checking an update, commit the relevant changes and push that update branch to `origin` as the user's requested backup. Confirm that its remote commit matches local HEAD. Do not force-push, rewrite published history, or delete backup branches.
- Never commit `.env`, sandbox credentials, databases, learner data, sessions, logs, dependencies or generated build files. Keep `.gitignore` protections intact and review staged paths before pushing.
- Follow [the backup workflow](docs/github-backup.md). GitHub backs up versioned source files; the local learner database needs a separate backup.

## Labs

- Keep all training runtimes localhost-only and isolated from the core database. See `docs/lab-isolation.md`.
- Runtime tests use temporary lab sessions. Never reset the learner database or remove Docker volumes to test or back up code.
