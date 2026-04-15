"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RoleKey = string;
type RoleStatus = Record<string, boolean>;

const ROLE_COLOR: Record<string, string> = {
  iOS: "#F5A623",
  Android: "#3B82F6",
  Backend: "#10B981",
  Flutter: "#06B6D4",
  DevOps: "#8B5CF6",
  Design: "#EC4899",
};

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "url" | "role" | "username";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  pattern?: string;
  patternError?: string;
  minLength?: number;
  maxLength?: number;
  builtin?: boolean;
  hidden?: boolean;
}

interface PrivacyPolicy {
  enabled: boolean;
  summary: string;
  details: string;
}

interface FormConfig {
  requireEmailAuth: boolean;
  privacyPolicy: PrivacyPolicy;
  fields: FormField[];
}

interface ApplicantSession {
  authenticated: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

// Google Identity Services
interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (r: GoogleCredentialResponse) => void;
      ux_mode?: "popup" | "redirect";
    }) => void;
    renderButton: (
      el: HTMLElement,
      opts: {
        type?: "standard" | "icon";
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        shape?: "rectangular" | "pill" | "circle" | "square";
        logo_alignment?: "left" | "center";
        width?: number;
      },
    ) => void;
    disableAutoSelect: () => void;
  };
}
declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const URL_REGEX = /^(https?:\/\/|www\.)[^\s]+$/i;

