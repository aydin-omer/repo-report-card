import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeRepo } from '../src/grade.js';

// A fixed "today" so the recent-activity rule gives the same result every run
const NOW = new Date('2026-11-03T00:00:00Z');

const perfectRepo = {
  description: 'A tool that does something useful',
  license: 'MIT License',
  readmeLength: 1200,
  topics: ['cli', 'github', 'nodejs'],
  homepage: 'https://example.com',
  pushedAt: '2026-10-01T00:00:00Z',
};

test('a repo meeting every rule scores 10/10 with grade A', () => {
  const result = gradeRepo(perfectRepo, NOW);
  assert.equal(result.score, 10);
  assert.equal(result.grade, 'A');
  assert.deepEqual(result.missing, []);
});

test('an empty description costs 2 points', () => {
  const result = gradeRepo({ ...perfectRepo, description: '' }, NOW);
  assert.equal(result.score, 8);
  assert.deepEqual(result.missing, ['description']);
});

test('a description of only spaces counts as empty', () => {
  const result = gradeRepo({ ...perfectRepo, description: '   ' }, NOW);
  assert.deepEqual(result.missing, ['description']);
});

test('no license costs 2 points', () => {
  const result = gradeRepo({ ...perfectRepo, license: null }, NOW);
  assert.equal(result.score, 8);
  assert.deepEqual(result.missing, ['license']);
});

test('a README under 300 characters counts as missing', () => {
  const result = gradeRepo({ ...perfectRepo, readmeLength: 299 }, NOW);
  assert.equal(result.score, 8);
  assert.deepEqual(result.missing, ['README']);
});

test('a README of exactly 300 characters passes', () => {
  const result = gradeRepo({ ...perfectRepo, readmeLength: 300 }, NOW);
  assert.equal(result.score, 10);
});

test('fewer than 3 topics costs 2 points', () => {
  const result = gradeRepo({ ...perfectRepo, topics: ['cli', 'github'] }, NOW);
  assert.equal(result.score, 8);
  assert.deepEqual(result.missing, ['topics']);
});

test('no website link costs 1 point', () => {
  const result = gradeRepo({ ...perfectRepo, homepage: '' }, NOW);
  assert.equal(result.score, 9);
  assert.equal(result.grade, 'A');
  assert.deepEqual(result.missing, ['website link']);
});

test('no push in the last 12 months costs 1 point', () => {
  const result = gradeRepo({ ...perfectRepo, pushedAt: '2025-10-01T00:00:00Z' }, NOW);
  assert.equal(result.score, 9);
  assert.deepEqual(result.missing, ['recent activity']);
});

test('grade boundaries: 7 is B, 5 is C, 4 is D', () => {
  const seven = gradeRepo({ ...perfectRepo, description: '', homepage: '' }, NOW);
  assert.equal(seven.score, 7);
  assert.equal(seven.grade, 'B');

  const five = gradeRepo({ ...perfectRepo, license: null, readmeLength: 0, homepage: '' }, NOW);
  assert.equal(five.score, 5);
  assert.equal(five.grade, 'C');

  const four = gradeRepo({ ...perfectRepo, description: '', license: null, readmeLength: 0 }, NOW);
  assert.equal(four.score, 4);
  assert.equal(four.grade, 'D');
});

test('an empty repo scores 0 and lists everything in table order', () => {
  const result = gradeRepo({}, NOW);
  assert.equal(result.score, 0);
  assert.equal(result.grade, 'D');
  assert.deepEqual(result.missing, [
    'description', 'license', 'README', 'topics', 'website link', 'recent activity',
  ]);
});
