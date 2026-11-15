import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <p>This page does not exist.</p>
      <Link href="/">Home</Link>
    </main>
  );
}
