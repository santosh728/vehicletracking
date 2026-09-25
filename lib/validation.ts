export function isBillNumber(value: string) {
  return /^[0-9]{12}$/.test(value);
}

export function isUsername(value: string) {
  return /^[A-Za-z0-9_.-]{3,80}$/.test(value);
}

export function isMobile(value: string) {
  return /^\d{10}$/.test(value);
}

export function isValidDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}
