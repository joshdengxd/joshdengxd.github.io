import Link from "next/link";
import type { CSSProperties } from "react";
import type { Post } from "@/lib/posts/loader";
import { PROJECTS } from "@/lib/projects";
import { Placeholder } from "../_components/placeholder";
import { Section } from "../_components/page-layout";
import pageStyles from "../_components/page.module.css";
import { ProjectCards } from "../_components/project-card";
import { PostDate } from "../blog/_components/post-date";
import { HOME_LABEL } from "../_shell/links";
import { ProfileLinks } from "../_shell/profile-links";
import styles from "./home.module.css";

const second = { "--reveal-index": 1 } as CSSProperties;

/** How many posts Latest posts shows. */
export const LATEST_POSTS = 3;

/** The home page: the D5 first screen (name and panel), then Focus, Featured repos and Latest posts on the ground. */
export function HomeView({ posts }: { posts: Post[] }) {
  const latest = posts.slice(0, LATEST_POSTS);
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
      <div className={styles.ground}>
        <Section title="Focus">
          <Placeholder>What I am working on and learning right now comes here.</Placeholder>
        </Section>
        <Section title="Featured repos">
          <ProjectCards projects={PROJECTS} headingLevel={3} />
          <p>
            <Link href="/projects/" className={pageStyles.link}>
              All projects
            </Link>
          </p>
        </Section>
        <Section title="Latest posts">
          {latest.length === 0 ? (
            <p>
              No posts yet.{" "}
              <Link href="/blog/" className={pageStyles.link}>
                Go to the blog
              </Link>
            </p>
          ) : (
            <>
              <ol className={pageStyles.list}>
                {latest.map((post) => (
                  <li key={post.slug} className={pageStyles.listItem}>
                    <p className={pageStyles.small}>
                      <PostDate iso={post.date} />
                    </p>
                    <h3 className={styles.postTitle}>
                      <Link href={`/blog/${post.slug}/`} className={pageStyles.link}>
                        {post.title}
                      </Link>
                    </h3>
                    <p>{post.summary}</p>
                  </li>
                ))}
              </ol>
              <p>
                <Link href="/blog/" className={pageStyles.link}>
                  All posts
                </Link>
              </p>
            </>
          )}
        </Section>
      </div>
    </>
  );
}
