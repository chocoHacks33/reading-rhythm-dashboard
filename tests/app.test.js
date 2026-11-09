const test = require("node:test");
const assert = require("node:assert/strict");

const {
  progressPercent,
  summarizeSessions,
  formatMinutes,
  formatDate,
  sortSessions,
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

test("sorts sessions by date, pages, and duration", () => {
  const sessions = [
    { date: "2026-11-01", pages: 45, minutes: 30 },
    { date: "2026-11-03", pages: 20, minutes: 70 },
    { date: "2026-11-02", pages: 35, minutes: 40 },
  ];
  assert.deepEqual(sortSessions(sessions, "date-asc").map((item) => item.date), ["2026-11-01", "2026-11-02", "2026-11-03"]);
  assert.deepEqual(sortSessions(sessions, "pages-desc").map((item) => item.pages), [45, 35, 20]);
  assert.deepEqual(sortSessions(sessions, "minutes-desc").map((item) => item.minutes), [70, 40, 30]);
});

test("session sorting leaves the source data unchanged", () => {
  const sessions = [{ date: "2026-11-01" }, { date: "2026-11-03" }];
  const result = sortSessions(sessions, "date-desc");
  assert.deepEqual(result.map((item) => item.date), ["2026-11-03", "2026-11-01"]);
  assert.deepEqual(sessions.map((item) => item.date), ["2026-11-01", "2026-11-03"]);
  assert.deepEqual(sortSessions(null), []);
});

