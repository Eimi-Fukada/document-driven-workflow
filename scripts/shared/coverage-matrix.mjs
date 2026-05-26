const PLACEHOLDERS = new Set([
  "",
  "-",
  "none",
  "n/a",
  "na",
  "not applicable",
  "not-applicable",
  "pending",
  "todo",
  "tbd",
  "not tested",
  "untested",
]);

function cleanCell(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

export function isPlaceholder(value) {
  const cleaned = cleanCell(value);
  const lower = cleaned.toLowerCase();
  return (
    !cleaned ||
    PLACEHOLDERS.has(lower) ||
    cleaned.startsWith("\u5f85") ||
    cleaned.startsWith("\u672a") ||
    cleaned.startsWith("\u65e0")
  );
}

export function isPassed(value) {
  const cleaned = cleanCell(value);
  return /^(passed|pass|yes|done)$/i.test(cleaned) || /\bpassed\b/i.test(cleaned) || cleaned.includes("\u901a\u8fc7");
}

function headingTitle(line) {
  const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line.trim());
  if (!match) {
    return null;
  }
  return { level: match[1].length, title: match[2].trim() };
}

function titleMatches(title, matchers) {
  return matchers.some((matcher) => matcher.test(title));
}

function extractSection(text, matchers) {
  const lines = String(text || "").split(/\r?\n/);
  let start = -1;
  let level = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = headingTitle(lines[index]);
    if (heading && titleMatches(heading.title, matchers)) {
      start = index + 1;
      level = heading.level;
      break;
    }
  }
  if (start === -1) {
    return "";
  }
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    const heading = headingTitle(lines[index]);
    if (heading && heading.level <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function splitTableLine(line) {
  let cleaned = line.trim();
  if (cleaned.startsWith("|")) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.endsWith("|")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned.split("|").map((cell) => cell.replace(/\\\|/g, "|").trim());
}

function isSeparatorLine(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTables(sectionText) {
  const lines = String(sectionText || "").split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].includes("|") || !isSeparatorLine(lines[index + 1])) {
      continue;
    }
    const headers = splitTableLine(lines[index]);
    const rows = [];
    let cursor = index + 2;
    while (cursor < lines.length && lines[cursor].trim().includes("|") && !headingTitle(lines[cursor])) {
      const cells = splitTableLine(lines[cursor]);
      if (cells.length === headers.length) {
        const row = {};
        headers.forEach((header, cellIndex) => {
          row[header] = cells[cellIndex] || "";
        });
        rows.push(row);
      }
      cursor += 1;
    }
    tables.push({ headers, rows });
    index = cursor;
  }
  return tables;
}

function findCell(row, patterns) {
  for (const [header, value] of Object.entries(row)) {
    if (patterns.some((pattern) => pattern.test(header))) {
      return cleanCell(value);
    }
  }
  return "";
}

function extractIds(value, pattern) {
  return [...String(value || "").matchAll(pattern)].map((match) => match[0]);
}

function list(values, max = 8) {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length <= max) {
    return unique.join(", ");
  }
  return `${unique.slice(0, max).join(", ")} and ${unique.length - max} more`;
}

function duplicateIds(rows) {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    const id = row.id.toUpperCase();
    if (seen.has(id)) {
      duplicates.add(row.id);
    }
    seen.add(id);
  }
  return [...duplicates].sort();
}

export function readCoverageMatrix(text, { verification = false } = {}) {
  const matchers = verification
    ? [
        /^Coverage Matrix Verification$/i,
        /^Coverage Matrix$/i,
        /^\u8986\u76d6\u77e9\u9635\u9a8c\u8bc1$/i,
        /^\u8986\u76d6\u77e9\u9635$/i,
      ]
    : [/^Coverage Matrix$/i, /^\u8986\u76d6\u77e9\u9635$/i];
  const section = extractSection(text, matchers);
  const requiredMatch = /^-\s*Coverage required:\s*(yes|no|true|false)\s*$/im.exec(section);
  const expectedMatch = /^-\s*Expected coverage items:\s*(\d+)\s*$/im.exec(section);
  const requiredExplicit = /^(yes|true)$/i.test(requiredMatch?.[1] || "");
  const expectedCount = expectedMatch ? Number.parseInt(expectedMatch[1], 10) : 0;
  const table = parseTables(section).find((candidate) =>
    candidate.headers.some((header) => /Coverage\s*ID/i.test(header)),
  );
  const rows = (table?.rows || [])
    .map((row) => ({
      id: findCell(row, [/Coverage\s*ID/i]),
      module: findCell(row, [/Module/i, /Item/i, /\u6a21\u5757/i, /\u8986\u76d6\u9879/i]),
      requirementId: findCell(row, [/Requirement\s*ID/i, /\u9700\u6c42\s*ID/i]),
      acceptanceId: findCell(row, [/Acceptance\s*ID/i, /\u9a8c\u6536\s*ID/i]),
      implementationEvidence: findCell(row, [/Implementation\s*Evidence/i, /\u5b9e\u73b0\u8bc1\u636e/i]),
      verificationEvidence: findCell(row, [/Verification\s*Evidence/i, /Test\s*Evidence/i, /\u9a8c\u8bc1\u8bc1\u636e/i, /\u6d4b\u8bd5\u8bc1\u636e/i]),
      status: findCell(row, [/Status/i, /Result/i, /\u72b6\u6001/i, /\u7ed3\u679c/i]),
    }))
    .filter((row) => /^COV-[A-Z0-9-]+$/i.test(row.id));

  return {
    sectionFound: Boolean(section),
    required: requiredExplicit || expectedCount > 0,
    requiredExplicit,
    expectedCount,
    rows,
  };
}

