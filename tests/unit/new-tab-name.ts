/** The accessible name of a link to another site: its text, then the hidden note (ticket #44). */
export const opensInNewTab = (text: string) => new RegExp(`^${text}\\s*\\(opens in a new tab\\)$`);
