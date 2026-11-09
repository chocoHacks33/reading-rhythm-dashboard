const test = require("node:test");
const assert = require("node:assert/strict");

const {
  progressPercent,
  summarizeSessions,
  formatMinutes,
  formatDate,
  sessionPace,
  summarizeReadingPace,
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

test("calculates a safe session pace in pages per hour", () => {
  assert.equal(sessionPace({ pages: 30, minutes: 45 }), 40);
  assert.equal(sessionPace({ pages: 10, minutes: 0 }), 0);
  assert.equal(sessionPace({ pages: -4, minutes: 20 }), 0);
});

test("summarizes weighted pace and the fastest session", () => {
  assert.deepEqual(
    summarizeReadingPace([
      { title: "Slow Book", pages: 20, minutes: 60 },
      { title: "Quick Book", pages: 30, minutes: 30 },
    ]),
    { overall: 33, fastest: { title: "Quick Book", pace: 60 } },
  );
  assert.deepEqual(summarizeReadingPace(null), { overall: 0, fastest: null });
  assert.deepEqual(
    summarizeReadingPace([{ title: "Untimed", pages: 50, minutes: 0 }]),
    { overall: 0, fastest: null },
  );
});

