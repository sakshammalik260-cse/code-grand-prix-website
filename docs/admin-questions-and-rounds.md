# Admin question and round APIs

The backend already supported admin overview, question listing and creation, publish and unpublish, and candidate problem DTOs. Phase 6 and 7 complete the draft editor, test case and hint endpoints, and add persisted rounds. Admin writes use PostgreSQL and the existing authenticated ADMIN middleware. Validation errors use the existing error envelope. Inaccessible problems return 404 on candidate detail and hint routes, and execution rejects rounds that are outside the live window.

## Questions

Paths are relative to `/api`. Administrative resource IDs are stored problem IDs. The candidate list and detail DTOs continue to use stable slugs.

| Method and path | Behavior |
| --- | --- |
| GET `/admin/overview` | Counts questions, participants and incidents. Keeps the existing `activeRounds` array and adds numeric `activeRoundCount`. |
| GET `/admin/problems` or `/admin/problems/:id` | Returns admin question summaries with editable fields, public samples, hints, round assignment, order, status and revision. |
| POST `/admin/problems` | Saves a draft with the supplied title, text, difficulty, points, time and memory limits, language allowlist, public samples, optional hints and round. |
| PATCH `/admin/problems/:id` | Updates a draft using `expectedRevision`. The optional `order` sets its display position within its round. |
| DELETE `/admin/problems/:id` | Deletes a draft given `expectedRevision` if it has no submissions, hint receipts or saved code. Returns 204. |
| POST `/admin/problems/:id/publish` | Publishes a complete, assigned draft with public samples and at least one hidden case. Future `publishAt` schedules release and must precede the round end. Send current `expectedRevision`. |
| POST `/admin/problems/:id/unpublish` | Returns the question to draft and cancels scheduled release. Send current `expectedRevision`. |
| GET or POST `/admin/problems/:id/testcases` | Lists case metadata or creates a case. Send `input`, `expectedOutput`, `visibility` and optional positive `weight` or null. |
| PATCH or DELETE `/admin/testcases/:id` | Replaces case content or deletes the case on an editable draft. PATCH accepts optional `expectedRevision`. DELETE returns 204. |
| GET or POST `/admin/problems/:id/hints` | Lists hints or adds one with `{hint, expectedRevision}`. A hint has `order`, `deductionPoints` and `content`. |
| PATCH or DELETE `/admin/hints/:id` | Updates a hint using `{hint, expectedRevision}`, or removes it using `{expectedRevision}`. Returns the updated hint list. |

Hidden case inputs and expected outputs are write-only in admin case endpoints. Candidates receive public samples only. Test case weights are stored as metadata. Judging continues to require every case to pass for full credit.

Judged cases, scoring configuration and round assignment are protected when historical activity requires it. Purchased hint content and cost are immutable. Editing descriptive fields on an unpublished question preserves its historical submissions. Standings use the recorded award for each accepted problem and the recorded deductions for that problem, including after unpublication. Conflicting revisions and protections return 409.

## Rounds

| Method and path | Behavior |
| --- | --- |
| GET `/admin/rounds` | Lists rounds for the configured contest in schedule order, with server-derived status. |
| POST `/admin/rounds` | Creates a round. Send optional `id`, `title`, `status`, ISO timestamps `startsAt` and `endsAt`, `resultsVisible` and optional `questionsVisible`. |
| PUT `/admin/rounds/:id` | Creates or updates using the same fields. Set `LIVE` to open or resume, `PAUSED_BY_ORGANIZER` to pause, or `FINISHED` to close. `WAITING` leaves a round scheduled for a staff opening. |
| POST `/admin/rounds/:id/problems` | Assigns a draft using `problemId`, `expectedRevision` and optional `order`. |

Round windows fit within the parent contest. Schedule edits are available before the round starts. Only one opened or paused round may occupy the current window. A finished round cannot reopen. Rounds end at the stored deadline even if no admin sends a close request. Candidate problem access requires a live contest, an open round within its window, round question visibility and publication. A scheduled release becomes visible at its timestamp when the round is open. Standings visibility combines the existing contest setting and the selected round's setting.

The existing contest clock keeps the contest ID stable and reports the selected round's `roundId`, title, status and timing fields. Candidate sessions and historical scores stay contest scoped across transitions.

## Migration and integration

`20261121120000_competition_rounds` adds the rounds table and problem assignment/release columns. It backfills existing problems into a Round 1 row using the original contest ID and clock. It widens existing integer weights to support the frontend's decimal inputs. Migration validation used disposable schemas, including a pre-migration fixture with a submission and hint receipt. The configured development schema was left for a separate migration step. Read-only preflight found its existing contest window has expired. Use a confirmed organizer schedule before opening rounds in that database.

The current frontend's question, test case, hint and round request paths are supported. The overview adapter should read `activeRoundCount` or derive it from `activeRounds.length`. Existing round forms can open and close via status. Separate question-visibility and order controls would need to send `questionsVisible` and `order` respectively. Clients should refresh the problem revision after a case or hint write before publishing or editing. The Arena already polls the contest clock and problem list every 15 seconds. During frontend integration, clear any stale selected problem when the refreshed list excludes it.

Verification used `npm.cmd run prisma:generate`, `npm.cmd run build`, `npm.cmd test`, and `git diff --check`. PostgreSQL integration tests use one disposable schema per suite. Frontend browser integration and production Judge0 were outside this verification.
