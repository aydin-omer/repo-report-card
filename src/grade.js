// Each rule matches one row of the report card table.
// The order here is also the order of the "missing" list.
const RULES = [
  {
    label: 'description',
    points: 2,
    passes: (repo) => isFilled(repo.description),
  },
  {
    label: 'license',
    points: 2,
    passes: (repo) => Boolean(repo.license),
  },
  {
    label: 'README',
    points: 2,
    passes: (repo) => (repo.readmeLength ?? 0) >= 300,
  },
  {
    label: 'topics',
    points: 2,
    passes: (repo) => Array.isArray(repo.topics) && repo.topics.length >= 3,
  },
  {
    label: 'website link',
    points: 1,
    passes: (repo) => isFilled(repo.homepage),
  },
  {
    label: 'recent activity',
    points: 1,
    passes: (repo, now) => pushedWithinLastYear(repo.pushedAt, now),
  },
];

function isFilled(text) {
  return typeof text === 'string' && text.trim() !== '';
}

function pushedWithinLastYear(dateString, now) {
  if (!dateString) return false;
  const pushed = new Date(dateString);
  if (Number.isNaN(pushed.getTime())) return false;
  const oneYearAgo = new Date(now);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  return pushed >= oneYearAgo;
}

function letterFor(score) {
  if (score >= 9) return 'A';
  if (score >= 7) return 'B';
  if (score >= 5) return 'C';
  return 'D';
}

export function gradeRepo(repo, now = new Date()) {
  let score = 0;
  const missing = [];

  for (const rule of RULES) {
    if (rule.passes(repo, now)) {
      score += rule.points;
    } else {
      missing.push(rule.label);
    }
  }

  return { score, grade: letterFor(score), missing };
}
