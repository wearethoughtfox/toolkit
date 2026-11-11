# Review response and implementation plan

Source: `../REVIEW-2026-11-11.md`. The source review is unchanged. Its publication and deletion instructions are proposals, not actions authorised by the document itself.

## Assessment

The central diagnosis is useful: copied foundations prevent fixes from reaching every site. Consolidating those foundations is worth doing. The roadmap also mixes maintenance, shared infrastructure, design exploration and a commercial offer. They should have separate acceptance checks. Its day estimates leave little room for visual review, deployment differences and content decisions.

| Proposal | Assessment |
| --- | --- |
| Wrapper and navigation fixes | Keep. The Wrapper self-reference is invalid. The installed SvelteKit source registers `afterNavigate` through `onMount`, supporting registration during component initialization. Browser navigation remains a release check. |
| Adopt copied sites | Keep, one at a time. Inventory differences and capture a current baseline before deleting copies. Separate adoption from unrelated visual and content edits. |
| Shared SEO and feed helpers | Keep. Start with URL handling, XML escaping and indexability tests. Preserve each site's canonical and title policy explicitly. Omit modification dates where no real date exists. |
| Shared Kit config | Defer until two integrations demonstrate the same requirements. Adapters and prerender rules depend on deployment; a recipe may suffice. |
| Inline CSS everywhere | Measure first. Larger HTML and reduced cross-page caching are costs. A config change alone does not establish a performance improvement. |
| Generator parity | Implemented locally for named viewport limits and optional precision. Preserve existing rounding by default to avoid moving text across all consumers. |
| Token watch plugin | Next foundation task. Watch token inputs only, handle additions and deletion, avoid output loops, suppress unchanged writes and test error reporting. |
| Layout props and runes | Separate changes. Runes migration need not alter layout defaults. Resetting every custom property can defeat intentional inheritance; specify nested-layout behaviour first. |
| Remove reveal and transitions | Defer removal until imports are inventoried and replacements tested. CSS scroll animations still need browser-support and reduced-motion checks. Tune the shortlist before publishing it. |
| Zero-height visually hidden content | Investigate with assistive technology. The review did not establish a failure, so this is not yet a confirmed defect. |
| Automated gate | Keep, incrementally. Start with builds, tests, variable checks and internal links. Add browser accessibility and performance checks with explicit budgets. Scanners do not replace keyboard and screen-reader checks. |
| Template and brief | Keep after proving one adoption. Create a fresh site without changing toolkit internals; preserve deployment-specific form behaviour. |
| Directions | Pilot manually on a real brief before building the comparison system. Directions may differ in hierarchy and layout as well as tokens. Archive alternatives instead of automatically deleting them. |
| v1 compatibility removal | Defer until every consumer has migrated and the replacement APIs are proven. Compatibility removal is not itself a client benefit. |
| Delete skills and branches | Do not treat this as routine cleanup. Different editors may require their own discovery paths; squash merges need content verification. Prefer a documented skill source with links where supported. |
| Thought Fox offer page | Commercial priority once the offer and source copy are established. This pass has not read the external AI Pivot research and has not invented positioning or prices. |

## Execution order

1. Validate the small fixes with regression tests, a playground build, current screenshots and browser navigation. Prepare a release containing only its intended changes.
2. Add the token watcher and shared SEO helpers. Adopt WATF while preserving its content, then Clubs, Ashbright and Brick House. Prove the API on one site before migrating all four.
3. Add repeatable checks during each adoption, rather than waiting until all migrations finish. Check canonicals, indexability, sitemap entries, keyboard navigation, hashes and browser history alongside screenshots.
4. Extract a neutral starter from the proven integration. Verify a fresh install and build, including the actual deployment's form recipe and 404 handling.
5. Try directions on a prospect and automate the useful steps. Revisit compatibility cleanup after the APIs have been used.

The offer page can proceed alongside foundation work once its brief is available. It should not depend on completing a design exploration platform.

## Implemented in this pass

- Named `maxViewport` limits in the shared generator.
- `clampPrecision`, defaulting to two decimals. Brick House can request four.
- Invalid fluid viewport ranges fail with a token-specific error instead of emitting `NaN` or `Infinity`.
- Six generator tests. A fixture copied from Brick House on 11 November proves byte-for-byte equality with its generated token CSS without requiring a sibling repository in CI.
- Two tests for the existing focus helper, covering first load, hash navigation, focus without scrolling and preservation of an existing `tabindex`.

No site migration or visual redesign is included. This pass has not published releases, pushed commits, deleted branches or skills, changed prices or changed indexing policy.

## Validation and remaining work

The initial suite had 101 passes and one TODO. The updated suite has 109 passes, no failures and the same TODO. The playground production build passes. Its existing warnings still need review; a successful build is not an accessibility or visual pass.

The previous review's all-site builds and browser results have not been independently reproduced here. Before release, inspect playground screenshots for the Wrapper change and test navigation in a browser. Before each consumer bump, capture its baseline and comparison with the same browser, content and environment.

Remaining decisions include Thought Fox's offer and source copy, Root's indexing status at launch, playground highlight colours and the transition shortlist. These do not block generator tests or shared helper work.
