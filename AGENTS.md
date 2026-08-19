<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:convex-agent-rules -->

# This project uses Convex as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

<!-- END:convex-agent-rules -->

Do not hard-wrap prose in source files, comments, JSX text, strings, or Markdown. Keep each paragraph on one source line unless a newline actually makes more sense, or is semantically required.

Always think about how any given layout and all of the used components look on all layouts, ranging from mobile to TV.

Never disguise or restructure correct code merely to evade a linter (i.e. by aliasing). Keep the canonical form and use the narrowest documented suppression for a verified false positive.

Never hand-roll anything locally in a given file or component, right where it's used. Use the shadcn cli for adding new components.
