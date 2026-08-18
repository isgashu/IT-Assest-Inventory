function pad(value) {
  return String(value).padStart(2, '0');
}

function partsFromDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
  }

  const text = String(value ?? '').trim();
  if (!text) return null;

  const displayMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  const dashDisplayMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  const match = displayMatch || isoMatch || dashDisplayMatch;

  if (!match) return null;
  const [first, second, third] = match.slice(1).map(Number);
  const year = isoMatch ? first : third;
  const month = second;
  const day = isoMatch ? third : first;
  return { year, month, day };
}

function isValidParts(parts) {
  if (!parts || parts.year < 1900 || parts.year > 2200 || parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31) return false;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return date.getUTCFullYear() === parts.year && date.getUTCMonth() === parts.month - 1 && date.getUTCDate() === parts.day;
}

function normalizeDate(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parts = partsFromDate(value);
  if (!isValidParts(parts)) throw new Error('Dates must use DD/MM/YYYY or YYYY-MM-DD format');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function formatDate(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const parts = partsFromDate(value);
  return isValidParts(parts) ? `${pad(parts.day)}/${pad(parts.month)}/${parts.year}` : '';
}

function dateYear(value) {
  const parts = partsFromDate(value);
  return isValidParts(parts) ? String(parts.year) : '';
}

function dateToUtc(value) {
  const parts = partsFromDate(value);
  return isValidParts(parts) ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)) : null;
}

module.exports = { dateToUtc, dateYear, formatDate, normalizeDate };
