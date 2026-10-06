import type { Metadata } from "next";
import Blog from "./blog";

export const metadata: Metadata = {
  title: "내 게시판",
  description: "내 게시판과 게시글을 한곳에서 관리하세요.",
  openGraph: {
    title: "내 게시판",
    description: "내 게시판과 게시글을 한곳에서 관리하세요.",
  },
  robots: { index: false, follow: false },
};

export default function Home() {
  return <Blog />;
}
