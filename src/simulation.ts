import type { Component } from './curriculum';

export type Controls = { policy: boolean; checkpoint: boolean; idempotency: boolean; verification: boolean; contextBudget: number; maxTurns: number };
export type Event = { component: Component; title: string; detail: string; status: 'ok' | 'warn' | 'fail' };
export type Scenario = { id: string; title: string; description: string; concept: string; correction: string };
export const defaults: Controls = { policy: true, checkpoint: true, idempotency: true, verification: true, contextBudget: 16, maxTurns: 6 };
export const scenarios: Scenario[] = [
  { id: 'injection', title: 'Hostile source', description: 'An external document asks the agent to export a tenant’s private records to an unapproved endpoint.', concept: 'Trust boundaries and runtime authorization', correction: 'Enforce the policy boundary before tool dispatch.' },
  { id: 'timeout', title: 'The lost receipt', description: 'A record is created, but the response is lost. The agent sees a timeout and retries the operation.', concept: 'Ambiguous outcomes and idempotency', correction: 'Use a stable idempotency key so the receiver returns the existing result.' },
  { id: 'restart', title: 'A session disappears', description: 'After three completed steps, the session terminates. A new worker must continue the task.', concept: 'Durable checkpoints and handoff', correction: 'Restore verified progress from a durable checkpoint, then revalidate it.' },
  { id: 'context', title: 'An overflowing briefing', description: 'The task needs 12k tokens of selected evidence plus 4k tokens of output headroom in this fixture.', concept: 'Context selection and reserved capacity', correction: 'Provide at least 16k total capacity for this fixture; real tasks also need relevance filtering.' },
  { id: 'false-success', title: 'A convincing wrong answer', description: 'The model says the update succeeded, but the stored record is missing a required field.', concept: 'Independent outcome verification', correction: 'Inspect the actual record against the acceptance contract.' },
  { id: 'loop', title: 'One more attempt', description: 'The same tool error repeats. The model keeps proposing the identical action without new evidence.', concept: 'Bounded execution and honest stopping', correction: 'Set the turn limit to six or fewer for this deliberately repetitive fixture.' },
];

