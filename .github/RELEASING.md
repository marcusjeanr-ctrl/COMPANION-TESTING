# Manual verified RC publication

The validation workflow stays read-only. `publish-rc.yml` is a separate, explicitly
requested manual release job, limited to COMPANION-TESTING. It uses GitHub's
short-lived repository token rather than cloud proxy credentials. It never edits
source, versions, presets, saved data or branches and is not triggered by pushes.
Dispatch only from main: verification code is copied from that trusted workflow
commit before checking out the candidate. Candidate packaging does not inherit
the release token. Fork or failed validation runs are rejected before packaging.

1. Review/test a candidate. Record the exact commit and tested ZIP SHA-256.
2. Dispatch **stage** on a ref containing this workflow/helper, passing that exact
   source commit, version and hash. It requires trusted green validation/browser
   jobs, packages a clean checkout, checks the known hash, uploads only draft assets,
   downloads them and verifies the ZIP and checksum report. Failure leaves a draft.
3. Only after staging passes, merge the reviewed candidate and wait for main CI.
4. Dispatch **publish** with the resulting main commit and the same ZIP hash.
   It repeats package/upload/download verification, requires current main and a
   correct/unused release tag, and publishes a prerelease only after every gate.
5. Verify public asset downloads and normal source-update entrypoints. A public
   endpoint check is not a claim of actual live Lumiverse installation/reload.

Do not dispatch arbitrary commits or weaken hash/CI checks to force publication.
Already published releases cannot be overwritten by this tool. No secret values
are stored; the job token is scoped to release contents writes and Actions reads.
