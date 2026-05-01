const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function evaluateReviewSchedule({ config = {}, now, lastReviewAt } = {}) {
  const schedule = normalizeSchedule(config.reviewSchedule);
  const localNow = parseLocalDateTime(now);
  const daily = schedule.dailyPack;
  if (daily.enabled) {
    const dailyResult = evaluateDaily({ daily, localNow, now, lastReviewAt });
    if (dailyResult.due || dailyResult.reason === "already_reviewed_today") {
      return dailyResult;
    }
  }

  const weekly = schedule.weeklyPack;
  if (weekly.enabled) {
    return evaluateWeekly({ weekly, localNow, now, lastReviewAt });
  }

  return quiet("not_scheduled", now);
}

function evaluateDaily({ daily, localNow, now, lastReviewAt }) {
  if (timeToMinutes(localNow.time) < timeToMinutes(daily.time)) {
    return quiet("before_scheduled_time", now);
  }
  const last = parseLocalDateTime(lastReviewAt);
  if (last && last.date === localNow.date) {
    return quiet("already_reviewed_today", now);
  }
  return due({
    kind: "daily_pack",
    output: daily.output || "daily_pack",
    format: daily.format || "short",
    now,
  });
}

function evaluateWeekly({ weekly, localNow, now, lastReviewAt }) {
  if (WEEKDAYS[localNow.weekday] !== weekly.day) {
    return quiet("wrong_weekday", now);
  }
  if (timeToMinutes(localNow.time) < timeToMinutes(weekly.time)) {
    return quiet("before_scheduled_time", now);
  }
  const last = parseLocalDateTime(lastReviewAt);
  if (last && isoWeekKey(last.date) === isoWeekKey(localNow.date)) {
    return quiet("already_reviewed_this_week", now);
  }
  return due({
    kind: "weekly_pack",
    output: weekly.output || "weekly_thread_review",
    format: weekly.format || "thread_review",
    now,
  });
}

function normalizeSchedule(schedule = {}) {
  const input = schedule && typeof schedule === "object" && !Array.isArray(schedule) ? schedule : {};
  return {
    dailyPack: {
      enabled: input.dailyPack?.enabled === undefined ? true : Boolean(input.dailyPack.enabled),
      time: normalizeTime(input.dailyPack?.time, "22:30"),
      format: normalizeText(input.dailyPack?.format) || "short",
      output: normalizeText(input.dailyPack?.output) || "daily_pack",
    },
    weeklyPack: {
      enabled: input.weeklyPack?.enabled === undefined ? false : Boolean(input.weeklyPack.enabled),
      day: WEEKDAYS.includes(input.weeklyPack?.day) ? input.weeklyPack.day : "Sunday",
      time: normalizeTime(input.weeklyPack?.time, "16:00"),
      format: normalizeText(input.weeklyPack?.format) || "thread_review",
      output: normalizeText(input.weeklyPack?.output) || "weekly_thread_review",
    },
  };
}

function due({ kind, output, format, now }) {
  return {
    due: true,
    kind,
    output,
    format,
    reason: "scheduled",
    evaluatedAt: normalizeNow(now),
  };
}

function quiet(reason, now) {
  return {
    due: false,
    kind: null,
    output: null,
    format: null,
    reason,
    evaluatedAt: normalizeNow(now),
  };
}

function parseLocalDateTime(value) {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }
  const match = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/u);
  const date = match ? match[1] : text.slice(0, 10);
  const time = match ? match[2] : "00:00";
  return {
    date,
    time,
    weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
  };
}

function isoWeekKey(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function timeToMinutes(value) {
  const [hours, minutes] = normalizeTime(value, "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeTime(value, fallback) {
  const text = normalizeText(value);
  return /^\d{2}:\d{2}$/u.test(text) ? text : fallback;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNow(value) {
  return normalizeText(value) || new Date().toISOString();
}

module.exports = {
  evaluateReviewSchedule,
};
