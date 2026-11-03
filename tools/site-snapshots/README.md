# Site snapshots

Screenshots every page of each site at 375, 768 and 1280px, so a change (a toolkit bump, a CSS refactor, a palette swap) can be checked by looking at what moved, not by clicking around.

Each run builds the site, serves the build, crawls from `/` (plus `sitemap.xml` and any `paths` in `sites.json`), freezes animations and lazy images, and takes full-page screenshots.

## Use

Take a baseline before you change anything:

```bash
npm run baseline -- brickhouse
```

Make the change, then compare:

```bash
npm run compare -- brickhouse
```

Open `output/report.html`. It shows before, after and a difference image (changed pixels in red) for every screenshot that moved, plus pages that appeared or disappeared. When the changes are what you meant, take a new baseline.

Leave out the site name to run every site. Other options:

- `--no-build` serves the existing build instead of rebuilding
- `--url=http://localhost:5173` uses a server that's already running (one site only)
- `node snap.js diff brickhouse` re-runs only the comparison and report

## Sites

Listed in `sites.json` with their folder and a port. The folders are relative to this one and assume the toolkit sits beside the sites in `CSS-course-picalli/`. The starter entry is the toolkit's own `playground/`. Add `paths` for pages nothing links to.

Root builds content from PocketBase when `PB_URL` is set. Take the baseline and the comparison with the same setting, or content changes will show up as design changes.

## Notes

- Run it from your own terminal. Claude's sandbox can't start servers or Chromium, so it can't take the screenshots itself; it can run `diff` and read the report.
- If `npm install` complains about root-owned files in `~/.npm`, either run `sudo chown -R 501:20 ~/.npm` once, or add `--cache "$TMPDIR/npm-cache"`.
- `output/` is git-ignored. Baselines are local to this machine.
