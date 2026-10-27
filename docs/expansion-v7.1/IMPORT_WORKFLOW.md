# Importing v7.1 content drafts

The kit does not assign new lessons to existing course modules or identify a source for each question. A content editor must choose these explicitly after checking relevance and source support. Availability of a URL does not establish accuracy or license. The importer does not publish or review material; Studio requires its normal independent review and publish flow. Source publishers and licenses are marked `Belum diperiksa` for the reviewer to resolve.

Supply a local JSON file with two complete objects: `modules` maps every kit ID `N026`–`N035` to an existing visible course module's numeric database ID; `question_sources` maps every question ID `Q051`–`Q080` to an HTTPS URL from that question's lesson manifest references. The URL selection is provenance supplied by the operator, not a claim of verified support. No suggested curriculum or citation mapping is bundled.

Use an existing non-suspended editor/admin account ID:

```sh
php artisan studio:import-expansion-v71 <editor-user-id> <path-to-mapping.json>
```

The command uses the Studio workflow, logs the actor, and creates ten lesson and ten quiz revisions in draft state. Question drafts reference their unpublished lesson entry; lesson and quiz must be reviewed and published separately in dependency order. Each question retains its source key in the revision and projected question row; import provenance also records source revisions. Editors and reviewers must preserve each key with its question when making semantic changes. The entire import runs in a transaction. Repeating the exact import returns unchanged; if source files, mapping or imported revision data have changed, the command stops without overwriting edits. Existing source IDs and slugs are checked for collisions. An imported revision is never automatically replaced or published.

Reviewers must inspect the complete Markdown, citations, accuracy, safety and licensing, and fix mappings or content in Studio before approval. This command does not enrich the existing 25 lessons or install labs.
