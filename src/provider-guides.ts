export type ProviderGuide = {
  id: 'codex' | 'claude' | 'pi' | 'deepseek' | 'factory';
  name: string;
  kind: string;
  summary: string;
  entryCommand: string;
  instructionFile: string;
  steps: string[];
  prompt: string;
  expectedEvidence: string[];
  source: { title: string; url: string }[];
  internal?: boolean;
};

const prompt = 'In this workshop folder, fix only "Welcomme" to "Welcome" in help.md. Preserve the link ./faq.md and all other content. Read the project instructions first. Run node verify.mjs, inspect the resulting file, and report the exact change and check result. Preserve every other file and add no files. Do not change faq.md or verify.mjs. If the check fails, correct the file and rerun it before claiming completion.';
const expectedEvidence = [
  'help.md starts with "# Welcome"; every other character is preserved.',
  'The ./faq.md link still points to the unchanged FAQ file.',
  'The trusted external check, node ../harness-starter/verify.mjs ., exits with code 0 and reports PASS; include that evidence.',
];
const prepare = 'Extract the six workshop files into harness-starter. Keep that trusted original outside the agent’s writable scope. Copy it to a sibling folder, harness-work, and open a terminal in the working copy. Node 22 and your chosen agent must already be installed; use the official setup link if needed.';
const baseline = 'Run node ../harness-starter/verify.mjs . before editing. Its expected failure shows that the typo is still present.';
const inspect = 'Paste the task prompt. Observe the read, edit, and verification steps. End the editing session, independently run node ../harness-starter/verify.mjs . in your terminal, and inspect help.md afterward.';
const piSource = { title: 'Pi: tools, providers, context and sessions', url: 'https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md' };

/** Public teaching guides. Source review: 2026-09-07. No credentials or tenant content. */
export const providerGuides: ProviderGuide[] = [
  {
    id: 'codex', name: 'Codex', kind: 'Coding agent',
    summary: 'AGENTS.md supplies project guidance. The agent uses tools to edit and check files; configured permissions govern execution separately from the prompt.',
    entryCommand: 'codex', instructionFile: 'AGENTS.md',
    steps: [prepare, baseline, 'Start codex in harness-work and sign in through its normal flow if required. Read any permission request before granting the scoped operation.', inspect],
    prompt, expectedEvidence,
    source: [
      { title: 'Codex CLI setup', url: 'https://learn.chatgpt.com/docs/codex/cli' },
      { title: 'Codex project instructions', url: 'https://learn.chatgpt.com/docs/agent-configuration/agents-md' },
      { title: 'Codex approvals and security', url: 'https://learn.chatgpt.com/docs/agent-approvals-security' },
    ],
  },
  {
    id: 'claude', name: 'Claude Code', kind: 'Coding agent',
    summary: 'CLAUDE.md supplies project context. Settings control tool permissions; hooks can run checks at defined lifecycle events. Written guidance alone does not enforce a boundary.',
    entryCommand: 'claude', instructionFile: 'CLAUDE.md',
    steps: [prepare, baseline, 'Start claude in harness-work. Use /memory to inspect loaded project guidance. Keep the ordinary permission flow and review the scoped edit.', inspect],
    prompt, expectedEvidence,
    source: [
      { title: 'Claude Code quickstart', url: 'https://code.claude.com/docs/en/quickstart' },
      { title: 'Claude Code project memory', url: 'https://code.claude.com/docs/en/memory' },
      { title: 'Claude Code configuration files', url: 'https://code.claude.com/docs/en/claude-directory' },
    ],
  },
  {
    id: 'pi', name: 'Pi', kind: 'Extensible coding harness',
    summary: 'Pi pairs a chosen model with read, write, edit and shell tools. Extensions add behavior. Its core has no permission popups: use an appropriate isolated environment for tool execution.',
    entryCommand: 'pi', instructionFile: 'AGENTS.md / CLAUDE.md',
    steps: [prepare, baseline, 'Start pi in harness-work. Use /login for your provider and /model to choose a model available to your account. Check the startup header for loaded instruction files.', inspect, 'Notice which part you changed: selecting a model changes the intelligence; tools, session handling and extensions belong to the harness.'],
    prompt, expectedEvidence,
    source: [piSource],
  },
  {
    id: 'deepseek', name: 'DeepSeek + Pi', kind: 'Model inside a harness',
    summary: 'DeepSeek supplies a model API that can request tools. In this entry path, Pi hosts the loop, executes tools and stores the session. DeepSeek is not the CLI or the permission boundary.',
    entryCommand: 'pi', instructionFile: 'AGENTS.md / CLAUDE.md (loaded by Pi)',
    steps: [prepare, baseline, 'Start pi. Configure DeepSeek through Pi’s normal provider authentication flow, then use /model to select an available DeepSeek model. Provider access is required; never paste credentials into this learning app.', inspect, 'Identify the handoff: DeepSeek proposes a tool call, Pi executes it and sends back the result. The host must supply the environment controls and verification.'],
    prompt, expectedEvidence,
    source: [
      { title: 'DeepSeek tool calls', url: 'https://api-docs.deepseek.com/guides/tool_calls/' },
      piSource,
    ],
  },
  {
    id: 'factory', name: 'Factory Droid', kind: 'Coding agent platform',
    summary: 'Droid combines project context, tools and approvals. Its CLI also supports headless work; lifecycle hooks provide deterministic checks. This exercise uses an interactive session.',
    entryCommand: 'droid', instructionFile: 'AGENTS.md',
    steps: [prepare, baseline, 'Start droid in harness-work and use its normal sign-in flow. Inspect the project context and approval request before allowing the scoped file edit.', inspect, 'Transfer idea: a team can attach repeatable checks to lifecycle hooks, while still checking the final artifact against the task contract.'],
    prompt, expectedEvidence,
    source: [
      { title: 'Droid CLI quickstart', url: 'https://docs.factory.ai/droid-cli/quickstart' },
      { title: 'Droid CLI capabilities', url: 'https://docs.factory.ai/droid-cli/overview' },
      { title: 'Droid project instructions', url: 'https://docs.factory.ai/harness/agents-md' },
      { title: 'Factory lifecycle hooks', url: 'https://docs.factory.ai/harness/hooks' },
    ],
  },
];
