import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReport } from '../src/report.js';

test('lists the weakest repos first, with aligned columns and an average', () => {
  const output = formatReport('alice', [
    { name: 'cve-watcher', score: 10, grade: 'A', missing: [] },
    { name: 'mcp', score: 8, grade: 'B', missing: ['website link'] },
    { name: 'old-tool', score: 5, grade: 'C', missing: ['license', 'README', 'website link'] },
  ]);

  assert.equal(output, [
    'Report card for alice (3 repos)',
    '',
    'old-tool     C   5/10  missing: license, README, website link',
    'mcp          B   8/10  missing: website link',
    'cve-watcher  A  10/10',
    '',
    'Average: 7.7/10',
  ].join('\n'));
});

test('repos with the same score are sorted by name', () => {
  const output = formatReport('alice', [
    { name: 'zebra', score: 9, grade: 'A', missing: ['website link'] },
    { name: 'apple', score: 9, grade: 'A', missing: ['website link'] },
  ]);
  const rows = output.split('\n').slice(2, 4);
  assert.ok(rows[0].startsWith('apple'));
  assert.ok(rows[1].startsWith('zebra'));
});

test('a single repo says "1 repo", not "1 repos"', () => {
  const output = formatReport('alice', [{ name: 'solo', score: 10, grade: 'A', missing: [] }]);
  assert.ok(output.startsWith('Report card for alice (1 repo)'));
});

test('an account with no repos gets a friendly message', () => {
  assert.equal(formatReport('alice', []), 'No public repositories found for alice.');
});
