// Centralized date helpers for seed generation
// No external dependencies, pure JavaScript

export function now() { 
  return new Date(); 
}

export function startOfDay(d = now()) { 
  const x = new Date(d); 
  x.setHours(0, 0, 0, 0); 
  return x; 
}

export function addDays(d, n) { 
  const x = new Date(d); 
  x.setDate(x.getDate() + n); 
  return x; 
}

export function toISODate(d) { 
  return new Date(d).toISOString(); 
}

export function randInt(min, max) { 
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}

// Generate upcoming date range for Events (tomorrow to +30 days)
export function makeUpcomingDateRange({ minDaysAhead = 1, maxDaysAhead = 30, durationMinutes = 90 }) {
  const base = startOfDay(now());
  const day = addDays(base, randInt(minDaysAhead, maxDaysAhead));
  // Pick a start hour between 9 and 17
  const start = new Date(day); 
  start.setHours(randInt(9, 17), randInt(0, 59), 0, 0);
  const end = new Date(start); 
  end.setMinutes(end.getMinutes() + durationMinutes);
  return { start, end };
}

// Generate recent date for Notices/Newsletters (0-6 days ago)
export function makeRecentDate({ maxDaysAgo = 6 }) {
  const base = startOfDay(now());
  const day = addDays(base, -randInt(0, maxDaysAgo)); // 0..6 days ago
  return day;
}

// Formatters for different date/time formats
export function toSeedDateString(d) { 
  return toISODate(d); 
}

// Format date as YYYY-MM-DD
export function fmtDateYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

// Format time as HH:MM
export function fmtTimeHM(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Format date as YYYY-MM-DD for createdAt fields
export function fmtDateForCreatedAt(d) {
  return fmtDateYMD(d);
}
