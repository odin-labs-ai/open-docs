# Provider stage sources and representation limits

Reviewed 7 September 2026. `src/provider-stages.ts` authors 25 cutaways: five providers across contract, context, permissions, verification and recovery. Each cutaway has six inspectable objects and five causal teaching frames. Layouts differ by provider: Pi workbench, Codex sandbox, Claude hook rail, Droid pipeline and DeepSeek request/response handoff.

These are public educational reconstructions. They do not connect to providers, install hooks, inspect private model reasoning or claim access to proprietary implementation code. Source links appear with the inspectable code. Highlight numbers refer to lines in the displayed excerpt, not line numbers in upstream repositories.

## Pi

The current primary repository is [earendil-works/pi](https://github.com/earendil-works/pi), which the historical badlogic/pi-mono URL redirects to. The fetched main-branch manifests identify `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core` and `@earendil-works/pi-coding-agent`; each reported version 0.85.1 at review. The stage uses the current names rather than the historical `@mariozechner` scope. Its role map is authored explanatory labeling, not a literal combined package manifest. Sources: [model API manifest](https://github.com/earendil-works/pi/blob/main/packages/ai/package.json), [agent runtime manifest](https://github.com/earendil-works/pi/blob/main/packages/agent/package.json), [coding agent manifest](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/package.json).

The [coding-agent README](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md) establishes default read/write/edit/bash tools, provider selection, DeepSeek support, session commands and the absence of built-in permission popups. [Extension documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md) establishes `ExtensionAPI`, `before_agent_start`, `tool_call`, `tool_result`, `session_before_tree` and `session_tree`. The displayed extension snippets are authored applications of those public interfaces; they are optional code, not installed functionality.

`before_agent_start` can contribute per-turn context. `tool_call` can block before execution. `tool_result` can inspect or modify observations after execution. The `export_folder` example is a fictional custom tool used to demonstrate denial, not a built-in Pi capability. Blocking that one name is not a comprehensive permission system, path validator or OS sandbox. The current [session format](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md) establishes JSONL entries connected by `id` and `parentId`. Displayed entries are abbreviated fictional examples; they are not complete session files to import. Branch navigation does not restore past filesystem state or implement business-operation deduplication.

## Codex

The [AGENTS.md guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md) establishes instruction discovery and concatenation from global through applicable project scopes. [Agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security) establishes `sandbox_mode`, `approval_policy`, workspace-write, on-request and network configuration. The configuration excerpts illustrate documented settings without changing this app or the learner's environment. The [CLI guide](https://learn.chatgpt.com/docs/codex/cli) establishes `/permissions` and `codex resume`.

The Codex loop and tool proposal are explicitly conceptual pseudocode. They are not claimed private API payloads. The visual distinguishes instruction following from runtime permission handling and execution isolation. A resumed conversation supplies context; the learner must still inspect current files and evidence.

## Claude Code

[Project memory](https://code.claude.com/docs/en/memory) establishes `CLAUDE.md` and `/memory`. The [hooks reference](https://code.claude.com/docs/en/hooks) establishes `PreToolUse`, `PostToolUse`, `Stop` and `SessionStart`, as well as their event inputs and decision outputs. [Permissions](https://code.claude.com/docs/en/permissions) establishes rule syntax and precedence. The [CLI reference](https://code.claude.com/docs/en/cli-reference) establishes the resume flow.

The stage distinguishes `.claude/settings.json`'s `hooks` wrapper from Factory's top-level event map. The illustrative scope script named in the config is not supplied. Denial occurs before execution; after-tool feedback can expose a failure but cannot prevent the original write. Stop feedback needs bounded behavior and attention to `stop_hook_active`. Direct file references are another reason a PreToolUse read hook alone is not complete access enforcement.

## Factory Droid

[Droid AGENTS.md](https://docs.factory.ai/harness/agents-md), [Factory hooks](https://docs.factory.ai/harness/hooks) and the [Droid CLI reference](https://docs.factory.ai/droid-cli/cli-reference) establish the displayed instruction surface, `.factory/hooks.json`, case-sensitive tool matchers, `Execute`, `Edit`, `Create`, `ApplyPatch`, and documented lifecycle events. The event rail uses `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `PreCompact` and `SessionStart`. Interactive recovery uses `droid --resume`; no unsafe autonomy flags appear.

The permission cutaway matches `Execute` to the fictional `node export-fixture.mjs` proposal. That script is not supplied or executed. A scope checker would need to inspect the actual command and environment. Other illustrative configurations show after-edit verification. Pre-tool denial blocks an effect; post-tool or stop feedback requests forward correction. Hooks do not by themselves prove the final artifact is correct.

## DeepSeek inside Pi

[DeepSeek tool calls](https://api-docs.deepseek.com/guides/tool_calls/) establishes the request's function schema, assistant `tool_calls`, string-encoded `arguments`, and the return message's `tool_call_id`. The provider asks for an operation; host code supplies its execution. Pi's primary README establishes the supported DeepSeek provider route.

Wire panels are authored, abbreviated examples using documented fields. They omit model selection and credentials, and are not captured Pi network traffic or complete runnable requests. The permission example declares a fictional custom `export_folder` tool and shows the matching Pi extension denial. A production adapter must preserve the requirements of its selected model and mode. A tool-call correlation ID, Pi session entry ID and application operation key are distinct; the stage does not claim any automatic exactly-once or idempotency guarantee.

## Workshop files and validation

`help.md` and the project instruction panels reproduce the public downloadable fixture. The `verify.mjs` panel reproduces its key file-checking statements with indentation removed for display. The expected diff and terminal result are authored teaching artifacts, explicitly labeled separately from actual files or live execution. The hook configurations point to illustrative scope scripts; only the starter project's real `verify.mjs` is supplied.

The public stage file contains no private odin-agent instructions, credentials or tenant records. Local validation checks the TypeScript module, all 25 specifications, graph references, code highlights and JSON examples. Browser coverage is recorded separately in the verification report; source accuracy and working navigation do not establish human mastery or successful live provider execution.
