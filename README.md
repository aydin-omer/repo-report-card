# repo-report-card

[![Tests](https://github.com/aydin-omer/repo-report-card/actions/workflows/test.yml/badge.svg)](https://github.com/aydin-omer/repo-report-card/actions/workflows/test.yml)

A command line tool that grades every public repository of a GitHub account and tells you what is missing.

```
$ npx repo-report-card aydin-omer

Report card for aydin-omer (10 repos)

ai-weekly-brief          A   9/10  missing: website link
feedback-hub             A   9/10  missing: website link
feedback-hub-mcp         A   9/10  missing: website link
news-to-notion-bridge    A   9/10  missing: website link
pm-weekly-digest         A   9/10  missing: website link
stock-trend-tracker      A   9/10  missing: website link
ai-reading-recommender   A  10/10
cve-watcher              A  10/10
github-trending-tracker  A  10/10
product-idea-evaluator   A  10/10

Average: 9.4/10
```

## Why

A repository is often the first thing people see of your work. If it has no description, no license or an empty README, visitors cannot tell what it does or whether they may use it. Checking this by hand across many repositories is slow and easy to forget. This tool does it in one command, and lists the weakest repositories first, because those are the ones worth fixing.

## Usage

You need Node.js 22 or later. No installation is required:

```bash
npx repo-report-card <github-user>
```

Or install it once and run it anywhere:

```bash
npm install --global repo-report-card
repo-report-card <github-user>
```

GitHub allows 60 requests per hour without a token, which covers about 30 repositories. For larger accounts, pass a token through the `GITHUB_TOKEN` environment variable. If you use the GitHub CLI, you can borrow its token for a single run:

```bash
GITHUB_TOKEN=$(gh auth token) npx repo-report-card <github-user>
```

## How repositories are graded

| Rule | Points | Full points when |
|---|---|---|
| Description | 2 | The repository description is not empty |
| License | 2 | GitHub recognizes a license |
| README | 2 | A README exists and is at least 300 characters long |
| Topics | 2 | At least 3 topics are set |
| Website link | 1 | The website field is filled in |
| Recent activity | 1 | Something was pushed in the last 12 months |

Grades: 9 to 10 is **A**, 7 to 8 is **B**, 5 to 6 is **C**, below 5 is **D**.

A few decisions behind these rules:

- The first four rules are worth 2 points because a visitor needs all of them to understand and use a project. The last two are worth 1 point, because not every project has a page to show, and a finished project that works does not need constant updates.
- A license that GitHub shows as "Other" does not count. It does not give visitors a clear answer to "may I use this code?".
- Forks and archived repositories are skipped. Forks are mostly someone else's work, and archived repositories are finished on purpose.

## Design

- **No dependencies.** The tool uses only what Node.js already provides: `fetch` for the GitHub API and `node:test` for tests. Installing it does not pull in any third-party code.
- **Grading is separate from fetching.** The grading rules are a plain function with no network access, so they can be tested quickly and reliably. The GitHub API code is tested against a fake GitHub, so the tests never touch the internet.
- **The rules live in one list.** Each rule in `src/grade.js` has a label, a point value and a check, so adding or changing a rule does not touch the rest of the code.

## Roadmap

The first real run showed that the website link rule creates noise for repositories that have nothing to show, such as email digests or servers. Ideas for handling this are collected in [#1](https://github.com/aydin-omer/repo-report-card/issues/1).

## Development

```bash
git clone https://github.com/aydin-omer/repo-report-card.git
cd repo-report-card
npm test
```

Tests run on Node.js 22, 24 and 26 for every push and pull request.

## License

[MIT](LICENSE)
