const currentReads = [
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", currentPage: 184, totalPages: 304 },
  { title: "Four Thousand Weeks", author: "Oliver Burkeman", currentPage: 119, totalPages: 288 },
  { title: "The Art of Statistics", author: "David Spiegelhalter", currentPage: 226, totalPages: 448 },
];

const readingSessions = [
  { date: "2026-11-07", title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", genre: "Fiction", pages: 42, minutes: 48 },
  { date: "2026-11-06", title: "Four Thousand Weeks", author: "Oliver Burkeman", genre: "Essays", pages: 31, minutes: 37 },
  { date: "2026-11-05", title: "The Art of Statistics", author: "David Spiegelhalter", genre: "Science", pages: 26, minutes: 44 },
  { date: "2026-11-03", title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", genre: "Fiction", pages: 38, minutes: 41 },
  { date: "2026-11-02", title: "The Art of Statistics", author: "David Spiegelhalter", genre: "Science", pages: 24, minutes: 39 },
];

function progressPercent(book) {
  if (!book || !Number.isFinite(book.totalPages) || book.totalPages <= 0) return 0;
  const currentPage = Number.isFinite(book.currentPage) ? book.currentPage : 0;
  return Math.round(Math.min(Math.max(currentPage / book.totalPages, 0), 1) * 100);
}

function summarizeSessions(sessions) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const pages = safeSessions.reduce((total, session) => total + Math.max(Number(session.pages) || 0, 0), 0);
  const minutes = safeSessions.reduce((total, session) => total + Math.max(Number(session.minutes) || 0, 0), 0);
  return {
    sessions: safeSessions.length,
    pages,
    minutes,
    averagePages: safeSessions.length ? Math.round(pages / safeSessions.length) : 0,
  };
}

function formatMinutes(minutes) {
  const safeMinutes = Math.max(Math.round(Number(minutes) || 0), 0);
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short" }).format(date);
}

function calculateReadingStreak(sessions) {
  const uniqueDays = new Set();
  (Array.isArray(sessions) ? sessions : []).forEach((session) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(session.date || ""));
    if (!match) return;
    const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = new Date(timestamp);
    if (
      parsed.getUTCFullYear() === Number(match[1]) &&
      parsed.getUTCMonth() === Number(match[2]) - 1 &&
      parsed.getUTCDate() === Number(match[3])
    ) {
      uniqueDays.add(timestamp);
    }
  });
  const days = [...uniqueDays].sort((a, b) => b - a);
  if (!days.length) return { days: 0, latestDate: null };

  let streak = 1;
  const oneDay = 24 * 60 * 60 * 1000;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] !== oneDay) break;
    streak += 1;
  }
  return { days: streak, latestDate: new Date(days[0]).toISOString().slice(0, 10) };
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderSummary(sessions) {
  const summary = summarizeSessions(sessions);
  const cards = [
    ["Reading sessions", String(summary.sessions)],
    ["Pages read", String(summary.pages)],
    ["Time with books", formatMinutes(summary.minutes)],
    ["Average session", `${summary.averagePages} pages`],
  ];
  const container = document.querySelector("#summary-grid");
  if (!container) return;
  container.replaceChildren();
  cards.forEach(([label, value]) => {
    const card = createElement("article", "summary-card");
    card.append(createElement("p", "summary-label", label));
    card.append(createElement("strong", "summary-value", value));
    container.append(card);
  });
}

function renderCurrentReads(books) {
  const container = document.querySelector("#current-reads");
  if (!container) return;
  container.replaceChildren();
  books.forEach((book) => {
    const percent = progressPercent(book);
    const card = createElement("article", "book-card");
    card.append(createElement("h3", "", book.title));
    card.append(createElement("p", "book-author", book.author));

    const meta = createElement("div", "book-meta");
    meta.append(createElement("span", "", `Page ${book.currentPage} of ${book.totalPages}`));
    meta.append(createElement("strong", "", `${percent}%`));

    const track = createElement("div", "progress-track");
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `${book.title} reading progress`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(percent));
    const bar = createElement("div", "progress-bar");
    bar.style.width = `${percent}%`;
    track.append(bar);

    card.append(meta, track);
    container.append(card);
  });
}

function renderSessions(sessions) {
  const body = document.querySelector("#session-rows");
  const count = document.querySelector("#session-count");
  if (!body) return;
  body.replaceChildren();
  sessions.forEach((session) => {
    const row = document.createElement("tr");
    const dateCell = createElement("td", "", formatDate(session.date));
    const bookCell = createElement("td", "book-cell");
    bookCell.append(createElement("strong", "", session.title));
    bookCell.append(createElement("span", "", session.author));
    row.append(
      dateCell,
      bookCell,
      createElement("td", "", session.genre),
      createElement("td", "", String(session.pages)),
      createElement("td", "", formatMinutes(session.minutes)),
    );
    body.append(row);
  });
  if (count) count.textContent = `${sessions.length} sessions logged`;
}

function renderReadingStreak(sessions) {
  const days = document.querySelector("#streak-days");
  const note = document.querySelector("#streak-note");
  if (!days || !note) return;
  const streak = calculateReadingStreak(sessions);
  days.textContent = `${streak.days} ${streak.days === 1 ? "day" : "days"}`;
  note.textContent = streak.latestDate
    ? `The latest run ends on ${formatDate(streak.latestDate)}.`
    : "Log sessions on consecutive days to build momentum.";
}

function initDashboard() {
  renderSummary(readingSessions);
  renderCurrentReads(currentReads);
  renderSessions(readingSessions);
  renderReadingStreak(readingSessions);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initDashboard);
}

if (typeof module !== "undefined") {
  module.exports = {
    currentReads,
    readingSessions,
    progressPercent,
    summarizeSessions,
    formatMinutes,
    formatDate,
    calculateReadingStreak,
  };
}

