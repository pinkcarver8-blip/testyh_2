import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입",
  description: "간단한 회원가입으로 나만의 게시판을 만들어 보세요.",
  openGraph: {
    title: "회원가입",
    description: "간단한 회원가입으로 나만의 게시판을 만들어 보세요.",
  },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
