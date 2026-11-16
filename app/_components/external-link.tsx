import type { ReactNode } from "react";

/** The words added to every link that opens another site in a new tab; the Markdown pipeline uses the same text. */
export const NEW_TAB_NOTE = " (opens in a new tab)";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Extra rel words, such as `me` for the profile links. */
  rel?: string;
};

/**
 * A link to another site: opens in a new tab and says so in its accessible name, with text that is visually hidden but
 * present without JavaScript. Links inside the site use `Link` instead. Ticket #44.
 */
export function ExternalLink({ href, children, className, rel }: Props) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel={rel ? `${rel} noopener noreferrer` : "noopener noreferrer"}
    >
      {children}
      <span className="visually-hidden">{NEW_TAB_NOTE}</span>
    </a>
  );
}
