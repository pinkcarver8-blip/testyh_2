import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";
import { CloseIcon } from "./icons";

// IntelliJ IDEA(New UI, Dark) 다이얼로그 스타일의 인증 화면 공통 요소

export const primaryButton =
  "inline-flex h-7 items-center justify-center rounded border border-zinc-600 bg-black px-4 font-medium text-white hover:bg-zinc-800 disabled:opacity-40";
export const secondaryButton =
  "inline-flex h-7 items-center justify-center rounded border border-zinc-300 px-4 hover:bg-zinc-100 disabled:opacity-40";
export const kakaoButton =
  "inline-flex h-7 w-full items-center justify-center rounded bg-[#FEE500] px-4 font-medium text-[#191919] hover:opacity-90";
export const linkClass = "text-ij-link hover:underline";

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        {...props}
        className="h-7 rounded border border-zinc-300 bg-transparent px-2"
      />
    </label>
  );
}

export function Separator() {
  return <div role="separator" className="my-1 h-px bg-zinc-200" />;
}

export function AuthShell({
  title,
  icon,
  error,
  onDismissError,
  children,
}: {
  title: string;
  icon: ReactNode;
  error?: string;
  onDismissError?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {error && (
        <div
          role="alert"
          className="fixed left-1/2 top-12 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-md border border-ij-error bg-[#2b2d30] py-2.5 pl-4 pr-2 shadow-xl"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-ij-error" />
          <span>{error}</span>
          {onDismissError && (
            <button
              onClick={onDismissError}
              aria-label="닫기"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <header className="shrink-0 border-b border-zinc-200">
        <div className="mx-auto flex h-10 w-full max-w-5xl items-center px-3">
          <Link
            href="/"
            className="rounded px-2 py-1 font-bold text-foreground hover:bg-zinc-100"
          >
            hello_world
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <section className="w-full max-w-sm rounded-lg border border-zinc-300 shadow-xl">
          <div className="flex h-10 items-center gap-2 border-b border-zinc-200 px-4">
            {icon}
            <h1 className="font-bold">{title}</h1>
          </div>
          <div className="flex flex-col gap-3 p-4">{children}</div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-zinc-200 text-xs text-zinc-500">
        <div className="mx-auto flex h-6 w-full max-w-5xl items-center justify-between px-3">
          <span>hello_world › {title}</span>
          <span>UTF-8 · LF</span>
        </div>
      </footer>
    </div>
  );
}
