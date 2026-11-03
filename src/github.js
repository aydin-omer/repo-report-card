// Turns one repository from GitHub's REST API into the simple shape
// that gradeRepo() understands. readmeSize comes from a separate API call,
// because the repository list does not include the README.
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
