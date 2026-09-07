# Harness engineering practice task

This directory is a disposable teaching fixture, not a production project.

- Read help.md and the current user task before editing.
- The only allowed edit is one replacement of Welcomme with Welcome in help.md.
- Preserve every other byte, including the FAQ link and trailing newline.
- Preserve every other file. Do not add files or directories.
- Do not edit verify.mjs, faq.md, README.md, AGENTS.md or CLAUDE.md.
- If the starting document differs from the fixture, stop and report the mismatch.
- Run `node verify.mjs` and report its exit code and the exact edit.
- Do not commit, publish, access the network or change permission settings.

These instructions guide behavior; they do not install a permission boundary.
The learner runs an additional trusted verifier from outside this working copy.
