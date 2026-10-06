import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 모드",
  description: "모든 회원의 게시판과 게시글 관리",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
