"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AuthShell,
  Field,
  Separator,
  kakaoButton,
  linkClass,
  primaryButton,
  secondaryButton,
} from "../auth-ui";
import { ShieldIcon } from "../icons";

function toKorean(message: string, code?: string) {
  const m = message.toLowerCase();
  if (
    code === "over_email_send_rate_limit" ||
    m.includes("rate limit") ||
    m.includes("seconds")
  )
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "email_address_invalid" || m.includes("invalid"))
    return "올바른 이메일 형식이 아닙니다.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
  return "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const canSubmit = email.trim() !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
      },
    );
    setLoading(false);
    if (error) {
      setError(toKorean(error.message, error.code));
      return;
    }
    setSentTo(email.trim());
  }

  return (
    <AuthShell
      title="비밀번호 찾기"
      icon={<ShieldIcon className="h-4 w-4" />}
      error={error}
      onDismissError={() => setError("")}
    >
      {sentTo ? (
        <p>
          <span className="font-bold">{sentTo}</span>(으)로 비밀번호 재설정
          링크를 보냈습니다. 메일의 링크를 눌러 새 비밀번호를 설정해 주세요.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>
          <Field
            label="이메일"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <div className="flex justify-end">
            <button disabled={!canSubmit || loading} className={primaryButton}>
              비밀번호 리셋 링크 발송
            </button>
          </div>
        </form>
      )}
      <Separator />
      <Link href="/login" className={`text-xs ${linkClass}`}>
        로그인으로 돌아가기
      </Link>
    </AuthShell>
  );
}
