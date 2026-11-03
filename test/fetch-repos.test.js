import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchRepos } from '../src/github.js';

// A pretend GitHub: answers each URL from a small table instead of the internet,
// and remembers every request so the tests can check what was sent.
function fakeGitHub(routes) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, headers: options.headers });
    const path = url.replace('https://api.github.com', '');
    const route = routes[path];
    if (!route) return { ok: false, status: 404, json: async () => ({}) };
    const status = route.status ?? 200;
    return { ok: status < 400, status, json: async () => route.body };
  };
  return { fetchImpl, calls };
}

const repo = (name, extra = {}) => ({ name, description: `${name} desc`, topics: [], ...extra });

test('lists repositories and adds each README size', async () => {
  const { fetchImpl } = fakeGitHub({
    '/users/alice/repos?type=owner&per_page=100&page=1': { body: [repo('one'), repo('two')] },
    '/repos/alice/one/readme': { body: { size: 1200 } },
    '/repos/alice/two/readme': { body: { size: 50 } },
  });
  const repos = await fetchRepos('alice', { fetchImpl });
  assert.deepEqual(repos.map((r) => [r.name, r.readmeLength]), [['one', 1200], ['two', 50]]);
});

test('a repo without a README gets length 0', async () => {
  const { fetchImpl } = fakeGitHub({
    '/users/alice/repos?type=owner&per_page=100&page=1': { body: [repo('no-readme')] },
  });
  const [result] = await fetchRepos('alice', { fetchImpl });
  assert.equal(result.readmeLength, 0);
});

test('forks and archived repos are skipped', async () => {
  const { fetchImpl } = fakeGitHub({
    '/users/alice/repos?type=owner&per_page=100&page=1': {
      body: [repo('mine'), repo('forked', { fork: true }), repo('old', { archived: true })],
    },
    '/repos/alice/mine/readme': { body: { size: 500 } },
  });
  const repos = await fetchRepos('alice', { fetchImpl });
  assert.deepEqual(repos.map((r) => r.name), ['mine']);
});

test('keeps reading pages until a page is not full', async () => {
  const { fetchImpl } = fakeGitHub({
    '/users/alice/repos?type=owner&per_page=2&page=1': { body: [repo('a'), repo('b')] },
    '/users/alice/repos?type=owner&per_page=2&page=2': { body: [repo('c')] },
  });
  const repos = await fetchRepos('alice', { fetchImpl, perPage: 2 });
  assert.deepEqual(repos.map((r) => r.name), ['a', 'b', 'c']);
});

test('sends the token only when one is given', async () => {
  const routes = { '/users/alice/repos?type=owner&per_page=100&page=1': { body: [] } };

  const withToken = fakeGitHub(routes);
  await fetchRepos('alice', { fetchImpl: withToken.fetchImpl, token: 'secret123' });
  assert.equal(withToken.calls[0].headers.Authorization, 'Bearer secret123');

  const withoutToken = fakeGitHub(routes);
  await fetchRepos('alice', { fetchImpl: withoutToken.fetchImpl });
  assert.equal(withoutToken.calls[0].headers.Authorization, undefined);
});

test('an unknown user gives a clear error', async () => {
  const { fetchImpl } = fakeGitHub({});
  await assert.rejects(fetchRepos('nobody', { fetchImpl }), /GitHub user not found: nobody/);
});

test('hitting the rate limit suggests setting GITHUB_TOKEN', async () => {
  const { fetchImpl } = fakeGitHub({
    '/users/alice/repos?type=owner&per_page=100&page=1': { status: 403, body: {} },
  });
  await assert.rejects(fetchRepos('alice', { fetchImpl }), /GITHUB_TOKEN/);
});
