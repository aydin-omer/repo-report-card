const API = 'https://api.github.com';

// Fetches an account's public repositories and turns each one into the
// shape gradeRepo() expects. Forks and archived repos are skipped:
// forks are mostly other people's work, archived repos are finished on purpose.
// fetchImpl lets the tests pass in a fake fetch, so they never touch the internet.
export async function fetchRepos(owner, { token, fetchImpl = fetch, perPage = 100 } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'repo-report-card',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const listed = [];
  for (let page = 1; ; page++) {
    const url = `${API}/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=${perPage}&page=${page}`;
    const res = await fetchImpl(url, { headers });
    if (res.status === 404) throw new Error(`GitHub user not found: ${owner}`);
    checkResponse(res);
    const batch = await res.json();
    listed.push(...batch);
    if (batch.length < perPage) break;
  }

  const ownRepos = listed.filter((repo) => !repo.fork && !repo.archived);
  return Promise.all(
    ownRepos.map(async (repo) => {
      const readmeSize = await fetchReadmeSize(owner, repo.name, headers, fetchImpl);
      return toRepoInfo(repo, readmeSize);
    }),
  );
}

// The repository list does not include the README, so we ask for it separately.
// GitHub reports its size in bytes, which is close enough to characters for our rule.
async function fetchReadmeSize(owner, name, headers, fetchImpl) {
  const url = `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/readme`;
  const res = await fetchImpl(url, { headers });
  if (res.status === 404) return 0;
  checkResponse(res);
  const data = await res.json();
  return data.size;
}

function checkResponse(res) {
  if (res.status === 403 || res.status === 429) {
    throw new Error('GitHub rate limit reached. Set GITHUB_TOKEN to raise the limit.');
  }
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
}

// Turns one repository from GitHub's REST API into the simple shape
// that gradeRepo() understands.
export function toRepoInfo(apiRepo, readmeSize) {
  return {
    name: apiRepo.name,
    description: apiRepo.description ?? '',
    license: recognizedLicense(apiRepo.license),
    readmeLength: readmeSize ?? 0,
    topics: apiRepo.topics ?? [],
    homepage: apiRepo.homepage ?? '',
    pushedAt: apiRepo.pushed_at ?? null,
  };
}

// GitHub reports "Other" (spdx_id NOASSERTION) when it finds a license file
// but cannot tell which license it is. Our rule says "GitHub recognizes a
// license", so that case counts as missing.
function recognizedLicense(license) {
  if (!license || license.spdx_id === 'NOASSERTION') return null;
  return license.name;
}
