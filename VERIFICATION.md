# Public release verification

The release pipeline runs the complete browser suite on the production build,
a nested-path static check, and adversarial checks of the downloadable exercise.
After deployment it waits for the expected commit at `version.json` and repeats
the browser suite against the public Pages URL. Runs and screenshots are available
in GitHub Actions. Head-bound independent review receipts live on `review/...`
branches, separate from the commits being reviewed.

Browser checks cover the authored learning journeys, desktop/mobile layouts,
keyboard return paths, reduced motion, accessible content, WebGL fallback, provider
selection, failure/recovery and downloads. They establish tested behavior, not
human learning outcomes or the absence of every possible bug. Real-provider agent
execution is optional and is not performed by this public app or its CI.

Initial deployed evaluation and merge-queue evidence will be recorded after the
first release. Historical private-identity fixtures are deliberately outside this
public build's scope.
