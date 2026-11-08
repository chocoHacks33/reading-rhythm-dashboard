const test = require("node:test");
const assert = require("node:assert/strict");

const {
  progressPercent,
  summarizeSessions,
  formatMinutes,
  formatDate,
  calculateDailyPace,
  forecastFinish,
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

test("calculates pages per calendar day over a rolling window", () => {
  const sessions = [
    { date: "2026-11-07", pages: 35 },
    { date: "2026-11-06", pages: 28 },
    { date: "2026-11-01", pages: 100 },
    { date: "2026-11-08", pages: -20 },
  ];
  assert.equal(calculateDailyPace(sessions, new Date("2026-11-08T12:00:00"), 7), 9);
});

test("forecasts the days and date needed to finish a book", () => {
  assert.deepEqual(
    forecastFinish(
      { currentPage: 120, totalPages: 300 },
      30,
      new Date("2026-11-08T12:00:00"),
    ),
    { days: 6, date: "2026-11-14" },
  );
});

test("handles completed books and unavailable pace data", () => {
  assert.deepEqual(
    forecastFinish({ currentPage: 320, totalPages: 300 }, 30, new Date("2026-11-08T12:00:00")),
    { days: 0, date: "2026-11-08" },
  );
  assert.equal(forecastFinish({ currentPage: 20, totalPages: 100 }, 0, new Date()), null);
  assert.equal(calculateDailyPace([], new Date("2026-11-08T12:00:00"), 7), 0);
});

