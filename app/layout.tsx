import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../design-language/tokens.css";
import "./globals.css";
import { SiteShell } from "./_shell/site-shell";
import { archivo, codeFace } from "./fonts";
import { themeScript } from "./theme";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  // Pages set their own title through pageMetadata; the template adds the site name after it.
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "Personal site of Xindong Deng (Josh): agent-assisted delivery, public repos and learning notes.",
  other: { commit: process.env.COMMIT_SHA ?? "unknown" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Dark in the HTML for everyone; the head script may switch to a stored "light" before paint.
    <html
      lang="en"
      data-theme="dark"
      className={`${archivo.variable} ${codeFace.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
