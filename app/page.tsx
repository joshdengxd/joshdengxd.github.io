import { pageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import { HomeView } from "./_home/home-view";

export const metadata = pageMetadata({
  title: SITE_NAME,
  description:
    "Personal site of Xindong Deng (Josh), a software developer in Alberta, Canada: agent-assisted delivery, public repos and learning notes.",
  path: "/",
});

export default function Home() {
  return <HomeView />;
}
