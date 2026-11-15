import { GITHUB_OWNER_URL } from "@/lib/site";
import { LINKEDIN_URL } from "./links";
import styles from "./shell.module.css";

export function ProfileLinks({ className }: { className?: string }) {
  return (
    <ul className={className ? `${styles.profiles} ${className}` : styles.profiles}>
      <li>
        <a href={GITHUB_OWNER_URL} rel="me">
          GitHub
        </a>
      </li>
      <li>
        <a href={LINKEDIN_URL} rel="me">
          LinkedIn
        </a>
      </li>
    </ul>
  );
}
