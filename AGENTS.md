<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Use searchable uppercase context tags only for constraints that cannot be expressed clearly by code alone. `LEGACY:` identifies a compatibility mechanism, the older state it serves, and its removal condition. `LEGAL:` identifies a non-obvious compliance invariant and its governing reason. `FUTURE:` identifies an intentionally deferred capability and the condition that makes it actionable. `TODO(scope):` identifies concrete unfinished work owned at that location; use `TODO(notifications):` for future delivery of durable events and `TODO(support):` for future routing of durable human-resolution states. There is no `GENERAL:` tag. Keep every tag terse; do not use tags as a prose backlog or duplicate a plan in comments.

Do not hard-wrap prose in source files, comments, JSX text, strings, or Markdown. Keep each paragraph on one source line unless a newline actually makes more sense, or is semantically required.

Always think about how any given layout and all of the used components look on all layouts, ranging from mobile to TV.

Never disguise or restructure correct code merely to evade a linter (i.e. by aliasing). Keep the canonical form and use the narrowest documented suppression for a verified false positive.

Never hand-roll anything locally in a given file or component, right where it's used. Use the shadcn cli for adding new components.

Proactively propose to use the Convex, Clerk, Vercel, and GitHub CLIs - but ensure you have an explicit OK from the user in the conversation for every impactful action you take. If authentication is required, mention it right away, instead of taking another route. Tread carefully around production, checking all the live consequences of your actions before you take them.

Put every test under test/: unit tests in test/unit, integration tests in test/integration, browser journeys in test/e2e, and shared infrastructure in test/support. Organize integrations by boundary, such as convex/mock, convex/local, or contract/<provider>. Name assertions *.test.ts; reserve *.setup.ts and *.teardown.ts for configured lifecycle projects. Test behavior at the lowest faithful boundary and avoid proving the same contract twice. Treat coverage as diagnostic, not a gate.
Contract tests must never silently use production credentials. When a provider exposes verifiable test or sandbox credentials, use dedicated *_TEST_* variables and validate them. Otherwise, define provider-specific safeguards. Keep local credentials in .env.test.local and committed placeholders in .env.example.test.local.
Keep development and verification cross-platform. Pull-request code must not receive secrets.
Package-script prefixes are exhaustive umbrellas. check runs every static check, test runs every test suite, and verify runs check, test, then the production build. Keep modes such as watch, debug, coverage, and fix outside the test:* suite tree.
