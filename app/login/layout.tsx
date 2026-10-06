import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "이메일로 로그인하고 내 게시판과 게시글을 관리하세요.",
  openGraph: {
    title: "로그인",
    description: "이메일로 로그인하고 내 게시판과 게시글을 관리하세요.",
  },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
