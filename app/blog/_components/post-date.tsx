"use client";

import { useSyncExternalStore } from "react";
import { formatLocalDate, formatUtcDate } from "@/lib/posts/dates";

const subscribe = () => () => {};

/**
 * The HTML (and so a reader without JavaScript) has the UTC date. After hydration the text becomes the date in the
 * reader's locale and time zone. useSyncExternalStore gives `false` for the server and for hydration, then `true`,
 * so there is no mismatch and no state set in an effect.
 */
export function PostDate({ iso }: { iso: string }) {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  return <time dateTime={iso}>{inBrowser ? formatLocalDate(iso) : formatUtcDate(iso)}</time>;
}
