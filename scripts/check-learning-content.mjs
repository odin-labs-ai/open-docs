import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// The manifest is authored from the accepted release, never refreshed by this check.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(readFileSync(resolve(root, '.ai/blueprints/learning-content-baseline.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');

function declaration(source, name, path) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const matches = [];
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const value of statement.declarationList.declarations) {
      if (ts.isIdentifier(value.name) && value.name.text === name && value.initializer) matches.push(value.initializer.getText(file));
    }
  }
  if (matches.length !== 1) throw new Error(`${path}: expected one ${name} declaration, found ${matches.length}`);
  // Ignore formatting and comments; preserve all literal text and meaningful syntax.
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, matches[0]);
  const tokens = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) tokens.push(scanner.getTokenText());
  return JSON.stringify(tokens);
}

function check(overrides = new Map()) {
  const failures = [];
  for (const entry of manifest.entries) {
    try {
      const bytes = overrides.get(entry.path) ?? readFileSync(resolve(root, entry.path));
      const value = entry.declaration ? declaration(bytes.toString(), entry.declaration, entry.path) : bytes;
      if (hash(value) !== entry.sha256) failures.push(`${entry.path}${entry.declaration ? `#${entry.declaration}` : ''}: protected learning content changed`);
    } catch (error) { failures.push(error.message); }
  }
  return failures;
}

const failures = check();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`PASS: ${manifest.entries.length} protected learning sources match accepted release ${manifest.baselineRef}.`);
if (process.argv.includes('--self-test')) {
  const mutations = [
    ['src/curriculum.ts', 'The model supplies capability.', ''],
    ['src/workshop.ts', 'A lost response does not mean a failed action.', ''],
    ['src/agent-overview.ts', 'A proposed tool call is not an executed action.', ''],
  ];
  for (const [path, before, after] of mutations) {
    const source = readFileSync(resolve(root, path), 'utf8');
    if (!source.includes(before)) throw new Error(`Negative probe anchor missing: ${path}`);
    const rejected = check(new Map([[path, Buffer.from(source.replace(before, after))]]));
    if (!rejected.some(message => message.startsWith(path))) throw new Error(`Content deletion escaped the check: ${path}`);
    console.log(`PASS: deleting a teaching explanation is rejected in ${path}.`);
  }
}
