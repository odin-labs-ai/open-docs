import assert from 'node:assert/strict';
const base = process.env.PLAYWRIGHT_BASE_URL;
const expected = process.env.GITHUB_SHA;
assert(base && expected, 'PLAYWRIGHT_BASE_URL and GITHUB_SHA are required');
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(new URL(`version.json?check=${Date.now()}`, base), { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (response.ok && (await response.json()).sha === expected) {
      console.log(`Verified deployed commit ${expected} at ${base}`);
      process.exit(0);
    }
  } catch (error) { console.log(`Deployment probe ${attempt + 1}: ${error.message}`); }
  await new Promise(resolve => setTimeout(resolve, 10000));
}
throw new Error(`Deployment did not serve expected commit ${expected}`);
