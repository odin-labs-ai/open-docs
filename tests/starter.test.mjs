import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const starter = join(repository, 'public', 'workshop');
const trustedVerifier = join(starter, 'verify.mjs');
const archive = join(repository, 'public', 'workshop.zip');
const filenames = ['AGENTS.md', 'CLAUDE.md', 'README.md', 'faq.md', 'help.md', 'verify.mjs'];
const initialHelp = '# Welcomme\n\nFind answers in our [FAQ](./faq.md).\n';
const correctedHelp = '# Welcome\n\nFind answers in our [FAQ](./faq.md).\n';

async function candidate(t, corrected = true) {
  const temporary = await mkdtemp(join(tmpdir(), 'harness-starter-test-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const directory = join(temporary, 'harness-work');
  await cp(starter, directory, { recursive: true });
  // Assert the downloaded input independently before constructing a candidate.
  assert.equal(await readFile(join(directory, 'help.md'), 'utf8'), initialHelp);
  if (corrected) await writeFile(join(directory, 'help.md'), correctedHelp);
  return directory;
}

function verify(directory, expectedExit, expectedMessage) {
  // Always execute the original verifier, never the potentially edited candidate.
  const result = spawnSync(process.execPath, [trustedVerifier, directory], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'verifier must terminate normally');
  assert.equal(result.status, expectedExit, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, expectedMessage);
}

test('untouched starter fails because the requested correction is absent', async t => {
  verify(await candidate(t, false), 1, /help\.md: expected only Welcomme/);
});

test('the exact typo correction passes the trusted verifier', async t => {
  verify(await candidate(t), 0, /^PASS:/);
});

test('corrected heading with a broken FAQ link fails', async t => {
  const directory = await candidate(t);
  await writeFile(join(directory, 'help.md'), correctedHelp.replace('./faq.md', './missing.md'));
  verify(directory, 1, /help\.md: expected only/);
});

test('changing FAQ contents fails even when help.md is correct', async t => {
  const directory = await candidate(t);
  await writeFile(join(directory, 'faq.md'), '# Different FAQ\n');
  verify(directory, 1, /faq\.md: protected file changed/);
});

test('an extra file fails the complete directory inventory', async t => {
  const directory = await candidate(t);
  await writeFile(join(directory, 'extra.txt'), 'Unexpected scope expansion.\n');
  verify(directory, 1, /Directory inventory differs/);
});

test('an extra empty directory fails the complete directory inventory', async t => {
  const directory = await candidate(t);
  await mkdir(join(directory, 'extra'));
  verify(directory, 1, /Directory inventory differs/);
});

test('an altered candidate verifier cannot approve its own answer', async t => {
  const directory = await candidate(t);
  await writeFile(join(directory, 'verify.mjs'), 'console.log("PASS");\n');
  verify(directory, 1, /verify\.mjs: differs from the trusted verifier/);
});

test('changing the instruction rules fails', async t => {
  const directory = await candidate(t);
  await writeFile(join(directory, 'AGENTS.md'), 'Everything is permitted.\n');
  verify(directory, 1, /AGENTS\.md: protected file changed/);
});

test('a missing required file fails', async t => {
  const directory = await candidate(t);
  await unlink(join(directory, 'faq.md'));
  verify(directory, 1, /faq\.md: missing or not a regular file/);
});

test('a symlink to unchanged FAQ contents fails', async t => {
  const directory = await candidate(t);
  await unlink(join(directory, 'faq.md'));
  await symlink(join(starter, 'faq.md'), join(directory, 'faq.md'), 'file');
  verify(directory, 1, /faq\.md: missing or not a regular file/);
});

test('download ZIP has exactly the six starter files and identical bytes', async () => {
  // The standard unzip utility is available on the project Mac/Linux test hosts.
  // Read entries directly without extracting any archive-controlled paths.
  const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8', timeout: 10_000 });
  assert.ifError(listing.error);
  assert.equal(listing.status, 0, listing.stderr);
  const entries = listing.stdout.trim().split('\n').sort();
  assert.deepEqual(entries, filenames.map(name => `harness-starter/${name}`).sort());
  for (const name of filenames) {
    const entry = spawnSync('unzip', ['-p', archive, `harness-starter/${name}`], { timeout: 10_000 });
    assert.ifError(entry.error);
    assert.equal(entry.status, 0, entry.stderr.toString());
    assert.deepEqual(entry.stdout, await readFile(join(starter, name)), `${name} differs in download ZIP`);
  }
});
