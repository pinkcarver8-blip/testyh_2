"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  if (code === "same_password" || m.includes("different from the old"))
    return "이전과 다른 비밀번호를 입력해 주세요.";
  if (code === "weak_password" || m.includes("password should be"))
    return "비밀번호는 6자 이상이어야 합니다.";
  if (code === "session_not_found" || m.includes("session"))
    return "링크가 만료되었습니다. 비밀번호 찾기를 다시 진행해 주세요.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
  return "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const canSubmit = password !== "" && confirm !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(toKorean(error.message, error.code));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="비밀번호 재설정"
      icon={<ShieldIcon className="h-4 w-4" />}
      error={error}
      onDismissError={() => setError("")}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field
          label="새 비밀번호 (6자 이상)"
          type="password"
          required
          minLength={6}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="새 비밀번호 확인"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div className="flex justify-end">
          <button disabled={!canSubmit || loading} className={primaryButton}>
            비밀번호 변경
          </button>
        </div>
      </form>
      <Separator />
      <Link href="/forgot-password" className={`text-xs ${linkClass}`}>
        링크가 만료되었나요? 다시 요청하기
      </Link>
    </AuthShell>
  );
}
