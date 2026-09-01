import type { Metadata } from "next";
import Image from "next/image";
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
        <footer className="site-footer">
          <div className="shell footer-inner">
            <span className="footer-title">Incident Reference Database</span>
            <div className="creator">
              <Image className="creator-avatar" src="/creator/avatar.jpeg" alt="Masashi" width={36} height={36} />
              <div>
                <span className="creator-label">Created and maintained by</span>
                <span className="creator-links">
                  <span>Masashi</span>
                  <span aria-hidden="true">·</span>
                  <a href="https://www.linkedin.com/in/masashi-saisho-22607ba8/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