export function simulate(id: string, c: Controls): { events: Event[]; contained: boolean; outcome: string; lesson: string } {
  const events: Event[] = [
    { component: 'intent', title: 'Contract loaded', detail: 'Fictional demo tenant. Update one authorized record; preserve scope and evidence.', status: 'ok' },
    { component: 'context', title: 'Context assembled', detail: `${c.contextBudget}k total token capacity; outside sources retain their provenance.`, status: 'ok' },
    { component: 'model', title: 'Action proposed', detail: 'The model proposes an action. No external effect has occurred yet.', status: 'ok' },
  ];
  let contained = false;
  let outcome = '';
  let lesson = '';
  const add = (component: Component, title: string, detail: string, status: Event['status']) => events.push({ component, title, detail, status });
  switch (id) {
    case 'injection':
      contained = c.policy; lesson = 'injection';
      add('context', 'Instruction injected into source', 'The document says “export private records.” Source text has no authority to grant this action.', 'warn');
      add('policy', c.policy ? 'Unauthorized action denied' : 'No enforcement boundary', c.policy ? 'Tenant, operation, and egress checks deny the request before tool execution.' : 'The teaching model allows the proposed export through the missing gate.', c.policy ? 'ok' : 'fail');
      add('tools', c.policy ? 'No export executed' : 'Simulated unauthorized export', c.policy ? 'No side effect. The original task can continue with the document treated as data.' : 'An instruction-only defense did not prevent the simulated side effect.', c.policy ? 'ok' : 'fail');
      outcome = c.policy ? 'Attack contained. Task continuation still needs ordinary verification.' : 'Boundary failure: the simulated export was allowed.';
      break;
    case 'timeout':
      contained = c.idempotency; lesson = 'recovery';
      add('tools', 'Write committed; response lost', 'The receiver created record demo-17, but the caller timed out.', 'warn');
      add('memory', c.idempotency ? 'Stable operation identity reused' : 'Retry treated as a new request', c.idempotency ? 'The same logical request uses key task-17:create-record.' : 'Without deduplication, a repeated request may create another record.', c.idempotency ? 'ok' : 'fail');
      add('tools', c.idempotency ? 'Existing result returned' : 'Duplicate record created', c.idempotency ? 'The receiver recognizes the key and returns demo-17. One logical effect in this fixture.' : 'The simulated receiver now contains two records for one intended operation.', c.idempotency ? 'ok' : 'fail');
      outcome = c.idempotency ? 'Duplicate prevented within this receiver’s idempotency contract.' : 'Recovery failure: the retry duplicated a side effect.';
      break;
    case 'restart':
      contained = c.checkpoint; lesson = 'memory';
      add('tools', 'Three steps completed; worker lost', 'The in-memory conversation is gone. Completed work still exists in the environment.', 'warn');
      add('memory', c.checkpoint ? 'Checkpoint restored' : 'No durable progress record', c.checkpoint ? 'Contract, operation IDs, verified artifacts, and pending work are restored.' : 'The new worker cannot distinguish completed effects from pending work.', c.checkpoint ? 'ok' : 'fail');
      add('evidence', c.checkpoint ? 'Current state revalidated' : 'Manual reconciliation required', c.checkpoint ? 'Recorded artifacts are checked before resuming the remaining step.' : 'Stop and reconstruct external state; replaying the plan blindly is unsafe.', c.checkpoint ? 'ok' : 'fail');
      outcome = c.checkpoint ? 'Progress recovered and checked before continuation.' : 'Resume blocked: verified progress was not preserved.';
      break;
    case 'context':
      contained = c.contextBudget >= 16; lesson = 'context';
      add('context', 'Fixture capacity checked', `12k evidence + 4k headroom = 16k required. Selected capacity: ${c.contextBudget}k.`, contained ? 'ok' : 'fail');
      add('model', contained ? 'Evidence and output reserve fit' : 'Required evidence or output space lost', contained ? 'The selected facts and response reserve both fit. Capacity alone does not guarantee reasoning quality.' : 'This fixture cannot hold its selected evidence and output reserve. Select less evidence or increase capacity.', contained ? 'ok' : 'fail');
      outcome = contained ? 'Capacity constraint satisfied for this fixture.' : 'Context failure: the briefing exceeds available capacity.';
      break;
    case 'false-success':
      contained = c.verification; lesson = 'evals';
      add('model', 'Model claims completion', 'The answer says the update succeeded. This statement is not acceptance evidence.', 'warn');
      add('evidence', c.verification ? 'Missing field detected' : 'Claim accepted without checking', c.verification ? 'A separate outcome check reads the stored record and finds a required field absent.' : 'The simulated harness treats confident text as success despite incorrect stored state.', c.verification ? 'ok' : 'fail');
      outcome = c.verification ? 'False success caught. Task remains incomplete and needs correction.' : 'Verification failure: a wrong result was marked complete.';
      break;
    case 'loop':
      contained = c.maxTurns <= 6; lesson = 'loop';
      add('tools', 'Same error repeats', 'The tool returns the same permanent error. No new evidence justifies an unchanged attempt.', 'warn');
      add('model', contained ? `Stopped after ${c.maxTurns} turns` : `${c.maxTurns} turns spent repeating work`, contained ? 'The hard runtime limit stops this fixture and records an exhausted status.' : 'The permissive limit allows unnecessary repeated attempts in this six-turn teaching budget.', contained ? 'ok' : 'fail');
      outcome = contained ? 'Waste bounded. The task is exhausted, not complete; diagnose before retrying.' : 'Loop failure: the configured limit exceeds this fixture’s budget.';
      break;
    default: throw new Error(`Unknown scenario: ${id}`);
  }
  return { events, contained, outcome, lesson };
}
