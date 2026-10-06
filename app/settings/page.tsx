"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeftIcon, ShieldIcon } from "../icons";

const supabase = createClient();

// IntelliJ IDEA의 Settings 대화상자 구조: 좌측 트리 + 우측 패널
export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(data === true));
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-zinc-200">
        <div className="mx-auto flex h-10 w-full max-w-5xl items-center gap-2 px-3">
          <Link
            href="/"
            aria-label="돌아가기"
            title="돌아가기"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <h1 className="font-bold">Settings</h1>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1">
        <nav className="w-64 shrink-0 border-r border-zinc-200 px-1.5 pt-3">
          <button className="flex h-7 w-full items-center gap-2 rounded bg-selection px-2 text-left">
            <ShieldIcon className="h-4 w-4 shrink-0" />
            관리자 모드
          </button>
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-8 pt-3">
          <h2 className="mb-1 text-lg font-bold">관리자 모드</h2>
          <p className="mb-6 text-zinc-500">
            관리자는 본인을 포함한 모든 회원의 게시판과 게시글을 이동, 수정,
            삭제할 수 있습니다.
          </p>

          <div className="mb-6 flex items-center gap-2">
            <span className="text-zinc-500">내 권한</span>
            <span
              className={
                isAdmin
                  ? "font-bold text-ij-string"
                  : "font-bold text-ij-keyword"
              }
            >
              {isAdmin === null ? "확인 중…" : isAdmin ? "관리자" : "일반 회원"}
            </span>
          </div>

          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 font-medium text-white hover:bg-primary-hover"
            >
              <ShieldIcon className="h-4 w-4" />
              관리자 모드 진입
            </Link>
          ) : (
            <>
              <button
                disabled
                className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 font-medium text-white opacity-40"
              >
                <ShieldIcon className="h-4 w-4" />
                관리자 모드 진입
              </button>
              {isAdmin === false && (
                <p className="mt-3 text-ij-error">
                  관리자 권한이 없는 계정입니다.
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
