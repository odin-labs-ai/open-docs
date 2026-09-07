import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const sha = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync('dist/version.json', JSON.stringify({ sha, builtAt: new Date().toISOString() }) + '\n');
