# A small, checkable agent task

Correct `Welcomme` to `Welcome` in `help.md`. Preserve every other byte and file.
The English fixture remains identical when used with the Dutch documentation.

## Prepare the exercise

Download these six files together, retaining their names and bytes:
`README.md`, `help.md`, `faq.md`, `AGENTS.md`, `CLAUDE.md`, `verify.mjs`.
Save them in a new folder named `harness-starter`. Read this guide and the script.
Node.js is required to run the verifier. There are no package dependencies.

Keep `harness-starter` as the trusted original. Copy the complete folder to a
sibling named `harness-work`. Give the editing agent only the working copy;
keep the trusted original outside its writable scope using your agent's actual
runtime controls. Instruction files do not enforce that boundary themselves.

The verifier performs local reads only. It does not contact a service or run an
agent. An optional real agent needs its usual installation, authentication and
provider access. Review its active permissions before starting.

## Establish the failing baseline

In a terminal whose current directory is `harness-work`, run:

```sh
node ../harness-starter/verify.mjs .
```

Expect exit code 1 and a FAIL message: the typo is still present. On Windows,
Node.js also accepts the forward-slash paths shown above.

## Give your agent this task

Launch your installed agent in `harness-work`: `codex` for Codex CLI, or `claude`
for Claude Code, `pi` for Pi (including a DeepSeek model configured in Pi), or
`droid` for Factory Droid. Use the harness's available runtime controls. Pi has
no built-in permission prompts or sandbox, so configure host isolation first
to protect the trusted original. Then paste:

> Read AGENTS.md. In help.md, change Welcomme to Welcome once. Preserve every
> other byte and every other file. Add no files. If the initial document differs
> from the described fixture, stop and report the mismatch. Run node verify.mjs,
> report its exit code, and summarize the exact edit. Do not commit, publish,
> use the network, or modify permissions.

Codex uses AGENTS.md for project instructions. Claude Code uses CLAUDE.md;
the supplied CLAUDE.md imports the shared AGENTS.md rules. Pi loads AGENTS.md
or CLAUDE.md context files; Factory Droid supports AGENTS.md. For Pi, configure
provider access and use /model to choose a model. Changing to DeepSeek changes
the model, while Pi remains responsible for executing local tools.

## Verify independently

End the editing session before the final check. From `harness-work`, run the
same external command yourself:

```sh
node ../harness-starter/verify.mjs .
```

Expect exit code 0 and PASS only after the exact correction. The trusted script
checks help.md, hashes of the protected files, the complete directory inventory,
and the working copy's verifier against its own bytes. Extra files or folders
(including tool metadata), missing files, symlinks and altered protected files
fail. Use a clean disposable working copy; do not run this against another repo.

`node verify.mjs` is useful feedback for the agent, but it is not the independent
final check: a modified local verifier could claim anything. Do not run the
working copy's script as your final authority. Do not let the agent edit the
trusted original. This verifier observes file state at inspection time; it does
not audit past activity, prevent writes, or provide a production sandbox.

## Challenge the check

Make separate disposable copies of the corrected working folder. Keep the trusted
original intact. In each copy, make one change and run the external verifier:

- Change the FAQ link in help.md: expect FAIL.
- Change faq.md: expect FAIL.
- Add an extra file or directory: expect FAIL.
- Alter verify.mjs in the working copy: expect FAIL.

Do not interpret a denied action as a completed task. After a pause or lost
response, inspect the actual files before repeating work and rerun the check.

## Official provider references

- Codex CLI: https://learn.chatgpt.com/docs/codex/cli
- AGENTS.md: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Claude Code CLI: https://code.claude.com/docs/en/cli-usage
- CLAUDE.md: https://code.claude.com/docs/en/memory
- Pi: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md
- DeepSeek tool calls: https://api-docs.deepseek.com/guides/tool_calls/
- Factory Droid: https://docs.factory.ai/droid-cli/quickstart
- Factory AGENTS.md: https://docs.factory.ai/harness/agents-md

## Nederlands

Bewaar `harness-starter` als vertrouwd origineel buiten het schrijfbereik van de
agent. Kopieer de volledige map naar `harness-work`. Voer vanuit die werkmap zelf
`node ../harness-starter/verify.mjs .` uit: eerst moet de controle mislukken.
Laat je agent alleen de typefout in help.md corrigeren. Beëindig het bewerken en
voer zelf dezelfde externe controle opnieuw uit. Alleen de exacte wijziging mag
slagen. De instructiebestanden installeren geen technische toegangsgrens.
Een aangepaste FAQ, extra bestand of gewijzigde verifier moet in een afzonderlijke
wegwerpkopie worden afgewezen. Gebruik de volledige Nederlandstalige opdracht en
stappen op de website; de oefenbestanden blijven bewust in het Engels.
