import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incident Reference Database",
  description: "Search public process safety and incident investigation documents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/">Incident Reference Database</Link>
            <nav aria-label="Primary navigation">
              <Link href="/">Search</Link>
              <Link href="/images">Images</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