export function evaluateCoverageMatrix({ acceptanceText, reportText, requirementIds = [], acceptanceIds = [] }) {
  const source = readCoverageMatrix(acceptanceText);
  const report = readCoverageMatrix(reportText, { verification: true });
  const declaredRows = source.rows;
  const reportRows = report.rows;
  const reportById = new Map(reportRows.map((row) => [row.id.toUpperCase(), row]));
  const checks = [];
  const required = source.required;
  const expectedCount = source.expectedCount;

  function add(check, status, detail, blockerType = "verification_blocker") {
    checks.push({ check, status, detail, blocker_type: blockerType });
  }

  if (!required) {
    add("Coverage matrix", "PASS", "coverage matrix is not required for this Feature", "doc_blocker");
    return {
      required: false,
      expected_count: expectedCount,
      declared_count: declaredRows.length,
      verified_count: 0,
      checks,
      missing_in_report: [],
      missing_evidence: [],
      not_passed: [],
      invalid_source_rows: [],
      duplicate_ids: [],
    };
  }

  add(
    "Coverage matrix declared",
    source.sectionFound ? "PASS" : "BLOCKED",
    source.sectionFound ? "coverage matrix section found in acceptance criteria" : "04-acceptance-criteria.md must include Coverage Matrix",
    "doc_blocker",
  );
  add(
    "Coverage expected count",
    expectedCount > 0 ? "PASS" : "BLOCKED",
    expectedCount > 0 ? `expected coverage items: ${expectedCount}` : "Expected coverage items must be greater than 0",
    "doc_blocker",
  );

  const duplicates = duplicateIds(declaredRows);
  add(
    "Coverage duplicate IDs",
    duplicates.length ? "BLOCKED" : "PASS",
    duplicates.length ? `duplicate Coverage IDs: ${list(duplicates)}` : "coverage IDs are unique",
    "doc_blocker",
  );

  add(
    "Coverage source item count",
    expectedCount > 0 && declaredRows.length === expectedCount ? "PASS" : "BLOCKED",
    `declared ${declaredRows.length} coverage item(s), expected ${expectedCount}`,
    "doc_blocker",
  );

  const invalidSourceRows = declaredRows
    .filter((row) => isPlaceholder(row.module) || isPlaceholder(row.requirementId) || isPlaceholder(row.acceptanceId))
    .map((row) => row.id);
  const unknownRequirementRows = declaredRows
    .filter((row) => {
      const ids = extractIds(row.requirementId, /\bREQ-[A-Z0-9-]+\b/g);
      return requirementIds.length > 0 && !ids.some((id) => requirementIds.includes(id));
    })
    .map((row) => row.id);
  const unknownAcceptanceRows = declaredRows
    .filter((row) => {
      const ids = extractIds(row.acceptanceId, /\bAC-[A-Z0-9-]+\b/g);
      return acceptanceIds.length > 0 && !ids.some((id) => acceptanceIds.includes(id));
    })
    .map((row) => row.id);
  const invalidRows = [...new Set([...invalidSourceRows, ...unknownRequirementRows, ...unknownAcceptanceRows])];
  add(
    "Coverage source mapping",
    invalidRows.length ? "BLOCKED" : "PASS",
    invalidRows.length
      ? `coverage rows must map to concrete module, REQ ID and AC ID: ${list(invalidRows)}`
      : "coverage rows map to concrete modules, requirement IDs and acceptance IDs",
    "doc_blocker",
  );

  const missingInReport = declaredRows.filter((row) => !reportById.has(row.id.toUpperCase())).map((row) => row.id);
  add(
    "Coverage report rows",
    missingInReport.length ? "BLOCKED" : "PASS",
    missingInReport.length ? `verification report is missing coverage rows: ${list(missingInReport)}` : "verification report includes all coverage rows",
  );

  const missingEvidence = declaredRows
    .filter((row) => {
      const reportRow = reportById.get(row.id.toUpperCase());
      return (
        !reportRow ||
        isPlaceholder(reportRow.implementationEvidence) ||
        isPlaceholder(reportRow.verificationEvidence)
      );
    })
    .map((row) => row.id);
  add(
    "Coverage item evidence",
    missingEvidence.length ? "BLOCKED" : "PASS",
    missingEvidence.length
      ? `coverage rows need implementation and verification evidence: ${list(missingEvidence)}`
      : "every coverage row has implementation and verification evidence",
  );

  const notPassed = declaredRows
    .filter((row) => {
      const reportRow = reportById.get(row.id.toUpperCase());
      return !reportRow || !isPassed(reportRow.status);
    })
    .map((row) => row.id);
  add(
    "Coverage item status",
    notPassed.length ? "BLOCKED" : "PASS",
    notPassed.length ? `coverage rows are not Passed: ${list(notPassed)}` : "every coverage row is Passed",
  );

  return {
    required: true,
    expected_count: expectedCount,
    declared_count: declaredRows.length,
    verified_count: declaredRows.length - new Set([...missingInReport, ...missingEvidence, ...notPassed]).size,
    checks,
    missing_in_report: missingInReport,
    missing_evidence: missingEvidence,
    not_passed: notPassed,
    invalid_source_rows: invalidRows,
    duplicate_ids: duplicates,
  };
}
