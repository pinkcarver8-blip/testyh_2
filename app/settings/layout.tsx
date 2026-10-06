import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "블로그 설정",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
