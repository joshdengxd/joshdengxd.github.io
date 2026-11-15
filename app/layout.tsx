import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../design-language/tokens.css";
import "./globals.css";
import { SiteShell } from "./_shell/site-shell";
import { archivo, codeFace } from "./fonts";
import { themeScript } from "./theme";

export const metadata: Metadata = {
  metadataBase: new URL("https://joshdengxd.github.io"),
  title: "Xindong Deng (Josh)",
  description: "Personal site of Xindong Deng (Josh). Under construction.",
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
