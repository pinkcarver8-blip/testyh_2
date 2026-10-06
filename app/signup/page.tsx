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
import { UserIcon } from "../icons";

function toKorean(message: string, code?: string) {
  const m = message.toLowerCase();
  if (code === "user_already_exists" || m.includes("already registered"))
    return "이미 가입된 이메일입니다.";
  if (code === "weak_password" || m.includes("password should be"))
    return "비밀번호는 6자 이상이어야 합니다.";
  if (code === "email_address_invalid" || m.includes("invalid"))
    return "올바른 이메일 형식이 아닙니다.";
  if (code === "over_email_send_rate_limit" || m.includes("rate limit"))
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "signup_disabled") return "현재 회원가입을 받지 않습니다.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
  return "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const canSubmit = email.trim() !== "" && password !== "" && confirm !== "";

  async function signInWithKakao() {
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error)
      setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }

  async function resend() {
    if (cooldown > 0 || loading) return;
    setError("");
    setNotice("");
    setLoading(true);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(toKorean(error.message, error.code));
      return;
    }
    setNotice("인증 메일을 다시 보냈습니다. 스팸 메일함도 확인해 주세요.");
    setCooldown(60);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(toKorean(error.message, error.code));
      return;
    }
    // 이미 인증이 끝난 이메일은 오류 없이 identities가 빈 배열로 돌아옴
    if (data.user && data.user.identities?.length === 0) {
      setError("이미 가입된 이메일입니다. 로그인해 주세요.");
      return;
    }
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }
    setSentTo(email.trim());
    setCooldown(60);
  }

  return (
    <AuthShell
      title="회원가입"
      icon={<UserIcon className="h-4 w-4" />}
      error={error}
      onDismissError={() => setError("")}
    >
      {sentTo ? (
        <div className="flex flex-col gap-3">
          <p className="font-bold text-ij-keyword">이메일 인증이 필요합니다.</p>
          <p>
            <span className="font-bold">{sentTo}</span>(으)로 인증 메일을
            보냈습니다. 메일의 확인 링크를 눌러 인증을 완료한 뒤 로그인해
            주세요.
          </p>
          {notice && <p className="text-xs text-zinc-500">{notice}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0 || loading}
              className={secondaryButton}
            >
              {cooldown > 0
                ? `인증 메일 재발송 (${cooldown}초)`
                : "인증 메일 재발송"}
            </button>
          </div>
          <Separator />
          <div className="flex flex-col gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setSentTo("");
                setNotice("");
              }}
              className={`text-left ${linkClass}`}
            >
              다른 이메일로 다시 가입하기
            </button>
            <Link href="/login" className={linkClass}>
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Field
              label="이메일"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            <Field
              label="비밀번호 (6자 이상)"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Field
              label="비밀번호 확인"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                disabled={!canSubmit || loading}
                className={primaryButton}
              >
                회원가입
              </button>
            </div>
          </form>
          <Separator />
          <button
            type="button"
            onClick={signInWithKakao}
            className={kakaoButton}
          >
            카카오 로그인
          </button>
          <p className="text-xs text-zinc-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className={linkClass}>
              로그인
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
