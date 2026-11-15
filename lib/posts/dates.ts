const utcFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

/** The date a reader without JavaScript sees, and what the server renders: "15 November 2026 (UTC)". */
export function formatUtcDate(iso: string): string {
  return `${utcFormat.format(new Date(iso))} (UTC)`;
}

/** The date in the reader's own locale and time zone (browser only). */
export function formatLocalDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso));
}
