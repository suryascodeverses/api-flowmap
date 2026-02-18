import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "api-graph — Express API Flow Visualizer",
  description: "Visualize your Express.js API routes and method call chains",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
