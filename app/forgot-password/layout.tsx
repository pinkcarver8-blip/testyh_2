import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "가입한 이메일로 비밀번호 재설정 링크를 받아보세요.",
  openGraph: {
    title: "비밀번호 찾기",
    description: "가입한 이메일로 비밀번호 재설정 링크를 받아보세요.",
  },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
