# Sprint 4 analytics contracts

`learning_activity_events` records the first verified completion of each lesson, quiz, lab and accepted internal practice report. `LearningEventService` checks owner-scoped domain state before recording; there is no public endpoint to write activity or XP. Existing checklist and reading events remain in `activity_events` for dashboard history but never qualify for streak, skill practice or XP.

`xp_transactions` is the canonical XP total. A composite unique `(user_id, reward_key)` constraint and a user-row transaction lock serialize competing awards. The activity source key and badge ownership pair also have database uniqueness constraints. Quiz completion returns its actual combined delta (+20 first quiz pass and +10 lesson completion). Lab/report repeat submissions return zero new XP. Level thresholds are centralized: `floor(sqrt(total_xp / 100)) + 1`; next threshold is `100 × level²`.

## Additive migration and historical awards

Migration `2026_10_24_000003` creates analytics tables, imports qualified historical lesson/quiz/lab state, and records a per-user version-1 marker in `learning_backfills`. Original rows and timestamps remain unchanged. Historical lab XP uses its original `xp_events.points` award, with the same reward key used for future solves, so importing and retrying cannot double-credit it. A historical XP row without a corresponding solve projection is preserved in the ledger but does not invent a lab-completion activity. Re-running the backfill is harmless.

No learner database reset, source progress update, note update, record deletion or Docker volume removal is part of this migration.

## Time and date filters

Event timestamps are stored in UTC. Charts and streak calendar dates use the account's IANA timezone. Current streak may end today or yesterday; longest streak includes all historical qualifying dates. A login, page view, checklist review, draft report or note alone cannot extend it. Daylight-saving transitions use calendar-day operations.

The progress summary is lifetime. Its 7/30/90/all filter changes only the activity chart, whose zero-filled date rows are also available to the accessible table. A new account has zero activity and undetermined skills. Journey completion comes from actual personal roadmap items; the day index uses local calendar dates, not elapsed UTC hours.

Study sessions are not yet credibly tracked, so `summary.verified_minutes` is `null` and the UI says **Belum dilacak**. Planned and estimated lesson durations are never substituted as verified attention. The activity study-minute series remains zero with this limitation disclosed.

## Skill evidence and badges

Eight code-defined mappings in `ProgressService::SKILLS` publish per-skill lesson and lab denominators. Knowledge contributes up to 40 points: the latest passing score per mapped lesson, with unpassed assessments at zero, divided by all mapped assessments. Practice contributes up to 60 points: distinct verified labs divided by mapped available labs. Reading provides no practical score. Skills without practical evidence say **Belum dinilai secara praktik**.

Reporting uses its mapped quiz plus the 0–24 automated completeness rubric of first accepted internal practice reports. That rubric is disclosed as internal automated feedback, never expert review or proof of professional mastery. The accepted event keeps only a minimal rubric score/version, not private report content, tokens or evidence.

Badge rules run after qualified events and after note saves. Each account/badge unlock is stored once. Note Master requires ten owner-scoped non-empty notes and awards no XP. HTTP Explorer requires all six original HTTP/Web Fundamentals lessons. API Explorer requires five distinct existing API/access labs listed in `LearningEventService::API_LABS`. Week Warrior uses a historical seven-day qualifying streak. Missing required content leaves a badge locked and unattainable.
