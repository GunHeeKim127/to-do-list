export function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayString() {
  return formatDateLocal(new Date());
}

export function getKoreaTodayString(): string {
  const now = new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getKoreaDateOffsetString(
  offsetDays: number
): string {
  const koreaToday = getKoreaTodayString();

  const [year, month, day] =
    koreaToday.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + offsetDays
  );

  return date.toISOString().split("T")[0];
}