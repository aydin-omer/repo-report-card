// Builds the text the user sees in the terminal.
// Worst repos come first, because those are the ones worth fixing.
export function formatReport(owner, graded) {
  if (graded.length === 0) {
    return `No public repositories found for ${owner}.`;
  }

  const sorted = [...graded].sort(
    (a, b) => a.score - b.score || a.name.localeCompare(b.name),
  );
  const nameWidth = Math.max(...sorted.map((r) => r.name.length));

  const lines = sorted.map((r) => {
    const row = `${r.name.padEnd(nameWidth)}  ${r.grade}  ${String(r.score).padStart(2)}/10`;
    return r.missing.length > 0 ? `${row}  missing: ${r.missing.join(', ')}` : row;
  });

  const average = graded.reduce((sum, r) => sum + r.score, 0) / graded.length;
  const count = graded.length === 1 ? '1 repo' : `${graded.length} repos`;

  return [
    `Report card for ${owner} (${count})`,
    '',
    ...lines,
    '',
    `Average: ${average.toFixed(1)}/10`,
  ].join('\n');
}