export default function ApplyForm({
  status,
  lockedRole,
}: {
  status: RoleStatus;
  lockedRole?: RoleKey;
}) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth
  const [session, setSession] = useState<ApplicantSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Fetch form config on mount
  useEffect(() => {
    fetch("/api/form-config")
      .then((r) => r.json())
      .then((d: { config: FormConfig }) => {
        setConfig(d.config);
        // Initialize default values
        const init: Record<string, string> = {};
        for (const f of d.config.fields) {
          if (f.id === "role") {
            init[f.id] =
              lockedRole ?? Object.keys(status).find((r) => status[r]) ?? "";
          } else {
            init[f.id] = "";
          }
        }
        setValues(init);
      })
      .catch(() => setError("폼 설정을 불러올 수 없어요."));
  }, [lockedRole, status]);

  // Fetch auth session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ authenticated: false }));
  }, []);

  // Google login is always required. `requireEmailAuth` only controls whether
  // the account must be @gsm.hs.kr.
  const restrictDomain = config?.requireEmailAuth === true;
  const isAuthed = session?.authenticated === true;
  const blurred = !isAuthed;
  const showOverlay = session !== null && !isAuthed;

  // Google credential handler
  async function handleCredential(response: GoogleCredentialResponse) {
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Google 로그인 실패");
        return;
      }
      setSession({
        authenticated: true,
        email: data.email,
        name: data.name,
        picture: data.picture,
      });
    } catch {
      setAuthError("네트워크 오류가 발생했어요.");
    }
  }

  // Render Google button when overlay shown
  useEffect(() => {
    if (!gsiReady || !clientId || !showOverlay) return;
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: "popup",
    });
    if (btnRef.current) {
      btnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        logo_alignment: "left",
        width: 280,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsiReady, clientId, showOverlay]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    window.google?.accounts?.id?.disableAutoSelect();
  }

  function setField(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  // Client-side validation per field
  function validateField(field: FormField, value: string): string | null {
    if (!value || value.trim() === "") {
      if (field.required) return `${field.label}을(를) 입력해주세요.`;
      return null;
    }
    if (field.type === "role") {
      if (!status[value]) return `${field.label}이(가) 잘못됐어요.`;
      return null;
    }
    if (field.type === "url") {
      try {
        new URL(value.startsWith("http") ? value : `https://${value}`);
      } catch {
        return `${field.label}은(는) 올바른 URL이어야 해요.`;
      }
      return null;
    }
    if (field.type === "username") {
      if (URL_REGEX.test(value) || value.includes("/")) {
        return `${field.label}에는 URL이 아닌 아이디만 입력해주세요.`;
      }
      return null;
    }
    if (field.pattern) {
      try {
        const re = new RegExp(field.pattern);
        if (!re.test(value))
          return field.patternError ?? `${field.label} 형식이 올바르지 않아요.`;
      } catch {
        /* ignore */
      }
    }
    if (field.minLength !== undefined && value.length < field.minLength) {
      return `${field.label}은(는) 최소 ${field.minLength}자 이상이어야 해요. (현재 ${value.length}자)`;
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      return `${field.label}은(는) 최대 ${field.maxLength}자까지 입력할 수 있어요. (현재 ${value.length}자)`;
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!config) return;

    for (const field of config.fields) {
      const err = validateField(field, values[field.id] ?? "");
      if (err) {
        setError(err);
        return;
      }
    }

    if (config.privacyPolicy.enabled && !privacyAgreed) {
      setError("개인정보 수집 및 이용에 동의해야 지원할 수 있어요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: values, privacyAgreed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "제출 실패");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[32px] bg-white border border-[#F5A623]/20 shadow-[0_20px_60px_-20px_rgba(245,166,35,0.25)] p-10 sm:p-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F5A623] to-[#FF8C00] shadow-lg shadow-[#F5A623]/30 mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-3xl font-black text-[#1E1E1E] tracking-tight">
          지원이 완료됐어요!
        </h3>
        <p className="mt-3 text-gray-500 leading-relaxed">
          Team HARIBO가 검토 후 연락드릴게요. <br />
          감사합니다.
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-[32px] bg-white border border-gray-100 p-10 text-center text-sm text-gray-400">
        폼을 불러오는 중...
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
        onReady={() => setGsiReady(true)}
      />
      <div className="relative">
        <form
          onSubmit={onSubmit}
          aria-hidden={blurred}
          className={`rounded-[32px] bg-white border border-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)] p-8 sm:p-12 space-y-6 transition-all duration-300 ${
            blurred ? "blur-[6px] pointer-events-none select-none opacity-70" : ""
          }`}
        >
          {/* Verified badge */}
          {isAuthed && session && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#F5A623]/5 to-[#FF8C00]/5 border border-[#F5A623]/15">
              <div className="flex items-center gap-3 min-w-0">
                {session.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.picture}
                    alt={session.name || session.email || ""}
                    className="w-9 h-9 rounded-full shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-[#F5A623]/20 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-600">
                    ✓ 학생 확인됨
                  </span>
                  <p className="text-xs text-[#1E1E1E] font-semibold truncate">
                    {session.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="text-xs font-bold text-gray-500 hover:text-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-white transition-colors shrink-0"
              >
                로그아웃
              </button>
            </div>
          )}

          {/* Dynamic fields */}
          <DynamicFields
            config={config}
            values={values}
            setField={setField}
            status={status}
          />

          {/* Privacy consent */}
          {config.privacyPolicy.enabled && (
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-[#F5A623] cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1E1E1E]">
                    개인정보 수집 및 이용에 동의합니다.{" "}
                    <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {config.privacyPolicy.summary}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPrivacyOpen(true);
                    }}
                    className="mt-2 text-xs font-bold text-[#F5A623] hover:underline inline-flex items-center gap-1"
                  >
                    자세히 보기
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </label>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 rounded-2xl bg-[#F5A623] text-white font-bold text-base hover:bg-[#E8961A] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-[#F5A623]/25"
          >
            {submitting ? "제출 중..." : "지원서 제출하기"}
          </button>

          <style jsx>{`
            :global(.input) {
              width: 100%;
              padding: 0.85rem 1rem;
              border-radius: 0.85rem;
              background: #f9fafb;
              border: 1.5px solid #e5e7eb;
              font-size: 0.9rem;
              transition: all 0.2s;
              font-family: inherit;
            }
            :global(.input:focus) {
              outline: none;
              border-color: #f5a623;
              background: white;
              box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15);
            }
          `}</style>
        </form>

        {/* Auth overlay */}
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 animate-fade-in-up">
            <div className="relative w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-[#F5A623]/20 shadow-[0_25px_80px_-20px_rgba(245,166,35,0.3)] p-8 sm:p-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F5A623]/10 mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1E1E1E] tracking-tight">
                {restrictDomain ? "학생 인증이 필요해요." : "Google 로그인이 필요해요."}
              </h3>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                {restrictDomain ? (
                  <>
                    광주소프트웨어마이스터고등학교 학생만 지원할 수 있어요.
                    <br />
                    <span className="font-semibold text-[#1E1E1E]">@gsm.hs.kr</span>{" "}
                    Google 계정으로 로그인해주세요.
                  </>
                ) : (
                  <>
                    지원서를 작성하려면 먼저
                    <br />
                    Google 계정으로 로그인해주세요.
                  </>
                )}
              </p>

              {!clientId && (
                <p className="mt-5 text-xs text-red-500 font-semibold">
                  관리자에게 문의하세요: GOOGLE_CLIENT_ID가 설정되지 않았어요.
                </p>
              )}

              {clientId && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div ref={btnRef} className="flex justify-center" />
                  {!gsiReady && (
                    <p className="text-xs text-gray-400">
                      Google 로그인 버튼 불러오는 중...
                    </p>
                  )}
                </div>
              )}

              {authError && (
                <p className="mt-4 text-xs text-red-500 font-semibold">
                  {authError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Privacy modal — portal'd to body so it escapes transform containing blocks */}
      {privacyOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1E1E1E]">
                개인정보 수집 및 이용
              </h3>
              <button
                onClick={() => setPrivacyOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 sm:px-8 py-6">
              <MarkdownView text={config.privacyPolicy.details} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 sm:px-8 py-4 flex justify-end">
              <button
                onClick={() => {
                  setPrivacyAgreed(true);
                  setPrivacyOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#F5A623] text-white text-sm font-bold hover:bg-[#E8961A] transition-colors"
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function DynamicFields({
  config,
  values,
  setField,
  status,
}: {
  config: FormConfig;
  values: Record<string, string>;
  setField: (id: string, value: string) => void;
  status: RoleStatus;
}) {
  const visibleFields = useMemo(
    () => config.fields.filter((f) => !f.hidden),
    [config.fields],
  );
  const textFields = useMemo(
    () =>
      visibleFields.filter(
        (f) => f.type === "text" || f.type === "username" || f.type === "url",
      ),
    [visibleFields],
  );
  const textAreaFields = useMemo(
    () => visibleFields.filter((f) => f.type === "textarea"),
    [visibleFields],
  );
  const roleField = useMemo(
    () => visibleFields.find((f) => f.type === "role"),
    [visibleFields],
  );

  return (
    <>
      {/* Text inputs in 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {textFields.map((field) => (
          <div key={field.id}>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === "url" ? "url" : "text"}
              value={values[field.id] ?? ""}
              onChange={(e) => setField(field.id, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              className="input"
            />
            {field.helpText && (
              <p className="mt-1 text-[11px] text-gray-400">{field.helpText}</p>
            )}
          </div>
        ))}
      </div>

      {/* Role picker */}
      {roleField && (
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
            {roleField.label}{" "}
            {roleField.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.keys(status).map((role) => {
              const open = status[role];
              const selected = values[roleField.id] === role;
              return (
                <button
                  key={role}
                  type="button"
                  disabled={!open}
                  onClick={() => setField(roleField.id, role)}
                  className={`relative px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    selected && open
                      ? "border-[#F5A623] bg-[#F5A623]/5"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!open ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                  style={selected && open ? { color: ROLE_COLOR[role] || "#F5A623" } : {}}
                >
                  {role}
                  {!open && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">
                      마감
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Textarea fields */}
      {textAreaFields.map((field) => {
        const value = values[field.id] ?? "";
        const showCounter =
          field.minLength !== undefined || field.maxLength !== undefined;
        return (
          <div key={field.id}>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => setField(field.id, e.target.value)}
              required={field.required}
              rows={6}
              placeholder={field.placeholder}
              className="input resize-none"
              minLength={field.minLength}
              maxLength={field.maxLength}
            />
            <div className="flex justify-between items-center mt-1.5">
              {field.helpText ? (
                <p className="text-[11px] text-gray-400">{field.helpText}</p>
              ) : (
                <span />
              )}
              {showCounter && (
                <p
                  className={`text-[11px] font-semibold ${
                    field.minLength !== undefined && value.length < field.minLength
                      ? "text-red-500"
                      : field.maxLength !== undefined && value.length > field.maxLength
                        ? "text-red-500"
                        : "text-gray-400"
                  }`}
                >
                  {value.length}
                  {field.maxLength !== undefined && ` / ${field.maxLength}`}
                  {field.minLength !== undefined && ` (최소 ${field.minLength}자)`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // Split by **bold** segments and render the matches as <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-bold text-[#1E1E1E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownView({ text }: { text: string }) {
  // Minimal markdown-ish renderer: headers + bold + paragraphs + lists
  const lines = text.split("\n");
  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h4 key={i} className="text-base font-black text-[#1E1E1E] mt-4">
              {renderInline(line.slice(3))}
            </h4>
          );
        }
        if (/^\*\*[^*]+\*\*$/.test(line)) {
          return (
            <p key={i} className="font-bold text-[#1E1E1E] mt-3">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="pl-4 text-gray-600 before:content-['•'] before:mr-2 before:text-[#F5A623]">
              {renderInline(line.slice(2))}
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-gray-600">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}
