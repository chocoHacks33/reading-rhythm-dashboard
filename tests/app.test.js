const test = require("node:test");
const assert = require("node:assert/strict");

const {
  progressPercent,
  summarizeSessions,
  formatMinutes,
  formatDate,
  escapeCsvCell,
  buildSessionsCsv,
} = require("../app.js");

test("calculates whole-number book progress", () => {
  assert.equal(progressPercent({ currentPage: 75, totalPages: 200 }), 38);
});

test("clamps book progress to a valid percentage", () => {
  assert.equal(progressPercent({ currentPage: 250, totalPages: 200 }), 100);
  assert.equal(progressPercent({ currentPage: -5, totalPages: 200 }), 0);
  assert.equal(progressPercent({ currentPage: 10, totalPages: 0 }), 0);
});

test("summarizes reading session totals", () => {
  const result = summarizeSessions([
    { pages: 20, minutes: 25 },
    { pages: 35, minutes: 40 },
  ]);
  assert.deepEqual(result, { sessions: 2, pages: 55, minutes: 65, averagePages: 28 });
});

test("returns a stable empty summary", () => {
  assert.deepEqual(summarizeSessions([]), { sessions: 0, pages: 0, minutes: 0, averagePages: 0 });
  assert.deepEqual(summarizeSessions(null), { sessions: 0, pages: 0, minutes: 0, averagePages: 0 });
});

test("ignores negative reading values in summaries", () => {
  assert.deepEqual(
    summarizeSessions([{ pages: -4, minutes: -10 }, { pages: 12, minutes: 18 }]),
    { sessions: 2, pages: 12, minutes: 18, averagePages: 6 },
  );
});

test("formats durations for minutes and hours", () => {
  assert.equal(formatMinutes(47), "47m");
  assert.equal(formatMinutes(120), "2h");
  assert.equal(formatMinutes(135), "2h 15m");
});

test("formats valid dates and handles invalid values", () => {
  assert.match(formatDate("2026-11-07"), /7 Nov/);
  assert.equal(formatDate("not-a-date"), "Unknown date");
});

test("escapes quotes and formula-like values in CSV cells", () => {
  assert.equal(escapeCsvCell('A "quoted" title'), '"A ""quoted"" title"');
  assert.equal(escapeCsvCell("=IMPORTXML('x')"), '"\'=IMPORTXML(\'x\')"');
  assert.equal(escapeCsvCell("  +SUM(1,2)"), '"\'  +SUM(1,2)"');
});

test("builds a complete reading-session CSV", () => {
  const csv = buildSessionsCsv([
    {
      date: "2026-11-07",
      title: "North Woods",
      author: "Daniel Mason",
      genre: "Fiction",
      pages: 32,
      minutes: 41,
    },
  ]);
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[0], '"Date","Title","Author","Genre","Pages","Minutes"');
  assert.match(lines[1], /"North Woods"/);
  assert.match(lines[1], /"32","41"$/);
});

test("exports only the header row for an empty reading log", () => {
  assert.equal(buildSessionsCsv([]), '"Date","Title","Author","Genre","Pages","Minutes"');
});

