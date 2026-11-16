import Link from "next/link";
import type { CSSProperties } from "react";
import { Placeholder } from "../_components/placeholder";
import { HOME_LABEL } from "../_shell/links";
import { ProfileLinks } from "../_shell/profile-links";
import styles from "./home.module.css";

const second = { "--reveal-index": 1 } as CSSProperties;

/** The home page: the D5 first screen (name and panel) and the footer, nothing else. */
export function HomeView() {
  return (
    <>
      {/* On the home page the name itself is the home mark. */}
      <h1 className={`name ${styles.name}`}>
        <Link href="/" aria-current="page" aria-label={HOME_LABEL} className={styles.nameLink}>
          <span className="reveal-mask">
            <span className="reveal-line name-first">Josh</span>
          </span>{" "}
          <span className="reveal-mask">
            <span className="reveal-line name-last" style={second}>
              Deng
            </span>
          </span>
        </Link>
      </h1>
      <div className={styles.panel}>
        <section aria-label="Intro">
          <Placeholder className={styles.intro}>
            Xindong Deng (Josh). Software developer since 2018, training to be an AI-native builder. Alberta, Canada.
          </Placeholder>
        </section>
        <ProfileLinks />
      </div>
    </>
  );
}
