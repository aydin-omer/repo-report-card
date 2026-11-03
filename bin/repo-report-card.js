#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fetchRepos } from '../src/github.js';
import { gradeRepo } from '../src/grade.js';
import { formatReport } from '../src/report.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

const HELP = `Usage: repo-report-card <github-user>

Grades every public repository of a GitHub account (forks and archived
repos are skipped) on description, license, README, topics, website link
and recent activity, and lists what is missing.

Options:
  -h, --help     Show this help
  -v, --version  Show the version

Set GITHUB_TOKEN to raise GitHub's rate limit (60 requests per hour without it).`;

async function main(args) {
  const [first] = args;

  if (!first) {
    console.error(HELP);
    return 1;
  }
  if (first === '-h' || first === '--help') {
    console.log(HELP);
    return 0;
  }
  if (first === '-v' || first === '--version') {
    console.log(version);
    return 0;
  }

  const repos = await fetchRepos(first, { token: process.env.GITHUB_TOKEN });
  const graded = repos.map((repo) => ({ name: repo.name, ...gradeRepo(repo) }));
  console.log(formatReport(first, graded));
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  },
);
