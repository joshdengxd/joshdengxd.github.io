import localFont from "next/font/local";

// Self-hosted, Latin subset, OFL (licences in design-language/fonts/). No font service at build or run time.

// Archivo, variable in weight and width: condensed and heavy for the name, normal width for text.
export const archivo = localFont({
  src: [{ path: "../design-language/fonts/archivo-latin-wdth-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-archivo-face",
  display: "swap",
  // Keep the width axis usable: without this the face is declared at 100% only.
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

// The code face, used only inside pre/code.
export const codeFace = localFont({
  src: [{ path: "../design-language/fonts/jetbrains-mono-latin-wght-normal.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-code-face",
  display: "swap",
  preload: false,
});
