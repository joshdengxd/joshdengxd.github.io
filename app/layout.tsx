import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://joshdengxd.github.io"),
  title: "Xindong Deng (Josh)",
  description: "Personal site of Xindong Deng (Josh). Under construction.",
  other: { commit: process.env.COMMIT_SHA ?? "unknown" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
