import type { ReactNode } from "react";
import { NEW_TAB_NOTE } from "@/lib/external-links";

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
