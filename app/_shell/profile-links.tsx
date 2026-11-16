import { ExternalLink } from "../_components/external-link";
import { GITHUB_OWNER_URL } from "@/lib/site";
import { LINKEDIN_URL } from "./links";
import styles from "./shell.module.css";

export function ProfileLinks({ className }: { className?: string }) {
  return (
    <ul className={className ? `${styles.profiles} ${className}` : styles.profiles}>
      <li>
        <ExternalLink href={GITHUB_OWNER_URL} rel="me">
          GitHub
        </ExternalLink>
      </li>
      <li>
        <ExternalLink href={LINKEDIN_URL} rel="me">
          LinkedIn
        </ExternalLink>
      </li>
    </ul>
  );
}
