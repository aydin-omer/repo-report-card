import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRepoInfo } from '../src/github.js';

// A trimmed-down example of what GitHub's API returns for one repository
const apiRepo = {
  name: 'cve-watcher',
  description: 'Daily dashboard that checks Python packages for known vulnerabilities',
  license: { name: 'MIT License', spdx_id: 'MIT' },
  topics: ['github-actions', 'python', 'security'],
  homepage: 'https://aydin-omer.github.io/cve-watcher/',
  pushed_at: '2026-10-28T15:00:00Z',
};

test('maps GitHub API fields to the shape gradeRepo expects', () => {
  assert.deepEqual(toRepoInfo(apiRepo, 1500), {
    name: 'cve-watcher',
    description: 'Daily dashboard that checks Python packages for known vulnerabilities',
    license: 'MIT License',
    readmeLength: 1500,
    topics: ['github-actions', 'python', 'security'],
    homepage: 'https://aydin-omer.github.io/cve-watcher/',
    pushedAt: '2026-10-28T15:00:00Z',
  });
});

test('missing fields become empty values instead of crashing', () => {
  const bare = { name: 'empty-repo', description: null, license: null, homepage: null };
  assert.deepEqual(toRepoInfo(bare, undefined), {
    name: 'empty-repo',
    description: '',
    license: null,
    readmeLength: 0,
    topics: [],
    homepage: '',
    pushedAt: null,
  });
});

test('a license GitHub cannot identify does not count as a license', () => {
  const unknown = { ...apiRepo, license: { name: 'Other', spdx_id: 'NOASSERTION' } };
  assert.equal(toRepoInfo(unknown, 1500).license, null);
});
